import { Router } from "express";
import { getScorerDashboardData } from "../owner/dashboard.controller.js";
import verifyAuth, {
  authorizeRoles,
} from "../../middleware/jwt/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Scorer
 *   description: Match scoring and statistical recording
 */

/**
 * @swagger
 * /scorer/dashboard:
 *   get:
 *     summary: Get scorer dashboard data
 *     tags: [Scorer]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Matches assigned to the scorer and historical data
 */
router.use(verifyAuth);
router.get("/dashboard", authorizeRoles("scorer"), getScorerDashboardData);

export default router;
