import { prisma } from "../config/prisma.js";
import { CalculatorsService } from "./calculators.service.js";
import { TrustScoreLedgerService } from "./trustScore.service.js";
import logger from "../utils/logger.js";

/**
 * MatchingService
 * Coordinates the filtering and prioritization of professionals for on-demand bookings.
 */
export class MatchingService {
  /**
   * FilteringEngine
   * Applies sequential filters F1-F5 to identify eligible professionals.
   * @param {object} bookingRequest - The booking request parameters
   * @param {string} bookingRequest.sport - The sport type (e.g. 'CRICKET')
   * @param {string} bookingRequest.role - The professional role (e.g. 'UMPIRE')
   * @param {number} bookingRequest.latitude - Center latitude
   * @param {number} bookingRequest.longitude - Center longitude
   * @param {Date|string} bookingRequest.startTime - Start date time
   * @param {Date|string} bookingRequest.endTime - End date time
   * @param {number} bookingRequest.maxBudget - Maximum user budget (total amount)
   * @returns {Promise<Array>} Filtered eligible professional profiles (OwnerProfile)
   */
  static async runFilteringEngine(bookingRequest) {
    const { latitude, longitude, startTime, endTime, maxBudget, role } =
      bookingRequest;

    const startReq = new Date(startTime);
    const endReq = new Date(endTime);
    const durationHours = (endReq - startReq) / (1000 * 60 * 60);

    if (isNaN(durationHours) || durationHours <= 0) {
      throw new Error("Invalid start or end times for matching");
    }

    logger.info(
      `[MatchingEngine] Running F1-F5 filters for role: ${role}, duration: ${durationHours.toFixed(1)} hrs`
    );

    // F1 & F2: Online status & Geographic search with auto-expanding radius (50km -> 100km)
    let radius = 50;
    let candidates = await CalculatorsService.searchProfessionalsInRadius(
      latitude,
      longitude,
      radius,
      role
    );

    const minProCountConfig = await prisma.platformConfig.findUnique({
      where: { key: "MIN_RADIUS_PROFESSIONAL_COUNT" },
    });
    const minProCount = minProCountConfig
      ? parseInt(minProCountConfig.value)
      : 3;

    if (candidates.length < minProCount) {
      logger.info(
        `[MatchingEngine] Found only ${candidates.length} candidates in 50km. Expanding search to 100km.`
      );

      // Log radius expansion event to platform configs audit or standard logs
      logger.info(
        `RADIUS_EXPANSION_EVENT: booking center (${latitude}, ${longitude}) expanded 50km -> 100km`
      );

      radius = 100;
      candidates = await CalculatorsService.searchProfessionalsInRadius(
        latitude,
        longitude,
        radius,
        role
      );
    }

    if (candidates.length === 0) {
      logger.info(
        "[MatchingEngine] No online professionals found within 100km radius."
      );
      return [];
    }

    const eligibleProfiles = [];

    for (const pro of candidates) {
      // F3: Budget check (professional cost <= maxBudget)
      const hourlyRate = parseFloat(pro.price || 0);
      const totalCost = hourlyRate * durationHours;
      if (totalCost > parseFloat(maxBudget)) {
        logger.debug(
          `[MatchingEngine] Pro ${pro.id} excluded: Cost Rs. ${totalCost} exceeds budget Rs. ${maxBudget}`
        );
        continue;
      }

      // F4: Schedule conflict check
      const conflicts = await this.checkScheduleConflicts(
        pro.id,
        startReq,
        endReq
      );
      if (conflicts) {
        logger.debug(
          `[MatchingEngine] Pro ${pro.id} excluded: Schedule conflict found.`
        );
        continue;
      }

      // F5: Travel Feasibility check
      const travelFeasible = await this.checkAllTravelFeasibilities(
        pro,
        startReq,
        endReq,
        latitude,
        longitude
      );
      if (!travelFeasible) {
        logger.debug(
          `[MatchingEngine] Pro ${pro.id} excluded: Travel feasibility check failed.`
        );
        continue;
      }

      eligibleProfiles.push(pro);
    }

    logger.info(
      `[MatchingEngine] Filtering complete. Eligible candidates: ${eligibleProfiles.length}`
    );
    return eligibleProfiles;
  }

