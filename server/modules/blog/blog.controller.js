import { prisma } from "../../config/prisma.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import logger from "../../utils/logger.js";

// Helper to generate deterministic views/likes based on UUID
const getMockStats = (id) => {
  if (!id) return { views: 120, likes: 12 };
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const views = Math.abs(hash % 200) + 50;
  const likes = Math.abs(hash % 20) + 5;
  return { views, likes };
};

// Map Prisma Blog database model to legacy/extended frontend expectations
const mapBlogResponse = (blog) => {
  if (!blog) return null;

  const wordCount = blog.content ? blog.content.split(/\s+/).length : 0;
  const computedReadTime =
    Math.max(1, Math.ceil(wordCount / 200)) + " MINS READ";
  const { views, likes } = getMockStats(blog.id);

  return {
    ...blog,
    _id: blog.id,
    id: blog.id,
    imageUrl: blog.featuredImage || "",
    subtitle: blog.summary || "",
    readTime: computedReadTime,
    category: (blog.tags && blog.tags[0]) || "SPORTS",
    author: blog.author?.name || "KRIDAZ TEAM",
    date: new Date(blog.createdAt)
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase(),
    views,
    likes,
    status: blog.status ? blog.status.toLowerCase() : "published",
  };
};

// ── GET all blogs ────────────────────────────────────────────────────────────
export const getBlogs = async (req, res) => {
  try {
    const isAdminRequest = req.originalUrl.includes("/admin");
    const whereClause = isAdminRequest ? {} : { status: "PUBLISHED" };

    const blogs = await prisma.blog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    const mappedBlogs = blogs.map(mapBlogResponse);
    res.status(200).json({ success: true, blogs: mappedBlogs });
  } catch (error) {
    logger.error("[getBlogs Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET single blog by ID ────────────────────────────────────────────────────
export const getBlogById = async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    res.status(200).json({ success: true, blog: mapBlogResponse(blog) });
  } catch (error) {
    logger.error("[getBlogById Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── LIKE a blog ────────────────────────────────────────────────────────────
export const likeBlog = async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    const mapped = mapBlogResponse(blog);
    mapped.likes = (mapped.likes || 0) + 1;
    res.status(200).json({ success: true, blog: mapped });
  } catch (error) {
    logger.error("[likeBlog Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE blog ────────────────────────────────────────────────────────────
export const createBlog = async (req, res) => {
  try {
    let featuredImage = req.body.imageUrl || "";

    // If a file was uploaded via multipart, push it to Cloudinary
    if (req.file) {
      logger.info("[createBlog]: Uploading file to Cloudinary...");
      featuredImage = await uploadToCloudinary(req.file.buffer, "kridaz/blogs");
    }

    if (!featuredImage) {
      return res
        .status(400)
        .json({ success: false, message: "Article image is required" });
    }

    const { title, content, summary, subtitle, tags, status, category } =
      req.body;
    const authorId = req.user?.id;

    if (!title || !content || !authorId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Missing required fields (title, content, or author)",
        });
    }

    // Generate unique slug
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") +
      "-" +
      Date.now();

    // Prepare tags list
    let tagsList = Array.isArray(tags)
      ? tags
      : tags
        ? tags.split(",").map((t) => t.trim())
        : [];
    const finalCategory = category || "Sports";
    if (finalCategory && !tagsList.includes(finalCategory)) {
      tagsList = [finalCategory, ...tagsList];
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        summary: summary || subtitle || "",
        featuredImage,
        tags: tagsList,
        status: status ? status.toUpperCase() : "PUBLISHED",
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, blog: mapBlogResponse(blog) });
  } catch (error) {
    logger.error("[createBlog Error]:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error during blog creation",
      });
  }
};

// ── UPDATE blog ────────────────────────────────────────────────────────────
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      summary,
      subtitle,
      imageUrl,
      tags,
      status,
      category,
    } = req.body;

    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    const updates = {};
    if (title !== undefined) {
      updates.title = title;
      updates.slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") +
        "-" +
        Date.now();
    }
    if (content !== undefined) updates.content = content;
    if (summary !== undefined || subtitle !== undefined) {
      updates.summary = summary !== undefined ? summary : subtitle;
    }
    if (status !== undefined) updates.status = status.toUpperCase();

    // Handle tags and category update
    if (tags !== undefined || category !== undefined) {
      let tagsList = [];
      if (tags !== undefined) {
        tagsList = Array.isArray(tags)
          ? tags
          : tags
            ? tags.split(",").map((t) => t.trim())
            : [];
      } else {
        tagsList = existing.tags || [];
      }

      const finalCategory =
        category !== undefined ? category : tagsList[0] || "Sports";
      if (finalCategory) {
        tagsList = [
          finalCategory,
          ...tagsList.filter((t) => t !== finalCategory),
        ];
      }
      updates.tags = tagsList;
    }

    // Handle image updates
    if (req.file) {
      logger.info("[updateBlog]: Uploading new file to Cloudinary...");
      updates.featuredImage = await uploadToCloudinary(
        req.file.buffer,
        "kridaz/blogs"
      );
    } else if (imageUrl !== undefined) {
      updates.featuredImage = imageUrl;
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: updates,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, blog: mapBlogResponse(blog) });
  } catch (error) {
    logger.error("[updateBlog Error]:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error during blog update",
      });
  }
};

// ── DELETE blog ────────────────────────────────────────────────────────────
export const deleteBlog = async (req, res) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    res
      .status(200)
      .json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    logger.error("[deleteBlog Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
