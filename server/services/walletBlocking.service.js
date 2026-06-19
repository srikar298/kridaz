import { prisma } from "../config/prisma.js";
import WalletService from "./wallet.service.js";
import logger from "../utils/logger.js";

/**
 * WalletBlockingService
 * Manages atomic wallet block, release, refund, and payout operations.
 */
export class WalletBlockingService {
  /**
   * Reserve/block funds in user's wallet for a professional booking.
   * @param {string} userId - ID of the user booking the service
   * @param {string} bookingId - ID of the OnDemandProfessionalBooking
   * @param {number} amount - The amount to block/reserve
   * @param {object} [tx] - Optional Prisma transaction client
   */
  static async reserveFunds(userId, bookingId, amount, tx = null) {
    const client = tx || prisma;
    const amountVal = parseFloat(amount);

    try {
      const operation = async (t) => {
        // 1. Get user's wallet
        const wallet = await t.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new Error("Wallet not found. Please recharge.");
        }

        const usableBalance =
          Number(wallet.balance) - Number(wallet.reservedBalance);
        if (usableBalance < amountVal) {
          throw new Error("Insufficient wallet. Please recharge.");
        }

        // 2. Reserve the balance
        await t.wallet.update({
          where: { userId },
          data: {
            reservedBalance: { increment: amountVal },
          },
        });

        // 3. Update the booking's blockedAmount
        await t.onDemandProfessionalBooking.update({
          where: { id: bookingId },
          data: {
            blockedAmount: amountVal,
          },
        });

        // 4. Create WalletTransaction log
        await t.walletTransaction.create({
          data: {
            userId,
            walletId: wallet.id,
            amount: amountVal,
            type: "BLOCK",
            status: "SUCCESS",
            description: `BLOCK: Reserved funds for on-demand professional booking: ${bookingId}`,
          },
        });

        logger.info(
          `[WalletBlocking] Reserved Rs. ${amountVal} for user ${userId}, booking ${bookingId}`
        );
      };

      if (tx) {
        await operation(tx);
      } else {
        await prisma.$transaction(operation);
      }
    } catch (error) {
      logger.error(
        `[WalletBlocking] Failed to reserve funds for booking ${bookingId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Release/unblock reserved funds from user's wallet.
   * @param {string} userId - ID of the user
   * @param {string} bookingId - ID of the OnDemandProfessionalBooking
   * @param {number} amount - The amount to release
   * @param {boolean} shouldDebit - If true, actually deducts from balance. If false, refunds (unreserves).
   * @param {object} [tx] - Optional Prisma transaction client
   */
  static async releaseBlockedFunds(
    userId,
    bookingId,
    amount,
    shouldDebit = false,
    tx = null
  ) {
    const client = tx || prisma;
    const amountVal = parseFloat(amount);

    try {
      const operation = async (t) => {
        const wallet = await t.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new Error("Wallet not found.");
        }

        // Check that we aren't unreserving more than we have reserved
        if (Number(wallet.reservedBalance) < amountVal) {
          throw new Error("Reserved balance mismatch.");
        }

        // If shouldDebit is true, actual debit occurs: decrement both balance and reservedBalance
        // If shouldDebit is false, refund: decrement reservedBalance (leaving balance untouched)
        await t.wallet.update({
          where: { userId },
          data: {
            reservedBalance: { decrement: amountVal },
            balance: shouldDebit ? { decrement: amountVal } : undefined,
          },
        });

        // Create WalletTransaction log
        await t.walletTransaction.create({
          data: {
            userId,
            walletId: wallet.id,
            amount: amountVal,
            type: shouldDebit ? "DEBIT" : "REFUND",
            status: "SUCCESS",
            description: shouldDebit
              ? `DEBIT: Released & debited funds for professional booking: ${bookingId}`
              : `REFUND: Unblocked/refunded funds for professional booking: ${bookingId}`,
          },
        });

        logger.info(
          `[WalletBlocking] Released Rs. ${amountVal} (debit: ${shouldDebit}) for user ${userId}, booking ${bookingId}`
        );
      };

      if (tx) {
        await operation(tx);
      } else {
        await prisma.$transaction(operation);
      }
    } catch (error) {
      logger.error(
        `[WalletBlocking] Failed to release blocked funds for booking ${bookingId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * releaseFundsToProfessional
   * Settles match payment: releases user funds (debits) and credits the professional's wallet.
   * @param {string} bookingId - ID of the OnDemandProfessionalBooking
   * @param {object} [tx] - Optional Prisma transaction client
   */
  static async releaseFundsToProfessional(bookingId, tx = null) {
    const client = tx || prisma;

    try {
      const operation = async (t) => {
        // 1. Fetch booking details
        const booking = await t.onDemandProfessionalBooking.findUnique({
          where: { id: bookingId },
          include: {
            professional: true,
          },
        });

        if (!booking) {
          throw new Error("Booking not found");
        }

        // Only allow payout for CONFIRMED, IN_PROGRESS, PENDING_COMPLETION or DISPUTED (if being resolved)
        // For COMPLETED, only skip if funds are already released
        if (
          booking.status === "REFUNDED" ||
          booking.status === "FAILED" ||
          (booking.status === "COMPLETED" && booking.fundsReleasedAt !== null)
        ) {
          logger.warn(
            `[WalletBlocking] Payout skipped: Booking ${bookingId} already in terminal state or funds released: ${booking.status}`
          );
          return;
        }

        const blockedAmt = Number(booking.blockedAmount);
        if (blockedAmt <= 0) {
          throw new Error("Blocked amount is zero. Cannot release payout.");
        }

        // 2. Load platform commission config
        const commissionConfig = await t.platformConfig.findUnique({
          where: { key: "COMMISSION_PERCENTAGE" },
        });
        const commissionPct = commissionConfig
          ? parseFloat(commissionConfig.value)
          : 5;

        // 3. Calculate commission and payout
        const commissionAmount = blockedAmt * (commissionPct / 100);
        const payoutAmount = blockedAmt - commissionAmount;

        // 4. Release (debit) user blocked funds ONLY IF NOT ALREADY DEBITED
        // When a booking transitions to COMPLETED, the user is debited. We don't want to debit them again.
        const existingDebit = await t.walletTransaction.findFirst({
          where: {
            userId: booking.userId,
            type: "DEBIT",
            description: { contains: bookingId },
          },
        });

        if (!existingDebit) {
          await this.releaseBlockedFunds(
            booking.userId,
            bookingId,
            blockedAmt,
            true,
            t
          );
        }

        // 5. Credit professional's wallet and decrement inProgressBalance in OwnerProfile
        await t.ownerProfile.update({
          where: { id: booking.professionalId },
          data: {
            walletBalance: { increment: payoutAmount },
            inProgressBalance: { decrement: blockedAmt },
          },
        });

        // 6. Update booking details to COMPLETED
        await t.onDemandProfessionalBooking.update({
          where: { id: bookingId },
          data: {
            status: "COMPLETED",
            commissionAmount,
            payoutAmount,
            fundsReleasedAt: new Date(),
          },
        });

        logger.info(
          `[WalletBlocking] Successfully released payout for booking ${bookingId}: Professional Payout: Rs. ${payoutAmount.toFixed(2)}, Platform Commission: Rs. ${commissionAmount.toFixed(2)}`
        );
      };

      if (tx) {
        await operation(tx);
      } else {
        await prisma.$transaction(operation);
      }
    } catch (error) {
      logger.error(
        `[WalletBlocking] Failed to release professional payout for booking ${bookingId}:`,
        error
      );
      throw error;
    }
  }
}
export default WalletBlockingService;
