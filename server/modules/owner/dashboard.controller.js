import { prisma } from "../../config/prisma.js";
import { format, formatDistanceToNow } from "date-fns";
import logger from "../../utils/logger.js";

export const getDashboardData = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const { venueId } = req.query;
  logger.info(`[DASHBOARD_OWNER] Fetching data for ${role} (ID: ${userId})`);

  // Redirect based on role
  if (role === "coach") return getCoachDashboardData(req, res);
  if (role?.toLowerCase().includes("umpire"))
    return getUmpireDashboardData(req, res);
  if (role?.toLowerCase() === "streamer")
    return getStreamerDashboardData(req, res);
  if (role?.toLowerCase() === "scorer") return getScorerDashboardData(req, res);

  try {
    // 1. Find the owner profile
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { userId: userId },
      include: { turfs: true },
    });

    if (!ownerProfile) {
      logger.info(`DEBUG: No owner profile found for User ID: ${userId}`);
      return res
        .status(404)
        .json({ success: false, message: "Owner profile not found" });
    }

    let turfIds = ownerProfile.turfs.map((t) => t.id);

    // Filter by specific venue if requested
    if (venueId && turfIds.includes(venueId)) {
      turfIds = [venueId];
    }

    if (turfIds.length === 0) {
      return res.json({
        totalBookings: 0,
        totalReviews: 0,
        averageRating: 0,
        totalRevenue: 0,
        totalTurfs: 0,
        revenueTrendWeek: [],
        revenueTrendMonth: [],
        recentBookings: [],
        activeUsers: 0,
        utilization: 0,
      });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 2. Parallel queries for dashboard metrics
    const [
      totalBookings,
      totalReviews,
      reviews,
      revenueData,
      revenueOverTimeWeek,
      revenueOverTimeMonth,
      activeUsersCount,
      occupancyRaw,
      revenueByVenueRaw,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: { turfId: { in: turfIds }, status: { not: "CANCELLED" } },
      }),
      prisma.review.count({ where: { turfId: { in: turfIds } } }),
      prisma.review.findMany({
        where: { turfId: { in: turfIds } },
        select: { rating: true },
      }),
      // Total Revenue
      prisma.booking.aggregate({
        where: { turfId: { in: turfIds }, status: { not: "CANCELLED" } },
        _sum: { ownerRevenue: true, paidAmount: true },
      }),
      // Revenue Over Time (Week)
      prisma.booking.findMany({
        where: {
          turfId: { in: turfIds },
          status: { not: "CANCELLED" },
          createdAt: { gte: sevenDaysAgo },
        },
        select: { ownerRevenue: true, createdAt: true },
      }),
      // Revenue Over Time (Month)
      prisma.booking.findMany({
        where: {
          turfId: { in: turfIds },
          status: { not: "CANCELLED" },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { ownerRevenue: true, createdAt: true },
      }),
      // Unique Customers
      prisma.booking.groupBy({
        by: ["userId"],
        where: { turfId: { in: turfIds }, status: { not: "CANCELLED" } },
      }),
      // Detailed Occupancy
      prisma.booking.findMany({
        where: { turfId: { in: turfIds }, status: { not: "CANCELLED" } },
        include: { timeSlot: true, turf: { select: { name: true } } },
      }),
      // Revenue By Venue
      prisma.booking.groupBy({
        by: ["turfId"],
        where: { turfId: { in: turfIds }, status: { not: "CANCELLED" } },
        _sum: { ownerRevenue: true },
      }),
      // Recent Bookings
      prisma.booking.findMany({
        where: { turfId: { in: turfIds } },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true, profilePicture: true } },
          turf: { select: { name: true, image: true } },
          timeSlot: true,
        },
      }),
    ]);

    // 3. Process aggregation data
    const averageRating =
      totalReviews > 0
        ? (
            reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews
          ).toFixed(1)
        : 0;

    const groupRevenueByDate = (data) => {
      return data.reduce((acc, b) => {
        const date = b.createdAt.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + Number(b.ownerRevenue || 0);
        return acc;
      }, {});
    };

    const revenueTrendWeek = Object.entries(
      groupRevenueByDate(revenueOverTimeWeek)
    ).map(([id, revenue]) => ({ id, revenue }));
    const revenueTrendMonth = Object.entries(
      groupRevenueByDate(revenueOverTimeMonth)
    ).map(([id, revenue]) => ({ id, revenue }));

    // Occupancy Heatmap
    const occupancyHeatmap = occupancyRaw.reduce((acc, b) => {
      if (!b.timeSlot) return acc;
      const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        new Date(b.timeSlot.startTime).getDay()
      ];
      const hour = new Date(b.timeSlot.startTime).getHours();
      const key = `${day}-${hour}`;
      if (!acc[key]) acc[key] = { day, hour, value: 0, turfs: new Set() };
      acc[key].value += 1;
      acc[key].turfs.add(b.turf?.name);
      return acc;
    }, {});

    const processedOccupancy = Object.values(occupancyHeatmap).map((o) => ({
      ...o,
      turfs: Array.from(o.turfs),
    }));

    const venueNames = new Map(ownerProfile.turfs.map((t) => [t.id, t.name]));
    const revenueByVenue = revenueByVenueRaw.map((r) => ({
      name: venueNames.get(r.turfId) || "Unknown",
      value: Number(r._sum.ownerRevenue || 0),
    }));

    const venueHealth = {
      score: Math.round((Number(averageRating) / 5) * 100),
      profileComp: 95,
      responseRate: 98,
      satisfaction: Number(averageRating),
      cancellation: 1.2,
    };

    const totalPossibleSlots = ownerProfile.turfs.length * 12 * 30; // Approx logic
    const utilization =
      totalPossibleSlots > 0
        ? Math.min(100, Math.round((totalBookings / totalPossibleSlots) * 100))
        : 0;

    res.json({
      totalBookings,
      totalReviews,
      averageRating: Number(averageRating),
      totalRevenue: Number(revenueData._sum.ownerRevenue || 0),
      settlementRevenue: Number(revenueData._sum.paidAmount || 0),
      totalTurfs: ownerProfile.turfs.length,
      turfsList: ownerProfile.turfs.map((t) => ({ id: t.id, name: t.name })),
      revenueTrendWeek,
      revenueTrendMonth,
      revenueByVenue,
      occupancyHeatmap: processedOccupancy,
      venueHealth,
      recentBookings: recentBookings.map((b) => ({
        ...b,
        user: { ...b.user, avatar: b.user.profilePicture },
        timeSlot: b.timeSlot
          ? { startTime: b.timeSlot.startTime, endTime: b.timeSlot.endTime }
          : null,
      })),
      activeUsers: activeUsersCount.length,
      utilization,
    });
  } catch (error) {
    logger.error("CRITICAL ERROR in getDashboardData:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching dashboard data",
        error: error.message,
      });
  }
};

