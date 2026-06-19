import { redisClient } from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * Idempotency-Key middleware.
 *
 * Why: a flaky mobile connection that retries POST /booking/create-order
 * mid-flight can double-charge the user. Stripe's pattern is the industry
 * standard — the client supplies a header `Idempotency-Key: <uuid>` and the
 * server replays the original response on any retry within the TTL window.
 *
 * Storage:
 *   reserved        — `Idempotency-Key:<key>` in Redis with value "PENDING"
 *                     and a short TTL (5 min) while the original request runs.
 *   committed       — same key replaced with the JSON of {status, headers, body}
 *                     and the full TTL (24h) once the response has been sent.
 *
 * Behavior:
 *   1. Header missing → pass through. The middleware is opt-in per route.
 *   2. Key already committed → respond with cached {status, body} immediately.
 *   3. Key reserved (in-flight from a prior request) → 409 Conflict with code
 *      IDEMPOTENCY_IN_PROGRESS — the client should wait and retry.
 *   4. Key unseen → reserve via SET NX, then capture res.json/res.send via a
 *      proxy and commit on response 'finish'.
 *
 * Scope: per-user. Two different users sharing a key is improbable but we
 * namespace by user id when available, so it's prevented entirely.
 */

const RESERVE_TTL_S = 5 * 60; // 5 min — covers the longest realistic POST
const COMMIT_TTL_S = 24 * 60 * 60; // 24h  — Stripe's window

const buildKey = (req, rawKey) => {
  const actor =
    req.user?.id || req.user?.userId || req.owner?.id || `ip:${req.ip}`;
  return `idem:${actor}:${rawKey}`;
};

export const idempotency = async (req, res, next) => {
  const rawKey = req.headers["idempotency-key"];
  if (!rawKey) return next();

  // Bound key to a sane size to prevent Redis pollution.
  if (
    typeof rawKey !== "string" ||
    rawKey.length === 0 ||
    rawKey.length > 200
  ) {
    return res.status(400).json({
      success: false,
      code: "INVALID_IDEMPOTENCY_KEY",
      message: "Idempotency-Key must be a 1–200 character string",
    });
  }

  const key = buildKey(req, rawKey);

  // 1. Check for an existing entry.
  let existing;
  try {
    existing = await redisClient.get(key);
  } catch (err) {
    // Redis is down — fail open so production stays usable. The downside
    // (a brief window where retries can double-write) is preferable to
    // hard-locking out every payment when Redis blips.
    logger.warn(`[idempotency] Redis GET failed, passing through`, {
      error: err.message,
    });
    return next();
  }

  if (existing) {
    if (existing === "PENDING") {
      return res.status(409).json({
        success: false,
        code: "IDEMPOTENCY_IN_PROGRESS",
        message:
          "A request with this Idempotency-Key is still being processed. Please retry shortly.",
      });
    }
    try {
      const cached = JSON.parse(existing);
      logger.info(`[idempotency] replaying cached response for ${rawKey}`);
      res.status(cached.status || 200);
      if (cached.headers) {
        for (const [k, v] of Object.entries(cached.headers))
          res.setHeader(k, v);
      }
      return res.json(cached.body);
    } catch (err) {
      logger.warn(`[idempotency] cached entry was malformed, ignoring`, {
        error: err.message,
      });
    }
  }

  // 2. Reserve the slot atomically. If someone beat us to it in the few ms
  // since the GET, SET NX returns null and we treat it as "in progress".
  let claimed;
  try {
    claimed = await redisClient.set(key, "PENDING", "EX", RESERVE_TTL_S, "NX");
  } catch (err) {
    logger.warn(`[idempotency] Redis SET NX failed, passing through`, {
      error: err.message,
    });
    return next();
  }
  if (claimed !== "OK") {
    return res.status(409).json({
      success: false,
      code: "IDEMPOTENCY_IN_PROGRESS",
      message:
        "A request with this Idempotency-Key is still being processed. Please retry shortly.",
    });
  }

  // 3. Capture the response body so we can commit it. Wrap res.json so we
  // see the JSON before it's serialised; falls through unchanged if the
  // handler doesn't call res.json.
  const originalJson = res.json.bind(res);
  let capturedBody = null;
  res.json = (body) => {
    capturedBody = body;
    return originalJson(body);
  };

  // 4. On finish, commit (success) or release (error). We only commit
  // 2xx/4xx responses — 5xx responses are presumed transient and should
  // remain retriable.
  res.on("finish", async () => {
    try {
      if (res.statusCode >= 500) {
        await redisClient.del(key);
        return;
      }
      const payload = JSON.stringify({
        status: res.statusCode,
        body: capturedBody,
      });
      await redisClient.set(key, payload, "EX", COMMIT_TTL_S);
    } catch (err) {
      logger.warn(`[idempotency] failed to commit ${rawKey}`, {
        error: err.message,
      });
    }
  });

  next();
};
