import { redisClient as redis } from "../config/redis.js";
import logger from "./logger.js";
import * as Sentry from "@sentry/node";

const DEAD_LETTER_KEY = "kridaz:dead-letter";

/**
 * Saves a failed BullMQ job payload to Redis for later retry.
 * Called when .add() throws — ensures no notification is silently lost.
 *
 * @param {string} queueName  - name of the BullMQ queue (e.g. 'notifications')
 * @param {string} jobName    - job name (e.g. 'booking-confirmed')
 * @param {object} payload    - job data
 * @param {object} opts       - original BullMQ job options
 */
export const saveToDeadLetter = async (
  queueName,
  jobName,
  payload,
  opts = {}
) => {
  const entry = JSON.stringify({
    queueName,
    jobName,
    payload,
    opts,
    failedAt: new Date().toISOString(),
  });

  try {
    await redis.lpush(DEAD_LETTER_KEY, entry);
    logger.warn(
      `[DEAD_LETTER] Saved failed job to dead-letter: ${queueName}/${jobName}`,
      { payload }
    );
  } catch (redisErr) {
    // If even Redis fails, capture in Sentry — this is the last resort
    logger.error("[DEAD_LETTER] Failed to save to dead-letter list", redisErr);
    Sentry.captureException(redisErr, {
      extra: {
        queueName,
        jobName,
        payload,
        originalError: "BullMQ enqueue failed",
      },
    });
  }
};

/**
 * Drains the dead-letter list and re-enqueues all saved jobs.
 * Call this once during server startup, after queues are initialized.
 *
 * @param {Object} queues - map of queueName → BullMQ Queue instance
 *                          e.g. { notifications: notificationQueue }
 */
export const drainDeadLetter = async (queues) => {
  let drained = 0;

  try {
    let raw;
    // RPOP processes oldest-first (FIFO)
    while ((raw = await redis.rpop(DEAD_LETTER_KEY)) !== null) {
      const entry = JSON.parse(raw);
      const queue = queues[entry.queueName];

      if (!queue) {
        logger.warn(
          `[DEAD_LETTER] No queue registered for "${entry.queueName}" — skipping`
        );
        continue;
      }

      try {
        await queue.add(entry.jobName, entry.payload, entry.opts);
        drained++;
        logger.info(
          `[DEAD_LETTER] Re-enqueued: ${entry.queueName}/${entry.jobName}`
        );
      } catch (err) {
        logger.error(
          `[DEAD_LETTER] Re-enqueue failed for ${entry.queueName}/${entry.jobName}`,
          err
        );
        Sentry.captureException(err, { extra: entry });
        // Push back so it's not lost — will retry on next startup
        await redis.lpush(DEAD_LETTER_KEY, raw);
      }
    }

    if (drained > 0) {
      logger.info(`[DEAD_LETTER] Drained ${drained} job(s) on startup`);
    }
  } catch (err) {
    logger.error("[DEAD_LETTER] Error during drain", err);
  }
};
