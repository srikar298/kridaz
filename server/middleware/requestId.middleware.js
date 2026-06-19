import { randomUUID } from "crypto";

/**
 * Per-request correlation ID.
 *
 * Accepts an inbound X-Request-Id (e.g. from an API gateway / mobile client)
 * so traces can be stitched across systems, else generates a UUID. Surfaces
 * the value at res.locals.requestId for downstream middleware (errors,
 * logger, Sentry) and echoes it as a response header so clients can log it
 * alongside failures and quote it in support tickets.
 *
 * Must be registered before any middleware that wants to read the ID
 * (logger, error handler, Sentry scope).
 */
export const requestId = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  const id =
    typeof incoming === "string" &&
    incoming.length > 0 &&
    incoming.length <= 200
      ? incoming
      : randomUUID();
  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
};
