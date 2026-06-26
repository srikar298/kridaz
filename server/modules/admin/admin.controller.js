import { NotFoundError, ConflictError, BadRequestError } from "@kridaz/common";
import { prisma } from "../../config/prisma.js";
import { logAdminAction } from "../../utils/auditLogger.js";
import NotificationService from "../../services/notification.service.js";
import logger from "../../utils/logger.js";
import argon2 from "argon2";
import crypto from "crypto";

/**
 * Helper to perform cascade deletion of all user-related data.
 * Purges posts, stories, games, bookings, reviews, and social interactions.
 */
const cleanupUserData = async (userIds) => {
  if (!Array.isArray(userIds)) userIds = [userIds];

  try {
    const owners = await prisma.ownerProfile.findMany({
      where: { userId: { in: userIds } },
    });
    const ownerIds = owners.map((o) => o.id);

    // Find all stories for these users to clean up R2
    const userStories = await prisma.story.findMany({
      where: { userId: { in: userIds } },
    });
    if (userStories.length > 0) {
      const { deleteStoryFilesFromR2 } = await import("../../utils/r2.js");
      await Promise.all(
        userStories.map((story) =>
          deleteStoryFilesFromR2(story).catch((err) =>
            logger.error(
              `[ADMIN_CLEANUP] R2 cleanup error for user story ${story.id}:`,
              err
            )
          )
        )
      );
    }

    await prisma.$transaction([
      // 1. Content: Posts & Stories
      prisma.post.deleteMany({ where: { authorId: { in: userIds } } }),
      prisma.story.deleteMany({ where: { userId: { in: userIds } } }),

      // 2. Gameplay: Games & Matches
      prisma.hostedGame.deleteMany({ where: { hostId: { in: userIds } } }),

      // 3. Transactions & Feedback
      prisma.booking.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.review.deleteMany({ where: { userId: { in: userIds } } }),

      // 4. Requests & Lifecycle
      prisma.ownerRequest.deleteMany({ where: { userId: { in: userIds } } }),

      // 5. Support & Disputes
      prisma.supportTicket.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.dispute.deleteMany({ where: { raisedById: { in: userIds } } }),

      // 6. Wallet & Communication
      prisma.walletTransaction.deleteMany({
        where: { userId: { in: userIds } },
      }),
      prisma.notification.deleteMany({ where: { userId: { in: userIds } } }),

      // 7. Messaging
      prisma.chatParticipant.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.message.deleteMany({ where: { senderUserId: { in: userIds } } }),
    ]);

    if (ownerIds.length > 0) {
      await prisma.$transaction([
        prisma.review.deleteMany({
          where: { professionalId: { in: ownerIds } },
        }),
        prisma.withdrawalRequest.deleteMany({
          where: { ownerId: { in: ownerIds } },
        }),
        prisma.turf.deleteMany({ where: { ownerId: { in: ownerIds } } }),
        prisma.ownerProfile.deleteMany({ where: { id: { in: ownerIds } } }),
      ]);
    }
  } catch (error) {
    logger.error("CASCADE_DELETION_ERROR:", error);
    throw error;
  }
};

