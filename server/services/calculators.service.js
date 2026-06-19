import { prisma } from "../config/prisma.js";
import logger from "../utils/logger.js";

/**
 * CalculatorsService
 * Handles geographic computations and travel feasibility verification.
 */
export class CalculatorsService {
  /**
   * Calculate straight-line Haversine distance between two coordinates in kilometers.
   * @param {number} lat1 - Latitude of first coordinate
   * @param {number} lng1 - Longitude of first coordinate
   * @param {number} lat2 - Latitude of second coordinate
   * @param {number} lng2 - Longitude of second coordinate
   * @returns {number} Distance in kilometers
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const p1 = parseFloat(lat1);
    const g1 = parseFloat(lng1);
    const p2 = parseFloat(lat2);
    const g2 = parseFloat(lng2);

    if (isNaN(p1) || isNaN(g1) || isNaN(p2) || isNaN(g2)) {
      return Infinity;
    }

    const R = 6371; // Earth's radius in km
    const dLat = ((p2 - p1) * Math.PI) / 180;
    const dLng = ((g2 - g1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1 * Math.PI) / 180) *
        Math.cos((p2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Verifies if a professional can travel from booking 1 to booking 2 in time.
   * Logic: gap_time = start2 - end1.
   * travel_time = (distance / speed) * 60 minutes.
   * required_time = travel_time + buffer.
   * Returns required_time <= gap_time.
   * @param {number} lat1 - Latitude of booking 1
   * @param {number} lng1 - Longitude of booking 1
   * @param {Date|string} endTime1 - End time of booking 1
   * @param {number} lat2 - Latitude of booking 2
   * @param {number} lng2 - Longitude of booking 2
   * @param {Date|string} startTime2 - Start time of booking 2
   * @returns {Promise<boolean>}
   */
  static async checkTravelFeasibility(
    lat1,
    lng1,
    endTime1,
    lat2,
    lng2,
    startTime2
  ) {
    try {
      const end1 = new Date(endTime1);
      const start2 = new Date(startTime2);

      const gapTimeMs = start2.getTime() - end1.getTime();
      const gapTimeMinutes = gapTimeMs / (1000 * 60);

      if (gapTimeMinutes < 0) {
        return false; // overlap or booking 2 starts before booking 1 ends
      }

      // Load platform config parameters for travel speed and buffer
      const speedConfig = await prisma.platformConfig.findUnique({
        where: { key: "TRAVEL_SPEED_KMH" },
      });
      const bufferConfig = await prisma.platformConfig.findUnique({
        where: { key: "TRAVEL_BUFFER_HOURS" },
      });

      const travelSpeedKmh = speedConfig ? parseFloat(speedConfig.value) : 30;
      const travelBufferHours = bufferConfig
        ? parseFloat(bufferConfig.value)
        : 1;

      const distanceKm = this.calculateDistance(lat1, lng1, lat2, lng2);

      // travel_time = (distance / speed) * 60 minutes
      const travelTimeMinutes = (distanceKm / travelSpeedKmh) * 60;
      const bufferTimeMinutes = travelBufferHours * 60;

      const requiredTimeMinutes = travelTimeMinutes + bufferTimeMinutes;

      const isFeasible = requiredTimeMinutes <= gapTimeMinutes;

      logger.debug(
        `[TravelFeasibility] Distance: ${distanceKm.toFixed(2)} km, required: ${requiredTimeMinutes.toFixed(
          1
        )}m, gap: ${gapTimeMinutes}m. Feasible: ${isFeasible}`
      );

      return isFeasible;
    } catch (error) {
      logger.error(
        "[TravelFeasibility] Error calculating travel feasibility:",
        error
      );
      return false;
    }
  }

  /**
   * Search for online professionals within a geographic radius using PostgreSQL Haversine formula.
   * Optionally filter by professional role.
   * @param {number} latitude - Center latitude
   * @param {number} longitude - Center longitude
   * @param {number} radius - Radius limit in kilometers
   * @param {string} [role] - Role name (e.g. 'UMPIRE', 'COACH', etc.)
   * @returns {Promise<Array>} List of matching OwnerProfile objects (including user relation)
   */
  static async searchProfessionalsInRadius(
    latitude,
    longitude,
    radius,
    role = null
  ) {
    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);
    const radVal = parseFloat(radius);

    if (isNaN(latVal) || isNaN(lngVal) || isNaN(radVal)) {
      throw new Error("Invalid coordinate or radius inputs");
    }

    try {
      let results;

      if (role) {
        // Query joining User to filter by Role enum
        results = await prisma.$queryRaw`
          SELECT op.*, u.name, u.role, u.email
          FROM "OwnerProfile" op
          JOIN "User" u ON op."userId" = u.id
          WHERE op."isOnline" = true
            AND u.role = ${role}::"Role"
            AND op.latitude IS NOT NULL
            AND op.longitude IS NOT NULL
            AND (6371 * acos(
              cos(radians(${latVal})) * cos(radians(CAST(op.latitude AS double precision))) * 
              cos(radians(CAST(op.longitude AS double precision)) - radians(${lngVal})) + 
              sin(radians(${latVal})) * sin(radians(CAST(op.latitude AS double precision)))
            )) <= ${radVal}
        `;
      } else {
        // Query without role filter
        results = await prisma.$queryRaw`
          SELECT op.*
          FROM "OwnerProfile" op
          WHERE op."isOnline" = true
            AND op.latitude IS NOT NULL
            AND op.longitude IS NOT NULL
            AND (6371 * acos(
              cos(radians(${latVal})) * cos(radians(CAST(op.latitude AS double precision))) * 
              cos(radians(CAST(op.longitude AS double precision)) - radians(${lngVal})) + 
              sin(radians(${latVal})) * sin(radians(CAST(op.latitude AS double precision)))
            )) <= ${radVal}
        `;
      }

      return results;
    } catch (error) {
      logger.error(
        "[GeoRadiusSearch] Error executing database radius query:",
        error
      );
      throw error;
    }
  }
}
export default CalculatorsService;