export const getCoachDashboardData = async (req, res) => {
  const userId = req.user.id;
  logger.info(`[DASHBOARD_COACH] Fetching data for User ID: ${userId}`);

  try {
    // 1. Find coach profile
    const coachProfile = await prisma.ownerProfile.findUnique({
      where: { userId: userId },
      include: {
        sessions: {
          include: {
            students: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profilePicture: true,
              },
            },
          },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!coachProfile) {
      logger.warn(
        `[DASHBOARD_COACH] Profile not found for userId: ${userId}, returning empty state`
      );
      return res.json({
        activeTrainees: 0,
        totalSessions: 0,
        totalRevenue: 0,
        revenueOverTimeRaw: [],
        liveStreamMins: 0,
        performanceIndex: 0,
        studentProgress: [],
        sessions: [],
        trainees: [],
        coach: null,
        upcomingSessions: [],
      });
    }

    const sessions = coachProfile.sessions || [];

    // 2. Extract unique trainees
    const traineeMap = new Map();
    sessions.forEach((s) => {
      s.students.forEach((student) => {
        traineeMap.set(student.id, student);
      });
    });
    const trainees = Array.from(traineeMap.values());

    // 3. Revenue from Wallet
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [revenueData, revenueOverTimeRaw] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: {
          userId: userId,
          status: "SUCCESS",
          type: { notIn: ["DEBIT", "TOPUP", "REFUND", "WITHDRAWAL"] },
        },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.groupBy({
        by: ["createdAt"],
        where: {
          userId: userId,
          status: "SUCCESS",
          type: { notIn: ["DEBIT", "TOPUP", "REFUND", "WITHDRAWAL"] },
          createdAt: { gte: sevenDaysAgo },
        },
        _sum: { amount: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const totalRevenue = Number(revenueData._sum.amount || 0);
    const processedRevenueOverTime = revenueOverTimeRaw.map((r) => ({
      id: r.createdAt.toISOString().split("T")[0],
      revenue: Number(r._sum.amount || 0),
    }));

    // 4. Assemble response
    res.json({
      activeTrainees: trainees.length,
      totalSessions: sessions.length,
      totalRevenue,
      revenueOverTimeRaw: processedRevenueOverTime,
      liveStreamMins: 0,
      performanceIndex: 85, // Placeholder or calculated if logic exists
      studentProgress: [],
      sessions: sessions.map((s) => ({
        ...s,
        traineeCount: s.students.length,
        students: s.students.map((st) => ({
          ...st,
          avatar: st.profilePicture,
        })),
      })),
      trainees: trainees.map((t) => ({ ...t, avatar: t.profilePicture })),
      coach: coachProfile,
      upcomingSessions: sessions
        .filter((s) => s.status === "upcoming")
        .slice(0, 5)
        .map((s) => ({
          id: s.id,
          time: s.time || "TBD",
          type: s.type || "Session",
          name: s.name || "Coaching Session",
          student: `${s.students.length} Students`,
        })),
    });
  } catch (error) {
    logger.error("CRITICAL ERROR in getCoachDashboardData:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching coach dashboard data",
        error: error.message,
      });
  }
};

export const getUmpireDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`[DASHBOARD_UMPIRE] Resolving for userId: ${userId}`);

    const umpireProfile = await prisma.ownerProfile.findUnique({
      where: { userId: userId },
    });

    if (!umpireProfile) {
      logger.warn(
        `[DASHBOARD_UMPIRE] Profile not found for userId: ${userId}, returning default empty state`
      );
      return res.json({
        matchesOfficiated: 0,
        upcomingMatches: 0,
        officialRating: 0,
        earnings: 0,
        totalRevenue: 0,
        revenueOverTimeRaw: [],
        matchEngagement: [],
        matches: [],
        upcomingAssignments: [],
        upgradeRequested: false,
      });
    }

    const hostedGames = await prisma.hostedGame.findMany({
      where: {
        status: { not: "CANCELLED" },
        umpireId: userId,
      },
      include: {
        turf: { select: { name: true, location: true } },
        teams: true,
      },
      orderBy: { date: "asc" },
    });

    const allMatches = hostedGames.map((game) => {
      const teamA = game.teams?.find((t) => t.teamKey === "teamA");
      const teamB = game.teams?.find((t) => t.teamKey === "teamB");

      return {
        ...game,
        name:
          game.name ||
          `${teamA?.name || "Team A"} VS ${teamB?.name || "Team B"}`,
        venue: game.turf?.name || game.city || "TBD Venue",
        status:
          game.status === "ACTIVE" ? "upcoming" : game.status.toLowerCase(),
        teams: [teamA?.name || "TBD", teamB?.name || "TBD"],
        isHostedGame: true,
      };
    });

    logger.info(`DEBUG: Found ${allMatches.length} hosted games`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [revenueData, revenueOverTimeRaw] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: {
          userId: userId,
          status: "SUCCESS",
          type: { notIn: ["DEBIT", "TOPUP", "REFUND", "WITHDRAWAL"] },
        },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.groupBy({
        by: ["createdAt"],
        where: {
          userId: userId,
          status: "SUCCESS",
          type: { notIn: ["DEBIT", "TOPUP", "REFUND", "WITHDRAWAL"] },
          createdAt: { gte: sevenDaysAgo },
        },
        _sum: { amount: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const totalRevenue = Number(revenueData._sum.amount || 0);
    const processedRevenueOverTime = revenueOverTimeRaw.map((r) => ({
      id: r.createdAt.toISOString().split("T")[0],
      revenue: Number(r._sum.amount || 0),
    }));

    if (!hostedGames || hostedGames.length === 0) {
      return res.json({
        matchesOfficiated: 0,
        upcomingMatches: 0,
        officialRating: umpireProfile.rating || 0,
        earnings: totalRevenue,
        totalRevenue,
        revenueOverTimeRaw: processedRevenueOverTime,
        matchEngagement: [],
        matches: [],
        upcomingAssignments: [],
        upgradeRequested: false,
      });
    }

    const matchesOfficiated = allMatches.filter(
      (m) => m.status === "completed"
    ).length;
    const upcomingMatches = allMatches.filter(
      (m) => m.status === "upcoming"
    ).length;

    const responseData = {
      matchesOfficiated,
      upcomingMatches,
      officialRating: umpireProfile.rating || 0,
      earnings: totalRevenue,
      totalRevenue,
      revenueOverTimeRaw: processedRevenueOverTime,
      matchEngagement: [],
      matches: allMatches,
      upcomingAssignments: allMatches
        .filter((m) => m.status === "upcoming")
        .slice(0, 5)
        .map((m) => ({
          id: m.id,
          match: m.name || "TBD Match",
          shortId: m.shortId,
          time: m.date
            ? `${new Date(m.date).toLocaleDateString()} - ${m.time || "N/A"}`
            : "TBD",
          venue: m.venue || "TBD Venue",
          role: "Head Umpire",
        })),
      upgradeRequested: false,
    };

    logger.info("DEBUG: Sending successful response for umpire dashboard");
    res.json(responseData);
  } catch (error) {
    logger.error("CRITICAL ERROR in getUmpireDashboardData:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching umpire dashboard data",
        error: error.message,
      });
  }
};

export const getStreamerDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`[DASHBOARD_STREAMER] Fetching for userId: ${userId}`);

    const streamerProfile = await prisma.ownerProfile.findUnique({
      where: { userId: userId },
    });

    if (!streamerProfile) {
      logger.warn(
        `[DASHBOARD_STREAMER] Profile not found, returning default empty state for userId: ${userId}`
      );
      return res.json({
        matchesStreamed: 0,
        upcomingStreams: 0,
        officialRating: 0,
        earnings: 0,
        totalRevenue: 0,
        revenueOverTimeRaw: [],
        matchEngagement: [],
        matches: [],
        upcomingAssignments: [],
        upgradeRequested: false,
        socialStats: { youtube: null, facebook: null },
      });
    }

    const hostedGames = await prisma.hostedGame.findMany({
      where: {
        status: { not: "CANCELLED" },
        streamerId: userId,
      },
      include: {
        turf: { select: { name: true, location: true } },
        teams: true,
      },
      orderBy: { date: "asc" },
    });

    const allMatches = hostedGames.map((game) => {
      const teamA = game.teams?.find((t) => t.teamKey === "teamA");
      const teamB = game.teams?.find((t) => t.teamKey === "teamB");

      return {
        ...game,
        name:
          game.name ||
          `${teamA?.name || "Team A"} VS ${teamB?.name || "Team B"}`,
        venue: game.turf?.name || game.city || "TBD Venue",
        status:
          game.status === "ACTIVE" ? "upcoming" : game.status.toLowerCase(),
        teams: [teamA?.name || "TBD", teamB?.name || "TBD"],
        isHostedGame: true,
      };
    });

    logger.info(`DEBUG: Found ${allMatches.length} hosted games for streamer`);

    // Fetch Real Revenue from Wallet
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [revenueData, revenueOverTimeRaw] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: {
          userId: userId,
          status: "SUCCESS",
          type: { notIn: ["DEBIT", "TOPUP", "REFUND", "WITHDRAWAL"] },
        },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.groupBy({
        by: ["createdAt"],
        where: {
          userId: userId,
          status: "SUCCESS",
          type: { notIn: ["DEBIT", "TOPUP", "REFUND", "WITHDRAWAL"] },
          createdAt: { gte: sevenDaysAgo },
        },
        _sum: { amount: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const totalRevenue = Number(revenueData._sum.amount || 0);
    const processedRevenueOverTime = revenueOverTimeRaw.map((r) => ({
      id: r.createdAt.toISOString().split("T")[0],
      revenue: Number(r._sum.amount || 0),
    }));

    if (!hostedGames || hostedGames.length === 0) {
      return res.json({
        matchesStreamed: 0,
        upcomingStreams: 0,
        officialRating: streamerProfile.rating || 0,
        earnings: totalRevenue,
        totalRevenue,
        revenueOverTimeRaw: processedRevenueOverTime,
        matchEngagement: [],
        matches: [],
        upcomingAssignments: [],
        upgradeRequested: false,
        socialStats: { youtube: null, facebook: null },
      });
    }

    const matchesStreamed = allMatches.filter(
      (m) => m.status === "completed"
    ).length;
    const upcomingStreams = allMatches.filter(
      (m) => m.status === "upcoming"
    ).length;

    const socialStats = { youtube: null, facebook: null };

    const responseData = {
      matchesStreamed,
      upcomingStreams,
      officialRating: streamerProfile.rating || 0,
      earnings: totalRevenue,
      totalRevenue,
      revenueOverTimeRaw: processedRevenueOverTime,
      matchEngagement: [],
      matches: allMatches,
      upcomingAssignments: allMatches
        .filter((m) => m.status === "upcoming")
        .slice(0, 5)
        .map((m) => ({
          id: m.id,
          match: m.name || "TBD Match",
          shortId: m.shortId,
          time: m.date
            ? `${new Date(m.date).toLocaleDateString()} - ${m.time || "N/A"}`
            : "TBD",
          venue: m.venue || "TBD Venue",
          role: "Head Streamer",
        })),
      upgradeRequested: false,
      socialStats,
    };

    logger.info("DEBUG: Sending successful response for streamer dashboard");
    res.json(responseData);
  } catch (error) {
    logger.error("CRITICAL ERROR in getStreamerDashboardData:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching streamer dashboard data",
        error: error.message,
      });
  }
};

export const getScorerDashboardData = async (req, res) => {
  const userId = req.user?.id || req.owner?.userId;
  const ownerId = req.owner?.ownerId || req.user?.ownerId;

  try {
    logger.info(
      `[DASHBOARD_SCORER] Resolving for userId: ${userId}, ownerId: ${ownerId}`
    );

    // 1. Find scorer profile using Prisma
    let scorerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [{ id: ownerId || undefined }, { userId: userId || undefined }],
      },
    });

    if (!scorerProfile) {
      logger.warn(
        `[DASHBOARD_SCORER] Profile not found for userId: ${userId}, returning default empty state`
      );
      return res.json({
        activeMatches: 0,
        matchesScored: 0,
        upcomingMatches: 0,
        officialRating: 0,
        earnings: 0,
        totalRevenue: 0,
        revenueOverTimeRaw: [],
        matchEngagement: [],
        matches: [],
        upcomingAssignments: [],
      });
    }

    const scorerId = scorerProfile.id;
    const scorerUserId = scorerProfile.userId;
    logger.info(
      `[DASHBOARD_SCORER] Profile found: ${scorerId}, userId: ${scorerUserId}`
    );

    // 2. Fetch matches where user is involved as scorer
    const hostedGames = await prisma.hostedGame.findMany({
      where: {
        OR: [
          { scorerId: scorerUserId },
          { scorerId: scorerId },
          // Check JSON requests if necessary, but primary relations should cover it now
          { status: { not: "CANCELLED" } },
        ],
        status: { not: "CANCELLED" },
      },
      include: {
        turf: { select: { name: true, location: true } },
        teams: true,
      },
      orderBy: { date: "asc" },
    });

    // 3. Format matches for frontend
    const allMatches = hostedGames.map((game) => {
      const teamA = game.teams?.find((t) => t.teamKey === "teamA");
      const teamB = game.teams?.find((t) => t.teamKey === "teamB");

      return {
        ...game,
        name: `${teamA?.name || "Team A"} VS ${teamB?.name || "Team B"}`,
        venue: game.turf?.name || game.city || "TBD Venue",
        status:
          game.status === "ACTIVE" ? "upcoming" : game.status.toLowerCase(),
        teams: [teamA?.name || "TBD", teamB?.name || "TBD"],
        isHostedGame: true,
      };
    });

    const matchesScored = allMatches.filter(
      (m) => m.status === "completed"
    ).length;
    const upcomingMatches = allMatches.filter(
      (m) => m.status === "upcoming"
    ).length;

    // 4. Fetch Revenue from WalletTransaction using Prisma
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueTransactions = await prisma.walletTransaction.findMany({
      where: {
        userId: scorerUserId,
        status: "SUCCESS",
        type: { notIn: ["DEBIT", "TOPUP", "REFUND", "WITHDRAWAL"] },
      },
    });

    const totalRevenue = revenueTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Group revenue by date for the chart
    const revenueByDate = revenueTransactions
      .filter((t) => t.createdAt >= sevenDaysAgo)
      .reduce((acc, t) => {
        const date = t.createdAt.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + Number(t.amount);
        return acc;
      }, {});

    const revenueOverTimeRaw = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({
        id: date,
        revenue,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    res.json({
      activeMatches: allMatches.filter(
        (m) => m.status === "live" || m.status === "playing"
      ).length,
      matchesScored,
      upcomingMatches,
      officialRating: scorerProfile.rating || 0,
      earnings: totalRevenue,
      totalRevenue,
      revenueOverTimeRaw,
      matchEngagement: [],
      matches: allMatches,
      upcomingAssignments: allMatches
        .filter((m) => m.status === "upcoming")
        .slice(0, 5)
        .map((m) => ({
          id: m.id,
          match: m.name,
          shortId: m.shortId,
          time: m.date
            ? `${new Date(m.date).toLocaleDateString()} - ${m.time || "N/A"}`
            : "TBD",
          venue: m.venue,
          role: "Official Scorer",
        })),
    });
  } catch (error) {
    logger.error("CRITICAL ERROR in getScorerDashboardData:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching scorer dashboard data",
      error: error.message,
    });
  }
};

