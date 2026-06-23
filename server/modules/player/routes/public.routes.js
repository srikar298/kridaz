import express from "express";
import { getPublicPlayers, getLeaderboard } from "../player.controller.js";
import { optionalUserAuth } from "../../../middleware/jwt/user.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Player Public
 *   description: Public player listings and leaderboard metrics
 */

/**
 * @swagger
 * /user/players:
 *   get:
 *     summary: Get list of public players
 *     tags: [Player Public]
 *     responses:
 *       200:
 *         description: Array of player profiles
 */
router.get("/players", optionalUserAuth, getPublicPlayers);

/**
 * @swagger
 * /user/leaderboard:
 *   get:
 *     summary: Get top-scoring players leaderboard
 *     tags: [Player Public]
 *     responses:
 *       200:
 *         description: Leaderboard rank list
 */
router.get("/leaderboard", getLeaderboard);

// Saved items — placeholder until a SavedItem model is added to the schema.
// Returns an empty grouped map so the Flutter saved-items screen renders its
// empty state rather than throwing on a 404.
router.get("/saved", (req, res) => {
  return res.status(200).json({ success: true, data: {} });
});

export default router;
