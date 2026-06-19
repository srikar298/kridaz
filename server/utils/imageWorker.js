import sharp from "sharp";
import axios from "axios";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { uploadToR2 } from "./r2.js";
import logger from "./logger.js";

/**
 * Generates a tiny base64 placeholder for an image
 */
export const generatePlaceholder = async (sourceUrlOrBuffer) => {
  try {
    let input = sourceUrlOrBuffer;

    if (typeof sourceUrlOrBuffer === "string") {
      const response = await axios.get(sourceUrlOrBuffer, {
        responseType: "arraybuffer",
      });
      input = Buffer.from(response.data);
    }

    const placeholder = await sharp(input)
      .resize(15, 15, { fit: "cover" })
      .blur(2)
      .toFormat("webp", { quality: 20 })
      .toBuffer();

    return `data:image/webp;base64,${placeholder.toString("base64")}`;
  } catch (error) {
    logger.error("[IMAGE_WORKER] Placeholder failed", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return null;
  }
};

/**
 * Optimizes and uploads a raw image to R2
 */
export const optimizeAndUploadImage = async (inputPath, keyPrefix) => {
  const tempDir = path.join(os.tmpdir(), `img_${Date.now()}`);
  await fs.ensureDir(tempDir);

  const optimizedPath = path.join(tempDir, "optimized.webp");

  try {
    // 1. Optimize image (Convert to WebP, resize if massive)
    await sharp(inputPath)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(optimizedPath);

    // 2. Generate Placeholder
    const placeholder = await generatePlaceholder(optimizedPath);

    // 3. Upload to R2
    const key = `${keyPrefix}/${Date.now()}.webp`;
    const uploadResult = await uploadToR2(optimizedPath, key, "image/webp");

    return {
      url: uploadResult.url,
      placeholder,
      key,
    };
  } finally {
    await fs.remove(tempDir).catch(() => {});
  }
};
