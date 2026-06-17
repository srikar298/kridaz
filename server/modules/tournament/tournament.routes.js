import { Router } from "express";
import {
  createTournament,
  getMyTournaments,
  getTournamentById,
  updateTournament,
  uploadPoster,
  getPublicTournament,
  registerForTournament,
  autoScheduleGroupStage,
  getStandings,
  manualSchedule,
  getTournamentMatches
} from "./tournament.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createTournamentSchema,
  updateTournamentSchema,
} from "./tournament.validator.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/uploads/upload.middleware.js";

const router = Router();

// Public Routes (no auth required)
router.get("/public/:id", getPublicTournament);
router.get("/:id/standings", getStandings);
router.get("/:id/matches", getTournamentMatches);

// All tournament routes below require authentication
router.use(requireAuth);

router.post(
  "/:id/register",
  registerForTournament
);

router.post("/:id/schedule/auto", autoScheduleGroupStage);
router.post("/:id/schedule/manual", manualSchedule);


router.post(
  "/",
  validate(createTournamentSchema),
  createTournament
);

router.get("/my-tournaments", getMyTournaments);

router.get("/:id", getTournamentById);

router.patch(
  "/:id",
  validate(updateTournamentSchema),
  updateTournament
);

router.post(
  "/:id/poster",
  upload.single("image"), // Uses existing Cloudinary image upload middleware
  uploadPoster
);

export default router;