export const getAllUsers = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          walletBalance: true,
          isVerified: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: "success",
      users: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error in getAllUsers: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAdminDashboardData = async (req, res) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalTurfs,
      pendingTurfs,
      totalBookings,
      pendingRequests,
      totalCoaches,
      totalUmpires,
      totalStreamers,
      totalScorers,
      payoutAggr,
      openTickets,
      pendingDisputes,
      totalCommunityPosts,
      totalHostedGames,
      publishedBlogs,
      userWalletAggr,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.ownerProfile.count({
        where: { user: { role: { in: ["VENUE_OWNER", "OWNER"] } } },
      }),
      prisma.turf.count(),
      prisma.turf.count({ where: { status: "pending" } }),
      prisma.booking.count(),
      prisma.ownerRequest.count({ where: { status: "pending" } }),
      prisma.ownerProfile.count({ where: { user: { role: "COACH" } } }),
      prisma.ownerProfile.count({ where: { user: { role: "UMPIRE" } } }),
      prisma.ownerProfile.count({ where: { user: { role: "STREAMER" } } }),
      prisma.ownerProfile.count({ where: { user: { role: "SCORER" } } }),
      prisma.withdrawalRequest.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.dispute.count({ where: { status: "PENDING" } }),
      prisma.post.count(),
      prisma.hostedGame.count(),
      prisma.blog.count({ where: { status: "PUBLISHED" } }),
      prisma.user.aggregate({
        _sum: { walletBalance: true },
      }),
    ]);

    const recentAuditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Simple group by for booking history
    const bookingHistoryRaw = await prisma.booking.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalPrice: true },
    });

    const historyMap = bookingHistoryRaw.reduce((acc, b) => {
      const date = b.createdAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + Number(b.totalPrice);
      return acc;
    }, {});

    const bookingHistory = Object.keys(historyMap)
      .sort()
      .map((date) => ({
        date,
        amount: historyMap[date],
      }));

    const responseData = {
      totalUsers,
      totalOwners,
      totalTurfs,
      pendingTurfs,
      totalBookings,
      pendingRequests,
      totalCoaches,
      totalUmpires,
      totalStreamers,
      totalScorers,
      totalPayouts: payoutAggr._sum.amount || 0,
      openTickets,
      pendingDisputes,
      totalCommunityPosts,
      totalHostedGames,
      publishedBlogs,
      totalUserWalletBalance: userWalletAggr._sum.walletBalance || 0,
      recentAuditLogs: recentAuditLogs.map((log) => ({
        ...log,
        admin: log.user,
      })),
      bookingHistory,
      platformHealth: {
        uptime: "99.9%",
        syncStatus: "Active",
        professionalGrowth: "+12%",
      },
    };

    return res.status(200).json(responseData);
  } catch (err) {
    logger.error("CRITICAL ERROR in getAdminDashboardData:", err);
    return res.status(500).json({
      success: false,
      message: "Error getting dashboard",
      error: err.message,
    });
  }
};

