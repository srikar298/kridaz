import express from "express";
import {
  getAllHostedGames,
  deleteHostedGame,
  batchDeleteGames,
  batchUpdateGameStatus,
  getAllDisputes,
  resolveDispute,
} from "../../admin/admin.controller.js";
import verifyAdminToken from "../../../middleware/jwt/admin.middleware.js";

const router = express.Router();

// Apply admin authentication to all routes in this router
router.use(verifyAdminToken);

/**
 * @swagger
 * tags:
 *   name: Admin GameManagement
 *   description: Admin management for hosted matches and games
 */

/**
 * @swagger
 * /hosted-game/admin/list:
 *   get:
 *     summary: List all hosted games
 *     tags: [Admin GameManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of games
 */
router.get("/list", getAllHostedGames);

/**
 * @swagger
 * /hosted-game/admin/{id}:
 *   delete:
 *     summary: Delete a hosted game
 *     tags: [Admin GameManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Game deleted
 */
router.delete("/:id", deleteHostedGame);

/**
 * @swagger
 * /hosted-game/admin/batch-delete:
 *   post:
 *     summary: Batch delete games
 *     tags: [Admin GameManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Games deleted
 */
router.post("/batch-delete", batchDeleteGames);

/**
 * @swagger
 * /hosted-game/admin/batch-status:
 *   put:
 *     summary: Batch update game status
 *     tags: [Admin GameManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.put("/batch-status", batchUpdateGameStatus);

export default router;

/**
 * @swagger
 * /hosted-game/admin/disputes:
 *   get:
 *     summary: List all games with disputes
 *     tags: [Admin GameManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of disputes
 */
router.get("/disputes", getAllDisputes);

/**
 * @swagger
 * /hosted-game/admin/resolve-dispute:
 *   post:
 *     summary: Resolve a dispute
 *     tags: [Admin GameManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dispute resolved
 */
router.post("/resolve-dispute", resolveDispute);
