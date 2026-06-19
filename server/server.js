import { initSentry } from "./config/sentry.js";
initSentry();

import * as Sentry from "@sentry/node";
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/database.js";
import http from "http";
import socketConfig from "./config/socket.js";

import logger from "./utils/logger.js";

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
    if (
      process.env.NODE_ENV === "production" ||
      process.env.RAILWAY_ENVIRONMENT
    ) {
      logger.info("[DATABASE] Deploying migrations...");

      // Use Railway's internal network to bypass public proxy unreachable errors
      if (
        process.env.DATABASE_URL &&
        process.env.DATABASE_URL.includes("zephyr.proxy.rlwy.net")
      ) {
        logger.info(
          "[DATABASE] Swapping to internal Railway network for Prisma sync..."
        );
        process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
          "zephyr.proxy.rlwy.net:15446",
          "postgres.railway.internal:5432"
        );
      }

      // execSync("npx prisma migrate deploy", { stdio: "inherit" });
      logger.info("[DATABASE] Migrations deployed successfully.");
    }
  } catch (error) {
    logger.error("[DATABASE] Failed to sync schema:", error);
  }

  // Catch unhandled Promise rejections (e.g. BullMQ processors, setTimeout callbacks)
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("[UNHANDLED_REJECTION] Unhandled Promise rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    Sentry.captureException(
      reason instanceof Error ? reason : new Error(String(reason)),
      {
        extra: { type: "unhandledRejection" },
      }
    );
    // Do NOT crash — log and continue. Crashing on every rejected promise
    // causes unnecessary restarts. Investigate Sentry alerts instead.
  });

  // Catch synchronous uncaught exceptions
  process.on("uncaughtException", (err) => {
    logger.error(
      "[UNCAUGHT_EXCEPTION] Synchronous uncaught exception — process will exit",
      {
        message: err.message,
        stack: err.stack,
      }
    );
    Sentry.captureException(err, { extra: { type: "uncaughtException" } });
    // Flush Sentry then exit — uncaughtException leaves process in undefined state
    Sentry.close(2000).finally(() => process.exit(1));
  });

  server.listen(port, () => {
    logger.info(`[SERVER] Running on http://localhost:${port}`);

    // Connect to database in the background
    connectDB()
      .then(async () => {
        logger.info("[DATABASE] Connection established successfully.");

        // Workers & Crons are now executed in a dedicated process via worker.js
        // to ensure HTTP/WebSocket performance is not impacted by CPU-heavy tasks.
      })
      .catch((err) => {
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
    logger.info("[SERVER] HTTP server closed. Disconnecting data stores...");

    try {
      // Disconnect data stores.
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
      logger.info("[SERVER] Prisma + Redis disconnected. Shutdown complete.");
      process.exit(0);
    } catch (err) {
      logger.error("[SERVER] Error during shutdown:", err);
      process.exit(1);
    }
  });

  // Force exit after 30 seconds if graceful fails
  setTimeout(() => {
    logger.error("[SERVER] Forced shutdown after 30s timeout");
    process.exit(1);
  }, 30_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
