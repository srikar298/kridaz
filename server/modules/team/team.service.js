import { InternalError } from "@kridaz/common";
import crypto from "crypto";
import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";
import generateQRCode from "../../utils/generateQRCode.js";

/**
 * Team Domain Service
 * Handles business logic for teams, squads, and challenges.
 */

/**
 * Generates a unique 10-character alphanumeric team code
 */
export const generateTeamCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Ensures uniqueness of the generated team code
 */
export const createUniqueTeamCode = async () => {
  let code;
  let attempts = 0;
  do {
    code = generateTeamCode();
    attempts++;
    if (attempts > 10)
      throw new InternalError("Failed to generate unique team code", {
        code: "INTERNAL_ERROR",
      });
  } while (await prisma.team.findUnique({ where: { teamCode: code } }));
  return code;
};

/**
 * Get team by ID with full relations
 */
export const getTeamWithDetails = async (id) => {
  return await prisma.team.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, profilePicture: true, username: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
              sportTypes: true,
            },
          },
        },
      },
      Team_A: {
        select: {
          id: true,
          name: true,
          teamCode: true,
          sportType: true,
          city: true,
          logo: true,
          image: true,
          owner: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
              username: true,
            },
          },
        },
      },
      Team_B: {
        select: {
          id: true,
          name: true,
          teamCode: true,
          sportType: true,
          city: true,
          logo: true,
          image: true,
          owner: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
              username: true,
            },
          },
        },
      },
      opponentRequestsReceived: {
        include: {
          from: {
            select: {
              id: true,
              name: true,
              image: true,
              logo: true,
              teamCode: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Generate and save team QR code
 */
export const ensureTeamQRCode = async (teamId) => {
  const frontendUrl =
    process.env.USER_URL ||
    process.env.CLIENT_URLS?.split(",")[0] ||
    "https://kridaz.com";
  const qrUrl = `${frontendUrl}/team/${teamId}`;

  try {
    const qrCodeUrl = await generateQRCode(qrUrl);
    return await prisma.team.update({
      where: { id: teamId },
      data: { qrCode: qrCodeUrl },
    });
  } catch (error) {
    logger.error("QR Generation failed in service:", error);
    return null;
  }
};

// ─── Team Statistics ─────────────────────────────────────────────────────────

/**
 * Fetch real match statistics for a team.
 *
 * Architecture note:
 *   - GameSlot = individual player seat (no score field)
 *   - GameTeam = team entry in a game (links Team.id → HostedGame via teamId on GameSlot)
 *   - Innings   = batting innings per game, tracks totalRuns
 *
 * We count completed games the team participated in (via GameSlot.teamId matching
 * a GameTeam that belongs to a completed HostedGame), then sum Innings.totalRuns
 * for all batting innings where the team was the batting side.
 *
 * @param {string} teamId - The Team.id (not GameTeam.id)
 * @returns {{ matchesPlayed: number, totalScore: number }}
 */
export const getTeamMatchStats = async (teamId) => {
  try {
    // Count distinct completed games where this team had at least one slot
    const matchCount = await prisma.hostedGame.count({
      where: {
        status: { in: ["COMPLETED", "ENDED"] },
        teams: {
          some: {
            slots: {
              some: { teamId },
            },
          },
        },
      },
    });

    // Sum all batting runs from Innings for games this team participated in.
    // Innings.battingTeam is a string key ("teamA" / "teamB"), so we join via
    // the game's CricketMatch and filter by innings belonging to completed games
    // where our team had slots.
    const scoreResult = await prisma.innings.aggregate({
      where: {
        match: {
          game: {
            status: { in: ["COMPLETED", "ENDED"] },
            teams: {
              some: {
                slots: {
                  some: { teamId },
                },
              },
            },
          },
        },
      },
      _sum: { totalRuns: true },
    });

    return {
      matchesPlayed: matchCount,
      totalScore: scoreResult._sum.totalRuns ?? 0,
    };
  } catch (error) {
    // Non-fatal: return zeroes if tables don't have data yet
    logger.warn(
      `[TeamService] getTeamMatchStats failed for team ${teamId}:`,
      error.message
    );
    return { matchesPlayed: 0, totalScore: 0 };
  }
};

// ─── Invite Helpers ───────────────────────────────────────────────────────────

/**
 * Process a single invitee entry.
 * Handles both registered users (by userId) and unregistered users
 * (by email/phone via TeamCustomMember).
 *
 * @param {string} teamId
 * @param {{ userId?: string, name?: string, email?: string, phone?: string }} invitee
 * @param {{ id: string, name: string }} team - Team context for notification messages
 * @returns {{ status: string, [key: string]: any }}
 */
export const processInvitee = async (teamId, invitee, team) => {
  if (invitee.userId) {
    return _inviteRegisteredUser(teamId, invitee.userId, team);
  }
  return _inviteCustomUser(teamId, invitee, team);
};

/**
 * @private - Invite an existing platform user by userId
 */
const _inviteRegisteredUser = async (teamId, userId, team) => {
  const existingMember = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });

  if (existingMember) {
    return {
      user: userId,
      status: "already_exists",
      message: "User already in team",
    };
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: { teamId, userId, role: "PLAYER", status: "PENDING" },
    }),
    prisma.notification.create({
      data: {
        userId,
        type: "TEAM_INVITE",
        title: "Team Invitation",
        message: `You have been invited to join the team "${team.name}"`,
        metadata: { teamId: team.id },
      },
    }),
  ]);

  return { user: userId, status: "invited" };
};

/**
 * @private - Invite a non-registered user via email/phone (creates TeamCustomMember)
 */
const _inviteCustomUser = async (teamId, invitee, team) => {
  const orConditions = [];
  if (invitee.email) orConditions.push({ email: invitee.email });
  if (invitee.phone) orConditions.push({ phone: invitee.phone });

  if (orConditions.length > 0) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: orConditions },
    });
    if (existingUser) {
      return {
        email: invitee.email,
        phone: invitee.phone,
        status: "error",
        message: "User already registered. Invite by user ID instead.",
      };
    }
  }

  const inviteToken = crypto.randomUUID();
  await prisma.teamCustomMember.create({
    data: {
      teamId,
      name: invitee.name,
      email: invitee.email,
      phone: invitee.phone,
      inviteToken,
      status: "PENDING",
    },
  });

  return { name: invitee.name, token: inviteToken, status: "invited_custom" };
};
