import { Router } from "express";
import {
  createVenueInvite,
  listVenueInvites,
  resendVenueInvite,
  revokeVenueInvite,
  verifyPublicInvite,
} from "../venueInvites.controller.js";

const router = Router();

// Admin protected routes (assumes verifyAdminToken is applied at the parent level)
router.post("/", createVenueInvite);
router.get("/", listVenueInvites);
router.post("/:id/resend", resendVenueInvite);
router.post("/:id/revoke", revokeVenueInvite);

export default router;
