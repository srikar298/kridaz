import { initSentry } from "./config/sentry.js";
initSentry();

import * as Sentry from "@sentry/node";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/database.js";
import { initSettlementWorker } from "./utils/settlementWorker.js";
import { initSettlementJobs } from "./queues/settlement.queue.js";
import { initCronJobs } from "./utils/cronJobs.js";

import logger from "./utils/logger.js";
import { trackQueue } from "./utils/metrics.js";
import http from "http";

const startWorker = async () => {
  try {
    // Start dummy HTTP server for Azure Web App health checks
    const port =
      process.env.WORKER_PORT ||
      (process.env.NODE_ENV === "production" ? process.env.PORT || 4000 : 4001);
    const healthServer = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Worker is running\n");
    });
    healthServer.listen(port, () => {
      logger.info(
        `[WORKER_PROCESS] Health check server listening on port ${port}`
      );
    });

    await connectDB();
    logger.info(
      "[WORKER_PROCESS] Database connection established successfully."
    );

    // Initialize Workers & Queues
    import("./utils/bloomFilter.js").then(({ seedUsernameBloom }) =>
      seedUsernameBloom()
    );

    initSettlementWorker(); // startup runs + backfill (immediate)
    const { settlementQueue } = await initSettlementJobs(); // recurring jobs via BullMQ (singleton)
    trackQueue("settlement", settlementQueue);

    // Initialize Notification Worker
    import("./queues/notification.worker.js").then(() => {
      logger.info("[WORKER_PROCESS] Notification BullMQ worker initialized.");
    });

    const { notificationQueue } =
      await import("./queues/notification.queue.js");
    trackQueue("notifications", notificationQueue);

    // Initialize Game Application Worker
    import("./queues/processors/gameApplication.processor.js").then(() => {
      logger.info("[WORKER_PROCESS] Game Application BullMQ worker initialized.");
    });

    const { gameApplicationQueue } =
      await import("./queues/gameApplication.queue.js");
    trackQueue("game_applications", gameApplicationQueue);

    // Drain dead-letter queue for BullMQ fallback
    try {
      const { drainDeadLetter } = await import("./utils/deadLetter.js");
      await drainDeadLetter({
        notifications: notificationQueue,
      });
    } catch (err) {
      logger.error(
        "[WORKER_PROCESS] Failed to drain dead-letter list on startup:",
        err
      );
    }

    // Start Unified Media Worker (Reels, Stories, Community)
    logger.info("[WORKER_PROCESS] Starting media processing workers...");
    const { mediaWorker, mediaQueue } = await import("./queues/media.queue.js");
    trackQueue("media", mediaQueue);
    logger.info("[WORKER_PROCESS] Unified inline media worker initialized.");

    // On startup: drain stale failed jobs from previous runs and requeue
    // any pending DB reels that have a rawVideoUrl (safety net for server restarts)
    try {
      const failedJobs = await mediaQueue.getFailed(0, 200);
      if (failedJobs.length > 0) {
        logger.info(
          `[WORKER_PROCESS] Draining ${failedJobs.length} stale failed jobs from previous runs...`
        );
        await Promise.all(failedJobs.map((j) => j.remove()));
      }

      const { prisma } = await import("./config/prisma.js");
      const pendingReels = await prisma.reel.findMany({
        where: { status: "pending", rawVideoUrl: { not: null } },
        select: { id: true },
      });
      if (pendingReels.length > 0) {
        logger.info(
          `[WORKER_PROCESS] Re-queuing ${pendingReels.length} pending reels from DB...`
        );
        for (const reel of pendingReels) {
          await mediaQueue.add("TRANSCODE_VIDEO", {
            mediaId: reel.id,
            mediaType: "reel",
          });
        }
      }
    } catch (drainErr) {
      logger.warn(
        `[WORKER_PROCESS] Startup drain/requeue failed (non-fatal): ${drainErr.message}`
      );
    }

    // Initialize Recurring Maintenance Tasks
    initCronJobs();
  } catch (error) {
    logger.error("[WORKER_PROCESS] Startup error:", error);
    process.exit(1);
  }

  // Catch unhandled Promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("[WORKER_PROCESS] Unhandled Promise rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    Sentry.captureException(
      reason instanceof Error ? reason : new Error(String(reason)),
      {
        extra: { type: "unhandledRejection" },
      }
    );
  });

  process.on("uncaughtException", (err) => {
    logger.error(
      "[WORKER_PROCESS] Synchronous uncaught exception — process will exit",
      {
        message: err.message,
        stack: err.stack,
      }
    );
    Sentry.captureException(err, { extra: { type: "uncaughtException" } });
    Sentry.close(2000).finally(() => process.exit(1));
  });
};

startWorker();

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(
    `[WORKER_PROCESS] ${signal} received. Graceful shutdown starting...`
  );

  try {
    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, 15_000)),
      Promise.allSettled([
        import("./queues/media.queue.js").then(({ mediaQueue }) =>
          mediaQueue.close()
        ),
        import("./queues/notification.queue.js")
          .then(({ notificationQueue }) => notificationQueue.close())
          .catch(() => {}),
        import("./queues/gameApplication.queue.js")
          .then(({ gameApplicationQueue }) => gameApplicationQueue?.close?.())
          .catch(() => {}),
        import("./queues/settlement.queue.js")
          .then(({ settlementQueue }) => settlementQueue?.close?.())
          .catch(() => {}),
      ]),
    ]);

    const [{ prisma }, redis] = await Promise.all([
      import("./config/prisma.js"),
      import("./config/redis.js"),
    ]);
    await Promise.allSettled([
      prisma.$disconnect(),
      redis.redisClient.quit?.().catch(() => {}),
      redis.pubClient?.quit?.().catch(() => {}),
      redis.subClient?.quit?.().catch(() => {}),
      redis.bullmqConnection?.quit?.().catch(() => {}),
    ]);
    logger.info(
      "[WORKER_PROCESS] Prisma + Redis disconnected. Shutdown complete."
    );
    process.exit(0);
  } catch (err) {
    logger.error("[WORKER_PROCESS] Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
