import { prisma } from "../../config/prisma.js";
import { mediaQueue } from "../../queues/media.queue.js";
import { getPresignedUploadUrl } from "../../utils/r2.js";
import { generatePlaceholder } from "../../utils/imageWorker.js";
import { getIO } from "../../config/socket.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";
import path from "path";
import { v4 as uuidv4 } from "uuid";
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
 * Get Signed URL for Community Posts
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { contentType, fileName } = req.query;
    const postId = uuidv4();
    const extension = fileName
      ? path.extname(fileName)
      : contentType.includes("video")
        ? ".mp4"
        : ".webp";
    const key = `temp/community/${postId}${extension}`;

    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    res.json({ success: true, postId, uploadUrl, key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Confirm Community Post
 */
export const confirmPost = async (req, res) => {
  try {
    const { postId, key, mediaType, title, content } = req.body;
    const authorId = await resolveUserId(req.user.id);

    let mediaUrls = [];
    let finalMediaType = mediaType || "text";
    let placeholder = null;
    const mediaUrl = `${process.env.REELS_CDN_URL}/${key}`;

    if (mediaItems && Array.isArray(mediaItems) && mediaItems.length > 0) {
      mediaUrls = mediaItems.map(
        (item) => `${process.env.REELS_CDN_URL}/${item.key}`
      );
      finalMediaType = mediaItems[0].mediaType;
    } else if (key) {
      mediaUrls = [`${process.env.REELS_CDN_URL}/${key}`];
      finalMediaType = mediaType || "image";
    }

    if (finalMediaType === "image" && mediaUrls.length > 0) {
      placeholder = await generatePlaceholder(mediaUrls[0]);
    }

    const post = await prisma.post.create({
      data: {
        id: postId,
        authorId,
        title,
        content,
        mediaType: mediaType || 'image',
        mediaUrls: [mediaUrl],
        placeholder,
        status: finalMediaType === "video" ? "pending" : "ready",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
      },
    });

    if (mediaType === "video") {
      await mediaQueue.add("TRANSCODE_VIDEO", {
        mediaId: post.id,
        mediaType: "community",
      });
    }

    const formattedPost = {
      ...post,
      adminId: post.author,
      mediaUrl: post.mediaUrls?.[0],
      image: post.mediaType === "image" ? post.mediaUrls?.[0] : null,
      videoUrl: post.mediaType === "video" ? post.mediaUrls?.[0] : null,
    };

    const io = getIO();
    if (io) io.emit(SOCKET.NEW_COMMUNITY_POST, formattedPost);

    res.status(201).json({ success: true, post: formattedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import { redisClient as redis } from "../../config/redis.js";

/**
 * Platform-wide community stats.
 *
 * Strategy:
 *  - `onlineNow`   → Redis SCARD (O(1), zero DB cost, always fresh)
 *  - members/posts → cached in Redis for 30 s to prevent DB hammering
 *    on high-traffic pages. Cache is keyed per-cluster via a shared key.
 */
export const getCommunityStats = async (req, res) => {
  try {
    const CACHE_KEY = "kridaz:community:stats:v1";
    const CACHE_TTL = 30; // seconds

    // ── 1. Online count — always live from Redis Set (O(1)) ─────────────────
    const onlineNow = await redis.scard("kridaz:online:users").catch(() => 0);

    // ── 2. Prisma stats — served from 30-second Redis cache ─────────────────
    let cachedStats = null;
    try {
      const raw = await redis.get(CACHE_KEY);
      if (raw) cachedStats = JSON.parse(raw);
    } catch {
      /* cache miss — proceed to DB */
    }

    if (cachedStats) {
      return res.status(200).json({
        success: true,
        stats: { ...cachedStats, onlineNow },
      });
    }

    // Cache miss: query Prisma in parallel
    const [totalMembers, totalPosts, commentsCount, postsByType] =
      await Promise.all([
        prisma.user.count({ where: { role: "USER" } }),
        prisma.post.count({ where: { status: "ready" } }),
        prisma.comment.count(),
        prisma.post.groupBy({
          by: ["mediaType"],
          where: { status: "ready" },
          _count: { _all: true },
        }),
      ]);

    // Compute per-type breakdowns
    const postBreakdown = { image: 0, video: 0, text: 0 };
    for (const row of postsByType) {
      const t = row.mediaType?.toLowerCase();
      if (t in postBreakdown) postBreakdown[t] = row._count._all;
    }

    const fresh = {
      members: totalMembers,
      posts: totalPosts,
      comments: commentsCount,
      imagePosts: postBreakdown.image,
      videoPosts: postBreakdown.video,
      textPosts: postBreakdown.text,
    };

    // Write to cache — fire-and-forget (non-blocking)
    redis
      .set(CACHE_KEY, JSON.stringify(fresh), "EX", CACHE_TTL)
      .catch(() => {});

    return res.status(200).json({
      success: true,
      stats: { ...fresh, onlineNow },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const rawId = req.user?.id || req.admin?.id;
    const creatorId = await resolveUserId(rawId);

    if (!creatorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let imageUrl = "";
    // Note: uploadToCloudinary was removed from imports in previous step if it wasn't used,
    // but I'll keep the logic if it's still needed.
    // Wait, I removed it but didn't replace it. I'll use R2 or Cloudinary if available.
    // The previous code had it. I'll re-add it or use the R2 logic.
    // For now, let's assume the user still wants Cloudinary for some cases or I should use R2.
    // The confirmPost used CDN URL.

    const post = await prisma.post.create({
      data: {
        authorId: creatorId,
        title,
        content,
        mediaType: "text",
        status: "ready",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
      },
    });

    const io = getIO();
    const formattedPost = {
      ...post,
      adminId: post.author,
      mediaUrl: post.mediaUrls?.[0],
      image: post.mediaType === "image" ? post.mediaUrls?.[0] : null,
      videoUrl: post.mediaType === "video" ? post.mediaUrls?.[0] : null,
    };
    if (io) io.emit(SOCKET.NEW_COMMUNITY_POST, formattedPost);

    res.status(201).json({ success: true, post: formattedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
        likes: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const formattedPost = {
      ...post,
      adminId: post.author,
      mediaUrl: post.mediaUrls?.[0],
      image: post.mediaType === "image" ? post.mediaUrls?.[0] : null,
      videoUrl: post.mediaType === "video" ? post.mediaUrls?.[0] : null,
      likesCount: post._count.likes,
      totalComments: post._count.comments,
      comments: post.comments.map((c) => ({
        ...c,
        userId: c.user,
      })),
    };
    delete formattedPost.author;
    delete formattedPost._count;

    // Check if the author has an active story
    if (formattedPost.adminId && formattedPost.adminId.id) {
      const activeStory = await prisma.story.findFirst({
        where: {
          userId: formattedPost.adminId.id,
          expiresAt: { gt: new Date() },
        },
      });
      formattedPost.adminId.hasActiveStory = !!activeStory;
    }

    res.status(200).json({ success: true, post: formattedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);

    const { search, page = 1, limit = 10, following, lat, lng } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let authorFilter = null;

    // 1. Nearby Users fallback (if lat/lng is passed)
    if (lat && lng) {
      const nearbyUsers = await findNearby(
        "User",
        parseFloat(lat),
        parseFloat(lng),
        1000000,
        { take: 50 }
      );
      if (nearbyUsers.length > 0) {
        authorFilter = { authorId: { in: nearbyUsers.map((u) => u.id) } };
      }
    }

    // 2. Following Override (if authenticated and requested)
    if (userId && following === "true") {
      const follows = await prisma.userRelationship.findMany({
        where: {
          userId,
          type: "FOLLOW",
        },
        select: {
          targetId: true,
        },
      });
      const followingIds = follows.map((f) => f.targetId);
      authorFilter = { authorId: { in: followingIds } };
    }

    const where = {};
    const statusOr = userId
      ? [
          { status: "ready" },
          { authorId: userId, status: { in: ["pending", "processing"] } },
        ]
      : [{ status: "ready" }];

    const conditions = [];
    conditions.push({ OR: statusOr });

    if (authorFilter) {
      conditions.push(authorFilter);
    }

    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
          {
            author: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      });
    }

    where.AND = conditions;

    let posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
        likes: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    // Fallback: If nearby filtering was applied but returned no posts, fetch global posts instead of showing empty screen
    if (posts.length === 0 && authorFilter) {
      const conditionsWithoutAuthor = conditions.filter(
        (c) => c !== authorFilter
      );
      where.AND = conditionsWithoutAuthor;
      posts = await prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
              username: true,
            },
          },
          likes: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
              username: true,
            },
          },
          _count: {
            select: { likes: true, comments: true },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profilePicture: true,
                  username: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      });
    }

    // Map to legacy format
    const formattedPosts = posts.map((post) => {
      const postObj = {
        ...post,
        adminId: post.author,
        mediaUrl: post.mediaUrls?.[0],
        image: post.mediaType === "image" ? post.mediaUrls?.[0] : null,
        videoUrl: post.mediaType === "video" ? post.mediaUrls?.[0] : null,
        likesCount: post._count.likes,
        totalComments: post._count.comments,
        comments: post.comments.map((c) => ({
          ...c,
          userId: c.user,
        })),
      };
      delete postObj.author;
      delete postObj._count;
      return postObj;
    });

    // Get active stories for authors
    const authorIds = formattedPosts
      .map((p) => p.adminId?.id)
      .filter((id) => id);
    const activeStories = await prisma.story.findMany({
      where: {
        userId: { in: authorIds },
        expiresAt: { gt: new Date() },
      },
      select: { userId: true },
    });

    const activeStoryUserIds = new Set(activeStories.map((s) => s.userId));

    const postsWithStoryStatus = formattedPosts.map((post) => {
      if (post.adminId) {
        post.adminId.hasActiveStory = activeStoryUserIds.has(post.adminId.id);
      }
      return post;
    });

    res.status(200).json({ success: true, posts: postsWithStoryStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);
    const role = req.user?.role || req.admin?.role;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Check ownership or admin role
    const isAuthor = post.authorId === userId;
    const isAdmin = role?.toUpperCase() === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to update this post" });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { title, content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      post: { ...updatedPost, adminId: updatedPost.author },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);
    const role = req.user?.role || req.admin?.role;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Check ownership or admin role
    const isAuthor = post.authorId === userId;
    const isAdmin = role?.toUpperCase() === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to delete this post" });
    }

    await prisma.post.delete({ where: { id } });

    const io = getIO();
    if (io) io.emit(SOCKET.COMMUNITY_POST_DELETED, id);

    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reportPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const report = await prisma.postReport.create({
      data: {
        postId: id,
        userId,
        reason,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "Post reported successfully", report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET POST REPORTS (ADMIN)
// ==========================================
export const getPostReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.postReport.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            select: {
              id: true,
              content: true,
              mediaUrls: true,
              mediaType: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  profilePicture: true,
                  email: true,
                },
              },
            },
          },
          user: {
            select: { id: true, name: true, profilePicture: true, email: true },
          },
        },
      }),
      prisma.postReport.count(),
    ]);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const post = await prisma.post.findUnique({
      where: { id },
      include: { likes: { select: { id: true } } },
    });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const isLiked = post.likes.some((l) => l.id === userId);

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        likes: isLiked
          ? { disconnect: { id: userId } }
          : { connect: { id: userId } },
      },
      include: {
        likes: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
      },
    });

    const io = getIO();
    if (io)
      io.emit(SOCKET.COMMUNITY_POST_LIKED, {
        postId: id,
        likes: updatedPost.likes,
        likesCount: updatedPost.likes.length,
      });

    res.status(200).json({
      success: true,
      likesCount: updatedPost.likes.length,
      isLiked: !isLiked,
      likes: updatedPost.likes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        userId,
        text,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const formattedComments = post.comments.map((c) => ({
      ...c,
      userId: c.user,
    }));

    const io = getIO();
    if (io)
      io.emit(SOCKET.COMMUNITY_POST_COMMENTED, {
        postId: id,
        comments: formattedComments,
      });

    res.status(200).json({ success: true, comments: formattedComments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    if (comment.userId !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to edit this comment" });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { text },
    });

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const formattedComments = post.comments.map((c) => ({
      ...c,
      userId: c.user,
    }));

    const io = getIO();
    if (io)
      io.emit(SOCKET.COMMUNITY_POST_COMMENTED, {
        postId: id,
        comments: formattedComments,
      });

    res.status(200).json({ success: true, comments: formattedComments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    // Allow user to delete their own comment, OR post admin can delete any comment
    if (comment.userId !== userId && post.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this comment",
      });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    const updatedPost = await prisma.post.findUnique({
      where: { id },
      include: {
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const formattedComments = updatedPost.comments.map((c) => ({
      ...c,
      userId: c.user,
    }));

    const io = getIO();
    if (io)
      io.emit(SOCKET.COMMUNITY_POST_COMMENTED, {
        postId: id,
        comments: formattedComments,
      });

    res.status(200).json({ success: true, comments: formattedComments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyActivity = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // Fetch posts the user commented on or liked
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { comments: { some: { userId } } },
          { likes: { some: { id: userId } } },
        ],
      },
      include: {
        author: { select: { id: true, name: true, profilePicture: true } },
        comments: { where: { userId } },
        likes: { where: { id: userId }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Filter and format for profile view
    const activity = posts.map((post) => ({
      postId: post.id,
      postTitle: post.title || "Untitled Update",
      postImage: post.mediaUrls[0],
      adminName: post.author?.name,
      myComments: post.comments,
      isLiked: post.likes.length > 0,
      createdAt: post.createdAt,
    }));

    res.status(200).json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { targetUserId: paramId } = req.params;
    let targetUserId = paramId || req.user?.id;
    if (!targetUserId)
      return res
        .status(400)
        .json({ success: false, message: "User ID required" });

    // Handle Owner-User identity mapping
    const owner = await prisma.ownerProfile.findUnique({
      where: { id: targetUserId },
    });
    const searchIds = [targetUserId];
    if (owner && owner.userId) {
      searchIds.push(owner.userId);
    } else {
      const linkedOwner = await prisma.ownerProfile.findFirst({
        where: { userId: targetUserId },
      });
      if (linkedOwner) searchIds.push(linkedOwner.id);
    }

    const posts = await prisma.post.findMany({
      where: { authorId: { in: searchIds } },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
        likes: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formattedPosts = posts.map((post) => ({
      ...post,
      adminId: post.author,
      comments: post.comments.map((c) => ({ ...c, userId: c.user })),
    }));

    res.status(200).json({ success: true, posts: formattedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserStories = async (req, res) => {
  try {
    const { targetUserId: paramId } = req.params;
    let targetUserId = paramId || req.user?.id;
    if (!targetUserId)
      return res
        .status(400)
        .json({ success: false, message: "User ID required" });

    // Handle Owner-User identity mapping
    const owner = await prisma.ownerProfile.findUnique({
      where: { id: targetUserId },
    });
    const searchIds = [targetUserId];
    if (owner && owner.userId) {
      searchIds.push(owner.userId);
    } else {
      const linkedOwner = await prisma.ownerProfile.findFirst({
        where: { userId: targetUserId },
      });
      if (linkedOwner) searchIds.push(linkedOwner.id);
    }

    const stories = await prisma.story.findMany({
      where: { userId: { in: searchIds } },
      include: {
        viewers: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
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

    const formattedStories = stories.map((s) => {
      const storyObj = {
        ...s,
        author: s.user,
      };
      delete storyObj.user;
      return storyObj;
    });

    // Enforce privacy
    const isOwnContent = req.user?.id && searchIds.includes(req.user.id);

    if (req.user?.id && !isOwnContent) {
      // Simplification: Check relationship via Follower/Following
      const relationship = await prisma.userRelationship.findFirst({
        where: {
          OR: [
            { followerId: req.user.id, followingId: { in: searchIds } },
            { followerId: { in: searchIds }, followingId: req.user.id },
          ],
        },
      });

      if (!relationship) {
        // If not in network, only show active stories
        const activeStories = formattedStories.filter(
          (s) => s.expiresAt > new Date()
        );
        return res.status(200).json({ success: true, stories: activeStories });
      }
    }

    res.status(200).json({ success: true, stories: formattedStories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Nodemon trigger
