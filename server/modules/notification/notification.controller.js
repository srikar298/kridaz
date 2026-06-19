import { prisma } from "../../config/prisma.js";
import { UnauthorizedError, BadRequestError } from "@kridaz/common";
import admin from "../../config/firebase.js";
import logger from "../../utils/logger.js";
import {
  buildCursorPage,
  decodeCursor,
  encodeCursor,
} from "../../utils/pagination.js";

const getRecipientQuery = (req) => {
  const actor = req.user || req.owner || req.admin;
  const id = actor?.id || actor?.userId || actor?._id;
  const ownerId = actor?.ownerId;
  const role = actor?.role?.toString().toLowerCase() || "";

  if (!id && !ownerId) {
    throw new UnauthorizedError(
      "Authenticated recipient could not be resolved",
      { code: "NO_RECIPIENT" }
    );
  }

  // Admins are stored as users. Business actors use their owner profile stream.
  if (ownerId && role !== "admin" && role !== "bmsp_admin") {
    return { ownerId, recipientModel: "Owner" };
  }

  return { userId: id, recipientModel: "User" };
};

const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 25;

export const getMyNotifications = async (req, res) => {
  try {
    const query = getRecipientQuery(req);

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT, 1),
      MAX_PAGE_LIMIT
    );
    const cursor = decodeCursor(req.query.cursor);

    // Cursor pagination on (createdAt DESC, id DESC). Cursor encodes the last
    // row's createdAt+id so the next page resumes deterministically even when
    // new rows are inserted at the head between fetches.
    const where = { ...query };
    if (cursor?.createdAt && cursor?.id) {
      where.OR = [
        { createdAt: { lt: new Date(cursor.createdAt) } },
        {
          AND: [
            { createdAt: new Date(cursor.createdAt) },
            { id: { lt: cursor.id } },
          ],
        },
      ];
    }

    // Fetch limit + 1 to know if there's another page without a separate count query.
    const rows = await prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null;

    // Back-compat: top-level `notifications` is what the web client reads.
    // Wave 4 envelope sweep will drop it once both clients consume data.items.
    res.status(200).json({
      success: true,
      notifications: items,
      data: {
        items,
        pagination: buildCursorPage({ items, nextCursor, limit, hasMore }),
      },
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, code: error.meta?.code, message: error.message });
  }
};

/**
 * Number of unread notifications for the current actor. Powers the badge
 * indicator on the bell icon — small enough that mobile can hit it on every
 * resume without worrying about cost. Returns 0 (not 404) when there are none.
 */
export const getUnreadCount = async (req, res) => {
  try {
    const query = getRecipientQuery(req);
    const count = await prisma.notification.count({
      where: { ...query, isRead: false },
    });
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, code: error.meta?.code, message: error.message });
  }
};

/**
 * Delete a single notification. Scoped by recipient — a user can only delete
 * their own. Idempotent: deleting a missing/already-deleted id returns 200.
 */
