import { prisma } from "../config/prisma.js";
import logger from "./logger.js";
import * as Sentry from "@sentry/node";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Backfill playStartTime / playEndTime on older CONFIRMED bookings that were
 * created before the Phase 1 schema migration added those fields.
 */
const backfillPlayTimes = async () => {
  try {
    const stale = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        playStartTime: null,
        timeSlotId: { not: null },
      },
      include: { timeSlot: true },
    });

    if (stale.length === 0) return;

    logger.info(`[SETTLEMENT] Backfilling ${stale.length} legacy bookings...`);

    let count = 0;
    // We still need to update each booking since playStartTime varies per booking
    // but we saved the N lookups.
    for (const b of stale) {
      if (b.timeSlot) {
        await prisma.booking.update({
          where: { id: b.id },
          data: {
            playStartTime: b.timeSlot.startTime,
            playEndTime: b.timeSlot.endTime,
          },
        });
        count++;
      }
    }

    if (count > 0) {
      logger.info(`[SETTLEMENT] Backfilled playStartTime on ${count} legacy bookings.`);
    }
  } catch (err) {
    logger.error("[SETTLEMENT] Backfill error", err);
    Sentry.captureException(err, { tags: { job: "backfillPlayTimes" } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase A — CONFIRMED → PLAYING → IN_REVIEW_WINDOW
// Runs every 5 minutes.
// ─────────────────────────────────────────────────────────────────────────────
export const runPlayingTransition = async () => {
  const now = new Date();

  // ── Step 1: CONFIRMED → PLAYING ──────────────────────────────────────────
  try {
    const result = await prisma.booking.updateMany({
      where: {
        status: "CONFIRMED",
        playStartTime: { lte: now },
      },
      data: { status: "PLAYING" },
    });

    if (result.count > 0) {
      logger.info(`[SETTLEMENT] Phase A-1: ${result.count} booking(s) → PLAYING`);
    }
  } catch (err) {
    logger.error("[SETTLEMENT] Phase A-1 error:", err);
    Sentry.captureException(err, { tags: { job: "runPlayingTransition_Phase1" } });
  }

  // ── Step 2: PLAYING → IN_REVIEW_WINDOW ───────────────────────────────────
  try {
    const playingBookings = await prisma.booking.findMany({
      where: {
        status: "PLAYING",
        playEndTime: { lte: now },
      },
      include: {
        turf: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (playingBookings.length === 0) return;

    const reviewWindowEndsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      const ownerBalanceChanges = new Map();
      const bookingIds = playingBookings.map(b => b.id);

      for (const booking of playingBookings) {
        if (!booking.turf?.owner) continue;

        const ownerRevenue = booking.ownerRevenue || booking.totalPrice;
        const ownerId = booking.turf.owner.id;

        // Group balance updates
        const current = ownerBalanceChanges.get(ownerId) || { pending: 0, inProgress: 0 };
        ownerBalanceChanges.set(ownerId, {
          pending: current.pending - ownerRevenue,
          inProgress: current.inProgress + ownerRevenue
        });
      }

      // 1. Bulk Update Owner Balances
      for (const [ownerId, changes] of ownerBalanceChanges.entries()) {
        await tx.ownerProfile.update({
          where: { id: ownerId },
          data: {
            pendingBalance: { increment: changes.pending },
            inProgressBalance: { increment: changes.inProgress },
          },
        });
      }

      // 2. Bulk Update Bookings
      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: {
          status: "IN_REVIEW_WINDOW",
          revenueStatus: "IN_PROGRESS",
          reviewWindowEndsAt,
        },
      });
    });

    logger.info(`[SETTLEMENT] Phase A-2: ${playingBookings.length} booking(s) → IN_REVIEW_WINDOW`);
  } catch (err) {
    logger.error("[SETTLEMENT] Phase A-2 error:", err);
    Sentry.captureException(err, { tags: { job: "runPlayingTransition_Phase2" } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase B — IN_REVIEW_WINDOW → COMPLETED  (auto-settle)
// Runs every 15 minutes.
// ─────────────────────────────────────────────────────────────────────────────
export const runAutoSettle = async () => {
  const now = new Date();

  try {
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        status: "IN_REVIEW_WINDOW",
        revenueStatus: "IN_PROGRESS",
        reviewWindowEndsAt: { lte: now },
      },
      include: {
        turf: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (eligibleBookings.length === 0) return;

    await prisma.$transaction(async (tx) => {
      const ownerBalanceChanges = new Map();
      const walletTransactions = [];
      const bookingIds = eligibleBookings.map(b => b.id);

      for (const booking of eligibleBookings) {
        if (!booking.turf?.owner) continue;

        const ownerRevenue = booking.ownerRevenue || booking.totalPrice;
        const ownerId = booking.turf.owner.id;
        const userId = booking.turf.owner.userId;

        // Group balance updates
        const current = ownerBalanceChanges.get(ownerId) || { inProgress: 0, wallet: 0 };
        ownerBalanceChanges.set(ownerId, {
          inProgress: current.inProgress - ownerRevenue,
          wallet: current.wallet + ownerRevenue
        });

        // Collect wallet transactions for bulk create
        walletTransactions.push({
          userId: userId,
          amount: ownerRevenue,
          type: "SETTLEMENT",
          status: "SUCCESS",
          description: `Auto-settled: booking #${booking.id.slice(-6).toUpperCase()} at ${booking.turf?.name || "Ground"}`,
          bookingId: booking.id,
        });
      }

      // 1. Bulk Update Owner Balances
      for (const [ownerId, changes] of ownerBalanceChanges.entries()) {
        await tx.ownerProfile.update({
          where: { id: ownerId },
          data: {
            inProgressBalance: { increment: changes.inProgress },
            walletBalance: { increment: changes.wallet },
          },
        });
      }

      // 2. Bulk Create Wallet Transactions
      if (walletTransactions.length > 0) {
        await tx.walletTransaction.createMany({
          data: walletTransactions
        });
      }

      // 3. Bulk Update Bookings
      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: {
          status: "COMPLETED",
          revenueStatus: "SETTLED",
          settledAt: now,
        },
      });
    });

    logger.info(`[SETTLEMENT] Phase B: Auto-settled ${eligibleBookings.length} booking(s) ✓`);
  } catch (err) {
    logger.error("[SETTLEMENT] Phase B error:", err);
    Sentry.captureException(err, { tags: { job: "runAutoSettle" } });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy compatibility shim
// Handles any remaining bookings that were settled under the old 12-hour flow
// ─────────────────────────────────────────────────────────────────────────────
const runLegacySettlement = async () => {
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  try {
    const legacyBookings = await prisma.booking.findMany({
      where: {
        revenueStatus: "PENDING",
        status: { in: ["CONFIRMED", "COMPLETED"] },
        playStartTime: null,
      },
      include: {
        timeSlot: true,
        turf: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (legacyBookings.length === 0) return;

    let legacyCount = 0;
    await prisma.$transaction(async (tx) => {
      const ownerBalanceChanges = new Map();
      const walletTransactions = [];
      const eligibleBookingIds = [];

      for (const booking of legacyBookings) {
        if (!booking.timeSlot?.endTime || !booking.turf?.owner) continue;
        if (new Date(booking.timeSlot.endTime) > twelveHoursAgo) continue;

        const amount = booking.ownerRevenue || booking.totalPrice;
        const ownerId = booking.turf.owner.id;
        const userId = booking.turf.owner.userId;

        eligibleBookingIds.push(booking.id);

        const current = ownerBalanceChanges.get(ownerId) || { pending: 0, wallet: 0 };
        ownerBalanceChanges.set(ownerId, {
          pending: current.pending - amount,
          wallet: current.wallet + amount
        });

        walletTransactions.push({
          userId: userId,
          amount,
          type: "SETTLEMENT",
          status: "SUCCESS",
          description: `Legacy settlement: booking #${booking.id.slice(-6).toUpperCase()}`,
          bookingId: booking.id,
        });
      }

      // 1. Bulk Update Owner Balances
      for (const [ownerId, changes] of ownerBalanceChanges.entries()) {
        await tx.ownerProfile.update({
          where: { id: ownerId },
          data: {
            pendingBalance: { increment: changes.pending },
            walletBalance: { increment: changes.wallet },
          },
        });
      }

      // 2. Bulk Create Wallet Transactions
      if (walletTransactions.length > 0) {
        await tx.walletTransaction.createMany({
          data: walletTransactions
        });
      }

      // 3. Bulk Update Bookings
      await tx.booking.updateMany({
        where: { id: { in: eligibleBookingIds } },
        data: {
          status: "COMPLETED",
          revenueStatus: "SETTLED",
          settledAt: new Date(),
        },
      });

      legacyCount = eligibleBookingIds.length;
    });

    if (legacyCount > 0) {
      logger.info(`[SETTLEMENT] Legacy: settled ${legacyCount} old booking(s) ✓`);
    }
  } catch (err) {
    logger.error("[SETTLEMENT] Legacy settlement error", err);
    Sentry.captureException(err, { tags: { job: "runLegacySettlement" } });
  }
};

import { redisClient as redis } from "../config/redis.js";

// ─────────────────────────────────────────────────────────────────────────────
// Entry point — called from server.js after DB connects
// ─────────────────────────────────────────────────────────────────────────────
export const initSettlementWorker = () => {
  logger.info("[SETTLEMENT] Initializing settlement worker...");

  // One-time backfill for pre-migration bookings
  backfillPlayTimes();

  // Startup run — guarded by a 2-minute Redis lock
  const lockKey = 'kridaz:settlement:startup:lock';
  redis.set(lockKey, '1', 'EX', 120, 'NX').then((result) => {
    if (result === 'OK') {
      logger.info('[SETTLEMENT] Startup lock acquired. Running immediate jobs...');
      runPlayingTransition();
      runAutoSettle();
      runLegacySettlement();
    } else {
      logger.info('[SETTLEMENT] Startup lock already held. Skipping immediate run.');
    }
  }).catch((err) => {
    logger.warn(`[SETTLEMENT] Redis lock failed. Running immediate jobs anyway.`, err);
    runPlayingTransition();
    runAutoSettle();
    runLegacySettlement();
  });

  logger.info('[SETTLEMENT] Worker functions ready. Scheduling handled by BullMQ.');
};
