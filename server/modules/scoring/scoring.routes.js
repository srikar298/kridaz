import { Router } from "express";
import {
  searchMatch,
  startScoring,
  updateScore,
  getMatchStatus,
  completeMatch,
  getMatchAnalytics,
  goLive,
  endLive,
  updateCommentarySettings,
  startNextInnings,
  // Phase 1 additions
  setToss,
  setPlayers,
  undoLastBall,
  // Phase 3: Live overlay
  getLiveScore,
  setupScoringGame,
  getMyScoringGames,
  getScoringGameById,
  authenticateScoringApp,
  notifyPlayers,
  updateMatchStatus,
  reviseTargetAndOvers,
  setMatchOfficials,
  substitutePlayer,
  useReview,
  setPowerplayOvers,
  toggleTimer,
  addPenalty,
  updateHouseRules,
  getMatchReport,
  verifyOverlayToken,
  // View tabs (public read-only)
  getScorecard,
  getSquads,
  getOvers,
  getLiveMatches,
} from "./scoring.controller.js";
import verifyAuth from "../../middleware/jwt/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  startScoringSchema,
  updateScoreSchema,
  tossSchema,
  setupScoringGameSchema,
  undoLastBallSchema,
  completeMatchSchema,
  startNextInningsSchema,
  setPlayersSchema,
  updateHouseRulesSchema,
} from "./scoring.validator.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Scoring
 *   description: Real-time Match Scoring and Live Broadcasting
 */

// Public routes (anyone can see live score)

/**
 * @swagger
 * /scoring/status/{matchId}:
 *   get:
 *     summary: Get live match status
 *     description: Returns the current score, batsman, and bowler details for a live match.
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Match status data
 */
router.get("/status/:matchId", getMatchStatus);

/**
 * @swagger
 * /scoring/search/{shortId}:
 *   get:
 *     summary: Find match by short ID
 *     description: Quick lookup for matches using their unique short identifier.
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: shortId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Match details
 */
router.get("/search/:shortId", searchMatch);

/**
 * @swagger
 * /scoring/analytics/{matchId}:
 *   get:
 *     summary: Get match analytics
 *     description: Returns detailed stats like run rate, worm chart, and wagon wheel data.
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get("/analytics/:matchId", getMatchAnalytics);

/**
 * @swagger
 * /scoring/live-score/{matchId}:
 *   get:
 *     summary: Get live score snapshot
 *     description: Snapshot used for external scoreboards and streaming overlays.
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Live score snapshot
 */
router.get("/live-score/:matchId", getLiveScore);
router.get("/overlay/verify/:matchId", verifyOverlayToken);

/**
 * @swagger
 * /scoring/live:
 *   get:
 *     summary: List currently live + recently completed matches
 *     description: Home/landing tab data — paginated by `?limit=N` (max 100).
 *     tags: [Scoring]
 */
router.get("/live", getLiveMatches);

/**
 * @swagger
 * /scoring/{matchId}/scorecard:
 *   get:
 *     summary: Full scorecard (batting, bowling, FoW, partnerships, extras)
 *     description: Powers the SCORECARD tab. Returns every innings.
 *     tags: [Scoring]
 */
router.get("/:matchId/scorecard", getScorecard);

/**
 * @swagger
 * /scoring/{matchId}/squads:
 *   get:
 *     summary: Playing XI + Bench per side
 *     description: Powers the SQUADS tab.
 *     tags: [Scoring]
 */
router.get("/:matchId/squads", getSquads);

/**
 * @swagger
 * /scoring/{matchId}/overs:
 *   get:
 *     summary: Per-over breakdown with ball-by-ball labels
 *     description: |
 *       Powers the OVERS tab. Optional `?innings=N` (0 or 1) to filter to one
 *       innings; omit for both. Overs returned latest-first.
 *     tags: [Scoring]
 */
router.get("/:matchId/overs", getOvers);

/**
 * @swagger
 * /scoring/auth/{gameId}:
 *   post:
 *     summary: Authenticate scoring app access with password
 *     tags: [Scoring]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns a scorer token
 *       401:
 *         description: Invalid password
 */
router.post("/auth/:gameId", authenticateScoringApp);

// Protected routes (Only authorized umpires can score)
router.use(verifyAuth);

/**
 * @swagger
 * /scoring/setup:
 *   post:
 *     summary: Setup a new Scoring Match
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Match created
 */
router.post(
  "/setup",
  verifyAuth,
  validate(setupScoringGameSchema),
  setupScoringGame
);

/**
 * @swagger
 * /scoring/my-games:
 *   get:
 *     summary: Get scoring matches for the current user
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Matches retrieved
 */
router.get("/my-games", verifyAuth, getMyScoringGames);

/**
 * @swagger
 * /scoring/game/{gameId}:
 *   get:
 *     summary: Get a scoring game by ID (full details)
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full game details
 */
router.get("/game/:gameId", verifyAuth, getScoringGameById);

/**
 * @swagger
 * /scoring/start:
 *   post:
 *     summary: Start scoring for a match
 *     description: Initializes the scoring session for an authorized match.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StartScoringRequest' }
 *     responses:
 *       200:
 *         description: Scoring started
 */
router.post("/start", validate(startScoringSchema), startScoring);

