import { prisma } from "../config/prisma.js";
import { WalletBlockingService } from "./walletBlocking.service.js";
import logger from "../utils/logger.js";

/**
 * DisputeService
 * Manages dispute raising and resolutions.
 */
export class DisputeService {
  /**
   * Raise a dispute on a booking.
   * @param {string} bookingId - ID of the OnDemandProfessionalBooking
   * @param {string} raisedById - ID of the User raising the dispute
   * @param {string} reason - The reason category for the dispute
   * @param {string} description - Detailed explanation
   * @param {string[]} [images] - Optional media attachments
   */
  static async raiseDispute(
    bookingId,
    raisedById,
    reason,
    description,
    images = []
  ) {
    try {
      const booking = await prisma.onDemandProfessionalBooking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Check if dispute is raised within 12 hours of match end parsed
      const matchEnd = booking.matchEndParsed
        ? new Date(booking.matchEndParsed)
        : null;
      if (matchEnd) {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        if (matchEnd < twelveHoursAgo) {
          throw new Error(
            "Dispute window has closed. Disputes must be raised within 12 hours of match completion."
          );
        }
      }

      const dispute = await prisma.$transaction(async (tx) => {
        // Update booking status to DISPUTED
        await tx.onDemandProfessionalBooking.update({
          where: { id: bookingId },
          data: {
            status: "DISPUTED",
            disputeRaisedAt: new Date(),
          },
        });

        // Create Dispute ticket
        // Note: The schema has bookingId referencing the Turf Booking, so we connect to that or leave it null,
        // and link via onDemandBookingId.
        // Let's find if a Turf Booking exists, if not we create dummy/default or link if needed.
        // Actually, the Dispute model has bookingId String (references Booking) and onDemandBookingId String (references OnDemandProfessionalBooking).
        // If we don't have a Turf Booking, we can create a dummy Booking or pass a null.
        // Wait, the Dispute model's bookingId is not nullable?
        // Let's check schema.prisma line 1162:
        // `booking        Booking        @relation(fields: [bookingId], references: [id])`
        // Oh! bookingId is NOT nullable in the Dispute model.
        // Let's create a dummy Turf Booking if it doesn't exist, or link to an existing Booking.
        // Wait! Let's check how we can handle this.
        // Can we create a dummy Booking record first?
        // Yes, we can check if a Booking exists for the user/turf, or create a stub Booking record
        // and use that for the bookingId field.
        // Let's write a helper to ensure a dummy Booking exists for the dispute.
        let bookingIdToUse = null;

        // Find if a Booking already exists, else create a stub
        const firstBooking = await tx.booking.findFirst({
          where: { userId: booking.userId },
        });

        if (firstBooking) {
          bookingIdToUse = firstBooking.id;
        } else {
          // Create stub turf booking
          // Find any turf first
          const turf = await tx.turf.findFirst();
          const turfId = turf ? turf.id : "dummy-turf-id";

          const stubBooking = await tx.booking.create({
            data: {
              userId: booking.userId,
              turfId,
              totalPrice: 0.0,
              paidAmount: 0.0,
              balanceAmount: 0.0,
              status: "PENDING",
            },
          });
          bookingIdToUse = stubBooking.id;
        }

        return tx.dispute.create({
          data: {
            bookingId: bookingIdToUse,
            onDemandBookingId: bookingId,
            raisedById,
            ownerId: booking.professionalId, // Linked pro
            reason,
            description,
            images,
            status: "PENDING",
          },
        });
      });

      logger.info(
        `[DisputeService] Raised dispute ${dispute.id} on booking ${bookingId}`
      );
      return dispute;
    } catch (error) {
      logger.error(`[DisputeService] Failed to raise dispute:`, error);
      throw error;
    }
  }

