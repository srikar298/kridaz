// tokenVersion enforcement helpers.
//
// Each User row carries a `tokenVersion` counter. Newly-issued access tokens
// embed the value as `tv` in the JWT payload. JWT-verifying middleware then
// calls isTokenVersionStale(...) which compares the embedded value against
// the live one in the DB — if the user bumped it (logout-all, password reset)
// since the token was issued, the comparison fails and middleware rejects.
//
// Performance: cache the DB row in Redis for 60s per user so the hot path is
// a single Redis GET. Cache misses fall through to Prisma. If Redis is
// unreachable, we fail-open (let the request through) so a Redis blip doesn't
// log every user out.

import { prisma } from "../config/prisma.js";
import { redisClient } from "../config/redis.js";
import logger from "./logger.js";

const CACHE_TTL_S = 60;
const cacheKey = (userId) => `auth:tv:${userId}`;

/**
 * Fetch the current tokenVersion for a user, Redis-cached.
 * Returns null if the user doesn't exist.
 */
export const getCurrentTokenVersion = async (userId) => {
  if (!userId) return null;
  // Try cache.
  try {
    const cached = await redisClient.get(cacheKey(userId));
    if (cached !== null && cached !== undefined) {
      const n = Number(cached);
      if (Number.isFinite(n)) return n;
    }
  } catch (err) {
    logger.warn("[tokenVersion] Redis GET failed, falling through to DB", {
      error: err.message,
    });
  }

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });
  if (!row) return null;
  const value = row.tokenVersion ?? 0;

  try {
    await redisClient.set(cacheKey(userId), String(value), "EX", CACHE_TTL_S);
  } catch (err) {
    logger.warn("[tokenVersion] Redis SET failed", { error: err.message });
  }
  return value;
};

/**
 * Bump tokenVersion for a user — invalidates every access token issued before
 * this call. Called by POST /user/auth/logout-all and password-reset paths.
 */
export const bumpTokenVersion = async (userId) => {
  if (!userId) throw new Error("bumpTokenVersion requires userId");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });
  // Invalidate cache so the next verify sees the new value immediately.
  try {
    await redisClient.del(cacheKey(userId));
  } catch (err) {
    logger.warn("[tokenVersion] Redis DEL failed after bump", {
      error: err.message,
    });
  }
  return updated.tokenVersion;
};

/**
 * Verify that the JWT-embedded tokenVersion still matches the current DB value.
 *
 *   `decoded.tv === undefined`  → legacy token from before this rollout; allow.
 *   `decoded.tv < current`      → stale; reject (user logged out from all devices).
 *   `decoded.tv === current`    → fresh; allow.
 *   `decoded.tv > current`      → impossible in normal flow; allow but log.
 *
 * Fail-open on infrastructure errors — we'd rather let a request through than
 * brick every authed user during a Redis/DB blip.
 */
export const isTokenVersionStale = async (decoded) => {
  if (!decoded || decoded.tv === undefined || decoded.tv === null) {
    return false; // legacy token, no field embedded
  }
  try {
    const current = await getCurrentTokenVersion(decoded.id || decoded.userId);
    if (current === null) return false; // user gone — let other middleware decide
    return decoded.tv < current;
  } catch (err) {
    logger.warn("[tokenVersion] verify failed, failing open", {
      error: err.message,
    });
    return false;
  }
};
