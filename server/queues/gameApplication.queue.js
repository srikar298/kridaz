import { Queue } from "bullmq";
import { bullmqConnection } from "../config/redis.js";
import logger from "../utils/logger.js";

const queueName = "gameApplicationQueue";

export const gameApplicationQueue = new Queue(queueName, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: 100, // Keep last 100 failed jobs for inspection
  },
});

gameApplicationQueue.on("error", (err) => {
  logger.error("GameApplicationQueue Error:", err);
});
