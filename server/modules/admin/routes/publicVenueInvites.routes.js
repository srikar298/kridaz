import { Router } from "express";
import { verifyPublicInvite } from "../venueInvites.controller.js";

const router = Router();

router.get("/verify/:token", verifyPublicInvite);

export default router;
