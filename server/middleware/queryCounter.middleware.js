import logger from "../utils/logger.js";
import { AsyncLocalStorage } from "async_hooks";

// Export the storage so prisma.js can access it
export const queryContext = new AsyncLocalStorage();

/**
 * Middleware to track request performance and query counts.
 */
const queryCounter = (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return next();
  }

  const startTime = Date.now();
  const store = { queryCount: 0 };

  queryContext.run(store, () => {
    // Attach the store to the request object for easy access in controllers if needed
    req.performance = store;

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const count = store.queryCount;

      logger.info(`[PERFORMANCE] ${req.method} ${req.originalUrl}`, {
        queries: count,
        duration: `${duration}ms`,
      });

      // Warning for N+1 detection
      if (count > 15) {
        logger.warn(
          `[PERFORMANCE] Potential N+1 Query detected at ${req.originalUrl}`,
          {
            queries: count,
          }
        );
      }
    });

    next();
  });
};

export default queryCounter;
