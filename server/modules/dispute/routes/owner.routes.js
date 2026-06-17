import { Router } from "express";
import { ownerActionDispute, getDisputeById } from "../dispute.controller.js";
import verifyOwnerToken from "../../../middleware/jwt/owner.middleware.js";

const router = Router();

router.use(verifyOwnerToken);

/**
 * @swagger
 * /dispute/{disputeId}:
 *   get:
 *     summary: Get dispute details for owner
 *     tags: [Dispute]
 */
router.get("/:disputeId", getDisputeById);

/**
 * @swagger
 * /dispute/{disputeId}/action:
 *   post:
 *     summary: Owner take action on a dispute
 *     tags: [Dispute]
 */
router.post("/:disputeId/action", ownerActionDispute);

export default router;
