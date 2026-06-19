import { Router } from "express";
import {
  raiseDispute,
  replyToDispute,
  getUserDisputes,
  getDisputeById,
  escalateDispute,
} from "../dispute.controller.js";
import verifyToken from "../../../middleware/jwt/user.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  raiseDisputeSchema,
  replyToDisputeSchema,
} from "../dispute.validator.js";
import upload from "../../../middleware/uploads/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dispute
 *   description: Customer support and ticket management for bookings and payments
 */

router.use(verifyToken);

/**
 * @swagger
 * /dispute:
 *   get:
 *     summary: Get all my disputes
 *     tags: [Dispute]
 */
router.get("/", getUserDisputes);

/**
 * @swagger
 * /dispute/raise:
 *   post:
 *     summary: Raise a new dispute
 *     tags: [Dispute]
 */
router.post(
  "/raise",
  upload.array("disputeImages", 5),
  validate(raiseDisputeSchema),
  raiseDispute
);

/**
 * @swagger
 * /dispute/{disputeId}:
 *   get:
 *     summary: Get dispute details
 *     tags: [Dispute]
 */
router.get("/:disputeId", getDisputeById);

/**
 * @swagger
 * /dispute/{disputeId}/reply:
 *   post:
 *     summary: Reply to a dispute thread
 *     tags: [Dispute]
 */
router.post(
  "/:disputeId/reply",
  validate(replyToDisputeSchema),
  replyToDispute
);

/**
 * @swagger
 * /dispute/{disputeId}/escalate:
 *   post:
 *     summary: Escalate a dispute to admin
 *     tags: [Dispute]
 */
router.post("/:disputeId/escalate", escalateDispute);

export default router;
