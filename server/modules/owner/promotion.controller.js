import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";

// Create a new promotion/coupon
export const createPromotion = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      validUntil,
      usageLimit,
      turfId,
    } = req.body;
    const { id: ownerId } = req.owner;

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    // If a specific turf is selected, verify the owner owns it
    if (turfId && turfId !== "all") {
      const turf = await prisma.turf.findFirst({
        where: { id: turfId, ownerId },
      });
      if (!turf) {
        return res.status(403).json({ message: "You do not own this turf" });
      }
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        ownerId,
        turfId: turfId === "all" ? null : turfId,
        discountType,
        discountValue: parseFloat(discountValue),
        validUntil: new Date(validUntil),
        usageLimit: parseInt(usageLimit) || 0,
      },
    });

    res
      .status(201)
      .json({ message: "Promotion created successfully", coupon: newCoupon });
  } catch (error) {
    logger.error("Error creating promotion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all promotions for the logged-in owner
export const getPromotions = async (req, res) => {
  try {
    const { id: ownerId } = req.owner;
    const coupons = await prisma.coupon.findMany({
      where: { ownerId },
      include: { turf: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Format the response for the frontend
    const formattedCoupons = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      validUntil: c.validUntil,
      usageLimit: c.usageLimit,
      timesUsed: c.timesUsed,
      isActive: c.isActive,
      turfName: c.turf ? c.turf.name : "All Grounds",
    }));

    res.status(200).json(formattedCoupons);
  } catch (error) {
    logger.error("Error fetching promotions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a promotion
export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: ownerId } = req.owner;

    const coupon = await prisma.coupon.findFirst({ where: { id, ownerId } });
    if (!coupon) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    await prisma.coupon.delete({ where: { id } });

    res.status(200).json({ message: "Promotion deleted successfully" });
  } catch (error) {
    logger.error("Error deleting promotion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Toggle promotion status
export const togglePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: ownerId } = req.owner;

    const coupon = await prisma.coupon.findFirst({ where: { id, ownerId } });
    if (!coupon) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });

    res
      .status(200)
      .json({
        message: "Promotion status updated",
        isActive: updatedCoupon.isActive,
      });
  } catch (error) {
    logger.error("Error toggling promotion status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
