import express from "express";
import verifyUser, {
  optionalUserAuth,
} from "../../../middleware/jwt/user.middleware.js";
import * as controller from "../hostedGame.controller.js";

import { validate } from "../../../middleware/validate.middleware.js";
import { createHostedGameSchema } from "../hostedGame.validator.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: HostedGame
 *   description: Match Hosting, Team Formation, and Official Booking
 */

// ── Public / Semi-public ───────────────────────────────────────────────────

/**
 * @swagger
 * /hosted-game/grounds:
 *   get:
 *     summary: Get grounds for hosting
 *     description: Returns a list of grounds available for hosting a game.
 *     tags: [HostedGame]
 *     responses:
 *       200:
 *         description: List of grounds
 */
router.get("/grounds", controller.getGroundsForHosting);

/**
 * @swagger
 * /hosted-game/umpires:
 *   get:
 *     summary: Get available umpires
 *     description: Returns a list of certified umpires available for booking.
 *     tags: [HostedGame]
 *     responses:
 *       200:
 *         description: List of umpires
 */
router.get("/umpires", controller.getUmpiresForHosting);

/**
 * @swagger
 * /hosted-game/streamers:
 *   get:
 *     summary: Get available streamers
 *     description: Returns a list of broadcasters available for live streaming.
 *     tags: [HostedGame]
 *     responses:
 *       200:
 *         description: List of streamers
 */
router.get("/streamers", controller.getStreamersForHosting);

/**
 * @swagger
 * /hosted-game/scorers:
 *   get:
 *     summary: Get list of available scorers for hosting
 *     description: Returns scorers filtered by city/state/query for the host-game picker.
 *     tags: [HostedGame]
 */
router.get("/scorers", controller.getScorersForHosting);

/**
 * @swagger
 * /hosted-game/list:
 *   get:
 *     summary: List all hosted games
 *     description: Returns a public list of games available to join.
 *     tags: [HostedGame]
 *     responses:
 *       200:
 *         description: List of hosted games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/HostedGame' }
 */
// optionalUserAuth so we can decorate each row with youJoined/isHost when a
// viewer is signed in, while keeping the listing publicly browsable.
router.get("/list", optionalUserAuth, controller.getAllHostedGames);

/**
 * @swagger
 * /hosted-game/verify-invite:
 *   get:
 *     summary: Verify invite token
 *     description: Verifies a magic-link invite token for joining a private slot.
 *     tags: [HostedGame]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Token verified
 */
router.get("/verify-invite", controller.verifyInviteToken); // Phase 2D — magic-link verification

// ── Authenticated — read ───────────────────────────────────────────────────

/**
 * @swagger
 * /hosted-game/my-hosted:
 *   get:
 *     summary: Get games hosted by current user
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of games
 */
router.get("/my-hosted", verifyUser, controller.getMyHostedGames);

/**
 * @swagger
 * /hosted-game/search-officials:
 *   get:
 *     summary: Search for game officials
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of officials
 */
router.get("/search-officials", verifyUser, controller.searchOfficials);

/**
 * @swagger
 * /hosted-game/my-joined:
 *   get:
 *     summary: Get games joined by current user
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of games
 */
router.get("/my-joined", verifyUser, controller.getMyJoinedGames);

/**
 * @swagger
 * /hosted-game/followers-for-slot:
 *   get:
 *     summary: Get followers to invite to slot
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of followers
 */
router.get("/followers-for-slot", verifyUser, controller.getFollowersForSlot); // Phase 2E

// ── Authenticated — write ──────────────────────────────────────────────────

/**
 * @swagger
 * /hosted-game/validate-coupon:
 *   post:
 *     summary: Validate a coupon code
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon validated
 */
router.post("/validate-coupon", verifyUser, controller.validateCoupon);

/**
 * @swagger
 * /hosted-game/create:
 *   post:
 *     summary: Create a hosted game
 *     description: Initializes a new match or practice session.
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, groundId, date, time]
 *             properties:
 *               title: { type: string }
 *               type: { type: string, enum: [MATCH, PRACTICE] }
 *               groundId: { type: string }
 *               date: { type: string, format: date }
 *               time: { type: string }
 *     responses:
 *       201:
 *         description: Game created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/HostedGame' }
 */
router.post(
  "/create",
  verifyUser,
  validate(createHostedGameSchema),
  controller.createHostedGame
);

/**
 * @swagger
 * /hosted-game/join:
 *   post:
 *     summary: Join a hosted game
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [gameId]
 *             properties:
 *               gameId: { type: string }
 *     responses:
 *       200:
 *         description: Joined successfully
 */
router.post("/join", verifyUser, controller.joinHostedGame);

/**
 * @swagger
 * /hosted-game/leave:
 *   post:
 *     summary: Leave a hosted game
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Left successfully
 */
router.post("/leave", verifyUser, controller.leaveHostedGame);

/**
 * @swagger
 * /hosted-game/approve:
 *   post:
 *     summary: Approve join request
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Request approved
 */
