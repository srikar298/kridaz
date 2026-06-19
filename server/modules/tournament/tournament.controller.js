import { prisma } from "../../config/prisma.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "@kridaz/common";
import {
  autoGenerateGroupStage,
  getTournamentStandings,
  createManualScheduledGame,
} from "./scheduler.service.js";

/**
 * @desc    Create a draft tournament (Step 1)
 * @route   POST /api/tournament
 * @access  Private (User)
 */
export const createTournament = async (req, res, next) => {
  try {
    const { name, sport, format, details, numberOfWinners } = req.body;
    const userId = req.user.id;

    // Create a new draft tournament
    const tournament = await prisma.tournament.create({
      data: {
        name,
        sport,
        format,
        details,
        numberOfWinners: numberOfWinners || 1,
        status: "DRAFT",
        currentStep: 1,
        ownerId: userId,
      },
    });

    res.status(201).json({
      success: true,
      data: tournament,
      message: "Draft tournament created successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's tournaments (drafts and published)
 * @route   GET /api/tournament/my-tournaments
 * @access  Private (User)
 */
export const getMyTournaments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const tournaments = await prisma.tournament.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { teams: true, matches: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: tournaments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single tournament by ID
 * @route   GET /api/tournament/:id
 * @access  Private (User)
 */
export const getTournamentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        pools: true,
        teams: {
          include: { team: true },
        },
        officials: true,
        venues: {
          include: { turf: true },
        },
        sponsors: true,
      },
    });

    if (!tournament) {
      throw new NotFoundError("Tournament not found");
    }

    // Optional: Add authorization check if needed (e.g. only owner can see draft)
    if (tournament.status === "DRAFT" && tournament.ownerId !== userId) {
      throw new ForbiddenError("Not authorized to view this draft tournament");
    }

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a tournament (auto-save for steps)
 * @route   PATCH /api/tournament/:id
 * @access  Private (Tournament Owner)
 */
export const updateTournament = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      throw new NotFoundError("Tournament not found");
    }

    if (tournament.ownerId !== userId) {
      throw new ForbiddenError("Not authorized to update this tournament");
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: updatedTournament,
      message: "Tournament auto-saved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload tournament poster
 * @route   POST /api/tournament/:id/poster
 * @access  Private (Tournament Owner)
 */
export const uploadPoster = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      throw new NotFoundError("Tournament not found");
    }

    if (tournament.ownerId !== userId) {
      throw new ForbiddenError("Not authorized");
    }

    // req.file.path comes from the multer upload middleware (cloudinary/s3)
    const posterUrl = req.file.path;

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: { posterUrl },
    });

    res.status(200).json({
      success: true,
      data: updatedTournament,
      message: "Poster uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public tournament details for the registration page
 * @route   GET /api/tournament/public/:id
 * @access  Public (or Logged in user)
 */
export const getPublicTournament = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        venues: {
          include: { turf: true },
        },
        teams: {
          where: { status: { in: ["APPROVED", "PENDING"] } },
          include: {
            team: {
              select: { name: true, logo: true, city: true },
            },
          },
        },
        sponsors: true,
      },
    });

    if (!tournament) {
      throw new NotFoundError("Tournament not found");
    }

    if (tournament.status === "DRAFT") {
      throw new BadRequestError("Tournament is not published yet");
    }

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a team for a tournament
 * @route   POST /api/tournament/:id/register
 * @access  Private (User/Captain)
 */
