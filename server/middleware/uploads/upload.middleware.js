import multer from "multer";
import { BadRequestError } from "@kridaz/common";

// Use memory storage instead of disk storage.
// Render's filesystem is ephemeral and files written to disk
// will be lost on restarts/redeploys. Files are immediately
// streamed to Cloudinary so no disk persistence is needed.

// Allowed MIME types — keeps the upload surface to media + PDFs the app
// actually consumes (profile pics, reels, story media, document uploads).
// Without this filter a client can claim image/jpeg and send anything.
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
]);

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  // multer wraps this in a MulterError-ish flow; throwing a typed BadRequest
  // makes the global error handler emit the standard envelope with code.
  cb(
    new BadRequestError(`Unsupported file type: ${file.mimetype}`, {
      code: "INVALID_FILE_TYPE",
      allowed: [...ALLOWED_MIME_TYPES],
    }),
    false
  );
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit to prevent OOM DoS
  },
});

export default upload;
