import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

export const uploadToR2 = async (filePath, key, contentType) => {
  try {
    const fileStream = fs.createReadStream(filePath);

    const parallelUploads3 = new Upload({
      client: r2Client,
      params: {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        CacheControl: key.endsWith(".m3u8")
          ? "max-age=0, no-cache, no-store, must-revalidate"
          : "public, max-age=31536000, immutable",
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false,
    });

    await parallelUploads3.done();

    return {
      success: true,
      key,
      url: `${process.env.REELS_CDN_URL}/${key}`,
    };
  } catch (error) {
    logger.error(`[R2_UPLOAD_ERROR] Failed to upload ${key}:`, error);
    throw error;
  }
};

export const uploadDirectoryToR2 = async (dirPath, prefix) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  const uploadPromises = entries.map(async (entry) => {
    const fullPath = path.join(dirPath, entry.name);
    const key = `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      return uploadDirectoryToR2(fullPath, key);
    } else {
      const contentType = entry.name.endsWith(".m3u8")
        ? "application/x-mpegURL"
        : entry.name.endsWith(".ts")
          ? "video/MP2T"
          : "application/octet-stream";
      return uploadToR2(fullPath, key, contentType);
    }
  });

  return Promise.all(uploadPromises);
};

export const getPresignedUploadUrl = async (
  key,
  contentType,
  expiresIn = 3600
) => {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
};

export const deleteFromR2 = async (key) => {
  try {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });
    await r2Client.send(command);
    return { success: true };
  } catch (error) {
    logger.error(`[R2_DELETE_ERROR] Failed to delete ${key}:`, error);
    throw error;
  }
};

export const deleteDirectoryFromR2 = async (prefix) => {
  try {
    const { ListObjectsV2Command, DeleteObjectsCommand } =
      await import("@aws-sdk/client-s3");
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefix,
    });
    const list = await r2Client.send(listCommand);
    if (!list.Contents || list.Contents.length === 0) return { success: true };

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Delete: {
        Objects: list.Contents.map((obj) => ({ Key: obj.Key })),
      },
    });
    await r2Client.send(deleteCommand);
    return { success: true };
  } catch (error) {
    logger.error(
      `[R2_DELETE_DIR_ERROR] Failed to delete prefix ${prefix}:`,
      error
    );
    throw error;
  }
};

export const deleteStoryFilesFromR2 = async (story) => {
  if (!story) return;
  const { id, mediaUrl, rawMediaUrl } = story;
  try {
    const cdnBase = process.env.REELS_CDN_URL?.replace(/\/$/, "");

    // Helper to get key from URL
    const getKeyFromUrl = (url) => {
      if (!url) return null;
      if (cdnBase && url.startsWith(cdnBase)) {
        return url.slice(cdnBase.length + 1);
      }
      try {
        const u = new URL(url);
        return u.pathname.replace(/^\//, "");
      } catch (e) {
        return null;
      }
    };

    // 1. Delete raw/image files from R2
    const urlsToDelete = [mediaUrl, rawMediaUrl];
    for (const url of urlsToDelete) {
      if (url && (url.includes("temp/stories") || url.includes("/stories/"))) {
        if (url.endsWith(".m3u8")) continue; // HLS playlist handled by directory delete
        const key = getKeyFromUrl(url);
        if (key) {
          logger.info(`[R2_CLEANUP] Deleting story file: ${key}`);
          await deleteFromR2(key).catch((err) =>
            logger.warn(`Failed to delete key ${key}: ${err.message}`)
          );
        }
      }
    }

    // 2. Delete HLS transcode directory (for videos)
    const hlsPrefix = `stories/${id}`;
    logger.info(`[R2_CLEANUP] Deleting story directory: ${hlsPrefix}`);
    await deleteDirectoryFromR2(hlsPrefix).catch((err) =>
      logger.warn(
        `Failed to delete directory prefix ${hlsPrefix}: ${err.message}`
      )
    );

    // 3. Delete thumbnail
    const thumbKey = `thumbnails/${id}.jpg`;
    logger.info(`[R2_CLEANUP] Deleting story thumbnail: ${thumbKey}`);
    await deleteFromR2(thumbKey).catch((err) =>
      logger.warn(`Failed to delete thumbnail ${thumbKey}: ${err.message}`)
    );
  } catch (error) {
    logger.error(`Error deleting R2 files for story ${id}:`, error);
  }
};

export default r2Client;
