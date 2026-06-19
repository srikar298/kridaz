import { Router } from "express";
import {
  getAllTickets,
  updateTicketStatus,
  replyToTicket,
  toggleAgentStatus,
  getAllDisputes,
  resolveDispute,
} from "../support.controller.js";
import verifyAdminToken from "../../../middleware/jwt/admin.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Support
 *   description: Admin management for support tickets and user disputes
 */

// Tickets
router.get("/tickets", verifyAdminToken, getAllTickets);
router.put("/tickets/:ticketId/status", verifyAdminToken, updateTicketStatus);
router.post("/tickets/:ticketId/reply", verifyAdminToken, replyToTicket);
router.put(
  "/tickets/:ticketId/agent-status",
  verifyAdminToken,
  toggleAgentStatus
);

// Disputes
router.get("/disputes", verifyAdminToken, getAllDisputes);
router.put("/disputes/:disputeId/resolve", verifyAdminToken, resolveDispute);

export default router;
