import { Router } from "express";
import {
  toggleFeatureFlag,
  seedFeatureFlags,
} from "../../admin/featureFlag.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin FeatureFlag
 *   description: System-wide feature toggles for enabling/disabling modules
 */

/**
 * @swagger
 * /feature/admin/seed:
 *   post:
 *     summary: Seed initial feature flags
 *     tags: [Admin FeatureFlag]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Flags seeded
 */
router.post("/seed", seedFeatureFlags);

/**
 * @swagger
 * /feature/admin/{key}:
 *   put:
 *     summary: Toggle a feature flag
 *     tags: [Admin FeatureFlag]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled: { type: boolean }
 *     responses:
 *       200:
 *         description: Flag toggled
 */
router.put("/:key", toggleFeatureFlag);

export default router;
