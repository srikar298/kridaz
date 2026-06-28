// Touch comment to reload nodemon and prisma client yet again final v2
import { prisma } from "../../config/prisma.js";
import { uploadToR2 } from "../../utils/r2Upload.js";

// Helper for upload (kept name for minimal changes)
const uploadMedia = (fileBuffer, folder, mimeType) => {
  return uploadToR2(fileBuffer, folder, mimeType);
};

// Ad Banners
export const getAdBanners = async (req, res) => {
  try {
    const banners = await prisma.adBanner.findMany({
      orderBy: { order: "asc" },
    });
    res.status(200).json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdBanner = async (req, res) => {
  try {
    const { title, description, targetUrl, type, order, isActive } = req.body;

    const bannerData = {
      title,
      description,
      targetUrl,
      type: type || "HOME",
      order: order ? Number(order) : 0,
      isActive: isActive === "true" || isActive === true,
    };

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video/");
      const uploadedUrl = await uploadMedia(
        req.file.buffer,
        "kridaz/marketing",
        req.file.mimetype
      );
      if (isVideo) {
        bannerData.videoUrl = uploadedUrl;
        bannerData.imageUrl = null;
      } else {
        bannerData.imageUrl = uploadedUrl;
        bannerData.videoUrl = null;
      }
    } else {
      if (req.body.imageUrl) bannerData.imageUrl = req.body.imageUrl;
      if (req.body.videoUrl) bannerData.videoUrl = req.body.videoUrl;
    }

    const banner = await prisma.adBanner.create({
      data: bannerData,
    });
    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdBanner = async (req, res) => {
  try {
    const { title, description, targetUrl, type, order, isActive } = req.body;

    const bannerData = {
      title,
      description,
      targetUrl,
      type: type || "HOME",
      order: order ? Number(order) : 0,
      isActive: isActive === "true" || isActive === true,
    };

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video/");
      const uploadedUrl = await uploadMedia(
        req.file.buffer,
        "kridaz/marketing",
        req.file.mimetype
      );
      if (isVideo) {
        bannerData.videoUrl = uploadedUrl;
        bannerData.imageUrl = null;
      } else {
        bannerData.imageUrl = uploadedUrl;
        bannerData.videoUrl = null;
      }
    } else {
      if (req.body.imageUrl) bannerData.imageUrl = req.body.imageUrl;
      if (req.body.videoUrl) bannerData.videoUrl = req.body.videoUrl;
    }

    const banner = await prisma.adBanner.update({
      where: { id: req.params.id },
      data: bannerData,
    });
    res.status(200).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdBanner = async (req, res) => {
  try {
    await prisma.adBanner.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Videos
export const getVideos = async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      orderBy: { order: "asc" },
    });
    res.status(200).json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createVideo = async (req, res) => {
  try {
    const { title, youtubeUrl, order, isActive } = req.body;
    const videoData = {
      title,
      youtubeUrl,
      order: order ? Number(order) : undefined,
      isActive: isActive === "true" || isActive === true,
    };

    const video = await prisma.video.create({
      data: videoData,
    });
    res.status(201).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { title, youtubeUrl, order, isActive } = req.body;
    const videoData = {
      title,
      youtubeUrl,
      order: order ? Number(order) : undefined,
      isActive: isActive === "true" || isActive === true,
    };

    const video = await prisma.video.update({
      where: { id: req.params.id },
      data: videoData,
    });
    res.status(200).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    await prisma.video.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: "Video deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public
export const getActiveMarketing = async (req, res) => {
  try {
    const [banners, videos, quickLinks] = await Promise.all([
      prisma.adBanner.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
      prisma.video.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
      prisma.quickLink.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
    ]);
    res.status(200).json({
      success: true,
      banners,
      videos,
      quickLinks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Quick Links
export const getQuickLinks = async (req, res) => {
  try {
    const quickLinks = await prisma.quickLink.findMany({
      orderBy: { order: "asc" },
    });
    res.status(200).json({ success: true, quickLinks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuickLink = async (req, res) => {
  try {
    const { title, targetUrl, order, isActive } = req.body;
    const linkData = {
      title,
      targetUrl,
      order: order ? Number(order) : 0,
      isActive: isActive === "true" || isActive === true,
    };
    if (req.file) {
      linkData.imageUrl = await uploadMedia(
        req.file.buffer,
        "kridaz/marketing",
        req.file.mimetype
      );
    } else if (req.body.imageUrl) {
      linkData.imageUrl = req.body.imageUrl;
    }
    const quickLink = await prisma.quickLink.create({ data: linkData });
    res.status(201).json({ success: true, quickLink });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuickLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, targetUrl, order, isActive } = req.body;
    const linkData = {
      title,
      targetUrl,
      order: order ? Number(order) : 0,
      isActive: isActive === "true" || isActive === true,
    };
    if (req.file) {
      linkData.imageUrl = await uploadMedia(
        req.file.buffer,
        "kridaz/marketing",
        req.file.mimetype
      );
    } else if (req.body.imageUrl) {
      linkData.imageUrl = req.body.imageUrl;
    }
    const quickLink = await prisma.quickLink.update({
      where: { id },
      data: linkData,
    });
    res.status(200).json({ success: true, quickLink });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteQuickLink = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quickLink.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
