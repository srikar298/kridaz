import express from "express";
import {
  getAllTurfs,
  getTurfById,
  getTimeSlotByTurfId,
  getTurfLocations,
  toggleTurfLike,
  getLikedTurfs,
  recordTurfShare,
  recordTurfInteraction,
  getTurfRecommendations,
  getSimilarTurfs,
} from "../turf.controller.js";
import {
  protect,
  optionalProtect,
} from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/like", protect, toggleTurfLike);
router.get("/likes", protect, getLikedTurfs);
router.post("/share", optionalProtect, recordTurfShare);
router.post("/interaction", optionalProtect, recordTurfInteraction);
router.get("/recommendations", optionalProtect, getTurfRecommendations);
router.get("/:id/similar", optionalProtect, getSimilarTurfs);

/**
 * @swagger
 * tags:
 *   name: Turf
 *   description: Sports Ground Discovery and Details
 */

/**
 * @swagger
 * /turf/all:
 *   get:
 *     summary: List all available turfs
 *     tags: [Turf]
 */
router.get("/all", getAllTurfs);

/**
 * @swagger
 * /turf/locations:
 *   get:
 *     summary: Get all turf locations
 *     tags: [Turf]
 */
router.get("/locations", getTurfLocations);

/**
 * @swagger
 * /turf/details/{id}:
 *   get:
 *     summary: Get turf details
 *     tags: [Turf]
 */
router.get("/details/:id", getTurfById);

/**
 * @swagger
 * /turf/timeSlot:
 *   get:
 *     summary: Get available time slots
 *     tags: [Turf]
 */
router.get("/timeSlot", getTimeSlotByTurfId);

export default router;
