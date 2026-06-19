import { prisma } from "../../config/prisma.js";

export const calculateAvgRating = async (turfId) => {
  const reviews = await prisma.review.findMany({
    where: { turfId },
  });
  if (reviews.length === 0) return 0;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Number((totalRating / reviews.length).toFixed(1));
};

export const getTurfWithAvgRating = async (turf) => {
  const avgRating = await calculateAvgRating(turf.id);
  return {
    ...turf,
    avgRating,
  };
};
