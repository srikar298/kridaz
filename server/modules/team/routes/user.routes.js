import { Router } from "express";
import {
  createTeam,
  getMyTeams,
  getTeamById,
  inviteMembers,
  joinTeam,
  requestToJoin,
  getAllTeams,
  getTeamByCode,
  requestOpponent,
  handleOpponentRequest,
  getOpponentTeams,
  getOpponentRequestsForTeam,
  updateTeam,
  deleteTeam,
  handleJoinRequest,
  updateMemberRole,
  removeMember,
  getJoinRequests,
} from "../team.controller.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import upload from "../../../middleware/uploads/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Team
 *   description: Team Management, Squad Selection, and Match Challenges
 */

// ── Public Routes ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /team/all:
 *   get:
 *     summary: List all public teams
 *     tags: [Team]
 *     responses:
 *       200:
 *         description: List of teams
 */
router.get("/all", getAllTeams);

/**
 * @swagger
 * /team/find-by-code/{code}:
 *   get:
 *     summary: Find team by unique code
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team details
 */
router.get("/find-by-code/:code", getTeamByCode);

/**
 * @swagger
 * /team/{id}:
 *   get:
 *     summary: Get team details by ID
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Team profile and squad
 */
router.get("/opponents", authenticate, getOpponentTeams);
// Specific paths MUST be registered before /:id to avoid being shadowed.
router.get("/:id/opponent-requests", authenticate, getOpponentRequestsForTeam);
router.get("/:teamId/join-requests", authenticate, getJoinRequests);
router.get("/:id", getTeamById);

// ── Authenticated Routes ────────────────────────────────────────────────────
router.use(authenticate);

/**
 * @swagger
 * /team:
 *   post:
 *     summary: Create a new team
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Team created
 */
router.post("/", upload.single("image"), createTeam);

/**
 * @swagger
 * /team:
 *   get:
 *     summary: Get my teams
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of teams I own or belong to
 */
router.get("/", getMyTeams);

/**
 * @swagger
 * /team/opponents:
 *   get:
 *     summary: Find available opponents
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of teams looking for matches
 */

/**
 * @swagger
 * /team/{id}/request-opponent:
 *   post:
 *     summary: Challenge another team
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Challenge sent
 */
router.post("/:id/request-opponent", requestOpponent);

/**
 * @swagger
 * /team/{id}/handle-opponent-request:
 *   post:
 *     summary: Handle match challenge
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Challenge response recorded
 */
router.post("/:id/handle-opponent-request", handleOpponentRequest);

/**
 * @swagger
 * /team/{id}/invite:
 *   post:
 *     summary: Invite members to team
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Invites sent
 */
router.post("/:id/invite", inviteMembers);

/**
 * @swagger
 * /team/join/{token}:
 *   post:
 *     summary: Join team via invite link
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Joined team
 */
router.post("/join/:token", joinTeam);

/**
 * @swagger
 * /team/join-request/{id}:
 *   post:
 *     summary: Request to join a team
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Join request sent
 */
router.post("/join-request/:id", requestToJoin);

/**
 * @swagger
 * /team/{id}/handle-join-request:
 *   post:
 *     summary: Handle a member join request
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Join request handled
 */
router.post("/:id/handle-join-request", handleJoinRequest);

/**
 * @swagger
 * /team/{id}:
 *   put:
 *     summary: Update team details
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Team updated
 */
router.put("/:id", upload.single("image"), updateTeam);

router.put("/:teamId/members/:userId/role", updateMemberRole);
router.patch("/:teamId/members/:userId/role", updateMemberRole);
router.delete("/:teamId/members/:userId", removeMember);

/**
 * @swagger
 * /team/{id}:
 *   delete:
 *     summary: Delete a team
 *     tags: [Team]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Team deleted
 */
router.delete("/:id", deleteTeam);

export default router;
