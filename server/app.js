import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { prisma } from "./config/prisma.js";
import { redisClient } from "./config/redis.js";
import rootRouter from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { requestId } from "./middleware/requestId.middleware.js";
import {
  authLimiter,
  otpLimiter,
  paymentLimiter,
  refreshLimiter,
  globalLimiter,
} from "./middleware/rateLimiter.middleware.js";

dotenv.config(); // Hot-reload trigger for route alias updates

// Server build identifiers — surfaced on every response so the mobile client
// can flag stale binaries. SERVER_RELEASE comes from CI (commit SHA / wave tag).
// MIN_CLIENT_VERSION is the lowest mobile build we still serve; mobile shows
// a "please update" screen when its build < this.
const SERVER_VERSION =
  process.env.SERVER_RELEASE ||
  `server@${process.env.npm_package_version || "unknown"}`;
const MIN_CLIENT_VERSION = process.env.MIN_CLIENT_VERSION || "0.0.0";

const app = express();
// CORP "cross-origin" lets the Flutter web prod build pull any assets we
// serve over `<img>`/`<link>` without bumping into the default "same-origin"
// policy helmet ships with. The real assets are Cloudinary, but anything we
// host directly (PDFs, QR codes) would otherwise block.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Gzip responses above 1 KB. Big win on metered mobile connections (JSON
// payloads compress 70–85%). Below 1 KB the CPU cost outweighs the bytes
// saved. Cloudinary URLs are served from Cloudinary directly so we don't
// double-compress.
app.use(compression({ threshold: 1024 }));

app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(requestId);

// Version headers on every response. Mobile clients log these on errors to
// correlate with a specific server release in Sentry, and watch
// Min-Client-Version to prompt for app updates.
app.use((req, res, next) => {
  res.setHeader("Server-Version", SERVER_VERSION);
  res.setHeader("Min-Client-Version", MIN_CLIENT_VERSION);
  next();
});

import requestLogger from "./middleware/requestLogger.middleware.js";
app.use(requestLogger);
import { requestTimeout } from "./middleware/requestTimeout.middleware.js";
app.use(requestTimeout(30_000));

// Serve static files from the public directory
import path from "path";
app.use(express.static(path.join(process.cwd(), "public")));

const defaultOrigins = [
  "http://localhost:5174",
  "https://kridaz.vercel.app",
  "http://localhost",
  "https://localhost",
  "capacitor://localhost",
];
const allowedOrigins = process.env.CLIENT_URLS
  ? [
      ...process.env.CLIENT_URLS.split(",").map((url) => url.trim()),
      "http://localhost",
      "https://localhost",
      "capacitor://localhost",
    ]
  : defaultOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

import { register } from "./utils/metrics.js";

app.get("/metrics", async (req, res, next) => {
  if (req.headers.authorization !== `Bearer ${process.env.METRICS_SECRET}`) {
    return res.status(401).end("Unauthorized");
  }
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Capture and resolve frontend web-vitals observability reports
app.all("/api/metrics/vitals", (req, res) => {
  res.status(204).end();
});

// ── Rate Limiters ─────────────────────────────────────────────────────────────â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Global â€” all /api routes (health check excluded via skip in the middleware)
app.use("/api", globalLimiter);

// Auth routes â€” user
app.use("/api/user/auth/send-otp", otpLimiter);
app.use("/api/user/auth/login-step1", authLimiter);
app.use("/api/user/auth/login", authLimiter);
app.use("/api/user/auth/register", authLimiter);
app.use("/api/user/auth/google-auth", authLimiter); // Google Auth usually handles its own bot protection
app.use("/api/user/auth/forgot-password-otp", authLimiter);
app.use("/api/user/auth/reset-password", authLimiter);
app.use("/api/user/auth/refresh", refreshLimiter);

// Auth routes â€” owner
app.use("/api/owner/auth/send-otp", otpLimiter);
app.use("/api/owner/auth/login-step1", authLimiter);
app.use("/api/owner/auth/login", authLimiter);
app.use("/api/owner/auth/register", authLimiter);
app.use("/api/owner/auth/google-auth", authLimiter);
app.use("/api/owner/auth/refresh", refreshLimiter);

// Payment routes â€” user bookings
app.use("/api/user/booking/create-order", paymentLimiter);
app.use("/api/user/booking/verify-payment", paymentLimiter);
app.use("/api/user/booking/book-with-wallet", paymentLimiter);

// Payment routes â€” user wallet top-up
app.use("/api/user/wallet/topup/create-order", paymentLimiter);
app.use("/api/user/wallet/topup/verify", paymentLimiter);

// Payment routes â€” owner banking & wallet
app.use("/api/owner/banking/payout", paymentLimiter);
app.use("/api/owner/wallet/withdraw", paymentLimiter);

// routes
app.use("/api", rootRouter);

// Health check route
//
// The app runs on Prisma + Redis. Earlier this endpoint checked
// mongoose.connection.readyState — Mongoose isn't even initialized here, so it
// always reported "Disconnected". Now it actually probes both backing stores
// in parallel and returns 503 when either fails so uptime monitors are honest.
app.get("/api/health", async (req, res) => {
  const [dbResult, redisResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redisClient.ping(),
  ]);

  const db = dbResult.status === "fulfilled" ? "ok" : "fail";
  const redis = redisResult.status === "fulfilled" ? "ok" : "fail";
  const ok = db === "ok" && redis === "ok";

  res.status(ok ? 200 : 503).json({
    status: ok ? "OK" : "DEGRADED",
    db,
    redis,
    timestamp: new Date().toISOString(),
  });
});

// Version endpoint.
//
// Mobile bootstrap calls this on launch to decide whether to show the update
// gate. Server-Version + Min-Client-Version are also echoed as headers on
// every response — the body is the authoritative copy.
app.get("/api/version", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      server: SERVER_VERSION,
      minSupportedClient: MIN_CLIENT_VERSION,
    },
  });
});

// Server-clock endpoint.
//
// Mobile clients must not trust the device clock for sync-window math (jet lag,
// time-travel debug, OS skew). This is the canonical "now" they reconcile
// against. Returns ms-precision UTC.
app.get("/api/sync/clock", (req, res) => {
  res
    .status(200)
    .json({ success: true, data: { now: new Date().toISOString() } });
});

app.get("/", (req, res) => {
  res.send("Kridaz API is running");
});

import * as Sentry from "@sentry/node";

// Error handling
app.use(notFound);

// Sentry error handler (must be after controllers but before other error middleware)
Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

export default app;
