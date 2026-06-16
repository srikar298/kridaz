import { initSentry } from "./config/sentry.js";
initSentry();

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/database.js";
import http from "http";
import socketConfig from "./config/socket.js";
import { initSettlementWorker } from "./utils/settlementWorker.js";
import { initSettlementJobs } from "./queues/settlement.queue.js";
import { initCronJobs } from "./utils/cronJobs.js";

import logger from "./utils/logger.js";
import { trackQueue } from "./utils/metrics.js";

const port = process.env.PORT || 4000;
const server = http.createServer(app);

// Keep-alive tuned for Render's load balancer (recommended: 75s)
server.keepAliveTimeout = 75000;
server.headersTimeout = 76000;

// Initialize Socket.io
socketConfig(server);

import { execSync } from "child_process";

// Function to start the server
const startServer = () => {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
      logger.info("[DATABASE] Deploying migrations...");
      
      // Use Railway's internal network to bypass public proxy unreachable errors
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('zephyr.proxy.rlwy.net')) {
        logger.info("[DATABASE] Swapping to internal Railway network for Prisma sync...");
        process.env.DATABASE_URL = process.env.DATABASE_URL.replace('zephyr.proxy.rlwy.net:15446', 'postgres.railway.internal:5432');
      }
      
      // execSync("npx prisma migrate deploy", { stdio: "inherit" });
      logger.info("[DATABASE] Migrations deployed successfully.");
    }
  } catch (error) {
    logger.error("[DATABASE] Failed to sync schema:", error);
  }

  server.listen(port, () => {
    logger.info(`[SERVER] Running on http://localhost:${port}`);
    
    // Connect to database in the background
    connectDB().then(async () => {
      logger.info("[DATABASE] Connection established successfully.");
      
      // Initialize Workers & Queues
      import("./utils/bloomFilter.js").then(({ seedUsernameBloom }) => seedUsernameBloom());
      
      initSettlementWorker();           // startup runs + backfill (immediate)
      const { settlementQueue } = await initSettlementJobs();       // recurring jobs via BullMQ (singleton)
      trackQueue("settlement", settlementQueue);
      
      // Initialize Notification Worker
      import("./queues/notification.worker.js").then(() => {
        logger.info("[NOTIFICATION] BullMQ worker initialized.");
      });
      
      const { notificationQueue } = await import("./queues/notification.queue.js");
      trackQueue("notifications", notificationQueue);

      // Drain dead-letter queue for BullMQ fallback
      try {
        const { drainDeadLetter } = await import("./utils/deadLetter.js");
        await drainDeadLetter({
          notifications: notificationQueue,
        });
      } catch (err) {
        logger.error("[DEAD_LETTER] Failed to drain dead-letter list on startup:", err);
      }

      // Conditionally start CPU-heavy media workers
      // In production, you can set ENABLE_WORKERS=false on the API service 
      // and run a separate 'worker' service with ENABLE_WORKERS=true
      if (process.env.ENABLE_WORKERS !== "false") {
        logger.info("[WORKER] Starting media processing workers...");
        
        // Start Unified Media Worker (Reels, Stories, Community)
        // Uses an INLINE processor (same process) — NOT sandboxed, ESM & Windows-safe
        const { mediaWorker, mediaQueue } = await import("./queues/media.queue.js");
        trackQueue("media", mediaQueue);
        logger.info("[MEDIA] Unified inline media worker initialized.");

        // On startup: drain stale failed jobs from previous runs and requeue
        // any pending DB reels that have a rawVideoUrl (safety net for server restarts)
        try {
          const failedJobs = await mediaQueue.getFailed(0, 200);
          if (failedJobs.length > 0) {
            logger.info(`[MEDIA] Draining ${failedJobs.length} stale failed jobs from previous runs...`);
            await Promise.all(failedJobs.map((j) => j.remove()));
          }

          const { prisma } = await import('./config/prisma.js');
          const pendingReels = await prisma.reel.findMany({
            where: { status: 'pending', rawVideoUrl: { not: null } },
            select: { id: true },
          });
          if (pendingReels.length > 0) {
            logger.info(`[MEDIA] Re-queuing ${pendingReels.length} pending reels from DB...`);
            for (const reel of pendingReels) {
              await mediaQueue.add('TRANSCODE_VIDEO', { mediaId: reel.id, mediaType: 'reel' });
            }
          }
        } catch (drainErr) {
          logger.warn(`[MEDIA] Startup drain/requeue failed (non-fatal): ${drainErr.message}`);
        }
      } else {
        logger.info("[SERVER] Media workers disabled (API-only mode).");
      }

      // Initialize Recurring Maintenance Tasks
      initCronJobs();

    }).catch(err => {
      logger.error("[DATABASE] Background connection error:", err);
    });
  });
};

// Start the server
startServer(); // triggered restart

// GRACEFUL SHUTDOWN
//
// Order matters:
//   1. Stop accepting new HTTP connections — server.close drains keep-alive.
//   2. Let BullMQ workers finish current jobs (15s budget).
//   3. Disconnect data stores (Prisma + Redis clients + pubsub).
//   4. Forced 30s ceiling so a stuck connection can't pin the container.
let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`[SERVER] ${signal} received. Graceful shutdown starting...`);

  server.close(async () => {
    logger.info('[SERVER] HTTP server closed. Draining queues...');

    try {
      // Close every BullMQ queue we know about. Each close() flushes the worker
      // and lets in-flight jobs complete. Capped at 15s so a stuck job can't
      // delay restart past the deploy budget.
      await Promise.race([
        new Promise(resolve => setTimeout(resolve, 15_000)),
        Promise.allSettled([
          import('./queues/media.queue.js').then(({ mediaQueue }) => mediaQueue.close()),
          import('./queues/notification.queue.js').then(({ notificationQueue }) => notificationQueue.close()).catch(() => {}),
          import('./queues/settlement.queue.js').then(({ settlementQueue }) => settlementQueue?.close?.()).catch(() => {}),
        ]),
      ]);

      // Disconnect data stores.
      const [{ prisma }, redis] = await Promise.all([
        import('./config/prisma.js'),
        import('./config/redis.js'),
      ]);
      await Promise.allSettled([
        prisma.$disconnect(),
        redis.redisClient.quit?.().catch(() => {}),
        redis.pubClient?.quit?.().catch(() => {}),
        redis.subClient?.quit?.().catch(() => {}),
        redis.bullmqConnection?.quit?.().catch(() => {}),
      ]);
      logger.info('[SERVER] Prisma + Redis disconnected. Shutdown complete.');
      process.exit(0);
    } catch (err) {
      logger.error('[SERVER] Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force exit after 30 seconds if graceful fails
  setTimeout(() => {
    logger.error('[SERVER] Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
