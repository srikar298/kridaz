import { Queue } from "bullmq";
import { bullmqConnection as connection } from "../config/redis.js";
import logger from "../utils/logger.js";

connection.on("error", (err) => {
  logger.error("[Notification Queue] Redis connection error:", err);
});

// Create the Queue
export const notificationQueue = new Queue("notifications", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true, // Keep it clean
    removeOnFail: false, // Keep for debugging failed jobs
  },
});

logger.info("[Notification Queue] Initialized successfully.");
