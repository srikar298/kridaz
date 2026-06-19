import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Geo Utility - Decimal Fallback
 * Provides location-based searching using standard SQL math for environments without PostGIS.
 */

/**
 * Update the geography Point field (No-op in Decimal Fallback)
 */
export const updateGeoPoint = async (table, id, lat, lng) => {
  // In decimal fallback mode, we rely solely on latitude/longitude columns
  // which are already handled by Prisma in the standard controllers.
  return;
};

/**
 * Find entities within a certain radius using the Haversine formula in SQL.
 * Optimized with a bounding box to utilize standard B-Tree indexes on lat/lng.
 */
const ALLOWED_TABLES = new Set(["Turf", "User", "Team"]);

export const findNearby = async (
  table,
  lat,
  lng,
  radiusInMeters = 5000,
  options = {}
) => {
  try {
    const tableName = table.charAt(0).toUpperCase() + table.slice(1);
    if (!ALLOWED_TABLES.has(tableName)) {
      throw new Error(`Invalid table name for geo query: ${tableName}`);
    }
    const { where = {}, take = 50, include = {}, select } = options;

    // 1. Calculate bounding box (rough square) to use indexes
    // 1 degree of latitude is ~111km
    // 1 degree of longitude is ~111km * cos(latitude)
    const latDelta = radiusInMeters / 111320;
    const lngDelta =
      radiusInMeters / (111320 * Math.cos(lat * (Math.PI / 180)));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    // 2. Haversine formula in SQL to get precise distance
    // 6371000 is Earth's radius in meters
    const nearbyIdsSql = `
    SELECT "id",
      (6371000 * acos(
        LEAST(GREATEST(
          cos(radians($5)) * cos(radians("latitude")) * 
          cos(radians("longitude") - radians($6)) + 
          sin(radians($5)) * sin(radians("latitude")),
          -1.0
        ), 1.0)
      )) AS "distance"
    FROM "${tableName}"
    WHERE 
      "latitude" BETWEEN $1 AND $2 AND 
      "longitude" BETWEEN $3 AND $4 AND
      "latitude" IS NOT NULL AND "longitude" IS NOT NULL AND
      (6371000 * acos(
        LEAST(GREATEST(
          cos(radians($5)) * cos(radians("latitude")) * 
          cos(radians("longitude") - radians($6)) + 
          sin(radians($5)) * sin(radians("latitude")),
          -1.0
        ), 1.0)
      )) <= $7
    ORDER BY "distance" ASC
    LIMIT $8
  `;

    const results = await prisma.$queryRawUnsafe(
      nearbyIdsSql,
      minLat,
      maxLat,
      minLng,
      maxLng, // Bounding box
      lat,
      lng,
      radiusInMeters, // Precise center and radius
      take
    );

    if (results.length === 0) return [];

    const idToDistance = {};
    const ids = [];
    results.forEach((r) => {
      ids.push(r.id);
      idToDistance[r.id] = r.distance;
    });

    // Fetch full records with Prisma
    const queryOptions = {
      where: {
        AND: [{ id: { in: ids } }, where],
      },
      take,
    };
    if (select) {
      queryOptions.select = select;
    } else if (include && Object.keys(include).length > 0) {
      queryOptions.include = include;
    }
    const records = await prisma[table.toLowerCase()].findMany(queryOptions);

    // Restore order and attach distance
    records.sort((a, b) => idToDistance[a.id] - idToDistance[b.id]);
    return records.map((r) => ({
      ...r,
      distance: idToDistance[r.id],
    }));
  } catch (error) {
    logger.error(`[GeoUtil] Error finding nearby ${table}`, error);
    return [];
  }
};
