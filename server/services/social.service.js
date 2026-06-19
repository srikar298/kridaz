import { prisma } from "../config/prisma.js";

/**
 * Social Service
 * Handles relational social interactions using Prisma
 */
class SocialService {
  /**
   * Follow a user or owner
   */
  async followUser(followerId, followingId) {
    const fId = followerId.toString();
    const tId = followingId.toString();

    if (fId === tId) {
      throw new Error("You cannot follow yourself");
    }

    await prisma.userRelationship.upsert({
      where: {
        userId_targetId_type: {
          userId: fId,
          targetId: tId,
          type: "FOLLOW",
        },
      },
      update: {},
      create: {
        userId: fId,
        targetId: tId,
        type: "FOLLOW",
      },
    });

    return { success: true };
  }

  /**
   * Unfollow a user or owner
   */
  async unfollowUser(followerId, followingId) {
    const fId = followerId.toString();
    const tId = followingId.toString();

    await prisma.userRelationship.deleteMany({
      where: {
        userId: fId,
        targetId: tId,
        type: "FOLLOW",
      },
    });

    return { success: true };
  }

  /**
   * Check if user is following another
   */
  async isFollowing(followerId, followingId) {
    if (!followerId || !followingId) return false;

    const count = await prisma.userRelationship.count({
      where: {
        userId: followerId.toString(),
        targetId: followingId.toString(),
        type: "FOLLOW",
      },
    });

    return count > 0;
  }

  /**
   * Get all follower IDs for a user
   */
  async getFollowerIds(userId) {
    const follows = await prisma.userRelationship.findMany({
      where: {
        targetId: userId.toString(),
        type: "FOLLOW",
      },
      select: { userId: true },
    });

    return follows.map((f) => f.userId);
  }

  /**
   * Get all following IDs for a user
   */
  async getFollowingIds(userId) {
    const follows = await prisma.userRelationship.findMany({
      where: {
        userId: userId.toString(),
        type: "FOLLOW",
      },
      select: { targetId: true },
    });

    return follows.map((f) => f.targetId);
  }

  /**
   * Get batch network stats for multiple users (Eliminates N+1)
   */
  async getBatchNetworkStats(userIds) {
    if (!userIds || userIds.length === 0) return new Map();

    const ids = userIds.map((id) => id.toString());

    const relationships = await prisma.userRelationship.findMany({
      where: {
        OR: [{ userId: { in: ids } }, { targetId: { in: ids } }],
        type: "FOLLOW",
      },
    });

    const statsMap = new Map();
    ids.forEach((id) =>
      statsMap.set(id, { followerIds: [], followingIds: [] })
    );

    relationships.forEach((r) => {
      // If the user is being followed
      if (statsMap.has(r.targetId)) {
        statsMap.get(r.targetId).followerIds.push(r.userId);
      }
      // If the user is following someone
      if (statsMap.has(r.userId)) {
        statsMap.get(r.userId).followingIds.push(r.targetId);
      }
    });

    return statsMap;
  }

  /**
   * Get network (followers and following with full documents)
   */
  async getNetwork(userId) {
    const userIdStr = userId.toString();

    const [followersRel, followingRel] = await Promise.all([
      prisma.userRelationship.findMany({
        where: { targetId: userIdStr, type: "FOLLOW" },
        include: { user: { include: { ownerProfile: true } } },
      }),
      prisma.userRelationship.findMany({
        where: { userId: userIdStr, type: "FOLLOW" },
        include: { target: { include: { ownerProfile: true } } },
      }),
    ]);

    const formatUser = (u) => ({
      id: u.id,
      name: u.name,
      username: u.username || u.ownerProfile?.businessName || "Member",
      profilePicture: u.profilePicture,
      location: u.city ? `${u.city}, ${u.state}` : null,
      bio: null, // Bio not in current relational User schema but can be added or fetched if needed
      sportTypes: u.sportTypes || [],
    });

    return {
      followers: followersRel.map((f) => formatUser(f.user)),
      following: followingRel.map((f) => formatUser(f.target)),
    };
  }

  /**
   * Get network IDs (Union of followers and following)
   */
  async getNetworkIds(userId) {
    const [followers, following] = await Promise.all([
      this.getFollowerIds(userId),
      this.getFollowingIds(userId),
    ]);
    return [...new Set([...followers, ...following])];
  }
}

export default new SocialService();
