import { notificationQueue } from "../../queues/notification.queue.js";
import logger from "../../utils/logger.js";
import { prisma } from "../../config/prisma.js";
import { processInAppNotification } from "../../services/notification.dispatcher.js";

const summarizeDispatchResults = (results) => {
  return results.reduce(
    (summary, result) => {
      const pushResult = result?.pushResult;
      summary.notifications += result?.notification ? 1 : 0;
      summary.tokens += result?.tokenCount || 0;
      summary.success += pushResult?.successCount || 0;
      summary.failure += pushResult?.failureCount || 0;
      if (pushResult?.mock) summary.mock = true;
      return summary;
    },
    { notifications: 0, tokens: 0, success: 0, failure: 0, mock: false }
  );
};

const getUsersWithRegisteredDevices = async () => {
  // user.fcmToken removed; UserDevice is the only source.
  const userDevices = await prisma.userDevice.findMany({
    select: { userId: true },
    distinct: ["userId"],
  });
  return userDevices.map((d) => ({ id: d.userId }));
};

/**
 * GET /api/admin/notifications/failed
 * Fetches all failed notification jobs for manual review.
 */
export const getFailedJobs = async (req, res) => {
  try {
    const failedJobs = await notificationQueue.getFailed();

    // Format jobs for a clean UI response
    const formattedJobs = failedJobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
    }));

    res.status(200).json({
      success: true,
      count: formattedJobs.length,
      jobs: formattedJobs,
    });
  } catch (error) {
    logger.error("[Admin Notification] Error fetching failed jobs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/notifications/failed/:jobId/retry
 * Manually trigger a retry for a specific failed job.
 */
export const retryJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await notificationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    await job.retry();

    res.status(200).json({
      success: true,
      message: `Job ${jobId} has been queued for retry.`,
    });
  } catch (error) {
    logger.error(`[Admin Notification] Error retrying job ${jobId}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/notifications/failed/:jobId
 * Remove a failed job from the queue manually.
 */
export const removeFailedJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await notificationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    await job.remove();

    res.status(200).json({
      success: true,
      message: `Job ${jobId} has been removed from the queue.`,
    });
  } catch (error) {
    logger.error(`[Admin Notification] Error removing job ${jobId}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/notifications/send
 * Allows admin to send custom push + in-app notification to a user or all users.
 */
export const sendAdminPushNotification = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }

  const { recipientId, title, message, type, link, metadata } = req.body;

  if (!title || !message) {
    return res
      .status(400)
      .json({ success: false, message: "Title and message are required" });
  }

  try {
    if (recipientId === "ALL") {
      const activeUsers = await getUsersWithRegisteredDevices();

      if (activeUsers.length === 0) {
        return res
          .status(200)
          .json({
            success: true,
            message: "No active users with registered mobile devices found.",
          });
      }

      const results = await Promise.all(
        activeUsers.map((user) =>
          processInAppNotification({
            recipientId: user.id,
            recipientModel: "User",
            title,
            message,
            type: type || "SYSTEM",
            link: link || "",
            metadata: metadata || {},
          })
        )
      );

      const summary = summarizeDispatchResults(results);
      const delivery = summary.mock
        ? "Firebase is in mock mode; notifications were saved but not delivered to devices."
        : `Delivered to ${summary.success}/${summary.tokens} registered device token(s).`;

      return res.status(200).json({
        success: true,
        message: `Sent notification to ${activeUsers.length} user(s). ${delivery}`,
        summary,
      });
    } else {
      // Send to a single user
      if (!recipientId) {
        return res
          .status(400)
          .json({ success: false, message: "Recipient User ID is required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true },
      });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const result = await processInAppNotification({
        recipientId: user.id,
        recipientModel: "User",
        title,
        message,
        type: type || "SYSTEM",
        link: link || "",
        metadata: metadata || {},
      });

      const summary = summarizeDispatchResults([result]);
      const delivery = summary.mock
        ? "Firebase is in mock mode; notification was saved but not delivered to the device."
        : `Delivered to ${summary.success}/${summary.tokens} registered device token(s).`;

      return res.status(200).json({
        success: true,
        message: `Sent notification for user. ${delivery}`,
        summary,
      });
    }
  } catch (error) {
    logger.error(
      "[Admin Notification] Error sending custom admin push notification:",
      error
    );
    res.status(500).json({ success: false, message: error.message });
  }
};
