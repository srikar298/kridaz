import { prisma } from "../../config/prisma.js";
import { getPresignedUploadUrl } from "../../utils/r2.js";
import { generatePlaceholder } from "../../utils/imageWorker.js";
import { mediaQueue } from "../../queues/media.queue.js";
import SocialService from "../../services/social.service.js";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import logger from "../../utils/logger.js";
import { findNearby } from "../../utils/geo.util.js";

const resolveUserId = async (id) => {
  if (!id) return null;
  const idStr = id.toString();
  try {
    const owner = await prisma.ownerProfile.findUnique({
      where: { id: idStr },
      select: { userId: true },
    });
    if (owner && owner.userId) return owner.userId;
    return idStr;
  } catch (error) {
    return idStr;
  }
};

/**
 * Get Signed URL for Stories
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { contentType, fileName } = req.query;
    const storyId = uuidv4();
    const extension = fileName
      ? path.extname(fileName)
      : contentType.includes("video")
        ? ".mp4"
        : ".webp";
    const key = `temp/stories/${storyId}${extension}`;

    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    res.json({ success: true, storyId, uploadUrl, key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Confirm Story Upload
 */
export const confirmStory = async (req, res) => {
  try {
    const { storyId, key, mediaType, content, durationDays, mediaItems } =
      req.body;
    const userId = await resolveUserId(req.user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays || 1));

    // Handle multiple items upload confirmation (array)
    if (mediaItems && mediaItems.length > 0) {
      const createdStories = [];
      for (const item of mediaItems) {
        const itemStoryId = uuidv4();
        const itemMediaUrl = `${process.env.REELS_CDN_URL}/${item.key}`;
        let placeholder = null;

        if (item.mediaType === "image") {
          placeholder = await generatePlaceholder(itemMediaUrl);
        }

        const story = await prisma.story.create({
          data: {
            id: itemStoryId,
            userId,
            mediaType: item.mediaType,
            mediaUrl: item.mediaType === "image" ? itemMediaUrl : null,
            rawMediaUrl: itemMediaUrl,
            placeholder,
            content,
            expiresAt,
            status: item.mediaType === "video" ? "pending" : "ready",
            durationDays: parseInt(durationDays || 1),
          },
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
        });

        const populatedStory = { ...story, userId: story.user };
        delete populatedStory.user;

        if (item.mediaType === "video") {
          await mediaQueue.add("TRANSCODE_VIDEO", {
            mediaId: story.id,
            mediaType: "story",
          });
        }
        createdStories.push(populatedStory);
      }

      return res.status(201).json({
        success: true,
        stories: createdStories,
        story: createdStories[0],
      });
    }

    // Fallback/Legacy single story confirmation
    let placeholder = null;
    const mediaUrl = `${process.env.REELS_CDN_URL}/${key}`;

    if (mediaType === "image") {
      placeholder = await generatePlaceholder(mediaUrl);
    }

    const story = await prisma.story.create({
      data: {
        id: storyId,
        userId,
        mediaType,
        mediaUrl: mediaType === "image" ? mediaUrl : null,
        rawMediaUrl: mediaUrl,
        placeholder,
        content,
        expiresAt,
        status: mediaType === "video" ? "pending" : "ready",
        durationDays: parseInt(durationDays || 1),
      },
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
    });

    const populatedStory = { ...story, userId: story.user };
    delete populatedStory.user;

    if (mediaType === "video") {
      await mediaQueue.add("TRANSCODE_VIDEO", {
        mediaId: story.id,
        mediaType: "story",
      });
    }

    res.status(201).json({ success: true, story: populatedStory });
  } catch (error) {
    logger.error("CONFIRM STORY ERROR:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStory = async (req, res) => {
  res
    .status(400)
    .json({
      success: false,
      message: "Deprecated: Please use direct R2 upload flow (/upload-url)",
    });
};

export const getStories = async (req, res) => {
  try {
    const { all, lat, lng } = req.query;
    const rawId = req.user?.id || req.admin?.id;
    const userId = rawId ? await resolveUserId(rawId) : null;

    let userIds = userId ? [userId] : [];

    if (all !== "true" && userId) {
      const networkIds = await SocialService.getNetworkIds(userId);

      // We must resolve any OwnerProfile IDs in networkIds to User IDs, because Stories are always saved with User.id
      const resolvedNetworkUserIds = await Promise.all(
        networkIds.map((id) => resolveUserId(id))
      );

      userIds = [...new Set([...userIds, ...resolvedNetworkUserIds])];
      console.log("Story Feed Query Debug:", {
        userId,
        networkIds,
        resolvedNetworkUserIds,
        userIds,
      });
    } else if (all !== "true" && !userId && lat && lng) {
      // Nearby Users fallback (if lat/lng is passed for guests)
      const nearbyUsers = await findNearby(
        "User",
        parseFloat(lat),
        parseFloat(lng),
        1000000,
        { take: 50 }
      );
      if (nearbyUsers.length > 0) {
        userIds = nearbyUsers.map((u) => u.id);
      }
    }

    const baseWhere = { expiresAt: { gt: new Date() } };
    if (all !== "true" && userIds.length > 0) {
      baseWhere.userId = { in: userIds };
    }

    const where = {
      ...baseWhere,
      ...(userId
        ? {
            OR: [
              { status: "ready" },
              { userId: userId, status: { in: ["pending", "processing"] } },
            ],
          }
        : { status: "ready" }),
    };

    // Fetch stories with user and viewer relations using Prisma
    let stories = await prisma.story.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
        viewers: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // safety cap per feed load
    });

    // Group stories by user and map to legacy format
    const groupedStories = stories.reduce((acc, story) => {
      const storyUser = story.user;
      if (!storyUser) return acc;

      const storyUserId = storyUser.id;

      // Map back to legacy fields for frontend compatibility
      const legacyStory = {
        ...story,
        userId: storyUser,
        viewers: story.viewers,
      };

      if (!acc[storyUserId]) {
        acc[storyUserId] = {
          author: storyUser,
          user: storyUser,
          stories: [],
        };
      }
      acc[storyUserId].stories.push(legacyStory);
      return acc;
    }, {});

    // Ensure current user's group is first in the list if it exists
    const finalStories = Object.values(groupedStories).sort((a, b) => {
      const aId = a.author.id;
      const bId = b.author.id;
      if (aId === userId) return -1;
      if (bId === userId) return 1;
      return 0;
    });

    res.status(200).json({ success: true, stories: finalStories });
  } catch (error) {
    logger.error("Get Stories Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    // Only owner or admin can delete
    if (story.userId !== userId && userRole?.toUpperCase() !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Call R2 cleanup helper!
    const { deleteStoryFilesFromR2 } = await import("../../utils/r2.js");
    await deleteStoryFilesFromR2(story);

    await prisma.story.delete({ where: { id } });
    res
      .status(200)
      .json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, durationDays } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    // Only owner or admin can edit
    if (story.userId !== userId && userRole?.toUpperCase() !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    let updateData = { content };
    if (durationDays) {
      updateData.durationDays = parseInt(durationDays);
      const expiresAt = new Date(story.createdAt);
      expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));
      updateData.expiresAt = expiresAt;
    }

    if (req.file) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Media updates must use the R2 upload flow.",
        });
    }

    const updatedStory = await prisma.story.update({
      where: { id },
      data: updateData,
    });
    res.status(200).json({ success: true, story: updatedStory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.story.update({
      where: { id },
      data: {
        viewers: {
          connect: { id: userId },
        },
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllStoriesAdmin = async (req, res) => {
  try {
    let stories = await prisma.story.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // admin safety cap
    });

    const formattedStories = stories.map((story) => {
      const storyObj = { ...story, userId: story.user };
      delete storyObj.user;
      storyObj.userId = storyObj.userId || {
        id: story.userId,
        name: "Unknown",
        username: "Unknown",
      };
      return storyObj;
    });

    res.status(200).json({ success: true, stories: formattedStories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
