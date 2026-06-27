import { Queue, Worker } from "bullmq";
import { bullmqConnection as connection } from "../config/redis.js";
import CareerStatsService from "../services/careerStats.service.js";
import logger from "../utils/logger.js";

/**
 * Career Stats Processing Queue
 */
export const careerStatsQueue = new Queue("career_stats", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: false,
  },
});

// Inline Worker for Windows ESM compatibility
export const careerStatsWorker = new Worker(
  "career_stats",
  async (job) => {
    logger.info(
      `[CAREER_STATS_WORKER] Processing job ${job.id}: ${job.name}`
    );
    if (job.name === "AGGREGATE_MATCH_STATS") {
      const { matchScoring, hostedGame } = job.data;
      return await CareerStatsService.aggregateMatchCareerStats(matchScoring, hostedGame);
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

careerStatsWorker.on("completed", (job) => {
  logger.info(`[CAREER_STATS_WORKER] Job ${job.id} completed successfully.`);
});

careerStatsWorker.on("failed", (job, err) => {
  logger.error(
    `[CAREER_STATS_WORKER] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts}): ${err.message}`
  );
});

careerStatsWorker.on("error", (err) => {
  logger.error("[CAREER_STATS_WORKER] Worker error:", err);
});