/**
 * @swagger
 * /scoring/update:
 *   put:
 *     summary: Update score (ball by ball)
 *     description: Records a new ball, runs, extras, and wickets.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateScoreRequest' }
 *     responses:
 *       200:
 *         description: Score updated
 */
router.put("/update", validate(updateScoreSchema), updateScore);

/**
 * @swagger
 * /scoring/complete:
 *   post:
 *     summary: Finalize match
 *     description: Marks the match as completed and generates final results.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Match completed
 */
router.post("/complete", validate(completeMatchSchema), completeMatch);

/**
 * @swagger
 * /scoring/notify-players:
 *   post:
 *     summary: Notify players about the match
 *     description: Dispatches push/socket notifications to all players in the match
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifications dispatched
 */
router.post("/notify-players", notifyPlayers);

/**
 * @swagger
 * /scoring/{matchId}/go-live:
 *   post:
 *     summary: Enable live broadcast
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Broadcast live
 */
router.post("/:matchId/go-live", goLive);

/**
 * @swagger
 * /scoring/{matchId}/end-live:
 *   post:
 *     summary: Stop live broadcast
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Broadcast stopped
 */
router.post("/:matchId/end-live", endLive);

/**
 * @swagger
 * /scoring/{matchId}/commentary-settings:
 *   post:
 *     summary: Update AI commentary settings
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Commentary settings updated
 */
router.post("/:matchId/commentary-settings", updateCommentarySettings);

/**
 * @swagger
 * /scoring/update-status:
 *   post:
 *     summary: Update match status
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */
router.post("/update-status", updateMatchStatus);

/**
 * @swagger
 * /scoring/revise-target:
 *   post:
 *     summary: Revise match target and overs
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Target and overs revised
 */
router.post("/revise-target", reviseTargetAndOvers);

/**
 * @swagger
 * /scoring/officials:
 *   post:
 *     summary: Set match officials
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Match officials updated
 */
router.post("/officials", setMatchOfficials);

/**
 * @swagger
 * /scoring/substitute:
 *   post:
 *     summary: Substitute a player
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Player substituted
 */
router.post("/substitute", substitutePlayer);

/**
 * @swagger
 * /scoring/review:
 *   post:
 *     summary: Use a team review (DRS)
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Review logged
 */
router.post("/review", useReview);

/**
 * @swagger
 * /scoring/powerplay:
 *   post:
 *     summary: Set powerplay overs
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Powerplay overs updated
 */
router.post("/powerplay", setPowerplayOvers);

/**
 * @swagger
 * /scoring/next-innings:
 *   post:
 *     summary: Transition to next innings
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Innings started
 */
router.post(
  "/next-innings",
  validate(startNextInningsSchema),
  startNextInnings
);

/**
 * @swagger
 * /scoring/toss:
 *   post:
 *     summary: Set match toss result
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [winnerId, decision]
 *             properties:
 *               winnerId: { type: string }
 *               decision: { type: string, enum: [BAT, BOWL] }
 *     responses:
 *       200:
 *         description: Toss result recorded
 */
router.post("/toss", validate(tossSchema), setToss);

/**
 * @swagger
 * /scoring/set-players:
 *   post:
 *     summary: Set active players for scoring
 *     description: Assigns the striker, non-striker, and bowler for the current over.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Players assigned
 */
router.post("/set-players", validate(setPlayersSchema), setPlayers);

/**
 * @swagger
 * /scoring/undo:
 *   post:
 *     summary: Undo last action
 *     description: Reverts the last ball or action recorded.
 *     tags: [Scoring]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scoringId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Action reverted
 */
router.post("/undo", validate(undoLastBallSchema), undoLastBall);

/**
 * @swagger
 * /scoring/toggle-timer:
 *   put:
 *     summary: Toggle match timer
 *     tags: [Scoring]
 */
router.put("/toggle-timer", verifyAuth, toggleTimer);

/**
 * @swagger
 * /scoring/penalty:
 *   put:
 *     summary: Add penalty runs
 *     tags: [Scoring]
 */
router.put("/penalty", verifyAuth, addPenalty);

/**
 * @swagger
 * /scoring/house-rules:
 *   patch:
 *     summary: Update per-match house rules
 *     description: |
 *       Partial update of CricketMatch.houseRules. Send any subset of:
 *       enforceConsecutiveOverBlock, enforceFreeHit, penaltyEnabled,
 *       wideIsLegalBall, noBallIsLegalBall, ballsPerOver (1–12),
 *       playersPerTeam (2–30), lastManStands, maxRunsPerBall (1–12).
 *       Send `null` for a key to revert it to the MCC default.
 *
 *       Allowed callers: the assigned umpire, the assigned scorer, OR a token
 *       derived from the scoring-app password (POST /scoring/auth/:gameId).
 *     tags: [Scoring]
 */
router.patch(
  "/house-rules",
  verifyAuth,
  validate(updateHouseRulesSchema),
  updateHouseRules
);

/**
 * @swagger
 * /scoring/report/{matchId}:
 *   get:
 *     summary: Get match report with timers
 *     tags: [Scoring]
 */
router.get("/report/:matchId", verifyAuth, getMatchReport);

export default router;
