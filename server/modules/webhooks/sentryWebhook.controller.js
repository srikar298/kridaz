import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";

export const handleSentryWebhook = async (req, res) => {
  try {
    const payload = req.body;
    logger.info("Received Sentry Webhook payload");

    // Basic extraction from Sentry's Issue Webhook format
    // https://docs.sentry.io/product/integrations/integration-platform/webhooks/issue-alerts/

    // We check if this is an issue alert ('triggered') or an issue webhook ('created')
    if (
      payload.action === "triggered" ||
      payload.action === "created" ||
      payload.data?.issue ||
      payload.data?.event ||
      payload.data?.error
    ) {
      const issue = payload.data?.issue || {};
      const event = payload.data?.event || payload.data?.error || {};

      const errorMessage =
        issue.title || event?.title || event?.message || "Unknown Error";
      const level = issue.level || event?.level || "error";
      const sentryUrl =
        issue.permalink || event?.web_url || "https://sentry.io";

      const newAlert = await prisma.sentryAlert.create({
        data: {
          errorMessage,
          level,
          sentryUrl,
        },
      });

      logger.info(`Sentry alert logged in database: ${newAlert.id}`);
    } else {
      logger.info(
        "Webhook payload did not match an issue/error event or was just a test ping."
      );
    }

    return res.status(200).json({ success: true, message: "Webhook received" });
  } catch (error) {
    logger.error("Error handling Sentry webhook:", error);
    // Always return 200 to Sentry so they don't disable the webhook, even if our parsing fails
    return res
      .status(200)
      .json({ success: false, message: "Internal processing error" });
  }
};
