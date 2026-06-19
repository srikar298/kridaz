import axios from "axios";
import logger from "../utils/logger.js";

/**
 * Middleware to validate Cloudflare Turnstile token.
 * Prevents automated bot submissions on sensitive endpoints (Login, Register).
 */
export const verifyTurnstile = async (req, res, next) => {
  // Skip Turnstile in non-production or if secret key is missing (for local dev)
  if (
    process.env.NODE_ENV !== "production" ||
    !process.env.TURNSTILE_SECRET_KEY
  ) {
    return next();
  }

  const token =
    req.body["cf-turnstile-response"] || req.headers["x-turnstile-token"];

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Bot protection token is missing. Please try again.",
    });
  }

  try {
    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: req.ip,
      })
    );

    if (response.data.success) {
      return next();
    } else {
      logger.warn("[TURNSTILE] Validation failed", {
        errorCodes: response.data["error-codes"],
      });
      return res.status(403).json({
        success: false,
        message:
          "Security verification failed. Please refresh the page and try again.",
        errorCodes: response.data["error-codes"],
      });
    }
  } catch (error) {
    logger.error("[TURNSTILE] Error verifying token", error);
    // On network error with Cloudflare, we fail open only if strictly necessary,
    // but here we fail closed for security on auth routes.
    return res.status(500).json({
      success: false,
      message: "Verification service error. Please try again later.",
    });
  }
};
