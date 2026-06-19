import { notificationQueue } from "../queues/notification.queue.js";
import logger from "../utils/logger.js";
import * as Sentry from "@sentry/node";
import { saveToDeadLetter } from "../utils/deadLetter.js";

/**
 * NotificationService - The single entry point for sending any notification.
 * All methods are asynchronous and return immediately after queuing the job.
 */
const NotificationService = {
  /**
   * Send OTP via Email and/or WhatsApp
   */
  async sendOTP(payload) {
    try {
      await notificationQueue.add("SEND_OTP", payload);
      return true;
    } catch (error) {
      logger.error(
        "[Notification Service] Error queuing SEND_OTP — saving to dead-letter:",
        error
      );
      Sentry.captureException(error, {
        extra: { jobName: "SEND_OTP", payload },
      });
      await saveToDeadLetter("notifications", "SEND_OTP", payload);
      return false;
    }
  },

  /**
   * Send an Admin Alert
   */
  async notifyAdmins(payload) {
    try {
      await notificationQueue.add("ADMIN_ALERT", payload);
      return true;
    } catch (error) {
      logger.error(
        "[Notification Service] Error queuing ADMIN_ALERT — saving to dead-letter:",
        error
      );
      Sentry.captureException(error, {
        extra: { jobName: "ADMIN_ALERT", payload },
      });
      await saveToDeadLetter("notifications", "ADMIN_ALERT", payload);
      return false;
    }
  },

  /**
   * Send an In-App Notification to a user/owner
   */
  async sendInApp(payload) {
    try {
      await notificationQueue.add("IN_APP_NOTIF", payload);
      return true;
    } catch (error) {
      logger.error(
        "[Notification Service] Error queuing IN_APP_NOTIF — saving to dead-letter:",
        error
      );
      Sentry.captureException(error, {
        extra: { jobName: "IN_APP_NOTIF", payload },
      });
      await saveToDeadLetter("notifications", "IN_APP_NOTIF", payload);
      return false;
    }
  },

  /**
   * Generic Email Sender
   */
  async sendEmail(payload) {
    try {
      await notificationQueue.add("SEND_EMAIL", payload);
      return true;
    } catch (error) {
      logger.error(
        "[Notification Service] Error queuing SEND_EMAIL — saving to dead-letter:",
        error
      );
      Sentry.captureException(error, {
        extra: { jobName: "SEND_EMAIL", payload },
      });
      await saveToDeadLetter("notifications", "SEND_EMAIL", payload);
      return false;
    }
  },

  /**
   * Send WhatsApp Notification
   */
  async sendWhatsApp(payload) {
    try {
      await notificationQueue.add("SEND_WHATSAPP", payload);
      return true;
    } catch (error) {
      logger.error(
        "[Notification Service] Error queuing SEND_WHATSAPP — saving to dead-letter:",
        error
      );
      Sentry.captureException(error, {
        extra: { jobName: "SEND_WHATSAPP", payload },
      });
      await saveToDeadLetter("notifications", "SEND_WHATSAPP", payload);
      return false;
    }
  },

  /**
   * Notify users in the same area about a new game
   */
  async notifyNewGame(payload) {
    try {
      await notificationQueue.add("NOTIFY_NEW_GAME", payload);
      return true;
    } catch (error) {
      logger.error(
        "[Notification Service] Error queuing NOTIFY_NEW_GAME — saving to dead-letter:",
        error
      );
      Sentry.captureException(error, {
        extra: { jobName: "NOTIFY_NEW_GAME", payload },
      });
      await saveToDeadLetter("notifications", "NOTIFY_NEW_GAME", payload);
      return false;
    }
  },

  /**
   * Invite an off-platform custom player
   */
  async sendCustomPlayerInvite(payload) {
    try {
      await notificationQueue.add("CUSTOM_PLAYER_INVITE", payload);
      return true;
    } catch (error) {
      logger.error(
        "[Notification Service] Error queuing CUSTOM_PLAYER_INVITE — saving to dead-letter:",
        error
      );
      Sentry.captureException(error, {
        extra: { jobName: "CUSTOM_PLAYER_INVITE", payload },
      });
      await saveToDeadLetter("notifications", "CUSTOM_PLAYER_INVITE", payload);
      return false;
    }
  },

  /**
   * Invite an off-platform custom umpire
   */
  async sendCustomUmpireInvite(payload) {
    try {
      await notificationQueue.add("CUSTOM_UMPIRE_INVITE", payload);
      return true;
    } catch (error) {
      logger.error(
        "[Notification Service] Error queuing CUSTOM_UMPIRE_INVITE — saving to dead-letter:",
        error
      );
      Sentry.captureException(error, {
        extra: { jobName: "CUSTOM_UMPIRE_INVITE", payload },
      });
      await saveToDeadLetter("notifications", "CUSTOM_UMPIRE_INVITE", payload);
      return false;
    }
  },

  /**
   * Universal Event Publisher
   * Dispatches an application event to the notification worker.
   * The worker will map the event to the appropriate email/wa/in-app templates.
   */
  async publishEvent(eventName, payload) {
    try {
      await notificationQueue.add("APP_EVENT", { eventName, payload });
      return true;
    } catch (error) {
      logger.error(
        `[Notification Service] Error queuing APP_EVENT (${eventName}) — saving to dead-letter:`,
        error
      );
      Sentry.captureException(error, {
        extra: { jobName: "APP_EVENT", eventName, payload },
      });
      await saveToDeadLetter("notifications", "APP_EVENT", {
        eventName,
        payload,
      });
      return false;
    }
  },
};

export default NotificationService;