export const getOwnerCalendarData = async (req, res) => {
  const userId = req.user?.id || req.owner?.userId;
  const ownerId = req.owner?.ownerId || req.user?.ownerId;
  const { date } = req.query; // Expecting YYYY-MM-DD

  try {
    const selectedDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // 1. Fetch all turfs for this owner
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [{ id: ownerId || undefined }, { userId: userId || undefined }],
      },
      include: {
        turfs: true,
      },
    });

    if (!ownerProfile || ownerProfile.turfs.length === 0) {
      return res.json({
        success: true,
        date: startOfDay,
        facilities: [],
        stats: { averageLoad: 0, confirmedSlots: 0, totalRevenue: 0 },
      });
    }

    const turfs = ownerProfile.turfs;
    const turfIds = turfs.map((t) => t.id);

    // 2. Fetch all bookings for these turfs on the selected date
    const bookings = await prisma.booking.findMany({
      where: {
        turfId: { in: turfIds },
        status: { not: "CANCELLED" },
        timeSlot: {
          startTime: { gte: startOfDay, lte: endOfDay },
        },
      },
      include: {
        timeSlot: true,
        user: { select: { name: true, profilePicture: true } },
      },
    });

    // 3. Process data for the calendar
    const calendarData = turfs.map((turf) => {
      // Map generated slots and check if they are booked
      const generatedSlots = Array.isArray(turf.generatedSlots)
        ? turf.generatedSlots
        : [];

      const slots = generatedSlots.map((slot) => {
        const booking = bookings.find(
          (b) =>
            b.turfId === turf.id &&
            b.timeSlot &&
            new Date(b.timeSlot.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }) === slot.startTime
        );

        let guestName = "Guest Player";
        if (
          booking?.guestDetails &&
          typeof booking.guestDetails === "object" &&
          booking.guestDetails.name
        ) {
          guestName = booking.guestDetails.name;
        }

        return {
          ...slot,
          isBooked: !!booking,
          bookingDetails: booking
            ? {
                userName: booking.user?.name || guestName,
                totalPrice: Number(booking.totalPrice),
                bookingId: booking.id,
                profileImage: booking.user?.profilePicture,
                bookingSource: booking.bookingSource,
              }
            : null,
        };
      });

      return {
        id: turf.id,
        name: turf.name,
        category:
          turf.sportTypes && turf.sportTypes.length > 0
            ? turf.sportTypes[0]
            : "Other",
        slots: slots,
      };
    });

    // 4. Calculate Stats for the day
    const confirmedSlots = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + Number(b.totalPrice || 0),
      0
    );
    const totalPossibleSlots = turfs.reduce(
      (sum, t) =>
        sum + (Array.isArray(t.generatedSlots) ? t.generatedSlots.length : 0),
      0
    );
    const averageLoad =
      totalPossibleSlots > 0
        ? Math.round((confirmedSlots / totalPossibleSlots) * 100)
        : 0;

    res.json({
      success: true,
      date: startOfDay,
      facilities: calendarData,
      stats: {
        averageLoad,
        confirmedSlots,
        totalRevenue,
      },
    });
  } catch (error) {
    logger.error("Error in getOwnerCalendarData:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching calendar data" });
  }
};

