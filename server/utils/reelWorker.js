/**
 * Reel Worker — Adaptive Bitrate HLS Transcoding Pipeline
 *
 * Converts a raw video upload into multi-variant HLS streams for mobile streaming.
 *
 * Pipeline:
 *  1. Download raw video from R2 (if cloud-upload flow) OR use local file path
 *  2. Probe metadata (duration, aspect ratio)
 *  3. Generate thumbnail at 1s
 *  4. Transcode 3 ABR renditions (360p, 480p, 720p) with HLS segmentation
 *  5. Upload all HLS files + thumbnail to R2
 *  6. Return hlsUrl, thumbnailUrl, duration, aspectRatio
 *  7. Cleanup is handled by the CALLER (media.processor.js) to allow safe retries
 */

import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import path from "path";
import fs from "fs-extra";
import os from "os";
import axios from "axios";
import { uploadDirectoryToR2, uploadToR2 } from "./r2.js";
import { getEmitter } from "../config/socketEmitter.js";
import logger from "./logger.js";

// Tell fluent-ffmpeg where to find the static binaries
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * Adaptive Bitrate Rendition Ladder
 * Orders from low to high quality — encoding starts at 360p so progress
 * feedback feels fast to the user.
 */
const RENDITIONS = [
  {
    resolution: "360p",
    width: 360,
    height: 640,
    bitrate: "800k",
    bufsize: "1200k",
    maxrate: "850k",
  },
  {
    resolution: "480p",
    width: 480,
    height: 854,
    bitrate: "1400k",
    bufsize: "2100k",
    maxrate: "1500k",
  },
  {
    resolution: "720p",
    width: 720,
    height: 1280,
    bitrate: "2800k",
    bufsize: "4200k",
    maxrate: "3000k",
  },
];

/**
 * Process a video into ABR HLS format and upload to R2.
 *
 * @param {Object} media - The Prisma media record (Reel | Story | Post)
 * @param {string} mediaType - 'reel' | 'story' | 'community'
 * @param {string|null} localPath - Optional local file path for legacy direct-upload flow
 * @returns {Promise<{ hlsUrl, thumbnailUrl, duration, aspectRatio, width, height }>}
 */
