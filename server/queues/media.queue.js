import { Queue, Worker } from "bullmq";
import { bullmqConnection as connection } from "../config/redis.js";
import mediaProcessor from "./processors/media.processor.js";
import logger from "../utils/logger.js";

/**
 * Media Processing Queue
 *
 * Handles transcoding for: reels, stories, community posts.
 *
 * IMPORTANT: We use an INLINE processor function (not a sandboxed file-path worker)
 * because BullMQ's sandboxed child-process worker fails on Windows with ESM modules:
 *   ERR_UNSUPPORTED_ESM_URL_SCHEME: Received protocol 'c:'
 * The inline approach runs in the same Node process, giving us access to the correct
 * Prisma client, env vars, and all ESM imports without any path-scheme issues.
 */

export const mediaQueue = new Queue("media_processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 50 }, // Keep last 50 completed for debugging
    removeOnFail: false,
  },
});

// ── Inline Worker (same process — ESM & Windows safe) ─────────────────────────
export const mediaWorker = new Worker(
  "media_processing",
  async (job) => {
    logger.info(
      `[MEDIA_WORKER] Processing job ${job.id}: ${job.name}`,
      job.data
    );
    return mediaProcessor(job);
  },
  {
    connection,
    concurrency: 2,
  }
);

// ── Worker Lifecycle Logging ───────────────────────────────────────────────────
mediaWorker.on("completed", (job) => {
  logger.info(`[MEDIA_WORKER] Job ${job.id} completed successfully.`);
});

mediaWorker.on("failed", (job, err) => {
  logger.error(
    `[MEDIA_WORKER] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts}): ${err.message}`
  );
});

mediaWorker.on("error", (err) => {
  logger.error("[MEDIA_WORKER] Worker error:", err);
});