export const registerForTournament = async (req, res, next) => {
  try {
    const { id: tournamentId } = req.params;
    const { teamId, paymentType } = req.body; // paymentType: 'FULL' | 'ADVANCE'
    const userId = req.user.id;

    // 1. Fetch Tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        teams: true,
      },
    });

    if (!tournament) throw new NotFoundError("Tournament not found");
    if (tournament.status !== "PUBLISHED")
      throw new BadRequestError("Registration is not open");

    // 2. Fetch Team and verify ownership
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });

    if (!team) throw new NotFoundError("Team not found");
    if (team.adminId !== userId)
      throw new ForbiddenError("You must be the team admin to register");
    if (
      team.sportType &&
      tournament.sport &&
      team.sportType !== tournament.sport
    ) {
      throw new BadRequestError(
        `This is a ${tournament.sport} tournament, but your team plays ${team.sportType}`
      );
    }

    // 3. Verify Team is not already registered
    const alreadyRegistered = tournament.teams.find((t) => t.teamId === teamId);
    if (alreadyRegistered) {
      throw new BadRequestError(
        "Your team is already registered for this tournament"
      );
    }

    // 4. Verify spots available
    if (tournament.maxTeams && tournament.teams.length >= tournament.maxTeams) {
      throw new BadRequestError("Tournament is already full");
    }

    // 5. Calculate Fee
    const entryFee = tournament.entryFee || 0;
    const advanceFee = tournament.advanceFee || 0;
    const amountToDeduct =
      paymentType === "ADVANCE" && advanceFee > 0 ? advanceFee : entryFee;

    // 6. Wallet Deduction Logic (Transaction)
    if (amountToDeduct > 0) {
      // Fetch user wallet
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amountToDeduct) {
        throw new BadRequestError(
          "Insufficient wallet balance. Please recharge."
        );
      }

      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId },
          data: { balance: { decrement: amountToDeduct } },
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: amountToDeduct,
            type: "DEBIT",
            status: "SUCCESS",
            description: `Registration fee (${paymentType}) for ${tournament.name}`,
            referenceType: "TOURNAMENT",
            referenceId: tournamentId,
          },
        }),
        // Register the team
        prisma.tournamentTeam.create({
          data: {
            tournamentId,
            teamId,
            status: "APPROVED", // or PENDING based on organizer preference
            paidAmount: amountToDeduct,
            isAdvancePaid: paymentType === "ADVANCE",
            isFullyPaid: paymentType === "FULL" || amountToDeduct >= entryFee,
          },
        }),
      ]);
    } else {
      // Free tournament
      await prisma.tournamentTeam.create({
        data: {
          tournamentId,
          teamId,
          status: "APPROVED",
          paidAmount: 0,
          isAdvancePaid: true,
          isFullyPaid: true,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Team successfully registered for the tournament!",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Auto generate group stage schedule
 * @route   POST /api/tournament/:id/schedule/auto
 * @access  Private (Owner)
 */
export const autoScheduleGroupStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, slotTimes } = req.body;
    const userId = req.user.id;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw new NotFoundError("Tournament not found");
    if (tournament.ownerId !== userId)
      throw new ForbiddenError("Not authorized");

    const matches = await autoGenerateGroupStage(id, startDate, slotTimes);

    res.status(200).json({
      success: true,
      message: `${matches.length} matches generated successfully`,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tournament standings
 * @route   GET /api/tournament/:id/standings
 * @access  Public
 */
export const getStandings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const standings = await getTournamentStandings(id);

    res.status(200).json({
      success: true,
      data: standings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manual schedule a match
 * @route   POST /api/tournament/:id/schedule/manual
 * @access  Private (Owner)
 */
export const manualSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, poolId, scheduledAt, team1Id, team2Id } = req.body;
    const userId = req.user.id;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw new NotFoundError("Tournament not found");
    if (tournament.ownerId !== userId)
      throw new ForbiddenError("Not authorized");

    const match = await createManualScheduledGame(
      id,
      stage,
      poolId,
      scheduledAt,
      team1Id,
      team2Id
    );

    res.status(201).json({
      success: true,
      message: "Match scheduled successfully",
      data: match,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tournament matches
 * @route   GET /api/tournament/:id/matches
 * @access  Public
 */
export const getTournamentMatches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const matches = await prisma.hostedGame.findMany({
      where: { tournamentId: id },
      orderBy: { scheduledAt: "asc" },
      include: {
        teams: {
          include: { team: true },
        },
        venue: {
          include: { turf: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
};