export const processMediaVideo = async (media, mediaType, localPath = null) => {
  const tempId = `media_${media.id}_${Date.now()}`;
  const tempDir = path.join(os.tmpdir(), tempId);

  // If localPath provided, use it directly; otherwise we'll download to tempDir/input.mp4
  const downloadedInputPath = path.join(tempDir, "input.mp4");
  const inputPath = localPath || downloadedInputPath;
  const outputDir = path.join(tempDir, "output");
  const thumbnailPath = path.join(tempDir, "thumbnail.jpg");

  try {
    logger.info(
      `[WORKER] [${media.id}] Starting ABR pipeline for ${mediaType}...`
    );
    await fs.ensureDir(tempDir);
    await fs.ensureDir(outputDir);

    // rawVideoUrl is the field on Reel; Story uses rawMediaUrl — the processor passes correct model
    const sourceUrl = media.rawVideoUrl || media.rawMediaUrl || null;

    // ── 1. Download raw video from R2 (cloud-upload flow) ───────────────────
    if (!localPath) {
      if (!sourceUrl) {
        throw new Error(
          `[WORKER] [${media.id}] No source video URL found — rawVideoUrl is null.`
        );
      }
      logger.info(
        `[WORKER] [${media.id}] Downloading raw video from: ${sourceUrl}`
      );
      const response = await axios({
        url: sourceUrl,
        method: "GET",
        responseType: "stream",
        timeout: 300_000, // 5 min download timeout
      });
      const writer = fs.createWriteStream(downloadedInputPath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
        response.data.on("error", reject);
      });
      logger.info(`[WORKER] [${media.id}] Download complete.`);
    }

    // ── 2. Probe metadata ────────────────────────────────────────────────────
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) reject(new Error(`ffprobe failed: ${err.message}`));
        else resolve(data);
      });
    });

    const duration = metadata.format?.duration || 0;
    const videoStream = metadata.streams?.find((s) => s.codec_type === "video");
    if (!videoStream) {
      throw new Error(
        `[WORKER] [${media.id}] No video stream found in input file.`
      );
    }
    const { width = 720, height = 1280 } = videoStream;
    const aspectRatio = width / height;

    logger.info(
      `[WORKER] [${media.id}] Probed: ${width}x${height}, duration=${duration}s`
    );

    // ── 3. Generate Thumbnail ────────────────────────────────────────────────
    logger.info(`[WORKER] [${media.id}] Generating thumbnail...`);
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ["1"],
          filename: "thumbnail.jpg",
          folder: tempDir,
          size: "720x?",
        })
        .on("end", resolve)
        .on("error", (err) =>
          reject(new Error(`Thumbnail generation failed: ${err.message}`))
        );
    });

    // ── 4. Multi-Variant Transcoding ─────────────────────────────────────────
    logger.info(
      `[WORKER] [${media.id}] Transcoding ABR ladder (${RENDITIONS.map((r) => r.resolution).join(", ")})...`
    );

    const emitter = getEmitter();
    // Room name MUST match socket.js: socket.join(userId) — NO `user_` prefix
    const userId = media.userId || media.creatorId || media.adminId;
    const userRoom = userId ? `${userId}` : null;

    // Prefix mapping for R2 storage
    const modelPrefix =
      mediaType === "community"
        ? "community"
        : mediaType === "story"
          ? "stories"
          : "reels";

    let masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n";

    for (let i = 0; i < RENDITIONS.length; i++) {
      const rendition = RENDITIONS[i];
      const renditionDir = path.join(outputDir, rendition.resolution);
      await fs.ensureDir(renditionDir);

      logger.info(`[WORKER] [${media.id}] Encoding ${rendition.resolution}...`);

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            "-vcodec libx264",
            "-crf 26",
            "-preset veryfast",
            `-b:v ${rendition.bitrate}`,
            `-maxrate ${rendition.maxrate}`,
            `-bufsize ${rendition.bufsize}`,
            "-pix_fmt yuv420p",
            `-vf scale=w=${rendition.width}:h=-2`,
            "-profile:v main",
            "-level 3.1",
            "-acodec aac",
            "-ar 44100",
            "-b:a 128k",
            "-start_number 0",
            "-hls_time 4",
            "-hls_list_size 0",
            "-hls_segment_type mpegts",
            "-hls_segment_filename",
            path.join(renditionDir, "segment_%03d.ts"),
            "-f hls",
          ])
          .output(path.join(renditionDir, "playlist.m3u8"))
          .on("progress", (progress) => {
            const renditionProgress = Math.min(
              Math.max(progress.percent || 0, 0),
              100
            );
            const totalProgress = Math.round(
              (i / RENDITIONS.length) * 100 +
                renditionProgress / RENDITIONS.length
            );

            if (emitter && userRoom) {
              emitter.to(userRoom).emit("MEDIA_PROCESSING_PROGRESS", {
                mediaId: media.id,
                mediaType,
                progress: totalProgress,
                status: `Optimizing ${rendition.resolution}...`,
              });
            }
          })
          .on("end", resolve)
          .on("error", (err) =>
            reject(
              new Error(
                `Encoding ${rendition.resolution} failed: ${err.message}`
              )
            )
          )
          .run();
      });

      const bandwidth = parseInt(rendition.bitrate) * 1000;
      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${rendition.width}x${rendition.height}\n${rendition.resolution}/playlist.m3u8\n`;
    }

    // Write master playlist
    await fs.writeFile(path.join(outputDir, "master.m3u8"), masterPlaylist);

    // ── 5. Upload HLS to R2 ──────────────────────────────────────────────────
    const r2Prefix = `${modelPrefix}/${media.id}`;
    logger.info(
      `[WORKER] [${media.id}] Uploading HLS to R2 prefix: ${r2Prefix}`
    );
    await uploadDirectoryToR2(outputDir, r2Prefix);

    // ── 6. Upload Thumbnail to R2 ────────────────────────────────────────────
    const thumbKey = `thumbnails/${media.id}.jpg`;
    const thumbResult = await uploadToR2(thumbnailPath, thumbKey, "image/jpeg");

    const hlsUrl = `${process.env.REELS_CDN_URL}/${r2Prefix}/master.m3u8`;

    logger.info(`[WORKER] [${media.id}] Pipeline complete. HLS: ${hlsUrl}`);

    return {
      hlsUrl,
      thumbnailUrl: thumbResult.url,
      duration,
      aspectRatio,
      width,
      height,
    };
  } catch (error) {
    logger.error(`[WORKER] [${media.id}] Pipeline error:`, error);
    throw error; // Caller (media.processor.js) handles status update and Sentry
  } finally {
    // Always clean up the local temp directory
    await fs
      .remove(tempDir)
      .catch((e) =>
        logger.warn(
          `[WORKER] [${media.id}] Temp dir cleanup failed: ${e.message}`
        )
      );
    // Clean up local path only if it was provided (legacy direct upload)
    if (localPath) {
      await fs
        .remove(localPath)
        .catch((e) =>
          logger.warn(
            `[WORKER] [${media.id}] Local file cleanup failed: ${e.message}`
          )
        );
    }
  }
};
