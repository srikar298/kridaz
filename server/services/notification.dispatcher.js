import { prisma } from "../config/prisma.js";
import logger from "../utils/logger.js";
import { sendPushNotification } from "../utils/pushHelper.js";

export const getUserDeviceTokens = async (userId) => {
  if (!userId) return [];

  // user.fcmToken removed in favor of the UserDevice table; this is now the
  // single source of truth for FCM dispatch.
  const userDevices = await prisma.userDevice.findMany({
    where: { userId },
    select: { token: true },
  });

  return [...new Set(userDevices.map((d) => d.token).filter(Boolean))];
};

export const processInAppNotification = async ({
  recipientId,
  recipientModel,
  title,
  message,
  type,
  link,
  metadata = {},
}) => {
  const data = {
    title,
    message,
    type,
    link,
    metadata,
    recipientModel,
  };

  // C-19: Strict Foreign Key Validation
  if (recipientModel === "User") {
    const userExists = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
    if (!userExists) {
      logger.warn(`[Notification Dispatcher] User ${recipientId} not found. Skipping.`);
      return { success: false, reason: "Recipient not found" };
    }
    data.userId = recipientId;
  } else if (recipientModel === "OwnerProfile" || recipientModel === "Owner") {
    data.recipientModel = "OwnerProfile";
    const ownerExists = await prisma.ownerProfile.findUnique({ where: { id: recipientId }, select: { id: true } });
    if (!ownerExists) {
      logger.warn(`[Notification Dispatcher] OwnerProfile ${recipientId} not found. Skipping.`);
      return { success: false, reason: "Recipient not found" };
    }
    data.ownerId = recipientId;
  } else {
    logger.warn(`[Notification Dispatcher] Unknown recipientModel: ${recipientModel}`);
    return { success: false, reason: "Invalid recipientModel" };
  }

  const dbNotification = await prisma.notification.create({ data });
  let pushResult = null;
  let tokenCount = 0;

  if (recipientModel === "User") {
    try {
      const tokens = await getUserDeviceTokens(recipientId);
      tokenCount = tokens.length;

      if (tokens.length > 0) {
        pushResult = await sendPushNotification(tokens, title, message, {
          notificationId: dbNotification.id,
          link: link || "",
          type: type || "",
        });
      }
    } catch (error) {
      logger.error("[Notification Dispatcher] Push dispatch failed:", error);
      pushResult = {
        successCount: 0,
        failureCount: tokenCount,
        error: error.message,
      };
    }
  }

  return {
    notification: dbNotification,
    tokenCount,
    pushResult,
  };
};
