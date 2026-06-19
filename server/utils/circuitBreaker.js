import CircuitBreaker from "opossum";
import logger from "./logger.js";

/**
 * Circuit Breaker Factory
 *
 * Creates a pre-configured opossum Circuit Breaker for any async function
 * that calls an external service (Razorpay, MSG91, SMTP, etc.).
 *
 * Behaviour:
 *   - After `errorThresholdPercentage`% of requests fail within the rolling
 *     window, the circuit "opens" and all subsequent calls fail-fast with a
 *     predictable error for `resetTimeout` ms.
 *   - After `resetTimeout`, the circuit enters "half-open" and allows a
 *     single probe request through. If it succeeds the circuit closes again.
 *
 * @param {Function} fn   - The async function to wrap.
 * @param {Object}   opts - Optional overrides for opossum defaults.
 * @returns {CircuitBreaker}
 */
export function createCircuitBreaker(fn, opts = {}) {
  const defaults = {
    timeout: 10_000, // 10s max per call
    errorThresholdPercentage: 50, // open after 50% failures
    resetTimeout: 30_000, // try again after 30s
    rollingCountTimeout: 60_000, // 1-minute rolling window
    rollingCountBuckets: 6, // 10s buckets within the window
    volumeThreshold: 5, // need at least 5 calls before tripping
    ...opts,
  };

  const name = opts.name || fn.name || "anonymous";
  const breaker = new CircuitBreaker(fn, defaults);

  breaker.on("open", () =>
    logger.warn(`[CIRCUIT_BREAKER] ${name} — circuit OPENED (failing fast)`)
  );
  breaker.on("halfOpen", () =>
    logger.info(`[CIRCUIT_BREAKER] ${name} — circuit HALF-OPEN (probing)`)
  );
  breaker.on("close", () =>
    logger.info(`[CIRCUIT_BREAKER] ${name} — circuit CLOSED (recovered)`)
  );
  breaker.on("fallback", () =>
    logger.warn(`[CIRCUIT_BREAKER] ${name} — fallback triggered`)
  );

  return breaker;
}
