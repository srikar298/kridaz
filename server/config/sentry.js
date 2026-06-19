import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

import logger from "../utils/logger.js";

// Per-deploy release tag — wire it from CI (e.g. the commit SHA or a tag).
// Falls back to package version so local runs still group errors sanely.
// During the Flutter-integration refactor each wave should ship under its own
// release (e.g. SERVER_RELEASE=wave-1-auth) so we can pinpoint regressions.
const release =
  process.env.SERVER_RELEASE ||
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.RENDER_GIT_COMMIT ||
  `server@${process.env.npm_package_version || "unknown"}`;

export const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      release,
      integrations: [
        nodeProfilingIntegration(),
        Sentry.prismaIntegration(),
        Sentry.httpIntegration({ tracing: true }),
        Sentry.expressIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

      environment: process.env.NODE_ENV || "development",

      // Ignore some common noisey errors
      ignoreErrors: [
        "UnauthorizedError",
        "PrismaClientKnownRequestError", // Handle specific codes in logic
      ],
    });
    logger.info(
      `[SENTRY] Initialized (release=${release}, env=${process.env.NODE_ENV || "development"}).`
    );
  } else {
    if (process.env.NODE_ENV === "production") {
      logger.warn("[SENTRY] DSN not found. Sentry is disabled in production.");
    }
  }
};

export default Sentry;
