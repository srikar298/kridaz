import winston from "winston";
import "winston-daily-rotate-file";
import { AsyncLocalStorage } from "async_hooks";

// Storage for request-scoped metadata (like requestId)
export const logStorage = new AsyncLocalStorage();

const sensitiveFields = [
  "password",
  "token",
  "otp",
  "emailOtp",
  "accessToken",
  "refreshToken",
  "secret",
  "authorization",
  "pin",
  "cvv",
];

/**
 * Winston format to recursively redact sensitive fields from log objects.
 */
const redactFormat = winston.format((info) => {
  const redact = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;
    if (obj instanceof Error) return obj; // Errors are handled by errors() format

    const newObj = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        newObj[key] = "[REDACTED]";
      } else if (typeof obj[key] === "object") {
        newObj[key] = redact(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  };

  const redactedInfo = redact(info);

  // Re-attach timestamp and level which might have been lost if they were top-level but handled as "object"
  redactedInfo.timestamp = info.timestamp;
  redactedInfo.level = info.level;
  redactedInfo.message = info.message;

  // Inject Request ID from AsyncLocalStorage if available
  const store = logStorage.getStore();
  if (store?.requestId) {
    redactedInfo.requestId = store.requestId;
  }

  return redactedInfo;
});

const safeStringify = (obj) => {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        return "[Circular]";
      }
      cache.add(value);
    }
    return value;
  });
};

/**
 * Development format: Human-readable, colorized, with RequestID prefix.
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    ({ timestamp, level, message, stack, requestId, ...meta }) => {
      const reqIdStr = requestId ? `\x1b[36m[${requestId}]\x1b[0m ` : "";
      const metaStr = Object.keys(meta).length ? ` ${safeStringify(meta)}` : "";
      return `${timestamp} ${level}: ${reqIdStr}${message}${stack ? `\n${stack}` : ""}${metaStr}`;
    }
  )
);

/**
 * Production format: Structured JSON.
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  redactFormat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  defaultMeta: { service: "kridaz-api" },
  silent: process.env.NODE_ENV === "test",
  transports: [
    new winston.transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d",
      zippedArchive: true,
    }),
    new winston.transports.DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
    }),
  ],
});

// Always log to console
logger.add(
  new winston.transports.Console({
    format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  })
);

export default logger;
