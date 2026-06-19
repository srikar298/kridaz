import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Create a new notification in the database
 * @param {Object} params - Notification parameters
 * @param {string} params.recipientId - ID of the User or Owner
 * @param {string} params.recipientModel - "User" or "Owner"
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification content
 * @param {string} params.type - Category (e.g., BOOKING, DISPUTE, WALLET)
 * @param {string} params.actionUrl - URL to redirect the user when clicked
 * @param {Object} params.metadata - Extra data (optional)
 */
export const createNotification = async ({
  recipientId,
  recipientModel,
  title,
  message,
  type,
  actionUrl,
  metadata = {},
}) => {
  try {
    const data = {
      title,
      message,
      type,
      link: actionUrl,
      metadata,
      recipientModel,
      isRead: false,
    };

    if (recipientModel === "User" || recipientModel === "Admin") {
      data.userId = recipientId;
    } else if (recipientModel === "Owner") {
      data.ownerId = recipientId;
    }

    const notification = await prisma.notification.create({
      data,
    });
    return notification;
  } catch (error) {
    logger.error("[NOTIFICATION_UTIL] Error creating notification", error);
    return null;
  }
};
