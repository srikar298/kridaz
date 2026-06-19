import admin from "../config/firebase.js";
import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

// FCM error codes that mean "this token is dead, stop sending to it".
// We delete the corresponding UserDevice rows so the next push doesn't waste
// quota and so stale tokens don't accumulate indefinitely.
const DEAD_TOKEN_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

/**
 * Sends a push notification to a specific device token (or array).
 *
 * @param {string|string[]} fcmToken - recipient device token(s)
 * @param {string} title
 * @param {string} body
 * @param {object} [data] - key/value payload (deep-link data, etc.)
 * @returns {Promise<object>} multicast response, with successCount/failureCount
 */
export const sendPushNotification = async (
  fcmToken,
  title,
  body,
  data = {}
) => {
  if (!fcmToken || (Array.isArray(fcmToken) && fcmToken.length === 0)) return;

  const tokens = Array.isArray(fcmToken) ? fcmToken : [fcmToken];

  // If Firebase Admin isn't initialized or running in mock mode, skip actual dispatch
  if (!admin || !admin.apps.length) {
    logger.info(
      `[Push Notification Mock] To: ${JSON.stringify(tokens)} | Title: ${title} | Body: ${body} | Data: ${JSON.stringify(data)}`
    );
    return {
      successCount: 0,
      failureCount: 0,
      mock: true,
      responses: [],
    };
  }

  // Ensure all keys and values in data are strings
  const stringifiedData = {};
  if (data) {
    Object.entries(data).forEach(([key, val]) => {
      stringifiedData[key] =
        val !== null && val !== undefined ? String(val) : "";
    });
  }

  const message = {
    tokens,
    notification: {
      title,
      body,
    },
    data: {
      ...stringifiedData,
      click_action: stringifiedData.link || "",
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(
      `[Push Notification] Multicast delivery finished. Success count: ${response.successCount}, Failure count: ${response.failureCount}`
    );

    // Identify dead tokens and prune from the UserDevice table. Without this,
    // tokens from uninstalled apps stay forever and every send wastes a slot.
    if (response.failureCount > 0) {
      const deadTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (DEAD_TOKEN_ERROR_CODES.has(code)) {
            deadTokens.push(tokens[idx]);
          } else {
            logger.warn(
              `[Push Notification] Transient failure for token ${tokens[idx]}: ${resp.error?.message || code}`
            );
          }
        }
      });

      if (deadTokens.length > 0) {
        try {
          const { count } = await prisma.userDevice.deleteMany({
            where: { token: { in: deadTokens } },
          });
          logger.info(
            `[Push Notification] Pruned ${count} stale UserDevice row(s) (FCM rejected ${deadTokens.length} token(s))`
          );
        } catch (err) {
          logger.error(`[Push Notification] Failed to prune stale tokens`, err);
        }
      }
    }
    return response;
  } catch (error) {
    logger.error(`[Push Notification] Error sending multicast message:`, error);
    return {
      successCount: 0,
      failureCount: tokens.length,
      error: error.message,
      responses: tokens.map(() => ({ success: false, error })),
    };
  }
};
