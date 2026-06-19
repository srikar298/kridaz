import { prisma } from "../../config/prisma.js";

export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, validUntil, usageLimit } =
      req.body;

    if (!code || !discountType || !discountValue || !validUntil) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        validUntil: new Date(validUntil),
        usageLimit: usageLimit || 0,
        isActive: true,
      },
    });

    res
      .status(201)
      .json({ message: "Coupon created successfully", coupon: newCoupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Coupon code already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: { isActive },
    });

    res
      .status(200)
      .json({ message: "Coupon status updated", coupon: updatedCoupon });
  } catch (error) {
    console.error("Error updating coupon status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.coupon.delete({
      where: { id },
    });

    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
