import { Worker } from "bullmq";
import { bullmqConnection as connection } from "../config/redis.js";
import logger from "../utils/logger.js";
import {
  sendWhatsAppMessage,
  notifyNewGame,
  sendCustomPlayerInvite,
  sendCustomUmpireInvite,
  sendSMSMessage,
} from "../utils/notification.service.js";
import generateEmail from "../utils/generateEmail.js";
import { notifyAdmins } from "../utils/notificationHelper.js";
import { processInAppNotification } from "../services/notification.dispatcher.js";

/**
 * Worker to process notification jobs
 */
const worker = new Worker(
  "notifications",
  async (job) => {
    const { name, data } = job;
    logger.info(`[Notification Worker] Processing job: ${name} (${job.id})`);

    try {
      switch (name) {
        case "SEND_OTP": {
          const {
            phone,
            email,
            otp,
            type,
            phoneTemplate,
            emailSubject,
            emailHtml,
            deliveryMethod,
          } = data;

          logger.info(
            `[Notification Worker - SEND_OTP] Start sending OTP to ${phone || email} at ${new Date().toISOString()}`
          );
          const promises = [];
          if (email && emailSubject && emailHtml) {
            promises.push(generateEmail(email, emailSubject, emailHtml));
          }
          if (phone) {
            if (deliveryMethod === "sms") {
              logger.info(
                `[Notification Worker - SEND_OTP] Initiating SMS delivery for ${phone}`
              );
              promises.push(sendSMSMessage(phone, otp));
            } else {
              logger.info(
                `[Notification Worker - SEND_OTP] Initiating WhatsApp & SMS delivery concurrently for ${phone}`
              );
              promises.push(sendSMSMessage(phone, otp)); // Force SMS as well to guarantee delivery
              const waPromise = async () => {
                let waSuccess = false;
                if (phoneTemplate) {
                  waSuccess = await sendWhatsAppMessage(
                    phone,
                    "",
                    phoneTemplate,
                    [otp]
                  );
                } else {
                  waSuccess = await sendWhatsAppMessage(
                    phone,
                    `Your Kridaz verification code is: ${otp}`
                  );
                }

                if (!waSuccess) {
                  logger.warn(
                    `[OTP - FALLBACK] WhatsApp delivery API call failed for ${phone}.`
                  );
                } else {
                  logger.info(
                    `[OTP] WhatsApp API queued successfully for ${phone} at ${new Date().toISOString()}.`
                  );
                }
              };
              promises.push(waPromise());
            }
          }
          await Promise.all(promises);
          logger.info(
            `[Notification Worker - SEND_OTP] Completed sending OTP to ${phone || email} at ${new Date().toISOString()}`
          );
          break;
        }

        case "ADMIN_ALERT": {
          const { title, message, type, link, metadata } = data;
          await notifyAdmins({ title, message, type, link, metadata });
          break;
        }

        case "IN_APP_NOTIF": {
          await processInAppNotification(data);
          break;
        }

        case "SEND_EMAIL": {
          const { to, subject, html, attachments } = data;
          await generateEmail(to, subject, html, attachments);
          break;
        }

        case "SEND_WHATSAPP": {
          const { phone, message, templateName, params } = data;
          await sendWhatsAppMessage(phone, message, templateName, params);
          break;
        }

        case "NOTIFY_NEW_GAME": {
          const { game, host } = data;
          await notifyNewGame(game, host);
          break;
        }

        case "CUSTOM_PLAYER_INVITE": {
          const { customPlayer, game, host } = data;
          await sendCustomPlayerInvite(customPlayer, game, host);
          break;
        }

        case "CUSTOM_UMPIRE_INVITE": {
          const { customUmpire, game, host } = data;
          await sendCustomUmpireInvite(customUmpire, game, host);
          break;
        }

        case "PRO_OFFER_EXPIRY": {
          const { bookingId, notificationId } = data;
          const { DispatchService } =
            await import("../services/dispatch.service.js");
          await DispatchService.handleOfferExpiry(bookingId, notificationId);
          break;
        }

        case "APP_EVENT": {
          const { eventName, payload } = data;
          const { getTemplatesForEvent } =
            await import("../utils/notification.templates.js");

          const templates = getTemplatesForEvent(eventName, payload);
          if (!templates) break;

          const promises = [];

          // 1. Email
          if (templates.email && payload.email) {
            promises.push(
              generateEmail(
                payload.email,
                templates.email.subject || "Kridaz Notification",
                templates.email.html,
                payload.attachments
              )
            );
          }

          // 2. WhatsApp
          if (templates.wa && payload.phone) {
            promises.push(
              sendWhatsAppMessage(
                payload.phone,
                templates.wa.message,
                templates.wa.template,
                templates.wa.params
              )
            );
          }

          // 3. In-App Notification
          if (
            templates.inApp &&
            payload.recipientId &&
            payload.recipientModel
          ) {
            promises.push(
              processInAppNotification({
                recipientId: payload.recipientId,
                recipientModel: payload.recipientModel,
                title: templates.inApp.title,
                message: templates.inApp.message,
                type: templates.inApp.type || "SYSTEM",
                link: templates.inApp.link || "",
              })
            );
          }

          await Promise.allSettled(promises);
          break;
        }

        default:
          logger.warn(`[Notification Worker] Unknown job type: ${name}`);
      }

      logger.info(
        `[Notification Worker] Job ${job.id} (${name}) completed successfully.`
      );
    } catch (error) {
      logger.error(
        `[Notification Worker] Job ${job.id} (${name}) failed:`,
        error
      );
      throw error; // Re-throw to trigger BullMQ retry
    }
  },
  { connection, concurrency: 5 }
);

worker.on("failed", (job, err) => {
  logger.error(
    `[Notification Worker] Job ${job?.id} failed after all retries:`,
    err
  );
});

export default worker;
