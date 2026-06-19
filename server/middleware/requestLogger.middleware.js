import { v4 as uuidv4 } from "uuid";
import logger, { logStorage } from "../utils/logger.js";

/**
 * Middleware to trace requests using a unique ID and log incoming/outgoing HTTP calls.
 */
const requestLogger = (req, res, next) => {
  // Skip health checks and metrics to avoid log bloat
  if (req.url === "/api/health" || req.url === "/metrics") {
    return next();
  }

  const requestId = req.header("X-Request-ID") || uuidv4();

  // Expose Request ID to response headers and res.locals
  res.setHeader("X-Request-ID", requestId);
  res.locals.requestId = requestId;

  const start = Date.now();

  // Run the rest of the request within the AsyncLocalStorage context
  logStorage.run({ requestId, userId: null }, () => {
    // Log incoming request
    logger.http(`${req.method} ${req.originalUrl || req.url}`, {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get("user-agent"),
    });

    // Capture response details on finish
    res.on("finish", () => {
      const duration = Date.now() - start;
      const level =
        res.statusCode >= 500
          ? "error"
          : res.statusCode >= 400
            ? "warn"
            : "http";

      logger.log(
        level,
        `${res.statusCode} ${req.method} ${req.originalUrl || req.url} - ${duration}ms`,
        {
          statusCode: res.statusCode,
          duration,
          userId: res.locals.user?.id || req.user?.id || null,
        }
      );
    });

    next();
  });
};

export default requestLogger;