export const getDetailedOccupancyStats = async (req, res) => {
  const userId = req.user?.id || req.owner?.userId;
  const ownerId = req.owner?.ownerId || req.user?.ownerId;
  const { filter = "week", turfId } = req.query; // week, month, year, day

  try {
    let turfIds = [];
    if (turfId) {
      turfIds = [turfId];
    } else {
      const ownerProfile = await prisma.ownerProfile.findFirst({
        where: {
          OR: [{ id: ownerId || undefined }, { userId: userId || undefined }],
        },
        include: { turfs: { select: { id: true } } },
      });
      if (ownerProfile) {
        turfIds = ownerProfile.turfs.map((t) => t.id);
      }
    }

    // 1. Weekly Occupancy Grid (For the Heatmap)
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const weeklyBookings = await prisma.booking.findMany({
      where: {
        turfId: { in: turfIds },
        createdAt: { gte: startOfWeek, lte: endOfWeek },
        status: { not: "CANCELLED" },
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        turf: { select: { name: true } },
        timeSlot: true,
      },
    });

    const heatmapData = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const slotsInThisHour = weeklyBookings.filter((b) => {
          const bDate = b.timeSlot?.startTime
            ? new Date(b.timeSlot.startTime)
            : new Date(b.createdAt);
          return bDate.getDay() === d && bDate.getHours() === h;
        });

        heatmapData.push({
          day: d,
          hour: h,
          count: slotsInThisHour.length,
          details: slotsInThisHour.map((b) => {
            const bStartTime = b.timeSlot?.startTime;
            const bEndTime = b.timeSlot?.endTime;
            return {
              id: b.id,
              user: b.user?.name || "Guest",
              email: b.user?.email,
              phone: b.user?.phone,
              turf: b.turf?.name,
              amount: Number(b.totalPrice),
              time:
                bStartTime && bEndTime
                  ? `${new Date(bStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(bEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "N/A",
            };
          }),
        });
      }
    }

    // 2. Peak Hours Distribution (For the Graph)
    let dateFilter = {};
    const today = new Date();
    if (filter === "day") {
      dateFilter = { gte: new Date(today.setHours(0, 0, 0, 0)) };
    } else if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { gte: weekAgo };
    } else if (filter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { gte: monthAgo };
    } else if (filter === "year") {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateFilter = { gte: yearAgo };
    }

    const bookingsForPeak = await prisma.booking.findMany({
      where: {
        turfId: { in: turfIds },
        createdAt: dateFilter,
        status: { not: "CANCELLED" },
      },
      select: { createdAt: true },
    });

    const peakHoursRaw = bookingsForPeak.reduce((acc, b) => {
      const hour = new Date(b.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakHours = Array.from({ length: 24 }, (_, i) => {
      return {
        hour: i,
        time: `${i % 12 || 12}${i < 12 ? "AM" : "PM"}`,
        count: peakHoursRaw[i] || 0,
      };
    });

    res.json({
      success: true,
      heatmap: heatmapData,
      peakHours,
      summary: {
        totalWeeklyBookings: weeklyBookings.length,
        peakTime: peakHours.reduce((prev, current) =>
          prev.count > current.count ? prev : current
        ).time,
      },
    });
  } catch (error) {
    logger.error("Error in getDetailedOccupancyStats:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching occupancy stats" });
  }
};
export const getOwnerCustomers = async (req, res) => {
  const userId = req.user?.id || req.owner?.userId;
  const ownerId = req.owner?.ownerId || req.user?.ownerId;

  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [{ id: ownerId || undefined }, { userId: userId || undefined }],
      },
      include: { turfs: { select: { id: true } } },
    });

    if (!ownerProfile || ownerProfile.turfs.length === 0) {
      return res.json({
        customers: [],
        stats: { totalPlayers: 0, activeUsers: 0, avgLtv: 0, retentionRate: 0 },
      });
    }

    const turfIds = ownerProfile.turfs.map((t) => t.id);

    // Fetch all bookings for these turfs
    const bookings = await prisma.booking.findMany({
      where: { turfId: { in: turfIds }, status: { not: "CANCELLED" } },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    // Aggregate manually since Prisma doesn't have deep grouping on JSON / conditional relations easily
    const customerMap = new Map();

    bookings.forEach((b) => {
      let identifier = b.userId;
      let isRegistered = true;
      let email = b.user?.email;
      let name = b.user?.name;
      let phone = b.user?.phone;

      // Handle guest
      if (!identifier && b.guestDetails && typeof b.guestDetails === "object") {
        identifier =
          b.guestDetails.email || b.guestDetails.phone || `guest_${b.id}`;
        isRegistered = false;
        email = b.guestDetails.email;
        name = b.guestDetails.name;
        phone = b.guestDetails.phone;
      }

      if (!identifier) identifier = `unknown_${b.id}`;

      if (!customerMap.has(identifier)) {
        customerMap.set(identifier, {
          id: identifier,
          name: name || "Guest Player",
          email: email || "N/A",
          phone: phone || "N/A",
          totalRevenue: 0,
          bookingCount: 0,
          lastActive: new Date(0),
          joinedDate: new Date(b.createdAt),
          isRegistered,
        });
      }

      const c = customerMap.get(identifier);
      c.totalRevenue += Number(b.totalPrice || 0);
      c.bookingCount += 1;

      if (new Date(b.createdAt) > c.lastActive) {
        c.lastActive = new Date(b.createdAt);
      }
      if (new Date(b.createdAt) < c.joinedDate) {
        c.joinedDate = new Date(b.createdAt);
      }
    });

    const customerStats = Array.from(customerMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    // Calculate Summary Stats
    const totalPlayers = customerStats.length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = customerStats.filter(
      (c) => c.lastActive >= thirtyDaysAgo
    ).length;

    const avgLtv =
      totalPlayers > 0
        ? customerStats.reduce((sum, c) => sum + c.totalRevenue, 0) /
          totalPlayers
        : 0;

    const returningPlayers = customerStats.filter(
      (c) => c.bookingCount > 1
    ).length;
    const retentionRate =
      totalPlayers > 0
        ? Math.round((returningPlayers / totalPlayers) * 100)
        : 0;

    res.json({
      customers: customerStats.map((c) => {
        let status = "SILVER";
        if (c.totalRevenue > 20000 || c.bookingCount > 15) status = "ELITE";
        else if (c.totalRevenue > 10000 || c.bookingCount > 8) status = "GOLD";
        else if (c.totalRevenue > 5000 || c.bookingCount > 3)
          status = "PLATINUM";

        return {
          ...c,
          status,
          joinedFormatted: c.joinedDate
            ? `Joined ${format(new Date(c.joinedDate), "MMM yyyy")}`
            : "N/A",
          lastActiveFormatted: c.lastActive
            ? formatDistanceToNow(new Date(c.lastActive), { addSuffix: true })
            : "Never",
        };
      }),
      stats: {
        totalPlayers,
        activeUsers,
        avgLtv,
        retentionRate,
      },
    });
  } catch (error) {
    logger.error("Error in getOwnerCustomers:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching customer directory" });
  }
};
