import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";
import { invalidateCache } from "../../utils/cache.js";

export const addReview = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { id } = req.params;
  const { rating, review: comment } = req.body;

  if (!rating || !comment) {
    return res
      .status(400)
      .json({ message: "Please provide all the required fields" });
  }

  try {
    const turf = await prisma.turf.findUnique({ where: { id } });
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    await prisma.review.create({
      data: {
        userId,
        turfId: id,
        rating: parseInt(rating),
        comment,
      },
    });

    await invalidateCache("turfs:list:*");

    return res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    logger.error("Error in addReview", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const viewReviewsByTurf = async (req, res) => {
  const { id } = req.params; // turf id
  try {
    const reviews = await prisma.review.findMany({
      where: { turfId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) /
          reviews.length
        : 0;

    return res.status(200).json({
      message: "Reviews retrieved successfully",
      reviews,
      averageRating,
    });
  } catch (error) {
    logger.error("Error in viewReviewsByTurf", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOwnerTurfReviews = async (req, res) => {
  const ownerId = req.owner.ownerId || req.owner.id;

  try {
    const owner = await prisma.ownerProfile.findFirst({
      where: {
        OR: [...(ownerId ? [{ id: ownerId }] : []), { userId: ownerId }],
      },
      include: {
        turfs: {
          include: {
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePicture: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "Owner not found" });
    }

    const turfsWithReviews = owner.turfs.map((turf) => {
      const reviewCount = turf.reviews.length;
      const totalRating = turf.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating =
        reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;

      return {
        id: turf.id,
        name: turf.name,
        avgRating: parseFloat(avgRating),
        reviewCount,
        reviews: turf.reviews.map((r) => ({
          id: r.id,
          userId: r.userId,
          userName: r.user?.name || "Anonymous Player",
          userProfile: r.user?.profilePicture,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
      };
    });

    return res.status(200).json(turfsWithReviews);
  } catch (error) {
    logger.error("Error in getOwnerTurfReviews", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
