import redis from "../config/redis.js";
import crypto from "crypto";
import logger from "./logger.js";

/**
 * L1 — in-process Map (zero network latency, per-instance)
 * L2 — Redis (shared across all server instances, survives restarts)
 *
 * L1 TTL is short (30s) intentionally — prevents stale data in multi-instance deploys.
 * L2 TTL is the caller-specified TTL (default 5 minutes).
 */
const l1Cache = new Map(); // Map<key, { value: any, expiresAt: number }>
const L1_TTL_MS = 30_000; // 30 seconds

/**
 * Generates a consistent cache key from a prefix and query params object.
 * Sorts params to ensure identical keys regardless of property order.
 */
export const generateCacheKey = (prefix, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join("|");
  const hash = crypto.createHash("md5").update(sortedParams).digest("hex");
  return `${prefix}:${hash}`;
};

/**
 * Cache-aside helper with L1 + L2 tiered lookup.
 * Order: L1 hit → return immediately (no network)
 *        L2 hit → promote to L1, return
 *        Miss   → call fetchFn, write to both L1 and L2, return
 *
 * @param {string}   key      - cache key
 * @param {Function} fetchFn  - async function that returns fresh data
 * @param {number}   ttl      - L2 Redis TTL in seconds (default 300 = 5 min)
 */
export const getOrSetCache = async (key, fetchFn, ttl = 300) => {
  // L1 check — zero network cost
  const l1Entry = l1Cache.get(key);
  if (l1Entry && Date.now() < l1Entry.expiresAt) {
    return l1Entry.value;
  }
  l1Cache.delete(key); // clean up expired entry

  // L2 check — Redis
  try {
    const cached = await redis.get(key);
    if (cached) {
      const value = JSON.parse(cached);
      // Promote to L1
      l1Cache.set(key, { value, expiresAt: Date.now() + L1_TTL_MS });
      return value;
    }
  } catch (err) {
    logger.warn(`[CACHE] L2 read error for ${key}`, { error: err.message });
    // Fall through to fetchFn — Redis being down must not break the request
  }

  // Cache miss — fetch fresh data
  const freshData = await fetchFn();

  if (freshData) {
    // Write to L1
    l1Cache.set(key, { value: freshData, expiresAt: Date.now() + L1_TTL_MS });
    // Write to L2
    try {
      await redis.set(key, JSON.stringify(freshData), "EX", ttl);
    } catch (err) {
      logger.warn(`[CACHE] L2 write error for ${key}`, { error: err.message });
    }
  }

  return freshData;
};

/**
 * Invalidates a cache key from both L1 and L2.
 * @param {string} pattern - exact key or glob pattern (e.g. 'turfs:list:*')
 */
export const invalidateCache = async (pattern) => {
  // Clear L1 — remove all keys matching the pattern prefix
  const prefix = pattern.replace(/\*/g, "");
  for (const key of l1Cache.keys()) {
    if (key.startsWith(prefix)) l1Cache.delete(key);
  }

  // Clear L2 — Redis key scan
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(
        `[CACHE] Invalidated ${keys.length} key(s) matching "${pattern}"`
      );
    }
  } catch (err) {
    logger.warn(`[CACHE] L2 invalidation error for ${pattern}`, {
      error: err.message,
    });
  }
};
