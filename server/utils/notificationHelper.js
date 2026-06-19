import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Create a notification for a user or partner
 * @param {string} recipientId - ID of the user/owner
 * @param {string} recipientModel - 'User' or 'Owner'
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Enum: BOOKING, PAYMENT, REVIEW, SUPPORT, WITHDRAWAL, SYSTEM
 * @param {string} link - Navigation link for frontend
 * @param {object} metadata - Extra data
 */
export const createNotification = async ({
  recipientId,
  recipientModel,
  title,
  message,
  type,
  link,
  metadata = {},
}) => {
  try {
    const data = {
      title,
      message,
      type,
      link,
      metadata,
      recipientModel,
    };

    if (recipientModel === "User") {
      data.userId = recipientId;
    } else {
      data.ownerId = recipientId;
    }

    const notification = await prisma.notification.create({ data });
    return notification;
  } catch (error) {
    logger.error("[CREATE_NOTIFICATION_ERROR]", error);
  }
};

/**
 * Notify all administrators
 */
export const notifyAdmins = async ({
  title,
  message,
  type,
  link,
  metadata = {},
}) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN"] } },
      select: { id: true },
    });

    const notifications = admins.map((admin) => ({
      userId: admin.id,
      recipientModel: "User",
      title,
      message,
      type,
      link,
      metadata: metadata || {},
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }
  } catch (error) {
    logger.error("[NOTIFY_ADMINS_ERROR]", error);
  }
};
