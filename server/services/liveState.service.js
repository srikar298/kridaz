import { redisClient as redis } from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * Live State Management Service
 * Handles real-time caching of match scores and overlay configurations.
 */
export const liveStateService = {
  /**
   * Set the live score for a match in Redis
   */
  setLiveScore: async (matchId, scoreData) => {
    try {
      const key = `match:${matchId}:score`;
      await redis.set(key, JSON.stringify(scoreData), "EX", 3600 * 6); // Expire in 6 hours
    } catch (err) {
      logger.error("[REDIS] Error setting live score:", err);
    }
  },

  /**
   * Get the live score for a match from Redis
   */
  getLiveScore: async (matchId) => {
    try {
      const key = `match:${matchId}:score`;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error("[REDIS] Error getting live score:", err);
      return null;
    }
  },

  /**
   * Set overlay configuration (e.g. show/hide components)
   */
  setOverlayConfig: async (matchId, config) => {
    try {
      const key = `match:${matchId}:overlay`;
      await redis.set(key, JSON.stringify(config), "EX", 3600 * 6);
    } catch (err) {
      logger.error("[REDIS] Error setting overlay config:", err);
    }
  },

  /**
   * Get overlay configuration
   */
  getOverlayConfig: async (matchId) => {
    try {
      const key = `match:${matchId}:overlay`;
      const data = await redis.get(key);
      return data
        ? JSON.parse(data)
        : { showScoreboard: true, showCommentary: true };
    } catch (err) {
      logger.error("[REDIS] Error getting overlay config:", err);
      return { showScoreboard: true, showCommentary: true };
    }
  },

  /**
   * Set Stream Status
   */
  setStreamStatus: async (matchId, status) => {
    try {
      const key = `match:${matchId}:streamStatus`;
      await redis.set(key, status, "EX", 3600 * 6);
    } catch (err) {
      logger.error("[REDIS] Error setting stream status:", err);
    }
  },

  getStreamStatus: async (matchId) => {
    try {
      const key = `match:${matchId}:streamStatus`;
      return (await redis.get(key)) || "none";
    } catch (err) {
      logger.error("[REDIS] Error getting stream status:", err);
      return "none";
    }
  },

  /**
   * Add Commentary (keeps last 50 balls for overlay)
   */
  addCommentary: async (matchId, commentaryData) => {
    try {
      const key = `match:${matchId}:commentary`;
      await redis.lpush(key, JSON.stringify(commentaryData));
      await redis.ltrim(key, 0, 49); // Keep latest 50
      await redis.expire(key, 3600 * 6);
    } catch (err) {
      logger.error("[REDIS] Error adding commentary:", err);
    }
  },

  getCommentary: async (matchId) => {
    try {
      const key = `match:${matchId}:commentary`;
      const data = await redis.lrange(key, 0, -1);
      return data.map((item) => JSON.parse(item));
    } catch (err) {
      logger.error("[REDIS] Error getting commentary:", err);
      return [];
    }
  },
};

export default redis;
