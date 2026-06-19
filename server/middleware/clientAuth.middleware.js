import crypto from "crypto";
import logger from "../utils/logger.js";

const HMAC_SECRET =
  process.env.CLIENT_HMAC_SECRET ||
  "kridaz_fallback_secret_change_in_production";
// 5 minutes max clock skew allowed
const MAX_SKEW_MS = 5 * 60 * 1000;

export const requireClientAuth = (req, res, next) => {
  // Allow OPTIONS preflight requests to pass through
  if (req.method === "OPTIONS") return next();

  // Exclude third-party webhooks from client auth
  // E.g., if Razorpay or Stripe sends webhooks to /api/user/payment/webhook
  if (
    req.originalUrl.includes("/webhook") ||
    req.originalUrl.includes("/stripe") ||
    req.originalUrl.includes("/razorpay")
  ) {
    return next();
  }

  const signature = req.headers["x-kridaz-signature"];
  const timestamp = req.headers["x-kridaz-timestamp"];

  if (!signature || !timestamp) {
    logger.warn(
      `Missing HMAC headers from IP: ${req.ip} for path: ${req.originalUrl}`
    );
    return res.status(403).json({
      success: false,
      message: "Unauthorized client. Signature missing.",
    });
  }

  // 1. Prevent Replay Attacks (Check timestamp window)
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid timestamp format." });
  }

  const currentTime = Date.now();
  if (Math.abs(currentTime - requestTime) > MAX_SKEW_MS) {
    logger.warn(`Replay attack prevented or clock out of sync. IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: "Request expired. Timestamp outside acceptable window.",
    });
  }

  // 2. Reconstruct the Signature Payload
  // Format: HTTP_METHOD:URL_PATH:TIMESTAMP:BODY_HASH

  // Hash the raw body if it exists, otherwise use empty string
  let bodyHash = "";
  if (req.rawBody && req.rawBody.length > 0) {
    bodyHash = crypto.createHash("sha256").update(req.rawBody).digest("hex");
  }

  const payload = `${req.method.toUpperCase()}:${req.originalUrl}:${timestamp}:${bodyHash}`;

  // 3. Compute Expected Signature
  const expectedSignature = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(payload)
    .digest("hex");

  // 4. Constant-Time Comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(signature);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      logger.warn(`HMAC Signature mismatch from IP: ${req.ip}`);
      console.log("--- HMAC DEBUG ---");
      console.log("Method:", req.method.toUpperCase());
      console.log("Original URL:", req.originalUrl);
      console.log("Timestamp:", timestamp);
      console.log("Body Hash:", bodyHash);
      console.log("Server Payload:", payload);
      console.log("Server Expected Sig:", expectedSignature);
      console.log("Client Provided Sig:", signature);
      console.log("------------------");
      return res.status(403).json({
        success: false,
        message: "Invalid signature. Client unauthorized.",
      });
    }
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, message: "Invalid signature format." });
  }

  // Signature is valid!
  next();
};
