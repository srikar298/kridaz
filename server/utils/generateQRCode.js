import QRCode from "qrcode";
import cloudinary from "./cloudinary.js";
import logger from "./logger.js";

async function generateQRCode(url) {
  try {
    // Generate QR code as a data URL for the provided URL
    const qrCodeDataURL = await QRCode.toDataURL(url);

    // Upload the QR code to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(qrCodeDataURL, {
      folder: "kridaz/qrcode",
    });

    logger.info("QR code URL generated and uploaded successfully!");
    return uploadResponse.secure_url;
  } catch (error) {
    logger.error("Error generating or uploading QR code:", error);
    throw error;
  }
}

export default generateQRCode;