  /**
   * PrioritizationEngine
   * Sorts the filtered pool of professionals based on Trust Score, active time, and acceptance rate.
   * @param {Array} professionals - List of eligible professionals (OwnerProfile)
   * @returns {Promise<Array>} Sorted list of professionals
   */
  static async runPrioritizationEngine(professionals) {
    if (professionals.length <= 1) {
      return professionals;
    }

    logger.info(
      `[MatchingEngine] Prioritizing ${professionals.length} professionals...`
    );

    // Fetch dynamic trust scores for all candidates
    const candidatesWithScores = await Promise.all(
      professionals.map(async (pro) => {
        const trustScore = await TrustScoreLedgerService.getTrustScore(pro.id);
        return {
          ...pro,
          trustScore,
          avgDailyActivePct: parseFloat(pro.avgDailyActivePct || 0),
          acceptanceRate30d: parseFloat(pro.acceptanceRate30d || 100),
        };
      })
    );

    // Sort by Trust Score desc, avgDailyActivePct desc, acceptanceRate30d desc
    candidatesWithScores.sort((a, b) => {
      if (b.trustScore !== a.trustScore) {
        return b.trustScore - a.trustScore;
      }
      if (b.avgDailyActivePct !== a.avgDailyActivePct) {
        return b.avgDailyActivePct - a.avgDailyActivePct;
      }
      return b.acceptanceRate30d - a.acceptanceRate30d;
    });

    return candidatesWithScores;
  }

  /**
   * Helper: Check if professional has any booking overlaps in the requested slot
   */
  static async checkScheduleConflicts(professionalId, startTime, endTime) {
    const startReq = new Date(startTime);
    const endReq = new Date(endTime);

    // 1. Check OnDemandProfessionalBooking (active/confirmed states)
    const onDemandBookings = await prisma.onDemandProfessionalBooking.findMany({
      where: {
        professionalId,
        status: {
          in: ["CONFIRMED", "IN_PROGRESS", "PENDING_COMPLETION"],
        },
      },
      select: {
        matchStartTime: true,
        matchEndTime: true,
      },
    });

    for (const b of onDemandBookings) {
      if (!b.matchStartTime || !b.matchEndTime) continue;
      const startB = new Date(b.matchStartTime);
      const endB = new Date(b.matchEndTime);
      if (startReq < endB && endReq > startB) {
        return true; // Overlap found
      }
    }

    // 2. Check manual ProfessionalBooking (confirmed/approved states)
    const manualBookings = await prisma.professionalBooking.findMany({
      where: {
        professionalId,
        status: {
          in: ["CONFIRMED", "APPROVED", "PENDING"], // Manual bookings check
        },
      },
      select: {
        date: true,
        slots: true,
      },
    });

    for (const mb of manualBookings) {
      if (!mb.date || !mb.slots) continue;
      const slots = Array.isArray(mb.slots)
        ? mb.slots
        : JSON.parse(mb.slots || "[]");

      for (const slot of slots) {
        const parts = slot.split(" - ");
        if (parts.length !== 2) continue;

        const [slotStartStr, slotEndStr] = parts;
        const startB = new Date(`${mb.date}T${slotStartStr}:00.000Z`);
        const endB = new Date(`${mb.date}T${slotEndStr}:00.000Z`);

        if (startReq < endB && endReq > startB) {
          return true; // Overlap found
        }
      }
    }

    return false;
  }

  /**
   * Helper: Check travel feasibility for back-to-back bookings (within 3 hours)
   */
  static async checkAllTravelFeasibilities(
    pro,
    startTime,
    endTime,
    newLat,
    newLng
  ) {
    const startReq = new Date(startTime);
    const endReq = new Date(endTime);

    // Query active bookings for the pro on the same calendar day
    const sameDayBookings = await prisma.onDemandProfessionalBooking.findMany({
      where: {
        professionalId: pro.id,
        status: {
          in: ["CONFIRMED", "IN_PROGRESS", "PENDING_COMPLETION"],
        },
      },
      select: {
        latitude: true,
        longitude: true,
        matchStartTime: true,
        matchEndTime: true,
      },
    });

    for (const b of sameDayBookings) {
      if (!b.matchStartTime || !b.matchEndTime || !b.latitude || !b.longitude)
        continue;
      const startB = new Date(b.matchStartTime);
      const endB = new Date(b.matchEndTime);

      const latB = parseFloat(b.latitude);
      const lngB = parseFloat(b.longitude);

      // Scenario 1: Existing booking ends before new booking starts
      if (endB <= startReq) {
        const gapMs = startReq.getTime() - endB.getTime();
        const gapHours = gapMs / (1000 * 60 * 60);

        if (gapHours < 3.0) {
          const feasible = await CalculatorsService.checkTravelFeasibility(
            latB,
            lngB,
            endB,
            newLat,
            newLng,
            startReq
          );
          if (!feasible) return false;
        }
      }

      // Scenario 2: Existing booking starts after new booking ends
      if (startB >= endReq) {
        const gapMs = startB.getTime() - endReq.getTime();
        const gapHours = gapMs / (1000 * 60 * 60);

        if (gapHours < 3.0) {
          const feasible = await CalculatorsService.checkTravelFeasibility(
            newLat,
            newLng,
            endReq,
            latB,
            lngB,
            startB
          );
          if (!feasible) return false;
        }
      }
    }

    return true;
  }
}
export default MatchingService;
