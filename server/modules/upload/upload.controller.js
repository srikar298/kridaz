import { uploadToCloudinary } from "../../utils/cloudinary.js";
import logger from "../../utils/logger.js";

/**
 * @desc Upload a file to Cloudinary
 * @route POST /api/upload
 */
export const handleSingleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file provided" });
    }

    const folder = req.body.folder || "kridaz/verification";
    const result = await uploadToCloudinary(req.file.buffer, folder);

    return res.status(200).json({
      success: true,
      url: result,
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    logger.error("[UPLOAD ERROR]", error);
    return res
      .status(500)
      .json({ success: false, message: "File upload failed" });
  }
};
