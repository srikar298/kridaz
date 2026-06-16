import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore   from 'rate-limit-redis';
import CircuitBreaker from 'opossum';
import { redisClient as redis } from '../config/redis.js';
import logger from '../utils/logger.js';

const isTestOrDev  = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
const defaultWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

/**
 * Creates a RedisStore wrapped in an Opossum circuit breaker.
 * If Redis is unhealthy, the breaker opens and express-rate-limit
 * falls back to its built-in memory store automatically.
 *
 * Circuit opens after 50% failure rate, resets after 30s.
 *
 * @param {string} prefix - unique keyPrefix for this limiter
 * @returns {RedisStore|undefined} store for express-rate-limit, or undefined (memory fallback)
 */
const createRedisStoreWithBreaker = (prefix) => {
  if (isTestOrDev) return undefined; // use memory store in test/dev

  let usingRedis = true;

  const breaker = new CircuitBreaker(
    async () => {
      // Lightweight health probe — just ping Redis
      await redis.ping();
    },
    {
      timeout: 3000,                   // 3s probe timeout = failure
      errorThresholdPercentage: 50,    // 50% failures → circuit opens
      resetTimeout: 30_000,            // retry Redis after 30s
    }
  );

  breaker.on('open', () => {
    usingRedis = false;
    logger.warn(`[RATE_LIMITER] Circuit OPEN — Redis unavailable, falling back to memory (${prefix})`);
  });
  breaker.on('halfOpen', () => {
    logger.info(`[RATE_LIMITER] Circuit HALF-OPEN — testing Redis (${prefix})`);
  });
  breaker.on('close', () => {
    usingRedis = true;
    logger.info(`[RATE_LIMITER] Circuit CLOSED — Redis restored (${prefix})`);
  });

  // Keep probing in the background
  setInterval(async () => {
    try { await breaker.fire(); } catch (_) { /* breaker handles logging */ }
  }, 10_000);

  // Return a dynamic store selector
  // When circuit is open, returning undefined makes express-rate-limit use memory
  return new RedisStore({
    sendCommand: async (...args) => {
      if (!usingRedis) throw new Error('Circuit open');
      return redis.call(...args);
    },
    prefix,
  });
};

/**
 * Per-actor key generator.
 *
 * Mobile users behind carrier-grade NAT share a public IP — limiting by IP
 * alone groups thousands of users into the same bucket and either lets abuse
 * through (high cap) or locks out legitimate users (low cap). When the request
 * is authenticated we key on user id; otherwise we fall back to the remote IP.
 *
 * Routes the IP path through express-rate-limit's `ipKeyGenerator` helper so
 * IPv6 traffic is bucketed at /64 rather than the full 128-bit address — a
 * raw req.ip key lets an attacker rotate through their /64 to bypass limits.
 */
const userOrIpKey = (req, res) => {
  const userId = req.user?.id || req.user?.userId || req.owner?.id;
  if (userId) return `u:${userId}`;
  return `ip:${ipKeyGenerator(req, res)}`;
};

/**
 * Auth limiter — login, register, Google auth, password reset.
 * 10 attempts per 15 minutes per IP (auth endpoints have no req.user yet).
 */
export const authLimiter = rateLimit({
  windowMs: defaultWindow,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStoreWithBreaker('rl:auth'),
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
  skip: (req) => isTestOrDev,
});

/**
 * OTP limiter — send-otp and login-step1.
 * 5 requests per 15 minutes per IP.
 */
export const otpLimiter = rateLimit({
  windowMs: defaultWindow,
  max: parseInt(process.env.RATE_LIMIT_OTP_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStoreWithBreaker('rl:otp'),
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many OTP requests. Please wait a while.' },
  skip: (req) => isTestOrDev,
});

/**
 * Payment limiter — order creation, payment verification.
 * 10 requests per 15 minutes per user/IP.
 */
export const paymentLimiter = rateLimit({
  windowMs: defaultWindow,
  max: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStoreWithBreaker('rl:payment'),
  keyGenerator: userOrIpKey,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many payment requests. Please slow down.' },
  skip: (req) => isTestOrDev,
});

/**
 * Refresh-token limiter — caps reuse attempts.
 * 10/min per user/IP. Keeps an attacker who scraped a refresh token from
 * grinding the rotate endpoint in the 60-second grace window.
 */
export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_REFRESH_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStoreWithBreaker('rl:refresh'),
  keyGenerator: userOrIpKey,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many refresh attempts.' },
  skip: (req) => isTestOrDev,
});

/**
 * Global limiter — all /api routes.
 * 200 requests per minute per user/IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStoreWithBreaker('rl:global'),
  keyGenerator: userOrIpKey,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
  skip: (req) => isTestOrDev || req.path === '/health' || req.path === '/api/health',
});
