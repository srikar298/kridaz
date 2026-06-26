import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";
import sharp from "sharp";
import logger from "./logger.js";
dotenv.config();

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "kridaz";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_DEV_URL;

/**
 * Uploads a file buffer to Cloudflare R2
 * @param {Buffer} buffer - File buffer
 * @param {string} folder  - Folder path inside the bucket
 * @param {string} mimeType - (Optional) Mime type, will auto-detect basic types if not provided
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadToR2 = async (buffer, folder = "kridaz", mimeType = null) => {
  if (!buffer || buffer.length === 0) {
    throw new Error("File buffer is empty");
  }

  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  // Ensure folder has no leading/trailing slashes
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const key = `${cleanFolder}/${fileName}`;

  // Simple mime type detection based on magic numbers if mimeType is not provided
  let contentType = mimeType || "application/octet-stream";
  if (!mimeType) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50) contentType = "image/png";
    else if (buffer[0] === 0x47 && buffer[1] === 0x49) contentType = "image/gif";
    else if (buffer[0] === 0xff && buffer[1] === 0xd8) contentType = "image/jpeg";
    else if (buffer[0] === 0x52 && buffer[1] === 0x49) contentType = "image/webp"; // RIFF WEBP
    else if (buffer.length > 4 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) contentType = "video/mp4"; // FTYP
  }

  // Upload the original file
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  // If it's an image (and not a gif which sharp might break animation for without special handling),
  // generate and upload variants
  if (contentType.startsWith("image/") && contentType !== "image/gif") {
    try {
      // We will save variants as webp for best compression
      
      // Medium variant (800px)
      const mediumBuffer = await sharp(buffer)
        .resize(800, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `${cleanFolder}/${fileName}_800.webp`,
          Body: mediumBuffer,
          ContentType: "image/webp",
        })
      );

      // Thumbnail variant (400px)
      const thumbBuffer = await sharp(buffer)
        .resize(400, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
        
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `${cleanFolder}/${fileName}_400.webp`,
          Body: thumbBuffer,
          ContentType: "image/webp",
        })
      );
    } catch (err) {
      logger.error("[R2_RESIZE_ERROR] Failed to generate image variants:", err.message);
      // Don't throw, we still successfully uploaded the original
    }
  }

  return `${R2_PUBLIC_URL}/${key}`;
};

/**
 * Deletes a file from Cloudflare R2 by its public URL
 * @param {string} fileUrl - The public R2 URL
 */
export const deleteFromR2 = async (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith(R2_PUBLIC_URL)) return;
  
  try {
    const key = fileUrl.replace(`${R2_PUBLIC_URL}/`, "");
    
    // Delete the original file
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    
    // Also try to delete potential variants if this was an image
    // The key format is like folder/123456789-abcdef
    const variants = [`${key}_400.webp`, `${key}_800.webp`];
    for (const variantKey of variants) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: variantKey,
          })
        );
      } catch (e) {
        // Ignore errors for variants, they might not exist (e.g. non-images)
      }
    }
    
  } catch (err) {
    console.error("Error deleting from R2:", err.message);
  }
};
