import express from "express";
import { addReview, viewReviewsByTurf } from "../review.controller.js";
import verifyUserToken from "../../../middleware/jwt/user.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Review
 *   description: Turf ratings and user feedback management
 */

/**
 * @swagger
 * /review/{id}:
 *   get:
 *     summary: View reviews for a specific turf
 *     tags: [Review]
 */
router.get("/:id", viewReviewsByTurf);

/**
 * @swagger
 * /review/{id}:
 *   post:
 *     summary: Add a review for a turf
 *     tags: [Review]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id", verifyUserToken, addReview);

export default router;
