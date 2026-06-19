import express from "express";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  addComment,
  updateComment,
  deleteComment,
  getMyActivity,
  getUserPosts,
  getUserStories,
  getCommunityStats,
  getUploadUrl,
  confirmPost,
  reportPost,
} from "../community.controller.js";
import userAuth from "../../../middleware/jwt/user.middleware.js";
import { optionalAuth } from "../../../middleware/jwt/auth.middleware.js";
import upload from "../../../middleware/uploads/upload.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  getUploadUrlSchema,
  confirmPostSchema,
  commentSchema,
  reportPostSchema,
} from "../community.validator.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Community Feed, Posts, and Interactions
 */

// ── Public Routes ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /community:
 *   get:
 *     summary: Get all community posts
 *     tags: [Community]
 */
router.get("/", optionalAuth, getPosts);

// ── Authenticated Routes ────────────────────────────────────────────────────

/**
 * @swagger
 * /community/stats:
 *   get:
 *     summary: Get community statistics
 *     tags: [Community]
 */
router.get("/stats", getCommunityStats);

/**
 * @swagger
 * /community/user-posts/{targetUserId}:
 *   get:
 *     summary: Get posts by specific user
 *     tags: [Community]
 */
router.get("/user-posts/:targetUserId?", getUserPosts);

/**
 * @swagger
 * /community/user-stories/{targetUserId}:
 *   get:
 *     summary: Get stories by specific user
 *     tags: [Community]
 */
router.get("/user-stories/:targetUserId?", getUserStories);

/**
 * @swagger
 * /community/my-activity:
 *   get:
 *     summary: Get current user's activity
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 */
router.get("/my-activity", userAuth, getMyActivity);

/**
 * @swagger
 * /community/{id}/like:
 *   post:
 *     summary: Like/Unlike a post
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/like", userAuth, likePost);

/**
 * @swagger
 * /community/{id}/comment:
 *   post:
 *     summary: Add a comment
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/comment", userAuth, validate(commentSchema), addComment);

/**
 * @swagger
 * /community/{id}/comment/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Delete a comment
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 */
router.put(
  "/:id/comment/:commentId",
  userAuth,
  validate(commentSchema),
  updateComment
);
router.delete("/:id/comment/:commentId", userAuth, deleteComment);

/**
 * @swagger
 * /community/upload-url:
 *   get:
 *     summary: Get pre-signed upload URL
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 */
router.get("/upload-url", userAuth, validate(getUploadUrlSchema), getUploadUrl);

/**
 * @swagger
 * /community/confirm-post:
 *   post:
 *     summary: Confirm post after upload
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/confirm-post",
  userAuth,
  validate(confirmPostSchema),
  confirmPost
);

/**
 * @swagger
 * /community:
 *   post:
 *     summary: Create a post (direct upload)
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 */
router.post("/", userAuth, upload.single("image"), createPost);

/**
 * @swagger
 * /community/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Delete a post
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 */
router.put("/:id", userAuth, upload.single("image"), updatePost);
router.delete("/:id", userAuth, deletePost);

/**
 * @swagger
 * /community/{id}/report:
 *   post:
 *     summary: Report a post
 *     tags: [Community]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/report", userAuth, validate(reportPostSchema), reportPost);

/**
 * @swagger
 * /community/{id}:
 *   get:
 *     summary: Get a specific community post
 *     tags: [Community]
 */
router.get("/:id", getPostById);

export default router;
