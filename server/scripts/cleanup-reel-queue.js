/**
 * One-time cleanup script: drain failed BullMQ jobs and reset stuck Prisma reels.
 * Run from: server/ directory
 *   node scripts/cleanup-reel-queue.js
 */
import dotenv from "dotenv";
dotenv.config();

import { Queue } from "bullmq";
import { bullmqConnection } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import logger from "../utils/logger.js";

const mediaQueue = new Queue("media_processing", {
  connection: bullmqConnection,
});

async function main() {
  logger.info("=== Reel Queue Cleanup ===");

  // 1. Remove all failed jobs (they used the broken sandboxed worker)
  const failed = await mediaQueue.getFailed(0, 200);
  logger.info(`Removing ${failed.length} failed BullMQ jobs...`);
  await Promise.all(failed.map((job) => job.remove()));
  logger.info("All failed jobs removed.");

  // 2. Reset DB reels stuck in 'processing' or 'failed' back to 'pending'
  //    so the fixed worker can pick them up when re-queued
  const stuckReels = await prisma.reel.findMany({
    where: { status: { in: ["processing", "failed"] } },
    select: { id: true, status: true, rawVideoUrl: true },
  });

  logger.info(`Found ${stuckReels.length} stuck reels in DB.`);

  for (const reel of stuckReels) {
    const hasSource = !!reel.rawVideoUrl;
    if (hasSource) {
      await prisma.reel.update({
        where: { id: reel.id },
        data: { status: "pending" },
      });
      logger.info(`  Reset → pending: ${reel.id} (has source)`);
    } else {
      // No raw source — cannot reprocess, mark permanently failed
      logger.warn(`  Skipped: ${reel.id} — no rawVideoUrl, leaving as failed`);
    }
  }

  // 3. Re-queue pending reels that have a rawVideoUrl (they have no BullMQ job)
  const pendingReels = await prisma.reel.findMany({
    where: { status: "pending", rawVideoUrl: { not: null } },
    select: { id: true },
  });

  logger.info(`Re-queuing ${pendingReels.length} pending reels...`);
  for (const reel of pendingReels) {
    await mediaQueue.add("TRANSCODE_VIDEO", {
      mediaId: reel.id,
      mediaType: "reel",
    });
    logger.info(`  Queued: ${reel.id}`);
  }

  const counts = await mediaQueue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed"
  );
  logger.info("Final queue counts:", counts);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  logger.error("Cleanup failed:", err);
  process.exit(1);
});
