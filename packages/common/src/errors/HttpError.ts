/**
 * Base HTTP error class. All typed errors extend this.
 * Preserves subclass name in logs via new.target.name.
 *
 * `meta` carries structured context: a stable machine-readable `code` for
 * clients, optional field-level details for validation, etc. Stored as-is
 * and surfaced by the error middleware.
 */
export class HttpError extends Error {
  statusCode: number;
  meta: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    meta: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.meta = meta;
    if (typeof (Error as any).captureStackTrace === "function") {
      (Error as any).captureStackTrace(this, new.target);
    }
  }
}

/** 400 — malformed request body or invalid parameters */
export class BadRequestError extends HttpError {
  constructor(msg = "Bad Request", meta: Record<string, unknown> = {}) {
    super(400, msg, meta);
  }
}

/** 401 — missing or invalid auth token */
export class UnauthorizedError extends HttpError {
  constructor(msg = "Unauthorized", meta: Record<string, unknown> = {}) {
    super(401, msg, meta);
  }
}

/** 403 — authenticated but not allowed */
export class ForbiddenError extends HttpError {
  constructor(msg = "Forbidden", meta: Record<string, unknown> = {}) {
    super(403, msg, meta);
  }
}

/** 404 — resource does not exist */
export class NotFoundError extends HttpError {
  constructor(msg = "Not Found", meta: Record<string, unknown> = {}) {
    super(404, msg, meta);
  }
}

/** 409 — resource already exists or state conflict */
export class ConflictError extends HttpError {
  constructor(msg = "Conflict", meta: Record<string, unknown> = {}) {
    super(409, msg, meta);
  }
}

/** 422 — validation failed (use meta for field-level errors) */
export class UnprocessableError extends HttpError {
  constructor(msg = "Validation Failed", meta: Record<string, unknown> = {}) {
    super(422, msg, meta);
  }
}

/** 429 — rate limit exceeded */
export class TooManyRequestsError extends HttpError {
  constructor(msg = "Too Many Requests", meta: Record<string, unknown> = {}) {
    super(429, msg, meta);
  }
}

/** 500 — unexpected server error */
export class InternalError extends HttpError {
  constructor(
    msg = "Internal Server Error",
    meta: Record<string, unknown> = {}
  ) {
    super(500, msg, meta);
  }
}
