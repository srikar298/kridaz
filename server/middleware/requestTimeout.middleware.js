import logger from "../utils/logger.js";

/**
 * Paths excluded from timeout — file uploads legitimately take longer than 30s.
 */
const EXCLUDE_PATHS = [
  "/api/upload",
  "/api/reels/upload",
  "/api/health",
  "/metrics",
];

/**
 * Hard timeout per request. Responds 408 if the handler does not finish in time.
 * Register AFTER requestLogger but BEFORE routes in app.js.
 *
 * @param {number} timeoutMs - default 30 seconds
 */
export const requestTimeout =
  (timeoutMs = 30_000) =>
  (req, res, next) => {
    if (EXCLUDE_PATHS.some((p) => req.path.startsWith(p))) return next();

    const timer = setTimeout(() => {
      if (res.headersSent) return;

      logger.warn(
        `[TIMEOUT] ${req.method} ${req.originalUrl} exceeded ${timeoutMs}ms`,
        {
          method: req.method,
          url: req.originalUrl,
          timeoutMs,
        }
      );

      res.status(408).json({
        success: false,
        error: "RequestTimeout",
        message: "Request timed out. Please try again.",
      });

      // Prevent any subsequent middleware from sending headers after the 408
      res.json = () => res;
      res.send = () => res;
    }, timeoutMs);

    // Clean up timer as soon as response is done
    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));

    next();
  };
