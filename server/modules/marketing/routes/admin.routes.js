import { Router } from "express";
import {
  getAdBanners,
  createAdBanner,
  updateAdBanner,
  deleteAdBanner,
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  getQuickLinks,
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
} from "../marketing.controller.js";
import upload from "../../../middleware/uploads/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Marketing
 *   description: Admin management for app banners and promotional videos
 */

// Ad Banners

/**
 * @swagger
 * /marketing/admin/banners:
 *   get:
 *     summary: Get all ad banners
 *     tags: [Admin Marketing]
 *     responses:
 *       200:
 *         description: List of banners
 */
router.get("/banners", getAdBanners);

/**
 * @swagger
 * /marketing/admin/banners:
 *   post:
 *     summary: Create an ad banner
 *     tags: [Admin Marketing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Banner created
 */
router.post("/banners", upload.single("image"), createAdBanner);

/**
 * @swagger
 * /marketing/admin/banners/{id}:
 *   put:
 *     summary: Update ad banner
 *     tags: [Admin Marketing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Banner updated
 */
router.put("/banners/:id", upload.single("image"), updateAdBanner);

/**
 * @swagger
 * /marketing/admin/banners/{id}:
 *   delete:
 *     summary: Delete ad banner
 *     tags: [Admin Marketing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Banner deleted
 */
router.delete("/banners/:id", deleteAdBanner);

// Videos

/**
 * @swagger
 * /marketing/admin/videos:
 *   get:
 *     summary: Get all promotional videos
 *     tags: [Admin Marketing]
 *     responses:
 *       200:
 *         description: List of videos
 */
router.get("/videos", getVideos);

/**
 * @swagger
 * /marketing/admin/videos:
 *   post:
 *     summary: Create a promotional video
 *     tags: [Admin Marketing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Video created
 */
router.post("/videos", createVideo);

/**
 * @swagger
 * /marketing/admin/videos/{id}:
 *   put:
 *     summary: Update promotional video
 *     tags: [Admin Marketing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Video updated
 */
router.put("/videos/:id", updateVideo);

/**
 * @swagger
 * /marketing/admin/videos/{id}:
 *   delete:
 *     summary: Delete promotional video
 *     tags: [Admin Marketing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Video deleted
 */
router.delete("/videos/:id", deleteVideo);

// Quick Links

router.get("/quick-links", getQuickLinks);
router.post("/quick-links", upload.single("image"), createQuickLink);
router.put("/quick-links/:id", upload.single("image"), updateQuickLink);
router.delete("/quick-links/:id", deleteQuickLink);

export default router;