export const getAllTransactions = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const transactions = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true } },
        turf: { select: { name: true } },
      },
    });

    return res.status(200).json({
      message: "Fetched all transactions",
      transactions: transactions,
    });
  } catch (error) {
    logger.error("Error in getAllTransactions: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllOwners = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const owners = await prisma.ownerProfile.findMany({
      where: {
        user: {
          role: {
            in: [
              "VENUE_OWNER",
              "OWNER",
              "COACH",
              "UMPIRE",
              "STREAMER",
              "SCORER",
            ],
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
      take: 200,
    });

    const mappedOwners = owners.map((o) => ({
      ...o,
      name: o.user?.name || o.businessName,
      email: o.user?.email || "",
      phone: o.user?.phone || "",
      status: o.user?.status || "active",
      createdAt: o.user?.createdAt || o.createdAt,
    }));

    res.status(200).json({
      message: "Fetched all owners",
      owners: mappedOwners,
    });
  } catch (error) {
    logger.error("Error in getAllOwners: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTurfByOwnerId = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const turfs = await prisma.turf.findMany({
      where: { ownerId: id },
      include: {
        reviews: { select: { rating: true } },
      },
    });

    const owner = await prisma.ownerProfile.findUnique({
      where: { id },
    });

    const turfsWithAvgRating = turfs.map((t) => {
      const avgRating =
        t.reviews.length > 0
          ? t.reviews.reduce((acc, r) => acc + r.rating, 0) / t.reviews.length
          : 0;
      return {
        ...t,
        avgRating: Number(avgRating.toFixed(1)),
      };
    });

    return res.status(200).json({
      message: "Fetched turf and owner",
      turfs: turfsWithAvgRating,
      owner: owner,
    });
  } catch (error) {
    logger.error("Error in getTurfByOwnerId: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllRequestedOwners = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const ownerRequests = await prisma.ownerRequest.findMany({
      where: {
        status: "pending",
        role: { in: ["venu_owners", "owner", "venue_owner"] },
      },
      include: { user: { select: { profilePicture: true, name: true } } },
    });
    const ownerRejectedRequests = await prisma.ownerRequest.findMany({
      where: {
        status: "rejected",
        role: { in: ["venu_owners", "owner", "venue_owner"] },
      },
      include: { user: { select: { profilePicture: true, name: true } } },
    });

    // Map fields for frontend compatibility
    const mapRequest = (r) => ({
      ...r,
      userId_ref: r.user,
      userId: r.user,
    });

    res.status(200).json({
      success: true,
      message: "success",
      ownerRequests: ownerRequests.map(mapRequest),
      ownerRejectedRequests: ownerRejectedRequests.map(mapRequest),
    });
  } catch (err) {
    logger.error("Error in getAllRequestedOwners: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllProfessionals = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const professionals = await prisma.ownerProfile.findMany({
      where: {
        user: {
          role: { in: ["COACH", "UMPIRE", "STREAMER", "SCORER"] },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
      take: 200,
    });

    const mappedProfessionals = professionals.map((p) => ({
      ...p,
      name: p.user?.name || p.businessName,
      email: p.user?.email || "",
      phone: p.user?.phone || "",
      role: p.user?.role || "",
      status: p.user?.status || "active",
      createdAt: p.user?.createdAt || p.createdAt,
    }));

    res.status(200).json({
      message: "Fetched all professionals",
      professionals: mappedProfessionals,
    });
  } catch (error) {
    logger.error("Error in getAllProfessionals: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProfessionalDetails = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;

  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const professional = await prisma.ownerProfile.findUnique({
      where: { id },
      include: {
        profBookings: {
          include: {
            user: {
              select: {
                name: true,
                profilePicture: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!professional) {
      return res
        .status(404)
        .json({ success: false, message: "Professional not found" });
    }

    // Fetch hosted games officiated by this umpire
    const matches = await prisma.hostedGame.findMany({
      where: { umpireId: id },
      include: {
        host: { select: { id: true, name: true, email: true } },
        turf: { select: { name: true, location: true } },
      },
      orderBy: { date: "desc" },
    });

    const formattedMatches = matches.map((m) => ({
      ...m,
      ground: m.turf,
    }));

    return res.status(200).json({
      success: true,
      profile: { ...professional, bookings: professional.profBookings },
      matches: formattedMatches,
    });
  } catch (error) {
    logger.error("Error in getProfessionalDetails: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllRequestedProfessionals = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const professionalRequests = await prisma.ownerRequest.findMany({
      where: {
        status: "pending",
        role: { in: ["coach", "umpire", "streamer", "scorer"] },
      },
      include: { user: { select: { profilePicture: true, name: true } } },
    });
    const professionalRejectedRequests = await prisma.ownerRequest.findMany({
      where: {
        status: "rejected",
        role: { in: ["coach", "umpire", "streamer", "scorer"] },
      },
      include: { user: { select: { profilePicture: true, name: true } } },
    });

    const mapRequest = (r) => ({
      ...r,
      userId_ref: r.user,
      userId: r.user,
    });

    res.status(200).json({
      success: true,
      message: "success",
      professionalRequests: professionalRequests.map(mapRequest),
      professionalRejectedRequests:
        professionalRejectedRequests.map(mapRequest),
    });
  } catch (err) {
    logger.error("Error in getAllRequestedProfessionals: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllVerificationRequests = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const pendingRequests = await prisma.ownerRequest.findMany({
      where: { status: "pending" },
      include: { user: { select: { profilePicture: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const rejectedRequests = await prisma.ownerRequest.findMany({
      where: { status: "rejected" },
      include: { user: { select: { profilePicture: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const mapRequest = (r) => ({
      ...r,
      userId_ref: r.user,
      userId: r.user,
    });

    res.status(200).json({
      success: true,
      pendingRequests: pendingRequests.map(mapRequest),
      rejectedRequests: rejectedRequests.map(mapRequest),
    });
  } catch (err) {
    logger.error("Error in getAllVerificationRequests: ", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const approveOwnerRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { adminName, adminDesignation } = req.body;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const ownerRequest = await prisma.ownerRequest.findUnique({
      where: { id },
    });
    if (!ownerRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Owner request not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      let targetUserId = ownerRequest.userId;

      let roleToSet = ownerRequest.role.toUpperCase();
      if (roleToSet === "VENU_OWNERS") roleToSet = "VENUE_OWNER";

      if (!targetUserId) {
        let existingUser = await tx.user.findUnique({
          where: { email: ownerRequest.email },
        });

        if (!existingUser) {
          existingUser = await tx.user.create({
            data: {
              email: ownerRequest.email,
              username:
                ownerRequest.email.split("@")[0] +
                "_" +
                Math.random().toString(36).substring(2, 7),
              name: ownerRequest.name,
              phone: ownerRequest.phone,
              password: await argon2.hash(
                crypto.randomBytes(32).toString("hex")
              ), // Secure random placeholder since password can be updated later/via recovery
              role: roleToSet,
              isVerified: true,
            },
          });
        }
        targetUserId = existingUser.id;
      }

      let owner = await tx.ownerProfile.findUnique({
        where: { userId: targetUserId },
      });

      if (!owner) {
        owner = await tx.ownerProfile.create({
          data: {
            userId: targetUserId,
            businessName: ownerRequest.name,
            verified: true,
            verificationDocs: ownerRequest.documents || {},
            businessDetails: ownerRequest.businessDetails || {},
          },
        });
      } else {
        owner = await tx.ownerProfile.update({
          where: { id: owner.id },
          data: {
            verified: true,
            verificationDocs: ownerRequest.documents || owner.verificationDocs,
            businessDetails:
              ownerRequest.businessDetails || owner.businessDetails,
          },
        });
      }

      // Sync role back to User
      await tx.user.update({
        where: { id: targetUserId },
        data: { role: roleToSet },
      });

      // Update request status
      return tx.ownerRequest.update({
        where: { id },
        data: { status: "approved" },
      });
    });

    // Event-driven notification
    await NotificationService.publishEvent("PARTNER_REQUEST_APPROVED", {
      email: ownerRequest.email,
      phone: ownerRequest.phone,
      recipientId: targetUserId,
      recipientModel: "User",
      role: ownerRequest.role,
    });
    await logAdminAction(
      req,
      "APPROVE_PARTNER",
      "USER_MANAGEMENT",
      ownerRequest.id,
      {
        role: ownerRequest.role,
        email: ownerRequest.email,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Owner request approved and profile created",
    });
  } catch (err) {
    logger.error("Error in approveOwnerRequest: ", err);
    return res.status(500).json({ message: "error", data: err.message });
  }
};

export const deleteOwnerRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const ownerRequest = await prisma.ownerRequest.findUnique({
      where: { id },
    });
    if (!ownerRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Owner request not found" });
    }

    await prisma.ownerRequest.update({
      where: { id },
      data: { status: "rejected" },
    });

    // Event-driven notification
    await NotificationService.publishEvent("PARTNER_REQUEST_REJECTED", {
      email: ownerRequest.email,
      phone: ownerRequest.phone,
      recipientId: ownerRequest.userId,
      recipientModel: "User",
      role: ownerRequest.role,
    });
    await logAdminAction(
      req,
      "REJECT_PARTNER",
      "USER_MANAGEMENT",
      ownerRequest.id,
      {
        role: ownerRequest.role,
        email: ownerRequest.email,
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "Owner request rejected" });
  } catch (err) {
    logger.error("Error in deleteOwnerRequest: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const reconsiderOwnerRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const ownerRequest = await prisma.ownerRequest.findUnique({
      where: { id },
    });
    if (!ownerRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Owner request not found" });
    }

    await prisma.ownerRequest.update({
      where: { id },
      data: { status: "pending" },
    });

    const to = ownerRequest.email;
    const subject = "Your request has been reconsidered";
    const html = ` 
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="color: #4CAF50;">Your request to become an owner has been reconsidered</h1>
        <p>We apologize for the inconvenience. Please contact us if you have any further questions.</p>
        <p>Thank you for your understanding.</p>
    </div>`;

    NotificationService.sendEmail({ to, subject, html });
    return res
      .status(200)
      .json({ success: true, message: "Owner request reconsidered" });
  } catch (err) {
    logger.error("Error in reconsiderOwnerRequest: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllWithdrawalRequests = async (req, res) => {
  const admin = req.admin.role;
  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const requests = await prisma.withdrawalRequest.findMany({
      include: {
        owner: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                role: true,
                profilePicture: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedRequests = requests.map((req) => ({
      ...req,
      owner: {
        ...req.owner,
        name: req.owner.user?.name || req.owner.businessName,
        email: req.owner.user?.email,
        role: req.owner.user?.role,
        profilePicture: req.owner.user?.profilePicture,
      },
    }));

    res.status(200).json({
      success: true,
      requests: formattedRequests,
    });
  } catch (error) {
    logger.error("Error in getAllWithdrawalRequests: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const approveWithdrawalRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { transactionId, screenshot, masterPassword } = req.body;

  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }

  // C-15: Master Payout Password verification
  const expectedPassword = process.env.MASTER_PAYOUT_PASSWORD || process.env.ADMIN_SEED_PASSWORD;
  if (!expectedPassword || masterPassword !== expectedPassword) {
    return res.status(401).json({
      success: false,
      message: "Invalid or missing Master Payout Password.",
    });
  }

  try {
    const request = await prisma.withdrawalRequest.findUnique({
      where: { id },
    });
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status.toLowerCase()}`,
      });
    }

    const owner = await prisma.ownerProfile.findUnique({
      where: { id: request.ownerId },
      include: { user: true },
    });
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "Owner not found" });
    }

    if (Number(owner.walletBalance) < Number(request.amount)) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient owner wallet balance" });
    }

    const currentBankDetails =
      request.bankDetails && typeof request.bankDetails === "object"
        ? request.bankDetails
        : {};

    await prisma.$transaction([
      prisma.ownerProfile.update({
        where: { id: request.ownerId },
        data: {
          walletBalance: { decrement: request.amount },
          reservedBalance:
            owner.reservedBalance >= request.amount
              ? { decrement: request.amount }
              : owner.reservedBalance,
        },
      }),
      prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: "COMPLETED",
          transactionId,
          processedAt: new Date(),
          bankDetails: {
            ...currentBankDetails,
            screenshotUrl: screenshot || null,
          },
        },
      }),
    ]);

    // Event-driven notification
    await NotificationService.publishEvent("WITHDRAWAL_APPROVED", {
      email: owner.email,
      phone: owner.user?.phone,
      recipientId: owner.userId,
      recipientModel: "User",
      amount: request.amount,
      transactionId: transactionId || "N/A",
    });
    await logAdminAction(req, "APPROVE_WITHDRAWAL", "FINANCE", request.id, {
      amount: request.amount,
      transactionId,
    });

    res
      .status(200)
      .json({ success: true, message: "Withdrawal approved and processed" });
  } catch (error) {
    logger.error("Error in approveWithdrawalRequest: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const rejectWithdrawalRequest = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { reason } = req.body;

  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const request = await prisma.withdrawalRequest.findUnique({
      where: { id },
    });
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status.toLowerCase()}`,
      });
    }

    const owner = await prisma.ownerProfile.findUnique({
      where: { id: request.ownerId },
      include: { user: true },
    });

    await prisma.$transaction(async (tx) => {
      if (owner && owner.reservedBalance >= request.amount) {
        await tx.ownerProfile.update({
          where: { id: request.ownerId },
          data: { reservedBalance: { decrement: request.amount } },
        });
      }

      await tx.withdrawalRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          processedAt: new Date(),
        },
      });
    });

    if (owner) {
      // Event-driven notification
      await NotificationService.publishEvent("WITHDRAWAL_REJECTED", {
        email: owner.email,
        phone: owner.user?.phone,
        recipientId: owner.userId,
        recipientModel: "User",
        amount: request.amount,
        reason: reason || "No specific reason provided.",
      });
    }

    await logAdminAction(req, "REJECT_WITHDRAWAL", "FINANCE", request.id, {
      amount: request.amount,
      reason,
    });

    res
      .status(200)
      .json({ success: true, message: "Withdrawal request rejected" });
  } catch (error) {
    logger.error("Error in rejectWithdrawalRequest: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const verifyKYC = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { status } = req.body;

  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const owner = await prisma.ownerProfile.findUnique({ where: { id } });
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    const bankingDetails = owner.bankingDetails || {};
    bankingDetails.kycStatus = status;

    await prisma.ownerProfile.update({
      where: { id },
      data: { bankingDetails },
    });

    await logAdminAction(req, `KYC_${status}`, "USER_MANAGEMENT", owner.id, {
      status,
    });

    res
      .status(200)
      .json({ success: true, message: `KYC status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  const { status } = req.body;

  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    await logAdminAction(
      req,
      `USER_${status.toUpperCase()}`,
      "USER_MANAGEMENT",
      user.id,
      { status }
    );

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;

  if (admin?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Perform cascade deletion of all related data
    await cleanupUserData(id);

    // Finally delete the user record
    await prisma.user.delete({ where: { id } });

    await logAdminAction(req, "DELETE_USER", "USER_MANAGEMENT", id, {
      name: user.name,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: "User and all associated data permanently deleted",
    });
  } catch (error) {
    logger.error("Error in deleteUser:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteOwner = async (req, res) => {
  const adminRole = req.admin.role;
  const { id } = req.params;

  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }

  try {
    const owner = await prisma.ownerProfile.findUnique({ where: { id } });
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    // If there's an associated User, perform full cascade cleanup starting from User
    if (owner.userId) {
      await cleanupUserData(owner.userId);
      await prisma.user.delete({ where: { id: owner.userId } });
    } else {
      // If no User ID (rare), just cleanup owner-specific data
      await prisma.turf.deleteMany({ where: { ownerId: id } });
      await prisma.withdrawalRequest.deleteMany({ where: { ownerId: id } });
      await prisma.hostedGame.updateMany({
        where: { umpireId: id },
        data: { umpireId: null },
      });
      await prisma.ownerProfile.delete({ where: { id } });
    }

    await logAdminAction(req, "DELETE_OWNER", "USER_MANAGEMENT", id, {
      name: owner.name,
      email: owner.email,
    });

    res.status(200).json({
      success: true,
      message: "Owner and all associated data permanently deleted",
    });
  } catch (error) {
    logger.error("Error in deleteOwner:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllHostedGames = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const games = await prisma.hostedGame.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        host: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        turf: { select: { id: true, name: true, location: true } },
        umpire: { select: { id: true, name: true } },
      },
    });

    const formattedGames = games;

    res.status(200).json({ success: true, games: formattedGames });
  } catch (error) {
    logger.error("Error in getAllHostedGames:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteHostedGame = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    const game = await prisma.hostedGame.delete({ where: { id } });
    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    await logAdminAction(req, "DELETE_HOSTED_GAME", "GAME_MANAGEMENT", id, {
      gameDetails: { id, date: game.date, type: game.gameType },
    });

    res
      .status(200)
      .json({ success: true, message: "Game deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteHostedGame:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchDeleteGames = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { gameIds } = req.body;
  if (!gameIds || !Array.isArray(gameIds)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid game IDs" });
  }

  try {
    const result = await prisma.hostedGame.deleteMany({
      where: { id: { in: gameIds } },
    });

    await logAdminAction(req, "BATCH_DELETE_GAMES", "GAME_MANAGEMENT", null, {
      count: result.count,
      gameIds,
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.count} games`,
      count: result.count,
    });
  } catch (error) {
    logger.error("Error in batchDeleteGames:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchUpdateGameStatus = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { gameIds, status } = req.body;
  if (!gameIds || !Array.isArray(gameIds) || !status) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request parameters" });
  }

  try {
    const result = await prisma.hostedGame.updateMany({
      where: { id: { in: gameIds } },
      data: { status },
    });

    await logAdminAction(
      req,
      "BATCH_GAME_STATUS_UPDATE",
      "GAME_MANAGEMENT",
      null,
      { count: result.count, status, gameIds }
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.count} games to ${status}`,
      count: result.count,
    });
  } catch (error) {
    logger.error("Error in batchUpdateGameStatus:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchDeleteUsers = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user IDs" });
  }

  try {
    // Perform full cascade cleanup for all users
    await cleanupUserData(userIds);

    // Finally delete the user records
    const result = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    // Log the batch action
    await logAdminAction(req, "BATCH_DELETE_USERS", "USER_MANAGEMENT", null, {
      count: result.count,
      userIds,
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.count} users and all associated data`,
      count: result.count,
    });
  } catch (error) {
    logger.error("Error in batchDeleteUsers:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchUpdateUserStatus = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { userIds, status } = req.body;
  if (!userIds || !Array.isArray(userIds) || !status) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request parameters" });
  }

  try {
    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { status },
    });

    // Log the batch action
    await logAdminAction(req, "BATCH_STATUS_UPDATE", "USER_MANAGEMENT", null, {
      count: result.count,
      status,
      userIds,
    });

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.count} users to ${status}`,
      count: result.count,
    });
  } catch (error) {
    logger.error("Error in batchUpdateUserStatus:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchDeleteOwners = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { ownerIds } = req.body;
  if (!ownerIds || !Array.isArray(ownerIds)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid owner IDs" });
  }

  try {
    const owners = await prisma.ownerProfile.findMany({
      where: { id: { in: ownerIds } },
    });
    const userIds = owners.filter((o) => o.userId).map((o) => o.userId);

    // Delete associated User entries if they exist
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    // Delete Owner entries
    const result = await prisma.ownerProfile.deleteMany({
      where: { id: { in: ownerIds } },
    });

    // Log the batch action
    await logAdminAction(req, "BATCH_DELETE_OWNERS", "USER_MANAGEMENT", null, {
      count: result.count,
      ownerIds,
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.count} records`,
      count: result.count,
    });
  } catch (error) {
    logger.error("Error in batchDeleteOwners:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const batchUpdateOwnerStatus = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { ownerIds, status } = req.body;
  if (!ownerIds || !Array.isArray(ownerIds) || !status) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request parameters" });
  }

  try {
    const owners = await prisma.ownerProfile.findMany({
      where: { id: { in: ownerIds } },
      select: { userId: true },
    });
    const userIds = owners.map((o) => o.userId).filter(Boolean);

    let count = 0;
    if (userIds.length > 0) {
      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { status },
      });
      count = result.count;
    }

    // Log the batch action
    await logAdminAction(
      req,
      "BATCH_OWNER_STATUS_UPDATE",
      "USER_MANAGEMENT",
      null,
      { count, status, ownerIds }
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${count} records to ${status}`,
      count,
    });
  } catch (error) {
    logger.error("Error in batchUpdateOwnerStatus:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllDisputes = async (req, res) => {
  try {
    const disputedGames = await prisma.hostedGame.findMany({
      where: { coinTransferStatus: "DISPUTED" },
      include: {
        host: {
          select: { id: true, name: true, phone: true },
        },
        slots: {
          where: { status: "JOINED", userId: { not: null } },
          include: {
            user: {
              select: { id: true, name: true, phone: true, email: true },
            },
          },
        },
        disputes: {
          include: {
            raisedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    return res.status(200).json({ success: true, games: disputedGames });
  } catch (error) {
    logger.error("Error fetching disputes:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const resolveDispute = async (req, res) => {
  try {
    const { gameId, action, refunds } = req.body;

    const { default: WalletService } =
      await import("../services/wallet.service.js");
    const { runInTransaction } = await import("../../utils/dbHelpers.js");

    await runInTransaction(async ({ tx }) => {
      const game = await tx.hostedGame.findUnique({
        where: { id: gameId },
        include: { slots: true },
      });
      if (!game)
        throw new NotFoundError("Game not found", { code: "GAME_NOT_FOUND" });
      if (game.coinTransferStatus !== "DISPUTED") {
        throw new ConflictError("Game is not in a disputed state", {
          code: "VALIDATION_ERROR",
        });
      }

      const isTeamMatch = game.matchPreferences?.opponentType === "TEAM";
      let totalAmountCollected = 0;

      if (isTeamMatch) {
         const prefs = game.matchPreferences || {};
         const applications = Array.isArray(prefs.applications) ? prefs.applications : [];
         const acceptedApp = applications.find(app => app.status === "APPROVED");
         if (acceptedApp) {
             const advance = acceptedApp.advancePaid || 0;
             const advanceRefunded = acceptedApp.advanceRefunded || 0;
             const currentAdvanceHeld = Math.max(0, advance - advanceRefunded);
             
             const targetPlayers = parseInt(prefs.opponentTargetPlayers) || 2;
             const memberCharge = acceptedApp.totalRequired / targetPlayers;
             
             const teamB = game.teams.find(t => t.linkedTeamId === acceptedApp.teamId);
             if (teamB) {
                const memberSlots = game.slots.filter(s => s.teamId === teamB.id && s.userId && s.userId !== acceptedApp.captainId && s.paymentStatus === "RESERVED").length;
                totalAmountCollected = currentAdvanceHeld + (memberSlots * memberCharge);
             } else {
                totalAmountCollected = currentAdvanceHeld;
             }
         }
      } else {
        const totalPaidSlots = game.slots.filter(
          (s) => s.status === "JOINED" && s.userId
        ).length;
        totalAmountCollected = Number(game.perPlayerCharge) * totalPaidSlots;
      }

      if (action === "TRANSFER_TO_HOST") {
        if (totalAmountCollected > 0) {
          // If we want to be fully robust, we would release(shouldDebit=true) for players here.
          // But maintaining legacy compatibility, we just credit the host.
          await WalletService.credit(
            game.hostId,
            "user",
            totalAmountCollected,
            tx
          );
          await tx.walletTransaction.create({
            data: {
              userId: game.hostId,
              amount: totalAmountCollected,
              type: "SLOT_INCOME",
              status: "SUCCESS",
              description: `Received payment from players for game (Dispute Resolved)`,
            },
          });
        }
      } else if (action === "REFUND_SELECTED") {
        let totalRefunded = 0;

        if (refunds && refunds.length > 0) {
          for (const refund of refunds) {
            const { userId, amount } = refund;
            
            const maxRefund = isTeamMatch ? totalAmountCollected : game.perPlayerCharge;
            if (amount > maxRefund) {
              throw new BadRequestError("Refund amount cannot exceed limit", {
                code: "VALIDATION_ERROR",
              });
            }

            if (isTeamMatch) {
              await WalletService.release(userId, "user", amount, false, tx);
            } else {
              await WalletService.credit(userId, "user", amount, tx);
            }

            await tx.walletTransaction.create({
              data: {
                userId,
                amount,
                type: "REFUND",
                status: "SUCCESS",
                description: "Partial refund for disputed game",
              },
            });
            totalRefunded += amount;
          }
        }

        const remainingToHost = totalAmountCollected - totalRefunded;
        if (remainingToHost > 0) {
          await WalletService.credit(game.hostId, "user", remainingToHost, tx);
          await tx.walletTransaction.create({
            data: {
              userId: game.hostId,
              amount: remainingToHost,
              type: "SLOT_INCOME",
              status: "SUCCESS",
              description: "Received remaining payment for game after refunds",
            },
          });
        }
      }

      await tx.hostedGame.update({
        where: { id: gameId },
        data: { coinTransferStatus: "RESOLVED" },
      });

      await tx.gameDispute.updateMany({
        where: { gameId },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });
    });

    return res
      .status(200)
      .json({ success: true, message: "Dispute resolved successfully" });
  } catch (error) {
    logger.error("Error resolving dispute:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const getAllErrorLogs = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const alerts = await prisma.sentryAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return res.status(200).json({ success: true, alerts });
  } catch (error) {
    logger.error("Error fetching sentry alerts:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const resolveErrorLog = async (req, res) => {
  const adminRole = req.admin.role;
  if (adminRole?.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const { id } = req.params;
    const alert = await prisma.sentryAlert.update({
      where: { id },
      data: { isResolved: true },
    });
    return res.status(200).json({ success: true, alert });
  } catch (error) {
    logger.error("Error resolving sentry alert:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
