import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";

/**
 * Get unified revenue summary for the owner dashboard
 * Returns exactly the fields needed for the 6 top-row cards plus in-progress bookings.
 */
export const getRevenueSummary = async (req, res) => {
  try {
    const userId = req.user?.id || req.owner?.userId;
    const ownerId = req.owner?.ownerId || req.user?.ownerId;

    // Resolve owner record
    const ownerRecord = await prisma.ownerProfile.findFirst({
      where: {
        OR: [{ id: ownerId || undefined }, { userId: userId || undefined }],
      },
      include: { turfs: { select: { id: true, name: true } } },
    });

    if (!ownerRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Owner profile not found." });
    }

    const turfIds = ownerRecord.turfs.map((t) => t.id);

    // 1. Total Revenue: Sum of ownerRevenue for all COMPLETED bookings
    const completedBookingsAggr = await prisma.booking.aggregate({
      where: { turfId: { in: turfIds }, status: "COMPLETED" },
      _sum: { ownerRevenue: true },
    });
    const totalRevenue = completedBookingsAggr._sum.ownerRevenue || 0;

    // 2. Pending Settlements: Sum of ownerRevenue for CONFIRMED bookings in the future
    const pendingAggr = await prisma.booking.aggregate({
      where: { turfId: { in: turfIds }, status: "CONFIRMED" },
      _sum: { ownerRevenue: true },
    });
    const pendingSettlements = pendingAggr._sum.ownerRevenue || 0;

    // 3. In-Progress Bookings (Review Window countdown)
    const inProgressBookings = await prisma.booking.findMany({
      where: {
        turfId: { in: turfIds },
        status: "IN_REVIEW_WINDOW",
        revenueStatus: "IN_PROGRESS",
      },
      select: {
        id: true,
        playStartTime: true,
        reviewWindowEndsAt: true,
        ownerRevenue: true,
        turf: { select: { name: true } },
      },
      orderBy: { reviewWindowEndsAt: "asc" },
    });

    // 4. Recent relevant wallet transactions (Settlements, Withdrawals, Disputes)
    const recentTransactions = await prisma.walletTransaction.findMany({
      where: {
        userId: ownerRecord.userId,
        type: {
          in: ["SETTLEMENT", "WITHDRAWAL", "DISPUTE_FREEZE", "DISPUTE_RELEASE"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.status(200).json({
      success: true,
      data: {
        balances: {
          usable: ownerRecord.walletBalance || 0,
          inProgress: ownerRecord.inProgressBalance || 0,
          dispute: ownerRecord.disputeBalance || 0,
          withdrawn: ownerRecord.withdrawnBalance || 0,
          totalRevenue,
          pendingSettlements,
        },
        inProgressBookings,
        recentTransactions,
      },
    });
  } catch (error) {
    logger.error("[REVENUE API] Summary error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching revenue summary.",
      });
  }
};

/**
 * Get paginated list of revenue-related transactions
 */
export const getRevenueTransactions = async (req, res) => {
  try {
    const userId = req.user?.id || req.owner?.userId;
    const ownerId = req.owner?.ownerId || req.user?.ownerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const ownerRecord = await prisma.ownerProfile.findFirst({
      where: {
        OR: [{ id: ownerId || undefined }, { userId: userId || undefined }],
      },
    });

    if (!ownerRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Owner profile not found." });
    }

    const query = {
      userId: ownerRecord.userId,
      type: {
        in: [
          "SETTLEMENT",
          "REVENUE",
          "WITHDRAWAL",
          "DISPUTE_FREEZE",
          "DISPUTE_RELEASE",
          "HOST_GAME",
          "JOIN_GAME",
        ],
      },
    };

    const transactions = await prisma.walletTransaction.findMany({
      where: query,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        booking: {
          select: { playStartTime: true, turf: { select: { name: true } } },
        },
      },
    });

    const total = await prisma.walletTransaction.count({ where: query });

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("[REVENUE API] Transactions error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching transactions." });
  }
};
