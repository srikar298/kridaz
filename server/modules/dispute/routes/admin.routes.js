import { Router } from "express";
import {
  getAllDisputes,
  getDisputeById,
  resolveDispute,
  replyToDispute,
} from "../dispute.controller.js";
import verifyAdmin from "../../../middleware/jwt/admin.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  resolveDisputeSchema,
  replyToDisputeSchema,
} from "../dispute.validator.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Dispute
 *   description: Administrative oversight and resolution for platform disputes
 */

/**
 * @swagger
 * /dispute/admin:
 *   get:
 *     summary: List all disputes across the platform
 *     tags: [Admin Dispute]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all disputes
 */
router.get("/", verifyAdmin, getAllDisputes);

/**
 * @swagger
 * /dispute/admin/{disputeId}:
 *   get:
 *     summary: Get full dispute details for review
 *     tags: [Admin Dispute]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dispute data
 */
router.get("/:disputeId", verifyAdmin, getDisputeById);

/**
 * @swagger
 * /dispute/admin/{disputeId}/reply:
 *   post:
 *     summary: Administrative reply to a dispute
 *     tags: [Admin Dispute]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reply added
 */
router.post(
  "/:disputeId/reply",
  verifyAdmin,
  validate(replyToDisputeSchema),
  replyToDispute
);

/**
 * @swagger
 * /dispute/admin/{disputeId}/resolve:
 *   post:
 *     summary: Resolve and close a dispute
 *     tags: [Admin Dispute]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dispute resolved
 */
router.post(
  "/:disputeId/resolve",
  verifyAdmin,
  validate(resolveDisputeSchema),
  resolveDispute
);

export default router;
