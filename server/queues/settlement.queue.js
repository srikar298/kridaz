import { Queue, Worker } from "bullmq";
import { bullmqConnection as connection } from "../config/redis.js";
import {
  runPlayingTransition,
  runAutoSettle,
} from "../utils/settlementWorker.js";
import logger from "../utils/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Queue — holds the repeatable job definitions
// ─────────────────────────────────────────────────────────────────────────────
export const settlementQueue = new Queue("settlement", { connection });

/**
 * Registers the three singleton repeatable jobs.
 * Called once from server.js after the DB is connected.
 * Removes stale job definitions first so restarts don't accumulate duplicates.
 */
export async function initSettlementJobs() {
  // Remove any previously registered repeatable jobs (clean slate on restart)
  await settlementQueue.removeRepeatableByKey("playing-transition-singleton");
  await settlementQueue.removeRepeatableByKey("auto-settle-singleton");
  await settlementQueue.removeRepeatableByKey("legacy-settle-singleton");

  // Phase A: CONFIRMED → PLAYING → IN_REVIEW_WINDOW (every 5 minutes)
  await settlementQueue.add(
    "playing-transition",
    {},
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: "playing-transition-singleton",
    }
  );

  // Phase B: IN_REVIEW_WINDOW → COMPLETED (every 15 minutes)
  await settlementQueue.add(
    "auto-settle",
    {},
    {
      repeat: { every: 15 * 60 * 1000 },
      jobId: "auto-settle-singleton",
    }
  );

  // Legacy: old 12-hr PENDING→SETTLED flow (every 60 minutes)
  await settlementQueue.add(
    "legacy-settle",
    {},
    {
      repeat: { every: 60 * 60 * 1000 },
      jobId: "legacy-settle-singleton",
    }
  );

  logger.info(
    "[SETTLEMENT] BullMQ jobs scheduled (singleton — runs once across all instances)"
  );
  return { settlementQueue };
}

// ─────────────────────────────────────────────────────────────────────────────
// Worker — processes jobs from the queue.
// concurrency: 1 ensures only one settlement job runs at a time — no overlaps.
// ─────────────────────────────────────────────────────────────────────────────
export const settlementWorker = new Worker(
  "settlement",
  async (job) => {
    if (job.name === "playing-transition") {
      await runPlayingTransition();
    }

    if (job.name === "auto-settle") {
      await runAutoSettle();
    }

    if (job.name === "legacy-settle") {
      // Dynamic import to avoid circular reference at module-load time
      const { runLegacySettlement } =
        await import("../utils/settlementWorker.js");
      await runLegacySettlement();
    }
  },
  {
    connection,
    concurrency: 1, // Only one settlement job runs at a time — no duplicates
  }
);

settlementWorker.on("failed", (job, err) => {
  logger.error(`[SETTLEMENT] Job ${job?.name} failed:`, err.message);
  const Sentry = import("@sentry/node");
  Sentry.then((s) => s.captureException(err, { tags: { job: job?.name } }));
});