  /**
   * Resolve a dispute.
   * @param {string} disputeId - ID of the Dispute
   * @param {string} outcome - Outcome enum ('FULL_REFUND', 'RELEASE_TO_UMPIRE', 'PARTIAL_REFUND')
   * @param {string} adminId - ID of the Admin resolving the dispute
   * @param {number} [refundPercentage] - Percentage to refund to user (only for PARTIAL_REFUND)
   */
  static async resolveDispute(
    disputeId,
    outcome,
    adminId,
    refundPercentage = 0
  ) {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: { onDemandBooking: true },
      });

      if (!dispute || !dispute.onDemandBooking) {
        throw new Error("Dispute or linked on-demand booking not found");
      }

      const booking = dispute.onDemandBooking;

      await prisma.$transaction(async (tx) => {
        // 1. Update dispute details
        await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: "RESOLVED",
            outcome,
            adminId,
            resolvedAt: new Date(),
          },
        });

        // 2. Perform monetary resolution
        const blockedAmt = Number(booking.blockedAmount);

        if (outcome === "FULL_REFUND") {
          // Refund full amount to user
          await WalletBlockingService.releaseBlockedFunds(
            booking.userId,
            booking.id,
            blockedAmt,
            false,
            tx
          );

          await tx.onDemandProfessionalBooking.update({
            where: { id: booking.id },
            data: { status: "REFUNDED" },
          });

          logger.info(
            `[DisputeService] Resolved dispute ${disputeId} with FULL_REFUND to user ${booking.userId}`
          );
        } else if (outcome === "RELEASE_TO_UMPIRE") {
          // Release full payout to professional
          await WalletBlockingService.releaseFundsToProfessional(
            booking.id,
            tx
          );

          logger.info(
            `[DisputeService] Resolved dispute ${disputeId} with RELEASE_TO_UMPIRE to professional ${booking.professionalId}`
          );
        } else if (outcome === "PARTIAL_REFUND") {
          // Partial refund: user receives refundPercentage % and professional receives the rest
          const refundPctVal = parseFloat(refundPercentage);
          if (isNaN(refundPctVal) || refundPctVal < 0 || refundPctVal > 100) {
            throw new Error("Invalid refund percentage for partial refund");
          }

          const userRefundAmount = blockedAmt * (refundPctVal / 100);
          const proPayoutAmountRaw = blockedAmt - userRefundAmount;

          // Fetch commission percentage from PlatformConfig
          const commissionConfig = await tx.platformConfig.findUnique({
            where: { key: "COMMISSION_PERCENTAGE" },
          });
          const commissionPct = commissionConfig
            ? parseFloat(commissionConfig.value)
            : 10;
          const commissionAmount = proPayoutAmountRaw * (commissionPct / 100);
          const payoutAmount = proPayoutAmountRaw - commissionAmount;

          // Release user's reserved balance (full amount) and debit user's actual balance for proPayoutAmountRaw
          const userWallet = await tx.wallet.findUnique({
            where: { userId: booking.userId },
          });

          if (!userWallet || Number(userWallet.reservedBalance) < blockedAmt) {
            throw new Error("User wallet reserved balance mismatch.");
          }

          await tx.wallet.update({
            where: { userId: booking.userId },
            data: {
              reservedBalance: { decrement: blockedAmt },
              balance: { decrement: proPayoutAmountRaw }, // User is only debited the professional's portion
            },
          });

          // Log transaction for user
          await tx.walletTransaction.create({
            data: {
              userId: booking.userId,
              walletId: userWallet.id,
              amount: proPayoutAmountRaw,
              type: "DEBIT",
              status: "SUCCESS",
              description: `DEBIT: Partial payout to professional for dispute: ${disputeId}`,
            },
          });

          if (userRefundAmount > 0) {
            await tx.walletTransaction.create({
              data: {
                userId: booking.userId,
                walletId: userWallet.id,
                amount: userRefundAmount,
                type: "REFUND",
                status: "SUCCESS",
                description: `REFUND: Partial refund on dispute: ${disputeId}`,
              },
            });
          }

          // Credit professional
          await tx.ownerProfile.update({
            where: { id: booking.professionalId },
            data: {
              walletBalance: { increment: payoutAmount },
            },
          });

          // Update booking status to COMPLETED
          await tx.onDemandProfessionalBooking.update({
            where: { id: booking.id },
            data: {
              status: "COMPLETED",
              commissionAmount,
              payoutAmount,
              fundsReleasedAt: new Date(),
            },
          });

          logger.info(
            `[DisputeService] Resolved dispute ${disputeId} with PARTIAL_REFUND: ${refundPctVal}% to user, ${100 - refundPctVal}% to professional`
          );
        }
      });
      return true;
    } catch (error) {
      logger.error(
        `[DisputeService] Failed to resolve dispute ${disputeId}:`,
        error
      );
      throw error;
    }
  }
}

export default DisputeService;
