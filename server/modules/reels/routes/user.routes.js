import { Router } from "express";
import * as reelsController from "../reels.controller.js";
import {
  protect,
  optionalProtect,
} from "../../../middleware/auth.middleware.js";
import multer from "multer";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  interactSchema,
  reelCommentSchema,
  confirmUploadSchema,
} from "../reels.validator.js";

const router = Router();

// Configure local multer for legacy support if needed
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/reels"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

/**
 * @swagger
 * tags:
 *   name: Reels
 *   description: Short-form video feed and interactions
 */

// ── Public / Optional Auth Routes ───────────────────────────────────────────

/**
 * @swagger
 * /reels/feed:
 *   get:
 *     summary: Get reels feed
 *     tags: [Reels]
 */
router.get("/feed", optionalProtect, reelsController.getReelsFeed);

/**
 * @swagger
 * /reels/recommended:
 *   get:
 *     summary: Get recommended reels
 *     tags: [Reels]
 */
router.get("/recommended", reelsController.getRecommendedReels);

/**
 * @swagger
 * /reels/{reelId}/heartbeat:
 *   post:
 *     summary: Track reel watch time
 *     tags: [Reels]
 */
router.post("/:reelId/heartbeat", reelsController.trackWatchTime);

// ── Authenticated Routes ────────────────────────────────────────────────────
router.use(protect);

/**
 * @swagger
 * /reels/upload-url:
 *   get:
 *     summary: Get pre-signed upload URL
 *     tags: [Reels]
 *     security:
 *       - BearerAuth: []
 */
router.get("/upload-url", reelsController.getUploadUrl);

/**
 * @swagger
 * /reels/confirm-upload:
 *   post:
 *     summary: Confirm reel upload
 *     tags: [Reels]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/confirm-upload",
  validate(confirmUploadSchema),
  reelsController.confirmUpload
);

/**
 * @swagger
 * /reels/upload:
 *   post:
 *     summary: Legacy direct upload
 *     tags: [Reels]
 */
router.post("/upload", upload.single("video"), reelsController.uploadReel);

/**
 * @swagger
 * /reels/{reelId}/interact:
 *   post:
 *     summary: Interact with a reel (LIKE, VIEW)
 *     tags: [Reels]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/:reelId/interact",
  validate(interactSchema),
  reelsController.interactWithReel
);

/**
 * @swagger
 * /reels/{reelId}/comments:
 *   get:
 *     summary: Get comments for a reel
 *     tags: [Reels]
 */
router.get("/:reelId/comments", reelsController.getReelComments);

/**
 * @swagger
 * /reels/{reelId}/comment:
 *   post:
 *     summary: Add a comment to a reel
 *     tags: [Reels]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/:reelId/comment",
  validate(reelCommentSchema),
  reelsController.addComment
);

/**
 * @swagger
 * /reels/analytics:
 *   get:
 *     summary: Get creator analytics
 *     tags: [Reels]
 *     security:
 *       - BearerAuth: []
 */
router.get("/analytics", reelsController.getCreatorAnalytics);

/**
 * @swagger
 * /reels/{reelId}:
 *   delete:
 *     summary: Delete a reel
 *     tags: [Reels]
 *     security:
 *       - BearerAuth: []
 */
router.get("/:reelId", optionalProtect, reelsController.getReelById);
router.delete("/:reelId", reelsController.deleteReel);

/**
 * @swagger
 * /reels/{reelId}/report:
 *   post:
 *     summary: Report a reel
 *     tags: [Reels]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:reelId/report", reelsController.reportReel);

/**
 * @swagger
 * /reels/reports:
 *   get:
 *     summary: Get all reel reports
 *     tags: [Reels]
 *     security:
 *       - BearerAuth: []
 */
router.get("/reports", reelsController.getReelReports);

export default router;
