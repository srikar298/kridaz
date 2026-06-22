import QRCode from "qrcode";
import { uploadToR2 } from "./r2Upload.js";
import logger from "./logger.js";

async function generateQRCode(url) {
  try {
    // Generate QR code as a buffer for the provided URL
    const qrCodeBuffer = await QRCode.toBuffer(url);

    // Upload the QR code to R2
    const uploadUrl = await uploadToR2(qrCodeBuffer, "kridaz/qrcode", "image/png");

    logger.info("QR code URL generated and uploaded successfully!");
    return uploadUrl;
  } catch (error) {
    logger.error("Error generating or uploading QR code:", error);
    throw error;
  }
}

export default generateQRCode;
