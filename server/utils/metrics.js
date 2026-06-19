import client from "prom-client";
import logger from "./logger.js";

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "kridaz-api",
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// ── HTTP Metrics ─────────────────────────────────────────────────────────────
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // seconds
});
register.registerMetric(httpRequestDurationMicroseconds);

// ── Socket Metrics ───────────────────────────────────────────────────────────
export const activeSocketConnections = new client.Gauge({
  name: "active_socket_connections_total",
  help: "Total number of active socket.io connections",
});
register.registerMetric(activeSocketConnections);

// ── Database Metrics ─────────────────────────────────────────────────────────
export const dbOperationDurationSeconds = new client.Histogram({
  name: "db_operation_duration_seconds",
  help: "Duration of database operations in seconds",
  labelNames: ["operation", "model"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});
register.registerMetric(dbOperationDurationSeconds);

// ── Queue Metrics ────────────────────────────────────────────────────────────
export const queueDepth = new client.Gauge({
  name: "queue_depth_total",
  help: "Number of jobs in BullMQ queues",
  labelNames: ["queue_name", "status"],
});
register.registerMetric(queueDepth);

// ── Business Metrics (KPIs) ──────────────────────────────────────────────────
export const bookingCreatedTotal = new client.Counter({
  name: "booking_created_total",
  help: "Total number of bookings created",
});
register.registerMetric(bookingCreatedTotal);

export const paymentTotal = new client.Counter({
  name: "payment_total",
  help: "Total number of payments processed",
  labelNames: ["status"], // success, failed
});
register.registerMetric(paymentTotal);

export const kridazBookingsTotal = new client.Counter({
  name: "kridaz_bookings_total",
  help: "Total number of kridaz bookings completed",
});
register.registerMetric(kridazBookingsTotal);

export const kridazWalletTopupsTotal = new client.Counter({
  name: "kridaz_wallet_topups_total",
  help: "Total number of successful wallet topups",
});
register.registerMetric(kridazWalletTopupsTotal);

export const kridazActiveUsers = new client.Gauge({
  name: "kridaz_active_users",
  help: "Total number of active users",
});
register.registerMetric(kridazActiveUsers);

// ── Granular Business Metrics (BMS-parity) ──────────────────────────────────
export const bookingConfirmedTotal = new client.Counter({
  name: "kridaz_booking_confirmed_total",
  help: "Total bookings confirmed (payment captured)",
  labelNames: ["payment_method"],
});
register.registerMetric(bookingConfirmedTotal);

export const bookingCancelledTotal = new client.Counter({
  name: "kridaz_booking_cancelled_total",
  help: "Total bookings cancelled",
  labelNames: ["reason", "refund_type"],
});
register.registerMetric(bookingCancelledTotal);

export const paymentSuccessTotal = new client.Counter({
  name: "kridaz_payment_success_total",
  help: "Total successful payments",
  labelNames: ["gateway", "type"],
});
register.registerMetric(paymentSuccessTotal);

export const paymentFailedTotal = new client.Counter({
  name: "kridaz_payment_failed_total",
  help: "Total failed payments",
  labelNames: ["gateway", "reason"],
});
register.registerMetric(paymentFailedTotal);

export const walletTopupTotal = new client.Counter({
  name: "kridaz_wallet_topup_total",
  help: "Total wallet topups",
});
register.registerMetric(walletTopupTotal);

export const userRegistrationTotal = new client.Counter({
  name: "kridaz_user_registration_total",
  help: "Total user registrations",
  labelNames: ["role", "method"],
});
register.registerMetric(userRegistrationTotal);

// ── Polling for Queue Depths ────────────────────────────────────────────────
const queues = {};

export const trackQueue = (name, queueInstance) => {
  queues[name] = queueInstance;
};

// Poller to update queue metrics every 30 seconds
let metricsInterval;
if (process.env.NODE_ENV !== "test") {
  metricsInterval = setInterval(async () => {
    for (const [name, queue] of Object.entries(queues)) {
      try {
        const counts = await queue.getJobCounts();
        queueDepth.set({ queue_name: name, status: "active" }, counts.active);
        queueDepth.set({ queue_name: name, status: "waiting" }, counts.waiting);
        queueDepth.set({ queue_name: name, status: "delayed" }, counts.delayed);
        queueDepth.set({ queue_name: name, status: "failed" }, counts.failed);
      } catch (error) {
        logger.error(
          `[METRICS] Error fetching counts for queue ${name}:`,
          error
        );
      }
    }
  }, 30000);
  if (metricsInterval && typeof metricsInterval.unref === "function") {
    metricsInterval.unref();
  }
}

export { register, metricsInterval };
export default client;
