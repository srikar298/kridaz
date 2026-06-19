import { redisClient } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

const KEY = "kridaz:usernames:bloom";

/**
 * Adds a username to the "Bloom-Optimized" Redis set.
 * This ensures future checks for this username are lightning-fast.
 * @param {string} username
 */
export const addUsernameToBloom = async (username) => {
  try {
    if (!username) return;
    const normalized = username.toLowerCase().trim();
    await redisClient.sadd(KEY, normalized);
  } catch (err) {
    logger.error("[BLOOM] Error adding username", err);
  }
};

/**
 * Checks if a username is available using a high-performance Redis lookup.
 *
 * Logic:
 * 1. Check Redis Set (O(1) complexity).
 * 2. If Redis says it's taken, return 'taken' immediately (Zero false positives in this implementation).
 * 3. If Redis says it's free, we do a fallback check to Prisma (Safety gate).
 *
 * @param {string} username
 * @returns {Promise<boolean>} true if available, false if taken
 */
export const checkUsernameBloom = async (username) => {
  try {
    const normalized = username.toLowerCase().trim();

    // ── STEP 1: FAST PATH (Redis) ────────────────────────────────────────
    const isMember = await redisClient.sismember(KEY, normalized);
    if (isMember) {
      return false; // Definitely taken
    }

    // ── STEP 2: SLOW PATH (Prisma Fallback) ────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { username: normalized },
      select: { id: true },
    });

    if (user) {
      // Self-Healing: If found in DB but missing from Redis, sync it now.
      await addUsernameToBloom(normalized);
      return false;
    }

    return true; // Available
  } catch (err) {
    logger.warn("[BLOOM] Redis lookup failed, falling back to DB", err);
    // If Redis is down, we fall back to the reliable Database check.
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      select: { id: true },
    });
    return !user;
  }
};

/**
 * Initial Seeding: Fetches all usernames from the database and populates Redis.
 * This should run on server startup to ensure the "Bloom" filter is hot.
 */
export const seedUsernameBloom = async () => {
  try {
    const users = await prisma.user.findMany({
      select: { username: true },
    });

    const usernames = users
      .map((u) => u.username)
      .filter(Boolean)
      .map((u) => u.toLowerCase().trim());

    if (usernames.length > 0) {
      // Chunk processing to avoid blocking Redis with a massive SADD command
      const chunkSize = 1000;
      for (let i = 0; i < usernames.length; i += chunkSize) {
        const chunk = usernames.slice(i, i + chunkSize);
        await redisClient.sadd(KEY, ...chunk);
      }
    }

    logger.info(`[BLOOM] Initialized with ${usernames.length} usernames.`);
  } catch (err) {
    logger.error("[BLOOM] Seeding failed", err);
  }
};

// ── REELS INTERACTION BLOOM ──────────────────────────────────────────────────

const REELS_INTERACTION_KEY = "kridaz:reels:interactions:bloom";

/**
 * Adds a reel interaction to the Bloom filter.
 * Prevents redundant database upserts for high-volume interactions like "views".
 */
export const addReelInteractionToBloom = async (userId, reelId, type) => {
  try {
    if (!userId || !reelId || !type) return;
    const interactionKey = `${userId}:${reelId}:${type}`;
    await redisClient.sadd(REELS_INTERACTION_KEY, interactionKey);
  } catch (err) {
    logger.error("[BLOOM] Error adding reel interaction", err);
  }
};

/**
 * Checks if a user has already interacted with a reel.
 * Used to skip expensive Prisma upserts.
 */
export const checkReelInteractionBloom = async (userId, reelId, type) => {
  try {
    const interactionKey = `${userId}:${reelId}:${type}`;
    const isMember = await redisClient.sismember(
      REELS_INTERACTION_KEY,
      interactionKey
    );
    return !!isMember;
  } catch (err) {
    return false; // Fallback to safe path (DB)
  }
};

/**
 * Removes a reel interaction from the Bloom filter.
 * Used when a user unlikes a reel.
 */
export const removeReelInteractionFromBloom = async (userId, reelId, type) => {
  try {
    if (!userId || !reelId || !type) return;
    const interactionKey = `${userId}:${reelId}:${type}`;
    await redisClient.srem(REELS_INTERACTION_KEY, interactionKey);
  } catch (err) {
    logger.error("[BLOOM] Error removing reel interaction", err);
  }
};

// ── OTP SECURITY BLOOM ────────────────────────────────────────────────────────

const OTP_BLACKLIST_KEY = "kridaz:otp:blacklist:bloom";

/**
 * Temporarily blacklists an identifier (email/phone) for OTP requests.
 * Used for rapid-fire spam protection.
 */
export const blacklistOtpIdentifier = async (
  identifier,
  durationSeconds = 300
) => {
  try {
    if (!identifier) return;
    // 1. Set a TTL-based key for precise blocking
    await redisClient.set(
      `blacklist:otp:${identifier}`,
      "true",
      "EX",
      durationSeconds
    );
    // 2. Add to the bloom-set for high-speed broad filtering
    await redisClient.sadd(OTP_BLACKLIST_KEY, identifier);
  } catch (err) {
    logger.error("[BLOOM] Error blacklisting OTP", err);
  }
};

/**
 * Checks if an identifier is currently blocked from requesting/verifying OTPs.
 */
export const isOtpBlacklisted = async (identifier) => {
  try {
    if (!identifier) return false;
    // 1. Fast path check (Bloom)
    const inBloom = await redisClient.sismember(OTP_BLACKLIST_KEY, identifier);
    if (!inBloom) return false;

    // 2. Verified path check (TTL Key)
    const isBlocked = await redisClient.get(`blacklist:otp:${identifier}`);
    return !!isBlocked;
  } catch (err) {
    return false;
  }
};