router.post("/approve", verifyUser, controller.approveJoinRequest);

/**
 * @swagger
 * /hosted-game/reject:
 *   post:
 *     summary: Reject join request
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Request rejected
 */
router.post("/reject", verifyUser, controller.rejectJoinRequest);

/**
 * @swagger
 * /hosted-game/cancel:
 *   post:
 *     summary: Cancel a hosted game
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Game cancelled
 */
router.post("/cancel", verifyUser, controller.cancelHostedGame);

/**
 * @swagger
 * /hosted-game/vote-started:
 *   post:
 *     summary: Vote that a game has started
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Vote recorded
 */
router.post("/vote-started", verifyUser, controller.voteGameStarted);

/**
 * @swagger
 * /hosted-game/raise-dispute:
 *   post:
 *     summary: Raise a dispute for a game
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dispute raised
 */
router.post("/raise-dispute", verifyUser, controller.raiseDispute);

// ── Quick Game slot management (Phase 2B & 2C) ─────────────────────────────

/**
 * @swagger
 * /hosted-game/assign-slot:
 *   post:
 *     summary: Assign quick slot
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Slot assigned
 */
router.post("/assign-slot", verifyUser, controller.assignQuickSlot);

/**
 * @swagger
 * /hosted-game/invite-custom-player:
 *   post:
 *     summary: Invite custom player to slot
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Invite sent
 */
router.post("/invite-custom-player", verifyUser, controller.inviteCustomPlayer);

/**
 * @swagger
 * /hosted-game/claim-slot:
 *   post:
 *     summary: Claim invite slot
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Slot claimed
 */
router.post("/claim-slot", verifyUser, controller.claimInviteSlot);

// ── Umpire specific ────────────────────────────────────────────────────────

/**
 * @swagger
 * /hosted-game/find-by-id:
 *   get:
 *     summary: Find game by short ID
 *     tags: [HostedGame]
 *     responses:
 *       200:
 *         description: Game found
 */
router.get("/find-by-id", controller.getHostedGameByShortId);

/**
 * @swagger
 * /hosted-game/{id}:
 *   get:
 *     summary: Get game by ID
 *     tags: [HostedGame]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Game details
 */
// optionalUserAuth so a signed-in viewer's youJoined/isHost flags populate,
// while keeping detail pages publicly shareable.
router.get("/:id", optionalUserAuth, controller.getHostedGameById);

/**
 * @swagger
 * /hosted-game/request-umpire:
 *   post:
 *     summary: Request an umpire
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Request sent
 */
router.post("/request-umpire", verifyUser, controller.requestToUmpire);

/**
 * @swagger
 * /hosted-game/handle-umpire-request:
 *   post:
 *     summary: Handle umpire request
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Request handled
 */
router.post(
  "/handle-umpire-request",
  verifyUser,
  controller.handleUmpireRequest
);

/**
 * @swagger
 * /hosted-game/request-streamer:
 *   post:
 *     summary: Request a streamer
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Request sent
 */
router.post("/request-streamer", verifyUser, controller.requestToStreamer);

/**
 * @swagger
 * /hosted-game/handle-streamer-request:
 *   post:
 *     summary: Handle streamer request
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Request handled
 */
router.post(
  "/handle-streamer-request",
  verifyUser,
  controller.handleStreamerRequest
);

/**
 * @swagger
 * /hosted-game/request-scorer:
 *   post:
 *     summary: Request a scorer
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Request sent
 */
router.post("/request-scorer", verifyUser, controller.requestToScorer);

/**
 * @swagger
 * /hosted-game/handle-scorer-request:
 *   post:
 *     summary: Handle scorer request
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Request handled
 */
router.post(
  "/handle-scorer-request",
  verifyUser,
  controller.handleScorerRequest
);

/**
 * @swagger
 * /hosted-game/invite-official:
 *   post:
 *     summary: Invite an official
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Invite sent
 */
router.post("/invite-official", verifyUser, controller.inviteOfficial);

/**
 * @swagger
 * /hosted-game/respond-to-official-invitation:
 *   post:
 *     summary: Respond to official invitation
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Response recorded
 */
router.post(
  "/respond-to-official-invitation",
  verifyUser,
  controller.respondToOfficialInvitation
);

/**
 * @swagger
 * /hosted-game/{id}/stream-config:
 *   post:
 *     summary: Update stream config
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Config updated
 */
router.post("/:id/stream-config", verifyUser, controller.updateStreamConfig);

/**
 * @swagger
 * /hosted-game/update-ticker-theme/{id}:
 *   post:
 *     summary: Update ticker theme
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Theme updated
 */
router.post(
  "/update-ticker-theme/:id",
  verifyUser,
  controller.updateTickerTheme
);

/**
 * @swagger
 * /hosted-game/update-venue:
 *   post:
 *     summary: Update venue
 *     tags: [HostedGame]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Venue updated
 */
router.post("/update-venue", verifyUser, controller.updateVenue);

export default router;
