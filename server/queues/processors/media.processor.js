/**
 * Media Processor
 *
 * Handles video transcoding for reels, stories, and community posts.
 * Runs as an INLINE BullMQ processor (same Node process) — NOT sandboxed.
 *
 * Pipeline:
 *  1. Fetch media record from DB
 *  2. Set status → 'processing'
 *  3. Download raw video from R2 (if needed) and transcode via ffmpeg (ABR HLS)
 *  4. Upload HLS segments + thumbnail to R2
 *  5. Delete raw temporary file from R2
 *  6. Set status → 'ready', update DB with hlsUrl + thumbnailUrl
 *  7. Emit MEDIA_PROCESSING_COMPLETE socket event to creator
 */

import dotenv from "dotenv";
dotenv.config(); // MUST run before any env-dependent imports

import { prisma } from "../../config/prisma.js";
import { processMediaVideo } from "../../utils/reelWorker.js";
import { getEmitter } from "../../config/socketEmitter.js";
import * as Sentry from "@sentry/node";
import { initSentry } from "../../config/sentry.js";
import logger from "../../utils/logger.js";
import { invalidateCache } from "../../utils/cache.js";

// Initialize Sentry for error tracking
initSentry();

/**
 * Maps media type string → Prisma model name
 */
const MODEL_MAP = {
  reel: "reel",
  story: "story",
  community: "post",
};

/**
 * Main BullMQ job processor
 * @param {import('bullmq').Job} job
 */
export default async function mediaProcessor(job) {
  const { mediaId, mediaType, localPath } = job.data;
  const prismaModel = MODEL_MAP[mediaType];

  if (!prismaModel) {
    throw new Error(
      `Invalid media type: "${mediaType}". Expected one of: ${Object.keys(MODEL_MAP).join(", ")}`
    );
  }

  const Model = prisma[prismaModel];

  // ── 1. Fetch media record ──────────────────────────────────────────────────
  const media = await Model.findUnique({ where: { id: mediaId } });
  if (!media) {
    throw new Error(
      `[PROCESSOR] ${mediaType} "${mediaId}" not found in database.`
    );
  }

  // Snapshot raw URL NOW before we null it — needed for R2 cleanup after transcoding
  const rawSourceUrl = media.rawVideoUrl || media.rawMediaUrl || null;

  // ── 2. Mark as processing ─────────────────────────────────────────────────
  await Model.update({
    where: { id: mediaId },
    data: { status: "processing" },
  });

  try {
    // ── 3. Transcode ────────────────────────────────────────────────────────
    const result = await processMediaVideo(media, mediaType, localPath);

    // ── 4. Update DB: mark ready + clear raw URL ───────────────────────────
    const updateData = {
      status: "ready",
      hlsUrl: result.hlsUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      aspectRatio: result.aspectRatio,
    };

    // Null out raw source fields per model schema
    if (mediaType === "reel") {
      updateData.rawVideoUrl = null;
    } else if (mediaType === "story") {
      updateData.rawMediaUrl = null;
      updateData.mediaUrl = result.hlsUrl;
    } else if (mediaType === "community") {
      updateData.mediaUrls = [result.hlsUrl];
    }

    await Model.update({ where: { id: mediaId }, data: updateData });

    // Invalidate caches based on media type
    try {
      if (mediaType === "reel") await invalidateCache("reels:feed*");
      else if (mediaType === "story") await invalidateCache("story:feed*");
      else if (mediaType === "community")
        await invalidateCache("community:feed*");
      logger.info(
        `[PROCESSOR] Invalidated cache for new ${mediaType}: ${mediaId}`
      );
    } catch (err) {
      logger.warn(`[PROCESSOR] Failed to invalidate cache: ${err.message}`);
    }

    // ── 5. Delete raw temp file from R2 ────────────────────────────────────
    // Done AFTER the DB update so that on failure, rawVideoUrl is still set
    // and the next retry can still find the source.
    if (rawSourceUrl) {
      try {
        const { deleteFromR2 } = await import("../../utils/r2.js");
        // Extract the key portion from the full CDN URL
        const cdnBase = process.env.REELS_CDN_URL?.replace(/\/$/, "");
        let rawKey = null;

        if (cdnBase && rawSourceUrl.startsWith(cdnBase)) {
          // e.g. "https://pub.r2.dev/temp/reels/abc.mp4" → "temp/reels/abc.mp4"
          rawKey = rawSourceUrl.slice(cdnBase.length + 1);
        } else {
          // Fallback: grab everything after the bucket domain
          const url = new URL(rawSourceUrl);
          rawKey = url.pathname.replace(/^\//, "");
        }

        if (rawKey) {
          logger.info(`[PROCESSOR] Deleting raw source from R2: ${rawKey}`);
          await deleteFromR2(rawKey);
          logger.info(`[PROCESSOR] Raw source deleted: ${rawKey}`);
        }
      } catch (cleanupErr) {
        // Non-fatal: log and continue — the main job succeeded
        logger.warn(
          `[PROCESSOR] R2 raw file cleanup failed (non-fatal): ${cleanupErr.message}`
        );
      }
    }

    // ── 6. Notify creator via Socket.io ────────────────────────────────────
    const emitter = getEmitter();
    if (emitter) {
      // Room name MUST match socket.js: socket.join(userId) — NO prefix
      const userId = media.userId || media.creatorId || media.authorId;
      if (userId) {
        emitter.to(`${userId}`).emit("MEDIA_PROCESSING_COMPLETE", {
          mediaId,
          mediaType,
          hlsUrl: result.hlsUrl,
          thumbnailUrl: result.thumbnailUrl,
        });
        logger.info(
          `[PROCESSOR] MEDIA_PROCESSING_COMPLETE emitted to room: ${userId}`
        );
      }
    }

    logger.info(`[PROCESSOR] Successfully processed ${mediaType}: ${mediaId}`);
    return result;
  } catch (error) {
    logger.error(
      `[PROCESSOR] Error processing ${mediaType} "${mediaId}":`,
      error
    );

    Sentry.captureException(error, {
      extra: { mediaId, mediaType, jobId: job.id, attempt: job.attemptsMade },
    });

    // Mark as failed in DB — do not null rawVideoUrl so retries can still download
    try {
      await Model.update({
        where: { id: mediaId },
        data: { status: "failed" },
      });
    } catch (dbErr) {
      logger.error(
        `[PROCESSOR] Failed to update status to "failed" for ${mediaId}:`,
        dbErr
      );
    }

    throw error; // BullMQ needs the re-throw to retry / mark failed
  }
}
