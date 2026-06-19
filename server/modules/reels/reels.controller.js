import { prisma } from "../../config/prisma.js";
import {
  getOrSetCache,
  generateCacheKey,
  invalidateCache,
} from "../../utils/cache.js";
import {
  addReelInteractionToBloom,
  checkReelInteractionBloom,
  removeReelInteractionFromBloom,
} from "../../utils/bloomFilter.js";

import { mediaQueue } from "../../queues/media.queue.js";
import { getPresignedUploadUrl } from "../../utils/r2.js";
import { getIO } from "../../config/socket.js";
import path from "path";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import logger from "../../utils/logger.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";

const isProd =
  process.env.NODE_ENV === "production" ||
  !!process.env.RAILWAY_ENVIRONMENT ||
  !!process.env.RAILWAY_ENVIRONMENT_NAME ||
  !!process.env.RAILWAY_PROJECT_ID;
const COOKIE_SETTINGS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "strict",
  domain: process.env.COOKIE_DOMAIN || (isProd ? ".kridaz.com" : "localhost"),
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Get Presigned URL for direct R2 upload
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { contentType, fileName } = req.query;

    const reelId = uuidv4();
    const extension = fileName ? path.extname(fileName) : ".mp4";
    const key = `temp/reels/${reelId}${extension}`;

    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    res.json({
      success: true,
      reelId,
      uploadUrl,
      key,
      cdnUrl: process.env.REELS_CDN_URL,
    });
  } catch (error) {
    logger.error("[REELS] Get Upload URL Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Confirm upload and start transcoding
 */
export const confirmUpload = async (req, res) => {
  try {
    const { reelId, key, caption, hashtags } = req.body;
    const userId = req.user.id;

    const reel = await prisma.reel.create({
      data: {
        id: reelId,
        creatorId: userId,
        caption,
        hashtags: hashtags
          ? Array.isArray(hashtags)
            ? hashtags
            : hashtags.split(",").map((h) => h.trim())
          : [],
        status: "pending",
        rawVideoUrl: `${process.env.REELS_CDN_URL}/${key}`,
      },
    });

    // Invalidate the cache so the new pending reel is visible
    try {
      await invalidateCache("reels:feed*");
    } catch (err) {
      logger.warn("[REELS] Failed to invalidate cache on confirm:", err);
    }

    // 2. Push to transcoding queue
    await mediaQueue.add("TRANSCODE_VIDEO", {
      mediaId: reel.id,
      mediaType: "reel",
    });

    res.status(201).json({
      success: true,
      message: "Upload confirmed. Processing started.",
      reel,
    });
  } catch (error) {
    logger.error("[REELS] Confirm Upload Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload a new Reel (Legacy)
 */
export const uploadReel = async (req, res) => {
  try {
    const { caption, hashtags } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No video file provided" });
    }

    const localPath = path.resolve(req.file.path);

    const reel = await prisma.reel.create({
      data: {
        creatorId: userId,
        caption,
        hashtags: hashtags
          ? Array.isArray(hashtags)
            ? hashtags
            : hashtags.split(",").map((h) => h.trim())
          : [],
        status: "pending",
      },
    });

    // 3. Push to transcoding queue with local file path
    await mediaQueue.add("TRANSCODE_VIDEO", {
      mediaId: reel.id,
      mediaType: "reel",
      localPath,
    });

    res.status(201).json({
      success: true,
      message:
        "Reel upload successful. Optimization is starting in the background.",
      reel,
    });
  } catch (error) {
    logger.error("[REELS] Upload Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Personalized Reel Feed
 */
export const getReelsFeed = async (req, res) => {
  try {
    const { cursor, limit = 10, initialId } = req.query;
    let initialReel = null;

    if (initialId && !cursor) {
      initialReel = await prisma.reel.findUnique({
        where: { id: initialId, status: "ready" },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePicture: true,
            },
          },
        },
      });
    }

    const where = { status: "ready", isPrivate: false };
    if (cursor) {
      where.id = { lt: cursor };
    } else if (initialId) {
      where.id = { not: initialId };
    }

    // Fetch user's pending reels if it's the first page
    let userPendingReels = [];
    if (!cursor && req.user) {
      // Fetch reels that are still being processed (pending OR processing)
      // so they stay visible throughout the full transcoding lifecycle
      userPendingReels = await prisma.reel.findMany({
        where: {
          creatorId: req.user.id,
          status: { in: ["pending", "processing"] },
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Cache the core feed (ready reels)
    const cacheKey = generateCacheKey("reels:feed", {
      cursor,
      limit,
      initialId,
    });
    const reels = await getOrSetCache(
      cacheKey,
      async () => {
        const results = await prisma.reel.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                username: true,
                profilePicture: true,
              },
            },
          },
          orderBy: { id: "desc" },
          take: parseInt(limit),
        });
        return results;
      },
      300
    ); // 5 minute TTL

    // Map to legacy format
    const formattedReels = reels.map((r) => ({
      ...r,
      creatorId: r.creator,
      stats: {
        views: r.views || 0,
        likes: r.likes || 0,
        comments: r.comments || 0,
        shares: r.shares || 0,
      },
    }));

    const finalReels = [
      ...(initialReel
        ? [
            {
              ...initialReel,
              creatorId: initialReel.creator,
              stats: {
                views: initialReel.views || 0,
                likes: initialReel.likes || 0,
                comments: initialReel.comments || 0,
                shares: initialReel.shares || 0,
              },
            },
          ]
        : []),
      ...userPendingReels.map((r) => ({
        ...r,
        creatorId: r.creator,
        stats: {
          views: r.views || 0,
          likes: r.likes || 0,
          comments: r.comments || 0,
          shares: r.shares || 0,
        },
      })),
      ...formattedReels,
    ];

    // Deduplicate
    const uniqueReels = finalReels.filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i
    );

    // Check likes for logged in user
    let likedReelIds = new Set();
    if (req.user && uniqueReels.length > 0) {
      const likes = await prisma.reelInteraction.findMany({
        where: {
          userId: req.user.id,
          reelId: { in: uniqueReels.map((r) => r.id) },
          type: "like",
        },
        select: { reelId: true },
      });
      likedReelIds = new Set(likes.map((l) => l.reelId));
    }

    const finalReelsWithLikes = uniqueReels.map((r) => ({
      ...r,
      isLiked: likedReelIds.has(r.id),
    }));

    const nextCursor = reels.length > 0 ? reels[reels.length - 1].id : null;

    // Performance Headers
    res.setHeader(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.status(200).json({
      success: true,
      reels: finalReelsWithLikes,
      nextCursor,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Interact with a Reel (Like, View, etc.)
 */
export const interactWithReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { type, watchTime, completionRate } = req.body;
    const userId = req.user.id;

    // Normalize type to lowercase
    const normalizedType = (type || "like").toLowerCase();

    // Support Unliking a Reel
    if (normalizedType === "unlike") {
      // 1. Delete matching like interaction in DB
      await prisma.reelInteraction.deleteMany({
        where: {
          userId,
          reelId,
          type: "like",
        },
      });

      // 2. Remove like from Bloom filter
      await removeReelInteractionFromBloom(userId, reelId, "like");

      // 3. Decrement the likes count on the reel
      const updatedReel = await prisma.reel.update({
        where: { id: reelId },
        data: { likes: { decrement: 1 } },
      });

      // 4. Invalidate cache so subsequent feed loads get the fresh count
      await invalidateCache("reels:feed:*");

      // 5. Broadcast to real-time clients
      const io = getIO();
      if (io) {
        io.emit(SOCKET.REEL_LIKED, { reelId, likes: updatedReel.likes });
      }

      return res
        .status(200)
        .json({ success: true, message: "Reel unliked successfully" });
    }

    // ── BLOOM FILTER OPTIMIZATION ───────────────────────────────────────────
    // If the user has already interacted (like/view), skip the expensive DB upsert.
    const alreadyInteracted = await checkReelInteractionBloom(
      userId,
      reelId,
      normalizedType
    );
    if (alreadyInteracted) {
      return res
        .status(200)
        .json({
          success: true,
          message: "Interaction already tracked (Bloom hit)",
        });
    }

    // Check if interaction already exists in DB (Bloom miss doesn't mean it's new)
    const existingInteraction = await prisma.reelInteraction.findUnique({
      where: { userId_reelId_type: { userId, reelId, type: normalizedType } },
    });

    if (existingInteraction) {
      // Re-populate Bloom filter from DB truth and return without incrementing
      addReelInteractionToBloom(userId, reelId, normalizedType);
      return res
        .status(200)
        .json({ success: true, message: "Already interacted (DB hit)" });
    }

    // Genuinely new interaction — create it
    const interaction = await prisma.reelInteraction.create({
      data: { userId, reelId, type: normalizedType, watchTime, completionRate },
    });

    // Update Bloom filter after successful DB operation
    addReelInteractionToBloom(userId, reelId, normalizedType);

    const updateData = {};
    if (normalizedType === "view") updateData.views = { increment: 1 };
    if (normalizedType === "like") updateData.likes = { increment: 1 };
    if (normalizedType === "share") updateData.shares = { increment: 1 };
    if (normalizedType === "complete")
      updateData.completionCount = { increment: 1 };

    if (Object.keys(updateData).length > 0) {
      const updatedReel = await prisma.reel.update({
        where: { id: reelId },
        data: updateData,
      });

      // Invalidate reels feed cache so hard refresh fetches fresh counts
      if (normalizedType === "like" || normalizedType === "share") {
        await invalidateCache("reels:feed:*");
      }

      const io = getIO();
      if (io) {
        if (normalizedType === "like") {
          io.emit(SOCKET.REEL_LIKED, { reelId, likes: updatedReel.likes });
        }
      }
    }

    res.status(200).json({ success: true, interaction });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(200).json({ success: true, message: "Already liked" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add Comment to Reel
 */
export const addComment = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.id;

    const comment = await prisma.reelComment.create({
      data: {
        userId,
        reelId,
        text: content,
        parentId,
      },
    });

    await prisma.reel.update({
      where: { id: reelId },
      data: { comments: { increment: 1 } },
    });

    // Invalidate reels feed cache so hard refresh fetches fresh counts
    await invalidateCache("reels:feed:*");

    const io = getIO();
    if (io) {
      io.emit(SOCKET.REEL_COMMENTED, { reelId, comment });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Comments for a Reel
 */
export const getReelComments = async (req, res) => {
  try {
    const { reelId } = req.params;
    const comments = await prisma.reelComment.findMany({
      where: { reelId, parentId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Creator Analytics
 */
export const getCreatorAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const reels = await prisma.reel.findMany({
      where: { creatorId: userId },
    });

    const totalStats = reels.reduce(
      (acc, reel) => {
        acc.views += reel.views || 0;
        acc.likes += reel.likes || 0;
        acc.comments += reel.comments || 0;
        acc.shares += reel.shares || 0;
        return acc;
      },
      { views: 0, likes: 0, comments: 0, shares: 0 }
    );

    res.status(200).json({
      success: true,
      totalStats,
      reelsCount: reels.length,
      reels: reels.map((r) => ({
        id: r.id,
        caption: r.caption,
        stats: {
          views: r.views,
          likes: r.likes,
          comments: r.comments,
          shares: r.shares,
        },
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackWatchTime = async (req, res) => {
  const { reelId } = req.params;
  const { watchTime, completed } = req.body;
  const userId = req.user?.id;
  try {
    // If it's a "view" and already in Bloom, we might still want to increment total watch time,
    // but we can skip the specific ReelInteraction upsert if it's already "viewed" recently.
    const alreadyViewed = userId
      ? await checkReelInteractionBloom(userId, reelId, "view")
      : false;

    const updateData = { avgWatchTime: { increment: watchTime } };
    if (completed) updateData.completionCount = { increment: 1 };

    await prisma.reel.update({
      where: { id: reelId },
      data: updateData,
    });

    if (userId && !alreadyViewed) {
      await prisma.reelInteraction.upsert({
        where: {
          userId_reelId_type: { userId, reelId, type: "view" },
        },
        update: {
          watchTime: { increment: watchTime },
          totalWatches: { increment: 1 },
        },
        create: { userId, reelId, type: "view", watchTime, totalWatches: 1 },
      });
      // Mark as viewed in Bloom
      addReelInteractionToBloom(userId, reelId, "view");
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecommendedReels = async (req, res) => {
  const { cursor } = req.query;
  const limit = 5;
  try {
    // Note: Complex scoring in Prisma is better done with raw SQL for efficiency,
    // but here I'll use findMany with manual sorting for simplicity in this migration step.
    // In production, consider a raw SQL query using PostGIS/Ordering logic.

    const reels = await prisma.reel.findMany({
      where: {
        status: "ready",
        isPrivate: false,
        id: cursor ? { lt: cursor } : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { id: "desc" },
      take: limit,
    });

    // Map to expected format
    const reelsWithCreator = reels.map((r) => ({
      ...r,
      creatorId: r.creator,
      stats: {
        views: r.views || 0,
        likes: r.likes || 0,
        comments: r.comments || 0,
        shares: r.shares || 0,
      },
    }));

    const nextCursor =
      reelsWithCreator.length === limit
        ? reelsWithCreator[reelsWithCreator.length - 1].id
        : null;

    res.json({ success: true, reels: reelsWithCreator, nextCursor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * Delete a Reel
 */
export const deleteReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user.id;

    const reel = await prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) {
      return res
        .status(404)
        .json({ success: false, message: "Reel not found" });
    }

    // Check ownership
    if (reel.creatorId !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to delete this reel" });
    }

    // 1. Delete from R2
    const { deleteDirectoryFromR2, deleteFromR2 } =
      await import("../../utils/r2.js");

    const reelPrefix = `reels/${reelId}`;
    await deleteDirectoryFromR2(reelPrefix).catch((e) =>
      logger.warn("[REELS] R2 Prefix Cleanup failed:", e)
    );

    if (
      reel.thumbnailUrl &&
      (reel.thumbnailUrl.includes(process.env.REELS_CDN_URL) ||
        reel.thumbnailUrl.includes("r2.dev"))
    ) {
      const thumbKey = `thumbnails/${reelId}.jpg`;
      await deleteFromR2(thumbKey).catch((e) =>
        logger.warn("[REELS] Thumbnail Cleanup failed:", e)
      );
    }

    // 2. Delete from DB (Cascade handles interactions/comments)
    await prisma.reel.delete({ where: { id: reelId } });

    // Invalidate reels feed cache
    await invalidateCache("reels:feed:*");

    // Socket Broadcast
    const io = getIO();
    if (io) {
      io.emit(SOCKET.REEL_DELETED, { reelId });
    }

    res
      .status(200)
      .json({ success: true, message: "Reel deleted successfully" });
  } catch (error) {
    logger.error("[REELS] Delete Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Report a Reel
 */
export const reportReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const report = await prisma.reelReport.create({
      data: {
        reelId,
        reportedById: userId,
        reason: reason || "Inappropriate content",
      },
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    logger.error("[REELS] Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Reel Reports
 */
export const getReelReports = async (req, res) => {
  try {
    const reports = await prisma.reelReport.findMany({
      include: {
        reportedBy: { select: { name: true, username: true } },
        reel: {
          select: {
            id: true,
            caption: true,
            creator: { select: { name: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    logger.error("[REELS] Get Reports Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Nodemon restart trigger
