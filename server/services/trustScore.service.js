import { prisma } from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * TrustScoreLedgerService
 * Implements the dynamic trust score ledger for all professional roles.
 */
export class TrustScoreLedgerService {
  /**
   * Record a trust score event in the append-only ledger.
   * @param {string} professionalId - The ID of the professional (OwnerProfile)
   * @param {string} eventType - Type of event (e.g. 'ONBOARDING', 'BOOKING_ACCEPTED', etc.)
   * @param {number} delta - The adjustment value (positive or negative)
   * @param {string} [bookingId] - Optional associated booking ID
   * @param {string} [reason] - Optional description/reason for audit purposes
   * @param {object} [tx] - Optional Prisma transaction client
   */
  static async recordEvent(
    professionalId,
    eventType,
    delta,
    bookingId = null,
    reason = null,
    tx = null
  ) {
    const client = tx || prisma;
    try {
      const event = await client.trustScoreEvent.create({
        data: {
          professionalId,
          eventType,
          delta: parseFloat(delta),
          bookingId,
          reason,
        },
      });
      logger.info(
        `[TrustScoreLedger] Recorded event ${eventType} for pro ${professionalId} with delta ${delta}`
      );
      return event;
    } catch (error) {
      logger.error(
        `[TrustScoreLedger] Failed to record event for pro ${professionalId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Dynamically calculate the trust score for a professional.
   * Sums up all deltas and caps the total at MAX_TRUST_SCORE (default 300).
   * @param {string} professionalId - The ID of the professional (OwnerProfile)
   * @param {object} [tx] - Optional Prisma transaction client
   * @returns {Promise<number>} Current calculated trust score
   */
  static async getTrustScore(professionalId, tx = null) {
    const client = tx || prisma;
    try {
      const events = await client.trustScoreEvent.findMany({
        where: { professionalId },
        select: { delta: true },
      });

      const maxScoreConfig = await client.platformConfig.findUnique({
        where: { key: "MAX_TRUST_SCORE" },
      });
      const maxScore = maxScoreConfig ? parseFloat(maxScoreConfig.value) : 300;

      const onboardingConfig = await client.platformConfig.findUnique({
        where: { key: "ONBOARDING_TRUST_SCORE" },
      });
      const defaultOnboardingScore = onboardingConfig
        ? parseFloat(onboardingConfig.value)
        : 100;

      // If no events exist, default to the onboarding score
      if (events.length === 0) {
        return defaultOnboardingScore;
      }

      const rawScore =
        defaultOnboardingScore +
        events.reduce((sum, event) => sum + event.delta, 0);

      // Cap the score at maxScore and ensure it doesn't go below 0
      const finalScore = Math.max(0, Math.min(rawScore, maxScore));
      return parseFloat(finalScore.toFixed(2));
    } catch (error) {
      logger.error(
        `[TrustScoreLedger] Failed to calculate trust score for pro ${professionalId}:`,
        error
      );
      throw error;
    }
  }
}
