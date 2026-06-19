import { prisma } from "../config/prisma.js";

/**
 * Stats Service
 * Manages user game statistics and badges with relational database
 */
class StatsService {
  /**
   * Get user stats
   */
  async getStats(userId) {
    return await prisma.userStats.findUnique({
      where: { userId: userId.toString() },
    });
  }

  /**
   * Get batch user stats
   * Optimizes N+1 lookups for multiple users
   */
  async getBatchStats(userIds) {
    if (!userIds || userIds.length === 0) return new Map();

    const ids = userIds.map((id) => id.toString());
    const allStats = await prisma.userStats.findMany({
      where: { userId: { in: ids } },
    });

    const statsMap = new Map();
    allStats.forEach((s) => statsMap.set(s.userId, s));
    return statsMap;
  }

  /**
   * Update user stats (e.g. after a match)
   */
  async updateStats(userId, updateData) {
    const userIdStr = userId.toString();

    return await prisma.userStats.upsert({
      where: { userId: userIdStr },
      update: {
        cricket: updateData.cricket,
        matchesOfficiated: updateData.matchesOfficiated,
        matchesScored: updateData.matchesScored,
        streamsHosted: updateData.streamsHosted,
      },
      create: {
        userId: userIdStr,
        cricket: updateData.cricket || {},
        matchesOfficiated: updateData.matchesOfficiated || 0,
        matchesScored: updateData.matchesScored || 0,
        streamsHosted: updateData.streamsHosted || 0,
        badges: [],
      },
    });
  }

  /**
   * Update user stats in batch (Eliminates N+1)
   */
  async updateBatchStats(updatesMap) {
    if (!updatesMap || updatesMap.size === 0) return;

    const updates = [];
    for (const [userId, updateData] of updatesMap.entries()) {
      updates.push(
        prisma.userStats.upsert({
          where: { userId: userId.toString() },
          update: {
            cricket: updateData.cricket,
            matchesOfficiated: updateData.matchesOfficiated,
            matchesScored: updateData.matchesScored,
            streamsHosted: updateData.streamsHosted,
          },
          create: {
            userId: userId.toString(),
            cricket: updateData.cricket || {},
            matchesOfficiated: updateData.matchesOfficiated || 0,
            matchesScored: updateData.matchesScored || 0,
            streamsHosted: updateData.streamsHosted || 0,
            badges: [],
          },
        })
      );
    }

    await prisma.$transaction(updates);
  }

  /**
   * Add a badge to a user
   */
  async addBadge(userId, badge) {
    const userIdStr = userId.toString();

    // In Prisma with JSON fields, we usually read and then write back or use a raw query
    // But since it's an array of strings/objects, let's do a findUnique then update
    const stats = await prisma.userStats.findUnique({
      where: { userId: userIdStr },
    });
    const currentBadges = stats?.badges || [];

    await prisma.userStats.upsert({
      where: { userId: userIdStr },
      update: { badges: [...currentBadges, badge] },
      create: {
        userId: userIdStr,
        badges: [badge],
        cricket: {},
        matchesOfficiated: 0,
        matchesScored: 0,
        streamsHosted: 0,
      },
    });
  }

  /**
   * Add multiple badges in batch
   */
  async addBatchBadges(badgeUpdates) {
    if (!badgeUpdates || badgeUpdates.length === 0) return;

    const transactions = badgeUpdates.map(async (update) => {
      const { userId, badges } = update;
      const userIdStr = userId.toString();

      const stats = await prisma.userStats.findUnique({
        where: { userId: userIdStr },
      });
      const currentBadges = stats?.badges || [];

      return prisma.userStats.upsert({
        where: { userId: userIdStr },
        update: { badges: [...currentBadges, ...badges] },
        create: {
          userId: userIdStr,
          badges: badges,
          cricket: {},
          matchesOfficiated: 0,
          matchesScored: 0,
          streamsHosted: 0,
        },
      });
    });

    await Promise.all(transactions);
  }
}

export default new StatsService();
