import { Router } from "express";
import { handleSentryWebhook } from "./sentryWebhook.controller.js";

const router = Router();

// Endpoint for Sentry to POST alerts
// Unprotected because Sentry sends the webhook from outside
router.post("/sentry", handleSentryWebhook);

export default router;
