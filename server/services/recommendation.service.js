import axios from "axios";
import { prisma } from "../config/prisma.js";
import { getOrSetCache } from "../utils/cache.js";
import logger from "../utils/logger.js";

const RECOMMENDATION_SERVICE_URL =
  process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:8001";

/**
 * Personalised Ground Recommendations service
 * Fetches ranked candidate sets from our Python FastAPI recommender under 200ms SLAs,
 * backed by a 10-minute Redis caching tier and a bulletproof PostgreSQL recovery fallback.
 */
export const getGroundRecommendations = async (
  userId,
  lat,
  lng,
  limit = 15
) => {
  const cacheKey = `rec:grounds:${userId}:${lat || "none"}:${lng || "none"}:${limit}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      try {
        logger.info(
          `[RECS] Requesting ground recommendation feed for user ${userId} from ML Service...`
        );

        const response = await axios.get(
          `${RECOMMENDATION_SERVICE_URL}/api/recommendations/feed`,
          {
            params: {
              user_id: userId,
              lat: lat ? parseFloat(lat) : undefined,
              lng: lng ? parseFloat(lng) : undefined,
              limit: parseInt(limit),
              include_scores: false,
            },
            timeout: 200, // Enforcing strict 200ms SLA
          }
        );

        if (response.data && response.data.success && response.data.data) {
          logger.info(
            `[RECS] Successfully fetched ${response.data.data.length} ML-ranked grounds.`
          );
          return response.data.data;
        }
      } catch (err) {
        logger.warn(
          `[RECS] ML Service unavailable or timed out (SLA 200ms). Falling back to PostgreSQL native queries! Error: ${err.message}`
        );
      }

      // PostgreSQL-native Fallback (High-Availability Recovery Mode)
      try {
        logger.info(`[RECS] Executing PostgreSQL-native fallback query...`);
        // Fetch approved active turfs sorted by rating and then creation date
        const fallbackGrounds = await prisma.turf.findMany({
          where: {
            isActive: true,
            status: "approved",
          },
          orderBy: [{ createdAt: "desc" }],
          take: parseInt(limit),
        });

        return fallbackGrounds.map((g) => ({
          id: g.id,
          _id: g.id,
          name: g.name,
          image: g.image,
          images: g.images || [],
          description: g.description,
          location: g.location,
          city: g.city,
          state: g.state,
          sportTypes: g.sportTypes,
          groundTypes: g.groundTypes,
          facilities: g.facilities,
          pricePerHour: parseFloat(g.pricePerHour),
          rating: g.rating ? parseFloat(g.rating) : 3.5,
          latitude: g.latitude ? parseFloat(g.latitude) : null,
          longitude: g.longitude ? parseFloat(g.longitude) : null,
          generatedSlots: g.generatedSlots || [],
          openTime: g.openTime,
          closeTime: g.closeTime,
          youtubeUrl: g.youtubeUrl,
          totalScore: 0.5, // Neutral baseline score for fallback items
        }));
      } catch (fallbackErr) {
        logger.error(
          `[RECS] PostgreSQL fallback query failed completely!`,
          fallbackErr
        );
        return [];
      }
    },
    600
  ); // 10 minutes cache TTL (600 seconds)
};

export const getUserRecommendations = async (userId, lat, lng, limit = 15) => {
  const cacheKey = `rec:users:${userId}:${lat || "none"}:${lng || "none"}:${limit}`;

  return getOrSetCache(
    cacheKey,
    async () => {
      try {
        logger.info(
          `[RECS] Requesting user follow recommendation feed for user ${userId} from ML Service...`
        );

        const response = await axios.get(
          `${RECOMMENDATION_SERVICE_URL}/api/recommendations/users`,
          {
            params: {
              user_id: userId,
              lat: lat ? parseFloat(lat) : undefined,
              lng: lng ? parseFloat(lng) : undefined,
              limit: parseInt(limit),
              include_scores: false,
            },
            timeout: 200, // Enforcing strict 200ms SLA
          }
        );

        if (response.data && response.data.success && response.data.data) {
          logger.info(
            `[RECS] Successfully fetched ${response.data.data.length} ML-ranked user follow recommendations.`
          );
          return response.data.data;
        }
      } catch (err) {
        logger.warn(
          `[RECS] ML Service unavailable or timed out for users (SLA 200ms). Falling back to PostgreSQL native queries! Error: ${err.message}`
        );
      }

      // PostgreSQL-native Fallback
      try {
        logger.info(
          `[RECS] Executing PostgreSQL-native fallback user recommendations query...`
        );
        const followingList = await prisma.userRelationship.findMany({
          where: {
            userId: userId,
            type: "FOLLOW",
          },
          select: {
            targetId: true,
          },
        });
        const followedIds = followingList.map((r) => r.targetId);
        followedIds.push(userId); // Exclude self

        const fallbackUsers = await prisma.user.findMany({
          where: {
            id: {
              notIn: followedIds,
            },
            status: "active",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: parseInt(limit),
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
            sportTypes: true,
          },
        });

        return fallbackUsers.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          profilePicture: u.profilePicture,
          sportTypes: u.sportTypes || [],
          followersCount: 0,
          totalScore: 0.5,
        }));
      } catch (fallbackErr) {
        logger.error(
          `[RECS] PostgreSQL fallback query for users failed completely!`,
          fallbackErr
        );
        return [];
      }
    },
    600
  );
};

export default {
  getGroundRecommendations,
  getUserRecommendations,
};