export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const query = getRecipientQuery(req);
    // deleteMany (not delete) so a missing row doesn't throw P2025.
    const result = await prisma.notification.deleteMany({
      where: { id, ...query },
    });
    res.status(200).json({ success: true, data: { deleted: result.count } });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, code: error.meta?.code, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const query = getRecipientQuery(req);

    await prisma.notification.updateMany({
      where: { ...query, isRead: false },
      data: { isRead: true },
    });
    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const query = getRecipientQuery(req);

    await prisma.notification.deleteMany({
      where: query,
    });
    res.status(200).json({ success: true, message: "Notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Normalize the platform string clients send for FCM registration.
 *
 *   - Required values: "android" | "ios" | "web". These are what Firebase
 *     payload variants (APNs vs Android channels) key off of.
 *   - Legacy: an older Flutter prototype sent "mobile". Map to "android" with
 *     a deprecation log so we can monitor migration. Drop once usage hits 0.
 *   - Anything else is rejected — keeps the column finite-valued.
 */
const ALLOWED_PLATFORMS = ["android", "ios", "web"];
const normalizePlatform = (raw) => {
  if (!raw) return null;
  const p = String(raw).toLowerCase();
  if (ALLOWED_PLATFORMS.includes(p)) return p;
  if (p === "mobile") {
    logger.warn(
      "[notification] legacy platform 'mobile' received; mapping to 'android'"
    );
    return "android";
  }
  return null;
};

export const saveDeviceToken = async (req, res) => {
  const { token, platform, deviceId, appVersion, locale } = req.body;
  try {
    const id = req.user?.id || req.user?.userId || req.user?._id;
    if (!token) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_REQUIRED",
        message: "Token is required",
      });
    }
    if (!id) {
      return res.status(401).json({
        success: false,
        code: "NO_USER",
        message: "Authenticated user could not be resolved",
      });
    }

    const normalized = normalizePlatform(platform);
    if (!normalized) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PLATFORM",
        message: `Platform must be one of: ${ALLOWED_PLATFORMS.join(", ")}`,
        allowed: ALLOWED_PLATFORMS,
      });
    }

    const now = new Date();
    const baseData = {
      platform: normalized,
      ...(deviceId != null && { deviceId: String(deviceId).slice(0, 200) }),
      ...(appVersion != null && {
        appVersion: String(appVersion).slice(0, 32),
      }),
      ...(locale != null && { locale: String(locale).slice(0, 16) }),
      lastSeenAt: now,
    };

    // UserDevice is the authoritative store. We no longer mirror onto
    // user.fcmToken — dispatchers still read it as a fallback for users who
    // registered before UserDevice existed, but once those users open the
    // updated mobile app they re-register here and the legacy value goes
    // stale naturally. A follow-up PR removes the column.
    await prisma.userDevice.upsert({
      where: { token },
      update: { userId: id, ...baseData },
      create: { userId: id, token, ...baseData },
    });

    // UserDevice is now the only source of truth. The legacy user.fcmToken
    // column has been removed in this release.
    res
      .status(200)
      .json({ success: true, message: "Device token registered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Unregister a device token (called on logout or app uninstall hook).
 * Idempotent — missing rows are silently no-op'd.
 */
export const unregisterDeviceToken = async (req, res) => {
  const { token } = req.body;
  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_REQUIRED",
        message: "Token is required",
      });
    }
    await prisma.userDevice.deleteMany({ where: { token } });
    res
      .status(200)
      .json({ success: true, message: "Device token unregistered" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Subscribe one or more FCM tokens to a topic (e.g. "match-<id>" for live
 * score broadcasts). Topic names follow Firebase rules: matches [a-zA-Z0-9-_.~%].
 */
const TOPIC_REGEX = /^[a-zA-Z0-9-_.~%]{1,200}$/;
export const subscribeToTopic = async (req, res) => {
  const { topic, tokens } = req.body;
  try {
    if (!topic || !TOPIC_REGEX.test(topic)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_TOPIC",
        message: "Invalid topic",
      });
    }
    const tokenList = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
    if (!tokenList.length) {
      return res.status(400).json({
        success: false,
        code: "NO_TOKENS",
        message: "tokens[] is required",
      });
    }
    if (!admin || !admin.apps?.length) {
      logger.warn(
        `[notification] topic subscribe skipped (firebase not configured): ${topic}`
      );
      return res.status(200).json({
        success: true,
        message: "Topic subscription skipped (firebase disabled)",
      });
    }
    const result = await admin.messaging().subscribeToTopic(tokenList, topic);
    res.status(200).json({
      success: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    logger.error("[notification] topic subscribe error", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unsubscribeFromTopic = async (req, res) => {
  const { topic, tokens } = req.body;
  try {
    if (!topic || !TOPIC_REGEX.test(topic)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_TOPIC",
        message: "Invalid topic",
      });
    }
    const tokenList = Array.isArray(tokens) ? tokens.filter(Boolean) : [];
    if (!tokenList.length) {
      return res.status(400).json({
        success: false,
        code: "NO_TOKENS",
        message: "tokens[] is required",
      });
    }
    if (!admin || !admin.apps?.length) {
      logger.warn(
        `[notification] topic unsubscribe skipped (firebase not configured): ${topic}`
      );
      return res.status(200).json({
        success: true,
        message: "Topic unsubscription skipped (firebase disabled)",
      });
    }
    const result = await admin
      .messaging()
      .unsubscribeFromTopic(tokenList, topic);
    res.status(200).json({
      success: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    logger.error("[notification] topic unsubscribe error", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle MSG91 Webhook events (e.g. "On API Failed Events", "On Hold Events").
 * If the WhatsApp delivery fails or is held, we trigger a fallback SMS.
 */
export const handleMsg91Webhook = async (req, res) => {
  try {
    // We configured the payload to match MSG91's default JSON payload format
    // where the 'payload' property contains the actual event string.
    const rawPayload = req.body.payload;
    const companyId = req.body.companyId;

    logger.info(
      `[MSG91 Webhook] Received status update from company ${companyId || "unknown"}`
    );

    // Parse the inner JSON string provided by MSG91 in 'payload'
    let eventData = {};
    if (typeof rawPayload === "string") {
      try {
        eventData = JSON.parse(rawPayload);
      } catch (e) {
        logger.warn(
          `[MSG91 Webhook] Could not parse nested payload string: ${rawPayload}`
        );
      }
    } else if (typeof rawPayload === "object") {
      eventData = rawPayload || {};
    }

    const msgStatus = eventData.status || req.body.reason || "";
    const mobile = eventData.mobile;

    if (
      msgStatus &&
      (msgStatus.includes("hold") ||
        msgStatus.includes("failed") ||
        msgStatus.includes("undelivered"))
    ) {
      logger.warn(
        `[MSG91 Webhook] WhatsApp delivery issue (${msgStatus}) for ${mobile}. Queuing SMS fallback...`
      );

      // Dynamically import the queue to avoid circular dependencies if any
      const { default: notificationQueue } =
        await import("../../queues/notification.worker.js");

      // Add the fallback job to the queue
      await notificationQueue.add("SEND_OTP", {
        phone: mobile,
        deliveryMethod: "sms", // Force SMS this time
        otp: "FALLBACK_TRIGGERED", // Since we don't have the original OTP here natively, in a full implementation you would read this from Redis.
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Webhook processed" });
  } catch (error) {
    logger.error(`[MSG91 Webhook] Error processing webhook: ${error.message}`);
    return res.status(200).json({ success: false });
  }
};
