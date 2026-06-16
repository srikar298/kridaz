import express from 'express';
import { 
  searchPlayers, 
  followPlayer, 
  unfollowPlayer, 
  getNetwork,
  getPlayerProfile,
  getNetworkById,
  getNearbyPlayers,
  updateUserLocation,
  updateNotificationPreferences,
  getPlayerRecommendations
} from '../player.controller.js';
import userAuth from "../../../middleware/jwt/user.middleware.js";


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Player
 *   description: Player discovery and social networking
 */

// ── Public Routes ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /player/search:
 *   get:
 *     summary: Search for players
 *     tags: [Player]
 */
router.get('/search', searchPlayers);

// ── Authenticated Routes (Static) ───────────────────────────────────────────

import { optionalUserAuth } from "../../../middleware/jwt/user.middleware.js";

/**
 * @swagger
 * /player/nearby:
 *   get:
 *     summary: Get nearby players
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/nearby', optionalUserAuth, getNearbyPlayers);

/**
 * @swagger
 * /player/recommendations:
 *   get:
 *     summary: Get personalized follow recommendations for the current player
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/recommendations', userAuth, getPlayerRecommendations);

/**
 * @swagger
 * /player/location:
 *   post:
 *     summary: Update user location (GPS)
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/location', userAuth, updateUserLocation);

/**
 * @swagger
 * /player/notification-preferences:
 *   patch:
 *     summary: Update notification preferences
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.patch('/notification-preferences', userAuth, updateNotificationPreferences);

/**
 * @swagger
 * /player/network:
 *   get:
 *     summary: Get my followers/following
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/network', userAuth, getNetwork);

// ── Public Parameterized / Wildcard Routes ──────────────────────────────────

/**
 * @swagger
 * /player/{id}:
 *   get:
 *     summary: Get player profile
 *     tags: [Player]
 */
router.get('/:id', getPlayerProfile);

// ── Authenticated Parameterized / Wildcard Routes ───────────────────────────

/**
 * @swagger
 * /player/{id}/follow:
 *   post:
 *     summary: Follow a player
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/follow', userAuth, followPlayer);

/**
 * @swagger
 * /player/{id}/unfollow:
 *   post:
 *     summary: Unfollow a player
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/unfollow', userAuth, unfollowPlayer);

/**
 * @swagger
 * /player/{id}/network:
 *   get:
 *     summary: Get another player's network
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/:id/network', userAuth, getNetworkById);

export default router;
