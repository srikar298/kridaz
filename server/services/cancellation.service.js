import { prisma } from "../config/prisma.js";
import { WalletBlockingService } from "./walletBlocking.service.js";
import { TrustScoreLedgerService } from "./trustScore.service.js";
import logger from "../utils/logger.js";
import { bookingCancelledTotal } from "../utils/metrics.js";

/**
 * CancellationService
 * Implements cancellation rules and refunds for on-demand bookings.
 */
export class CancellationService {
  /**
   * Cancel an on-demand professional booking.
   * @param {string} bookingId - ID of the OnDemandProfessionalBooking
   * @param {string} actorType - Who cancelled the booking ('USER' or 'PROFESSIONAL')
   */
  static async cancelBooking(bookingId, actorType) {
    try {
      const booking = await prisma.onDemandProfessionalBooking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status !== "CONFIRMED") {
        throw new Error(
          `Only CONFIRMED bookings can be cancelled. Current status: ${booking.status}`
        );
      }

      const matchStartTime = new Date(booking.matchStartTime);
      const now = new Date();
      const diffMs = matchStartTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const blockedAmt = Number(booking.blockedAmount);

      if (actorType === "USER") {
        await prisma.$transaction(async (tx) => {
          if (diffHours > 72) {
            // User Cancellation > 72h: 100% Refund, 0% Pro, 0% Platform
            await WalletBlockingService.releaseBlockedFunds(
              booking.userId,
              bookingId,
              blockedAmt,
              false,
              tx
            );

            await tx.onDemandProfessionalBooking.update({
              where: { id: bookingId },
              data: { status: "CANCELLED_BY_USER" },
            });
            logger.info(
              `[CancellationService] Booking ${bookingId} cancelled by USER > 72h before start. 100% Refund.`
            );
            bookingCancelledTotal.inc({
              reason: "USER_INITIATED",
              refund_type: "FULL",
            });
          } else if (diffHours >= 48 && diffHours <= 72) {
            // User Cancellation 48h - 72h: 50% Refund, 0% Pro, 50% Platform fee
            const platformFee = blockedAmt * 0.5;
            const refundAmount = blockedAmt * 0.5;

            const wallet = await tx.wallet.findUnique({
              where: { userId: booking.userId },
            });
            await tx.wallet.update({
              where: { userId: booking.userId },
              data: {
                reservedBalance: { decrement: blockedAmt },
                balance: { decrement: platformFee }, // Deduct 50% as fee
              },
            });

            // Transaction log for user debit (50% fee)
            await tx.walletTransaction.create({
              data: {
                userId: booking.userId,
                walletId: wallet.id,
                amount: platformFee,
                type: "DEBIT",
                status: "SUCCESS",
                description: `DEBIT: Platform cancellation fee (50%) for booking: ${bookingId}`,
              },
            });

            // Transaction log for user refund (50% refund)
            await tx.walletTransaction.create({
              data: {
                userId: booking.userId,
                walletId: wallet.id,
                amount: refundAmount,
                type: "REFUND",
                status: "SUCCESS",
                description: `REFUND: Partial refund (50%) on user cancellation for booking: ${bookingId}`,
              },
            });

            await tx.onDemandProfessionalBooking.update({
              where: { id: bookingId },
              data: { status: "CANCELLED_BY_USER" },
            });
            logger.info(
              `[CancellationService] Booking ${bookingId} cancelled by USER 48-72h. 50% Refund, 50% Platform Fee.`
            );
            bookingCancelledTotal.inc({
              reason: "USER_INITIATED",
              refund_type: "PARTIAL",
            });
          } else {
            // User Cancellation < 48h: 0% Refund, 10% Pro, 90% Platform fee
            const platformFee = blockedAmt * 0.9;
            const proPayout = blockedAmt * 0.1;

            const wallet = await tx.wallet.findUnique({
              where: { userId: booking.userId },
            });
            await tx.wallet.update({
              where: { userId: booking.userId },
              data: {
                reservedBalance: { decrement: blockedAmt },
                balance: { decrement: blockedAmt }, // Fully debited
              },
            });

            // Transaction log for user debit (100% loss)
            await tx.walletTransaction.create({
              data: {
                userId: booking.userId,
                walletId: wallet.id,
                amount: blockedAmt,
                type: "DEBIT",
                status: "SUCCESS",
                description: `DEBIT: 100% cancellation fee for booking: ${bookingId}`,
              },
            });

            // Credit 10% payout to professional
            await tx.ownerProfile.update({
              where: { id: booking.professionalId },
              data: {
                walletBalance: { increment: proPayout },
              },
            });

            await tx.onDemandProfessionalBooking.update({
              where: { id: bookingId },
              data: { status: "CANCELLED_BY_USER" },
            });
            logger.info(
              `[CancellationService] Booking ${bookingId} cancelled by USER < 48h. 0% Refund, 10% Pro Payout, 90% Platform Fee.`
            );
            bookingCancelledTotal.inc({
              reason: "USER_INITIATED",
              refund_type: "NONE",
            });
          }
        });
      } else if (actorType === "PROFESSIONAL") {
        if (diffHours < 72) {
          throw new Error(
            "Cancellation Blocked: Professionals cannot cancel within 72 hours of match start."
          );
        }

        // Professional Cancellation > 72h: Allowed. Full refund to user, deduct -0.5 trust score.
        await prisma.$transaction(async (tx) => {
          await WalletBlockingService.releaseBlockedFunds(
            booking.userId,
            bookingId,
            blockedAmt,
            false,
            tx
          );

          await tx.onDemandProfessionalBooking.update({
            where: { id: bookingId },
            data: { status: "CANCELLED_BY_PRO" },
          });

          await TrustScoreLedgerService.recordEvent(
            booking.professionalId,
            "CANCEL_OVER_72",
            -0.5,
            bookingId,
            "Cancelled booking > 72h before start",
            tx
          );
        });

        logger.info(
          `[CancellationService] Booking ${bookingId} cancelled by PROFESSIONAL > 72h before start. Trust penalty applied.`
        );
        bookingCancelledTotal.inc({
          reason: "PRO_INITIATED",
          refund_type: "FULL",
        });
      } else {
        throw new Error("Invalid actor type for cancellation");
      }

      return { success: true };
    } catch (error) {
      logger.error(`[CancellationService] Failed to cancel booking:`, error);
      throw error;
    }
  }
}

export default CancellationService;
