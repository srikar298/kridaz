import { prisma } from "../../config/prisma.js";
import { BadRequestError, NotFoundError, ForbiddenError, UnauthorizedError, InternalError } from "@kridaz/common";
import StatsService from "../../services/stats.service.js";
import CareerStatsService from "../../services/careerStats.service.js";
import { liveStateService } from "../../services/liveState.service.js";
import { getIO } from "../../config/socket.js";
import jwt from "jsonwebtoken";
import logger from "../../utils/logger.js";
import { getAccessSecret } from "../../utils/jwtSecrets.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";
import { computeScoreSnapshot, resolveHouseRules } from "./scoring.utils.js";

const HOSTED_GAME_SCORING_INCLUDE = {
  turf: true,
  umpire: { select: { id: true, name: true, profilePicture: true } },
  scorer: { select: { id: true, name: true, profilePicture: true } },
  streamer: { select: { id: true, name: true, profilePicture: true } },
  teams: {
    include: {
      slots: {
        include: {
          user: { select: { id: true, name: true, profilePicture: true } },
          customPlayer: true
        }
      }
    }
  }
};

/**
 * Mapper helper to structure team A/B and ground details in HostedGame.
 */
const mapHostedGame = (hostedGame) => {
  if (!hostedGame) return null;
  const teamA = hostedGame.teams?.find(t => t.teamKey === "teamA") || { name: "Team A", slots: [] };
  const teamB = hostedGame.teams?.find(t => t.teamKey === "teamB") || { name: "Team B", slots: [] };
  
  const getCaptain = (team) => {
    const captainSlot = team.slots?.find(s => s.role && (s.role.trim().toLowerCase() === "captain" || s.role.trim().toLowerCase() === "c" || s.role.trim().toLowerCase() === "(c)"));
    if (captainSlot) {
      if (captainSlot.user) return { id: captainSlot.user.id, name: captainSlot.user.name, profilePicture: captainSlot.user.profilePicture, type: 'user' };
      if (captainSlot.customPlayer) return { id: captainSlot.customPlayer.id, name: captainSlot.customPlayer.name, type: 'custom' };
    }
    return null;
  };
  teamA.captain = getCaptain(teamA);
  teamB.captain = getCaptain(teamB);

  const mapped = {
    ...hostedGame,
    teamA,
    teamB
  };
  if (hostedGame.turf) {
    mapped.ground = hostedGame.turf;
  }
  return mapped;
};

/**
 * Aggregates and updates player statistics after a match is completed.
 * @param {Object} matchScoring - The completed CricketMatch (Prisma) object.
 * @param {Object} hostedGame - The corresponding HostedGame (Prisma) object.
 */
export const aggregatePlayerStats = async (matchScoring, hostedGame) => {
  try {
    const userUpdates = new Map();

    // 0. Extract all relevant user IDs for batch processing
    const playerIds = new Set();

    matchScoring.playerStats.forEach(s => playerIds.add(s.userId));
    matchScoring.timeline.filter(t => t.fielderId).forEach(t => playerIds.add(t.fielderId));

    if (hostedGame.umpireId) playerIds.add(hostedGame.umpireId);
    if (hostedGame.hostId) playerIds.add(hostedGame.hostId);

    const idsArray = Array.from(playerIds);
    const statsMap = await StatsService.getBatchStats(idsArray);

    const usersForNames = await prisma.user.findMany({
      where: { id: { in: idsArray } },
      select: { id: true, name: true }
    });
    const userNameMap = new Map(usersForNames.map(u => [u.id, u.name]));

    const getStatsData = (userId) => {
      const idStr = userId?.toString();
      if (!idStr) return null;
      if (userUpdates.has(idStr)) return userUpdates.get(idStr);

      const stats = statsMap.get(idStr) || { cricket: {}, badges: [] };
      if (!stats.cricket) stats.cricket = {};

      userUpdates.set(idStr, stats);
      return stats;
    };

    // 1. Process Batting & Bowling Stats from playerStats
    for (const stat of matchScoring.playerStats) {
      const stats = getStatsData(stat.userId);
      if (!stats) continue;

      const cricket = stats.cricket;

      // Batting
      if (stat.battingBalls > 0 || stat.battingRuns > 0) {
        cricket.matches = (cricket.matches || 0) + 1;
        cricket.runs = (cricket.runs || 0) + (stat.battingRuns || 0);
        cricket.ballsFaced = (cricket.ballsFaced || 0) + (stat.battingBalls || 0);

        if ((stat.battingRuns || 0) > (cricket.highestScore || 0)) {
          cricket.highestScore = stat.battingRuns;
        }

        if (stat.battingRuns >= 100) cricket.hundreds = (cricket.hundreds || 0) + 1;
        else if (stat.battingRuns >= 50) cricket.fifties = (cricket.fifties || 0) + 1;

        cricket.battingAverage = cricket.matches > 0 ? Number((cricket.runs / cricket.matches).toFixed(2)) : 0;
        cricket.battingStrikeRate = cricket.ballsFaced > 0 ? Number(((cricket.runs / cricket.ballsFaced) * 100).toFixed(2)) : 0;
      }

      // Bowling
      if (stat.bowlingBalls > 0) {
        cricket.wickets = (cricket.wickets || 0) + (stat.bowlingWickets || 0);
        cricket.runsConceded = (cricket.runsConceded || 0) + (stat.bowlingRuns || 0);
        cricket.ballsBowled = (cricket.ballsBowled || 0) + (stat.bowlingBalls || 0);

        const currentBest = cricket.bestBowling || { wickets: 0, runs: 999 };
        if (stat.bowlingWickets > currentBest.wickets || (stat.bowlingWickets === currentBest.wickets && stat.bowlingRuns < currentBest.runs)) {
          cricket.bestBowling = { wickets: stat.bowlingWickets, runs: stat.bowlingRuns };
        }

        cricket.bowlingEconomy = cricket.ballsBowled > 0 ? Number(((cricket.runsConceded / cricket.ballsBowled) * 6).toFixed(2)) : 0;
        cricket.bowlingAverage = cricket.wickets > 0 ? Number((cricket.runsConceded / cricket.wickets).toFixed(2)) : 0;
      }
    }

    // 2. Process Fielding Stats from Timeline
    for (const ball of matchScoring.timeline) {
      if (ball.isWicket && ball.fielderId) {
        const stats = getStatsData(ball.fielderId);
        if (!stats) continue;

        const cricket = stats.cricket;
        const wType = ball.wicketType?.toUpperCase();
        if (wType === "CAUGHT") cricket.catches = (cricket.catches || 0) + 1;
        else if (wType === "STUMPED") cricket.stumpings = (cricket.stumpings || 0) + 1;
      }
    }

    // 3. Update Official Stats
    if (hostedGame.umpireId) {
      const stats = getStatsData(hostedGame.umpireId);
      if (stats) stats.matchesOfficiated = (stats.matchesOfficiated || 0) + 1;
    }

    // 4. Batch update all stats
    await StatsService.updateBatchStats(userUpdates);

    // 5. Check for Badges
    const earnedBadges = [];
    const badgeBatchUpdates = [];

    for (const [userId, stats] of userUpdates.entries()) {
      const newBadges = checkAndAwardBadges(stats);
      if (newBadges.length > 0) {
        earnedBadges.push({
          userId: userId,
          userName: userNameMap.get(userId) || "Unknown",
          badges: newBadges
        });
        badgeBatchUpdates.push({ userId, badges: newBadges });
      }
    }

    if (badgeBatchUpdates.length > 0) {
      await StatsService.addBatchBadges(badgeBatchUpdates);
    }

    // Trigger the new LinkedIn-style Career Stats & Gamification Aggregator
    try {
      await CareerStatsService.aggregateMatchCareerStats(matchScoring, hostedGame);
    } catch (careerErr) {
      logger.error("Error aggregating career stats in aggregatePlayerStats:", careerErr);
    }

    logger.info(`Successfully aggregated normalized stats for match ${matchScoring.id}`);
    return earnedBadges;
  } catch (error) {
    logger.error("Error in aggregatePlayerStats:", error);
    return [];
  }
};

const checkAndAwardBadges = (user) => {
  if (!user.cricket) return [];
  const cricket = user.cricket;
  const currentBadges = user.badges || [];
  const newBadges = [];

  const hasBadge = (name) => currentBadges.some(b => b.name === name);

  if (cricket.runs >= 100 && !hasBadge('Century Maker')) {
    newBadges.push({
      name: 'Century Maker',
      category: 'batting',
      icon: 'Trophy',
      description: 'Reached a monumental 100 career runs milestone.'
    });
  }

  if (cricket.wickets >= 10 && !hasBadge('Wicket Machine')) {
    newBadges.push({
      name: 'Wicket Machine',
      category: 'bowling',
      icon: 'Target',
      description: 'Became a threat to batters with 10 career wickets.'
    });
  }

  if (cricket.catches >= 5 && !hasBadge('Safe Hands')) {
    newBadges.push({
      name: 'Safe Hands',
      category: 'fielding',
      icon: 'Activity',
      description: 'Proven defensive reliability with 5 career catches.'
    });
  }

  if (cricket.matches >= 1 && !hasBadge('Rising Star')) {
    newBadges.push({
      name: 'Rising Star',
      category: 'ranking',
      icon: 'Star',
      description: 'Successfully completed the first official match on Kridaz.'
    });
  }

  return newBadges;
};

/**
 * Initializes live overlay broadcasting details for OBS/External scoreboards.
 */
export const goLiveSession = async (matchId) => {
  let hostedGame = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!hostedGame) {
    const scoring = await prisma.cricketMatch.findUnique({ where: { id: matchId } });
    if (scoring) hostedGame = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
  }

  if (!hostedGame) {
    throw new NotFoundError("Match not found");
  }

  if (!process.env.OVERLAY_TOKEN_SECRET) {
    logger.error('[FATAL] OVERLAY_TOKEN_SECRET env var is not set.');
    throw new InternalError("Server configuration error: overlay token secret not set.");
  }

  const finalMatchId = hostedGame.id;

  const overlayToken = jwt.sign(
    { matchId: finalMatchId, type: 'OBS_OVERLAY' },
    process.env.OVERLAY_TOKEN_SECRET,
    { expiresIn: '12h' }
  );

  await prisma.hostedGame.update({
    where: { id: finalMatchId },
    data: {
      isLive: true,
      overlayToken: overlayToken,
      streamStatus: 'starting',
      liveStartedAt: new Date()
    }
  });

  const overlayConfig = hostedGame.overlayConfig || { showScoreboard: true, showCommentary: true };
  try {
    await liveStateService.setStreamStatus(finalMatchId, 'starting');
    await liveStateService.setOverlayConfig(finalMatchId, overlayConfig);
  } catch (redisErr) {
    logger.warn("[Scoring] Redis state init failed (non-fatal):", redisErr.message);
  }

  // Fetch updated game & scoring session to cache and broadcast the live snapshot
  try {
    const updatedHostedGame = await prisma.hostedGame.findUnique({
      where: { id: finalMatchId },
      include: HOSTED_GAME_SCORING_INCLUDE
    });
    const mappedMatch = mapHostedGame(updatedHostedGame);

    const scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: finalMatchId },
      include: {
        innings: true,
        playerStats: true,
        timeline: { take: 6, orderBy: { timestamp: 'desc' } }
      }
    });

    let snapshot = null;
    if (scoring) {
      snapshot = computeScoreSnapshot(scoring, mappedMatch);
    }

    if (!snapshot) {
      snapshot = {
        matchId: finalMatchId,
        status: 'NOT_STARTED',
        matchName: mappedMatch.name,
        teamA: mappedMatch.teamA,
        teamB: mappedMatch.teamB,
        date: mappedMatch.date,
        time: mappedMatch.time,
        scheduledStartAt: mappedMatch.scheduledStartAt,
        tossWinner: null,
        tossDecision: null,
        message: 'Match starts soon',
        tickerTheme: mappedMatch.tickerTheme || 'neon_classic',
        isLive: true,
      };
    }

    await liveStateService.setLiveScore(finalMatchId, snapshot);

    const io = getIO();
    if (io) {
      io.to(finalMatchId).emit(SOCKET.SCORE_UPDATED, snapshot);
    }
  } catch (err) {
    logger.error("Error caching/broadcasting live snapshot in goLiveSession:", err);
  }

  const appBase = process.env.USER_URL || process.env.CLIENT_URLS?.split(",")[0] || "https://kridaz.com";
  return {
    overlayToken,
    streamStatus: 'starting',
    youtubeVideoId: hostedGame.youtubeVideoId,
    urls: {
      obsOverlay: `${appBase}/live-overlay/${finalMatchId}?token=${overlayToken}`,
      publicScoreboard: `${appBase}/live-score/${finalMatchId}`
    }
  };
};

/**
 * Ends live broadcasting for the match.
 */
export const endLiveSession = async (matchId) => {
  let hostedGame = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!hostedGame) {
    const scoring = await prisma.cricketMatch.findUnique({ where: { id: matchId } });
    if (scoring) hostedGame = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
  }

  if (!hostedGame) {
    throw new NotFoundError("Match not found");
  }

  const finalMatchId = hostedGame.id;

  await prisma.hostedGame.update({
    where: { id: finalMatchId },
    data: {
      isLive: false,
      overlayToken: null,
      streamStatus: 'ended'
    }
  });

  try {
    await liveStateService.setStreamStatus(finalMatchId, 'ended');
  } catch (redisErr) {
    logger.warn("[Scoring] Redis cleanup failed (non-fatal):", redisErr.message);
  }

  // Fetch updated game & scoring session to cache and broadcast the live snapshot (sync off)
  try {
    const updatedHostedGame = await prisma.hostedGame.findUnique({
      where: { id: finalMatchId },
      include: HOSTED_GAME_SCORING_INCLUDE
    });
    const mappedMatch = mapHostedGame(updatedHostedGame);

    const scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: finalMatchId },
      include: {
        innings: true,
        playerStats: true,
        timeline: { take: 6, orderBy: { timestamp: 'desc' } }
      }
    });

    let snapshot = null;
    if (scoring) {
      snapshot = computeScoreSnapshot(scoring, mappedMatch);
    }

    if (!snapshot) {
      snapshot = {
        matchId: finalMatchId,
        status: 'NOT_STARTED',
        matchName: mappedMatch.name,
        teamA: mappedMatch.teamA,
        teamB: mappedMatch.teamB,
        date: mappedMatch.date,
        time: mappedMatch.time,
        scheduledStartAt: mappedMatch.scheduledStartAt,
        tossWinner: null,
        tossDecision: null,
        message: 'Match starts soon',
        tickerTheme: mappedMatch.tickerTheme || 'neon_classic',
        isLive: false,
      };
    }

    await liveStateService.setLiveScore(finalMatchId, snapshot);

    const io = getIO();
    if (io) {
      io.to(finalMatchId).emit(SOCKET.SCORE_UPDATED, snapshot);
    }
  } catch (err) {
    logger.error("Error caching/broadcasting live snapshot in endLiveSession:", err);
  }
};

/**
 * Updates YouTube streaming config keys.
 */
export const configureStream = async (matchId, { youtubeVideoId, youtubeLiveChatId }) => {
  let hostedGame = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!hostedGame) {
    const scoring = await prisma.cricketMatch.findUnique({ where: { id: matchId } });
    if (scoring) hostedGame = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
  }

  if (!hostedGame) {
    throw new NotFoundError("Match not found");
  }

  const finalMatchId = hostedGame.id;
  const streamStatus = youtubeVideoId ? 'online' : 'offline';

  await prisma.hostedGame.update({
    where: { id: finalMatchId },
    data: {
      streamConfig: {
        ...(typeof hostedGame.streamConfig === 'object' && hostedGame.streamConfig !== null ? hostedGame.streamConfig : {}),
        youtubeVideoId,
        youtubeLiveChatId
      },
      streamStatus: streamStatus
    }
  });

  await liveStateService.setStreamStatus(finalMatchId, streamStatus);

  // Broadcast updated live score so YouTube embed appears immediately
  try {
    const updatedHostedGame = await prisma.hostedGame.findUnique({
      where: { id: finalMatchId },
      include: HOSTED_GAME_SCORING_INCLUDE
    });
    const mappedMatch = mapHostedGame(updatedHostedGame);

    const scoring = await prisma.cricketMatch.findUnique({
      where: { gameId: finalMatchId },
      include: {
        innings: true,
        playerStats: true,
        timeline: { take: 6, orderBy: { timestamp: 'desc' } }
      }
    });

    let snapshot = null;
    if (scoring) {
      snapshot = computeScoreSnapshot(scoring, mappedMatch);
    } else {
      snapshot = {
        matchId: finalMatchId,
        status: 'NOT_STARTED',
        matchName: mappedMatch.name,
        teamA: mappedMatch.teamA,
        teamB: mappedMatch.teamB,
        date: mappedMatch.date,
        time: mappedMatch.time,
        scheduledStartAt: mappedMatch.scheduledStartAt,
        tickerTheme: mappedMatch.tickerTheme || 'neon_classic',
        youtubeVideoId: updatedHostedGame.streamConfig?.youtubeVideoId || null,
        isLive: updatedHostedGame.isLive,
      };
    }

    await liveStateService.setLiveScore(finalMatchId, snapshot);
    const io = getIO();
    if (io) io.to(finalMatchId).emit(SOCKET.SCORE_UPDATED, snapshot);
  } catch (err) {
    logger.error("Error caching/broadcasting live snapshot in configureStream:", err);
  }

  return { streamStatus };
};

/**
 * Finalizes the scoring session, normalizes game/match states and runs aggregation.
 */
export const finalizeMatch = async (scoringId) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: true }
  });

  if (!scoring) {
    throw new NotFoundError("Scoring session not found");
  }

  // Compute the result string ("Team A won by 24 runs" etc.) and persist it
  // on cricketMatch.result so downstream (post-match screens, share images,
  // notifications) can read a single canonical verdict instead of re-deriving.
  const hostedGameForResult = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE,
  });
  const resultSnapshot = computeScoreSnapshot(scoring, mapHostedGame(hostedGameForResult));
  const resultString = resultSnapshot?.matchResult || null;

  await prisma.$transaction([
    prisma.cricketMatch.update({
      where: { id: scoringId },
      data: { status: "COMPLETED", result: resultString }
    }),
    prisma.hostedGame.update({
      where: { id: scoring.gameId },
      data: {
        scoringStatus: "COMPLETED",
        status: "COMPLETED"
      }
    }),
    // Archive any temporary-pickup Teams linked to this game's GameTeam rows.
    // Team has NO gameId scalar — it joins to HostedGame via GameTeam.linkedTeamId,
    // so we have to traverse the relation. (Previous version targeted Team.gameId
    // which doesn't exist and crashed the whole finalizeMatch transaction.)
    prisma.team.updateMany({
      where: {
        isTemporaryPickup: true,
        linkedGameTeams: { some: { gameId: scoring.gameId } }
      },
      data: { status: "ARCHIVED" }
    })
  ]);

  const match = await prisma.hostedGame.findUnique({ where: { id: scoring.gameId } });
  const earnedBadges = await aggregatePlayerStats(scoring, match);

  return { earnedBadges };
};

/**
 * Performs a search match lookup using the unique short ID.
 */
export const lookupMatchByShortId = async (shortId) => {
  let match = await prisma.hostedGame.findFirst({
    where: { shortId: shortId.toUpperCase() },
    include: {
      host: { select: { id: true, name: true, profilePicture: true } },
      turf: true
    }
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  if (match.turf) {
    match.ground = match.turf;
  }

  return match;
};

/**
 * Initializes a live scoring session if one doesn't exist, validating permissions.
 */
export const initializeScoringSession = async (finalMatchId, finalBattingTeam, umpireId, userRole, tossWinner, tossDecision) => {
  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: finalMatchId },
    include: {
      host: true,
      umpire: true
    }
  });

  if (!hostedGame) {
    throw new NotFoundError("Match not found");
  }

  const isAdmin = userRole?.toUpperCase() === 'ADMIN';
  const isAuthorized =
    isAdmin ||
    hostedGame.umpireId === umpireId ||
    hostedGame.hostId === umpireId;

  if (!isAuthorized) {
    throw new ForbiddenError("Authorization failed. Only the assigned umpire, host, or admin can score this match.");
  }

  // 2-hour window check
  const now = new Date();
  const startTime = new Date(hostedGame.date);
  if (hostedGame.time) {
    const [hours, minutes] = hostedGame.time.split(':').map(Number);
    startTime.setHours(hours || 0, minutes || 0, 0, 0);
  }
  const timeDiffMs = startTime.getTime() - now.getTime();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  if (timeDiffMs > twoHoursMs) {
    throw new BadRequestError("Scoring can only be started within 2 hours of the scheduled start time.");
  }

  let scoring = await prisma.cricketMatch.findUnique({
    where: { gameId: finalMatchId },
    include: {
      innings: true,
      playerStats: true,
      timeline: { take: 5, orderBy: { timestamp: 'desc' } }
    }
  });

  if (!scoring) {
    scoring = await prisma.cricketMatch.create({
      data: {
        gameId: finalMatchId,
        status: "LIVE",
        timerState: "RUNNING",
        timerLastStartedAt: new Date(),
        oversPerInnings: hostedGame.oversPerInnings,
        tossWinner: tossWinner,
        tossDecision: tossDecision,
        innings: {
          create: {
            inningsIndex: 0,
            battingTeam: finalBattingTeam,
            extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 }
          }
        }
      },
      include: {
        innings: true,
        playerStats: true,
        timeline: true
      }
    });

    await prisma.hostedGame.update({
      where: { id: finalMatchId },
      data: { scoringStatus: "LIVE" }
    });
  } else if (tossWinner || tossDecision) {
    const isStarting = scoring.status === "NOT_STARTED";
    scoring = await prisma.cricketMatch.update({
      where: { gameId: finalMatchId },
      data: {
        tossWinner: tossWinner || scoring.tossWinner,
        tossDecision: tossDecision || scoring.tossDecision,
        status: isStarting ? "LIVE" : undefined,
        timerState: isStarting ? "RUNNING" : undefined,
        timerLastStartedAt: isStarting ? new Date() : undefined
      },
      include: {
        innings: true,
        playerStats: true,
        timeline: { take: 5, orderBy: { timestamp: 'desc' } }
      }
    });

    if (isStarting) {
      await prisma.hostedGame.update({
        where: { id: finalMatchId },
        data: { scoringStatus: "LIVE" }
      });
    }
  }

  return scoring;
};

/**
 * Transitions the live scoring session to the second innings.
 */
export const advanceToNextInnings = async (scoringId, battingTeamId) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });

  if (!scoring) {
    throw new NotFoundError("Scoring session not found");
  }

  // Guard 1 — already in (or past) innings 1, refuse to re-create.
  if (scoring.currentInningsIndex !== 0) {
    throw new BadRequestError(
      "Cannot advance — match is already past innings 1.",
      { code: "INNINGS_ALREADY_ADVANCED" }
    );
  }

  // Guard 2 — match already declared complete.
  if (scoring.status === "COMPLETED") {
    throw new BadRequestError(
      "Cannot advance — match has been finalized.",
      { code: "MATCH_ALREADY_COMPLETE" }
    );
  }

  const firstInnings = scoring.innings.find((i) => i.inningsIndex === 0);
  if (!firstInnings) {
    throw new BadRequestError(
      "Cannot advance — innings 0 doesn't exist.",
      { code: "NO_FIRST_INNINGS" }
    );
  }

  // Guard 3 — innings 0 must actually be done (all-out OR overs finished).
  // Without this an umpire could prematurely flip innings and lose runs.
  const maxOvers = scoring.oversPerInnings || 20;
  const oversFinished = firstInnings.totalBalls >= maxOvers * 6;
  const isAllOut = firstInnings.totalWickets >= 10; // conservative; per-match
                                                   // playersPerTeam lives on HostedGame
                                                   // and isn't fetched here.
  if (!firstInnings.isCompleted && !oversFinished && !isAllOut) {
    throw new BadRequestError(
      "Innings 0 is not complete yet (no all-out, no overs exhausted).",
      { code: "INNINGS_NOT_COMPLETE" }
    );
  }

  // Guard 4 — the new batting team must differ from innings 0's batting team.
  if (battingTeamId === firstInnings.battingTeam) {
    throw new BadRequestError(
      "Innings 1 batting team must differ from innings 0.",
      { code: "SAME_BATTING_TEAM" }
    );
  }

  await prisma.$transaction([
    prisma.innings.updateMany({
      where: { matchId: scoringId, inningsIndex: 0 },
      data: { isCompleted: true }
    }),
    prisma.innings.create({
      data: {
        matchId: scoringId,
        inningsIndex: 1,
        battingTeam: battingTeamId,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 }
      }
    }),
    prisma.cricketMatch.update({
      where: { id: scoringId },
      data: {
        currentInningsIndex: 1,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
        // Don't carry a stale free-hit flag into the new innings.
        freeHitActive: false,
      }
    })
  ]);

  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const match = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });
  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(match));
  await liveStateService.setLiveScore(scoring.gameId, liveData);

  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return updatedScoring;
};

/**
 * Updates the match status (e.g. LIVE, RAIN_DELAY, BAD_LIGHT).
 */
export const updateMatchStatus = async (scoringId, newStatus) => {
  const match = await prisma.cricketMatch.findUnique({
    where: { id: scoringId }
  });
  
  if (!match) throw new Error("Match not found");

  const now = new Date();
  let timerUpdate = {};

  const isPauseStatus = [
    "DRINKS", "TIMED_OUT", "LUNCH", "STUMPS", "RAIN", "OTHER",
    "SCORING_MISTAKE", "CHANGE_SCORER", "FACING_PROBLEM", "TESTING",
    "PAUSED", "RAIN_DELAY", "BAD_LIGHT"
  ].includes(newStatus.toUpperCase());
  
  if (isPauseStatus && match.timerState === "RUNNING") {
    let newTotalDuration = match.totalDurationSeconds;
    if (match.timerLastStartedAt) {
      const diffSecs = Math.floor((now.getTime() - match.timerLastStartedAt.getTime()) / 1000);
      newTotalDuration += diffSecs;
    }
    timerUpdate = {
      timerState: "PAUSED",
      totalDurationSeconds: newTotalDuration,
      timerLastStartedAt: null
    };
  } else if (newStatus.toUpperCase() === "LIVE" && (match.timerState === "PAUSED" || match.timerState === "NOT_STARTED")) {
    timerUpdate = {
      timerState: "RUNNING",
      timerLastStartedAt: now
    };
  }

  const scoring = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: { 
      status: newStatus,
      ...timerUpdate
    }
  });

  // Sync HostedGame.scoringStatus so match cards reflect pause/resume correctly
  if (isPauseStatus) {
    await prisma.hostedGame.update({
      where: { id: scoring.gameId },
      data: { scoringStatus: "PAUSED" }
    });
  } else if (newStatus.toUpperCase() === "LIVE") {
    await prisma.hostedGame.update({
      where: { id: scoring.gameId },
      data: { scoringStatus: "LIVE" }
    });
  }

  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });

  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(hostedGame));
  await liveStateService.setLiveScore(scoring.gameId, liveData);

  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return scoring;
};

/**
 * Revise match target and overs (DLS / Rain Rule).
 */
export const reviseTargetAndOvers = async (scoringId, revisedTarget, revisedOvers) => {
  const scoring = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: { revisedTarget, revisedOvers }
  });

  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });

  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(hostedGame));
  await liveStateService.setLiveScore(scoring.gameId, liveData);

  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return scoring;
};

/**
 * Set Match Officials (Umpires, Referees).
 */
export const setMatchOfficials = async (scoringId, officials) => {
  const scoring = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: { matchOfficials: officials }
  });

  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });

  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(hostedGame));
  await liveStateService.setLiveScore(scoring.gameId, liveData);

  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return scoring;
};

/**
 * Substitute an on-field player.
 */
export const substitutePlayer = async (scoringId, userId, substituteForId, inningsIndex) => {
  // Add the substitute to the player stats for the match/innings
  const stat = await prisma.matchPlayerStat.upsert({
    where: {
      matchId_userId_inningsIndex: { matchId: scoringId, userId, inningsIndex }
    },
    update: {
      isSubstitute: true,
      substituteForId: substituteForId
    },
    create: {
      matchId: scoringId,
      userId,
      inningsIndex,
      isSubstitute: true,
      substituteForId: substituteForId
    }
  });

  return stat;
};

/**
 * Use a team review (DRS).
 * @param {string} team - 'batting' or 'fielding'
 * @param {boolean} isSuccessful - if true, review is retained.
 */
export const useReview = async (scoringId, inningsIndex, team, isSuccessful) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });
  const innings = scoring.innings.find(i => i.inningsIndex === inningsIndex);
  if (!innings) throw new Error("Innings not found");

  const field = team === 'batting' ? 'battingTeamReviews' : 'fieldingTeamReviews';
  const currentReviews = innings[field];

  if (currentReviews <= 0) {
    throw new Error("No reviews remaining for this team");
  }

  if (!isSuccessful) {
    await prisma.innings.update({
      where: { id: innings.id },
      data: { [field]: currentReviews - 1 }
    });
  }

  // Refresh live score
  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });
  const updatedScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });

  const liveData = computeScoreSnapshot(updatedScoring, mapHostedGame(hostedGame));
  await liveStateService.setLiveScore(scoring.gameId, liveData);
  const io = getIO();
  if (io) io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);

  return updatedScoring;
};

/**
 * Set Powerplay overs for the current innings.
 */
export const setPowerplayOvers = async (scoringId, inningsIndex, overs) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });
  const innings = scoring.innings.find(i => i.inningsIndex === inningsIndex);

  if (innings) {
    await prisma.innings.update({
      where: { id: innings.id },
      data: { powerplayOvers: overs }
    });
  }

  return scoring;
};

/**
 * Updates toss winner and decision state details.
 */
export const updateTossResult = async (scoringId, winnerTeam, decision) => {
  const scoring = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: {
      tossWinner: winnerTeam,
      tossDecision: decision === "BAT" ? "BAT" : "BOWL"
    }
  });

  return scoring;
};

/**
 * Assigns or swaps active players on the scoring sheet.
 */
export const updateActivePlayers = async (scoringId, { strikerId, nonStrikerId, bowlerId, wicketKeeperId }) => {
  const scoring = await prisma.cricketMatch.findUnique({ where: { id: scoringId } });
  if (!scoring) {
    throw new NotFoundError("Scoring session not found");
  }

  // Law 17.6 — a bowler cannot bowl two consecutive overs. Disabled for
  // casual house rules where one good bowler is allowed to keep going.
  const houseRules = resolveHouseRules(scoring.houseRules);
  if (houseRules.enforceConsecutiveOverBlock && bowlerId && scoring.bowlerId === bowlerId) {
    throw new BadRequestError(
      "Same bowler cannot bowl consecutive overs",
      { code: "SAME_BOWLER_CONSECUTIVE_OVERS" }
    );
  }

  const finalStrikerId = strikerId !== undefined ? strikerId : scoring.strikerId;
  const finalNonStrikerId = nonStrikerId !== undefined ? nonStrikerId : scoring.nonStrikerId;

  if (finalStrikerId && finalNonStrikerId && finalStrikerId === finalNonStrikerId) {
    throw new BadRequestError("Striker and Non-Striker cannot be the same player");
  }

  const updateData = {};
  if (bowlerId) updateData.bowlerId = bowlerId;
  if (strikerId !== undefined) updateData.strikerId = strikerId;
  if (nonStrikerId !== undefined) updateData.nonStrikerId = nonStrikerId;

  // Retired-hurt comeback: when a player retired hurt is sent back in to bat,
  // flip their stat row's outStatus from RETIRED_HURT → NOT_OUT so the
  // scorecard correctly shows them as active again. Without this they keep
  // accumulating runs but the scorecard still shows them as retired.
  const incomingBatterIds = [strikerId, nonStrikerId].filter(
    (id) => typeof id === "string" && id.length > 0
  );
  const resetRetiredHurtOps = incomingBatterIds.map((userId) =>
    prisma.matchPlayerStat.updateMany({
      where: {
        matchId: scoringId,
        userId,
        inningsIndex: scoring.currentInningsIndex,
        outStatus: "RETIRED_HURT",
      },
      data: { outStatus: "NOT_OUT" },
    })
  );

  await prisma.$transaction([
    prisma.cricketMatch.update({
      where: { id: scoringId },
      data: updateData,
    }),
    ...resetRetiredHurtOps,
  ]);

  return await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true },
  });
};

/**
 * Reverts/undos the last ball logged in the database timeline.
 */
export const revertLastBall = async (scoringId) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: {
      timeline: { orderBy: { timestamp: 'desc' }, take: 1 },
      innings: true
    }
  });

  if (!scoring) {
    throw new NotFoundError("Scoring session not found");
  }

  if (!scoring.timeline.length) {
    throw new BadRequestError("No balls to undo");
  }

  const lastBall = scoring.timeline[0];
  const currentInnings = scoring.innings.find(i => i.inningsIndex === lastBall.inningsIndex);
  if (!currentInnings) {
    throw new BadRequestError("Innings not found for undo");
  }

  // Must match the forward path's definition exactly (processScoreUpdate),
  // including the same houseRules overrides — otherwise an undo decrements
  // totalBalls that the forward never incremented (or vice versa).
  const houseRules = resolveHouseRules(scoring.houseRules);
  const isLegalBall =
    lastBall.extraType !== "PENALTY" &&
    (lastBall.extraType !== "WIDE"    || houseRules.wideIsLegalBall) &&
    (lastBall.extraType !== "NO_BALL" || houseRules.noBallIsLegalBall);
  const runs = lastBall.runs ?? 0;
  const extraRuns = lastBall.extraRuns ?? (lastBall.isExtra ? 1 : 0);

  const newExtras = { ...currentInnings.extras };
  if (lastBall.extraType === "WIDE") newExtras.wides = Math.max(0, newExtras.wides - extraRuns);
  else if (lastBall.extraType === "NO_BALL") newExtras.noBalls = Math.max(0, newExtras.noBalls - extraRuns);
  else if (lastBall.extraType === "BYE") newExtras.byes = Math.max(0, newExtras.byes - extraRuns);
  else if (lastBall.extraType === "LEG_BYE") newExtras.legByes = Math.max(0, newExtras.legByes - extraRuns);
  else if (lastBall.extraType === "PENALTY") newExtras.penalty = Math.max(0, newExtras.penalty - extraRuns);

  let wasMaiden = false;
  if (isLegalBall && lastBall.ballInOver === 5) {
    const overBalls = await prisma.matchBall.findMany({
      where: {
        matchId: scoring.id,
        inningsIndex: lastBall.inningsIndex,
        over: lastBall.over,
        bowlerId: lastBall.bowlerId
      }
    });

    let totalBowlerRuns = 0;
    for (const b of overBalls) {
      if (!["BYE", "LEG_BYE", "PENALTY"].includes(b.extraType)) {
        totalBowlerRuns += (b.runs || 0) + (b.extraRuns || 0);
      }
    }
    if (totalBowlerRuns === 0) {
      wasMaiden = true;
    }
  }

  await prisma.$transaction([
    prisma.matchBall.delete({ where: { id: lastBall.id } }),
    prisma.innings.update({
      where: { id: currentInnings.id },
      data: {
        totalRuns: { decrement: runs + extraRuns },
        totalBalls: isLegalBall ? { decrement: 1 } : undefined,
        totalWickets: lastBall.isWicket ? { decrement: 1 } : undefined,
        extras: newExtras
      }
    }),
    prisma.matchPlayerStat.updateMany({
      where: { matchId: scoring.id, userId: lastBall.batterId, inningsIndex: lastBall.inningsIndex },
      data: {
        battingRuns: { decrement: runs },
        // Match the forward path: batter faced it iff the delivery counted
        // as legal (which respects houseRules.wideIsLegalBall / .noBallIsLegalBall).
        battingBalls: { decrement: isLegalBall ? 1 : 0 },
        battingFours: { decrement: lastBall.isFour ? 1 : 0 },
        battingSixes: { decrement: lastBall.isSix ? 1 : 0 }
      }
    }),
    prisma.matchPlayerStat.updateMany({
      where: { matchId: scoring.id, userId: lastBall.bowlerId, inningsIndex: lastBall.inningsIndex },
      data: {
        bowlingRuns: { decrement: (!["BYE", "LEG_BYE", "PENALTY"].includes(lastBall.extraType)) ? (runs + extraRuns) : 0 },
        bowlingBalls: { decrement: isLegalBall ? 1 : 0 },
        bowlingMaidens: { decrement: wasMaiden ? 1 : 0 },
        bowlingWickets: { decrement: (lastBall.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "TIMED_OUT", "OBSTRUCTING_FIELD", "HIT_BALL_TWICE", "HANDLED_BALL"].includes(lastBall.wicketType)) ? 1 : 0 }
      }
    }),
    ...(lastBall.isWicket ? [
      prisma.matchPlayerStat.updateMany({
        where: { matchId: scoring.id, userId: lastBall.playerOutId || lastBall.batterId, inningsIndex: lastBall.inningsIndex },
        data: {
          outStatus: "NOT_OUT",
          // Clear the dismissal-credit fields so the row mirrors the
          // forward-path state before the wicket was recorded.
          dismissedById: null,
          caughtById: null,
        }
      })
    ] : [])
  ]);

  return await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
  });
};

/**
 * Computes, validates, and processes standard score state changes on ball updates.
 */
export const processScoreUpdate = async (scoringId, ballData) => {
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });
  if (!scoring) {
    throw new NotFoundError("Scoring session not found");
  }

  const currentInnings = scoring.innings.find(i => i.inningsIndex === scoring.currentInningsIndex);
  if (!currentInnings) {
    throw new BadRequestError("No active innings");
  }

  if (scoring.timerState === "PAUSED") {
    throw new BadRequestError("Match is paused. Resume timer to score.");
  }

  const isWide = ballData.extraType === "WIDE";
  const isNoBall = ballData.extraType === "NO_BALL";
  const isBye = ballData.extraType === "BYE";
  const isLegBye = ballData.extraType === "LEG_BYE";
  const isPenalty = ballData.extraType === "PENALTY";

  // Default extraRuns: wides and no-balls carry an implicit +1; byes,
  // leg-byes and penalties only count what the caller explicitly states.
  // (Previously this defaulted to 1 for every `isExtra`, which caused
  // `{ extraType: BYE, runs: 4 }` to record 1 + 4 = 5 byes instead of 4.)
  let runs = ballData.runs ?? 0;
  let extraRuns = ballData.extraRuns ?? ((isWide || isNoBall) ? 1 : 0);

  // For byes/leg-byes the batter doesn't hit the ball, so any runs the
  // batters ran belong on `extraRuns`, not `runs`. Re-route before any state
  // update so those runs don't inflate the batter's individual score.
  // Callers can either send `{ extraType: BYE, runs: 4 }` OR
  // `{ extraType: BYE, extraRuns: 4 }`; both end up the same.
  if ((isBye || isLegBye) && runs > 0) {
    extraRuns = (extraRuns || 0) + runs;
    runs = 0;
  }

  const houseRules = resolveHouseRules(scoring.houseRules);

  // Free Hit (Law 21.18): if active and this is a regular delivery (not
  // wide/no-ball/penalty), the batter cannot be out via these modes. The
  // umpire-side UI should already prevent these inputs, but reject server-
  // side too so the database can't ever record an illegal dismissal.
  // Allowed on a free hit: RUN_OUT, HIT_BALL_TWICE, OBSTRUCTING_FIELD, HANDLED_BALL.
  // Disabled entirely when houseRules.enforceFreeHit is false (casual games).
  const FREE_HIT_FORBIDDEN_WICKETS = new Set([
    "BOWLED", "LBW", "CAUGHT", "STUMPED", "HIT_WICKET",
  ]);
  if (
    houseRules.enforceFreeHit &&
    scoring.freeHitActive &&
    ballData.isWicket &&
    FREE_HIT_FORBIDDEN_WICKETS.has(ballData.wicketType)
  ) {
    throw new BadRequestError(
      `Batter cannot be out ${ballData.wicketType} on a free hit (Law 21.18).`,
      { code: "FREE_HIT_INVALID_DISMISSAL" }
    );
  }

  const strikerId = scoring.strikerId || ballData.batterId || ballData.batsmanId;
  const bowlerId = scoring.bowlerId || ballData.bowlerId;
  const nonStrikerId = scoring.nonStrikerId;

  // ballsPerOver is configurable (default 6); some formats use 4 or 8.
  const ballsPerOver = houseRules.ballsPerOver || 6;
  const overNumber = Math.floor(currentInnings.totalBalls / ballsPerOver);
  const ballInOver = currentInnings.totalBalls % ballsPerOver;

  // Legal-ball definition. House rules can promote wide and/or no-ball to
  // count as a legal delivery (tape-ball formats often do this for wides).
  const isLegalBall =
    !isPenalty &&
    (!isWide || houseRules.wideIsLegalBall) &&
    (!isNoBall || houseRules.noBallIsLegalBall);
  const newExtras = { ...currentInnings.extras };
  if (isWide) newExtras.wides += extraRuns;
  else if (isNoBall) newExtras.noBalls += extraRuns;
  else if (isBye) newExtras.byes += extraRuns;
  else if (isLegBye) newExtras.legByes += extraRuns;
  else if (isPenalty) newExtras.penalty = (newExtras.penalty || 0) + extraRuns;

  // Strike Rotation Logic
  let newStrikerId = strikerId;
  let newNonStrikerId = nonStrikerId;
  const isOverComplete = isLegalBall && (ballInOver === ballsPerOver - 1);

  const physicalRunsRan = runs + (isBye || isLegBye ? extraRuns : 0) + ((isWide || isNoBall) && extraRuns > 1 ? extraRuns - 1 : 0);
  const pOutId = ballData.isWicket ? (ballData.playerOutId || strikerId) : null;

  if (ballData.isWicket) {
    const isRunOutOrRetired = ["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT"].includes(ballData.wicketType);

    if (isRunOutOrRetired) {
      let currentStrikerEndId = strikerId;
      let currentNonStrikerEndId = nonStrikerId;

      if (physicalRunsRan % 2 !== 0) {
        currentStrikerEndId = nonStrikerId;
        currentNonStrikerEndId = strikerId;
      }

      if (pOutId === currentStrikerEndId) {
        newStrikerId = ballData.nextBatterId || currentStrikerEndId;
        newNonStrikerId = currentNonStrikerEndId;
      } else {
        newNonStrikerId = ballData.nextBatterId || currentNonStrikerEndId;
        newStrikerId = currentStrikerEndId;
      }
    } else {
      newStrikerId = ballData.nextBatterId || strikerId;
      newNonStrikerId = nonStrikerId;
    }
  } else {
    if (!isPenalty && physicalRunsRan % 2 !== 0) {
      [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
    }
  }

  if (isOverComplete) {
    [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
  }

  if (newStrikerId && newNonStrikerId && newStrikerId === newNonStrikerId) {
    throw new BadRequestError("Striker and Non-Striker cannot be the same player");
  }

  await prisma.$transaction([
    prisma.matchBall.create({
      data: {
        matchId: scoring.id,
        inningsIndex: scoring.currentInningsIndex,
        over: overNumber,
        ballInOver: ballInOver,
        batterId: strikerId,
        bowlerId: bowlerId,
        runs: runs,
        isExtra: ballData.isExtra || false,
        extraType: ballData.extraType || "NONE",
        extraRuns: extraRuns,
        isBoundary: ballData.isBoundary || false,
        isFour: ballData.isFour || false,
        isSix: ballData.isSix || false,
        isWicket: ballData.isWicket || false,
        wicketType: ballData.wicketType,
        playerOutId: ballData.playerOutId,
        wicketTakerId: ballData.wicketTakerId,
        fielderId: ballData.fielderId,
        fieldingPosition: ballData.fieldingPosition,
        distance: ballData.distance
      }
    }),
    prisma.innings.update({
      where: { id: currentInnings.id },
      data: {
        totalRuns: { increment: runs + extraRuns },
        totalBalls: isLegalBall ? { increment: 1 } : undefined,
        totalWickets: (ballData.isWicket && ballData.wicketType !== 'RETIRED_HURT') ? { increment: 1 } : undefined,
        extras: newExtras
      }
    }),
    ...(strikerId ? [
      prisma.matchPlayerStat.upsert({
        where: {
          matchId_userId_inningsIndex: {
            matchId: scoring.id,
            userId: strikerId,
            inningsIndex: scoring.currentInningsIndex
          }
        },
        update: {
          battingRuns: { increment: runs },
          battingBalls: { increment: isLegalBall ? 1 : 0 },
          battingFours: { increment: ballData.isFour ? 1 : 0 },
          battingSixes: { increment: ballData.isSix ? 1 : 0 },
          outStatus: (ballData.isWicket && pOutId === strikerId) ? ballData.wicketType : undefined,
          // Persist who took the wicket / made the catch so the scorecard
          // can render "c Fielder b Bowler" without re-walking the timeline.
          dismissedById: (ballData.isWicket && pOutId === strikerId) ? (ballData.wicketTakerId || bowlerId) : undefined,
          caughtById:    (ballData.isWicket && pOutId === strikerId) ? (ballData.fielderId || null)        : undefined,
        },
        create: {
          matchId: scoring.id,
          userId: strikerId,
          inningsIndex: scoring.currentInningsIndex,
          battingRuns: runs,
          battingBalls: isLegalBall ? 1 : 0,
          battingFours: ballData.isFour ? 1 : 0,
          battingSixes: ballData.isSix ? 1 : 0,
          outStatus: (ballData.isWicket && pOutId === strikerId) ? ballData.wicketType : "NOT_OUT",
          dismissedById: (ballData.isWicket && pOutId === strikerId) ? (ballData.wicketTakerId || bowlerId) : null,
          caughtById:    (ballData.isWicket && pOutId === strikerId) ? (ballData.fielderId || null)        : null,
        }
      })
    ] : []),
    ...((ballData.isWicket && pOutId === nonStrikerId) ? [
      prisma.matchPlayerStat.upsert({
        where: {
          matchId_userId_inningsIndex: {
            matchId: scoring.id,
            userId: nonStrikerId,
            inningsIndex: scoring.currentInningsIndex
          }
        },
        update: {
          outStatus: ballData.wicketType,
          dismissedById: ballData.wicketTakerId || bowlerId,
          caughtById: ballData.fielderId || null,
        },
        create: {
          matchId: scoring.id,
          userId: nonStrikerId,
          inningsIndex: scoring.currentInningsIndex,
          battingRuns: 0,
          battingBalls: 0,
          battingFours: 0,
          battingSixes: 0,
          outStatus: ballData.wicketType,
          dismissedById: ballData.wicketTakerId || bowlerId,
          caughtById: ballData.fielderId || null,
        }
      })
    ] : []),
    ...(bowlerId ? [
      prisma.matchPlayerStat.upsert({
        where: {
          matchId_userId_inningsIndex: {
            matchId: scoring.id,
            userId: bowlerId,
            inningsIndex: scoring.currentInningsIndex
          }
        },
        update: {
          bowlingRuns: { increment: (!isBye && !isLegBye && !isPenalty) ? (runs + extraRuns) : 0 },
          bowlingBalls: { increment: isLegalBall ? 1 : 0 },
          bowlingWickets: { increment: (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "TIMED_OUT", "OBSTRUCTING_FIELD", "HIT_BALL_TWICE", "HANDLED_BALL"].includes(ballData.wicketType)) ? 1 : 0 }
        },
        create: {
          matchId: scoring.id,
          userId: bowlerId,
          inningsIndex: scoring.currentInningsIndex,
          bowlingRuns: (!isBye && !isLegBye && !isPenalty) ? (runs + extraRuns) : 0,
          bowlingBalls: isLegalBall ? 1 : 0,
          bowlingWickets: (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "TIMED_OUT", "OBSTRUCTING_FIELD", "HIT_BALL_TWICE", "HANDLED_BALL"].includes(ballData.wicketType)) ? 1 : 0
        }
      })
    ] : []),
    prisma.cricketMatch.update({
      where: { id: scoring.id },
      data: {
        strikerId: newStrikerId,
        nonStrikerId: newNonStrikerId,
        // Free Hit lifecycle (Law 21.18):
        //   - SET on every no-ball (the NEXT delivery is the free hit).
        //   - PERSISTS through subsequent wides / no-balls (the free hit
        //     window stays open until a fair ball is bowled).
        //   - CLEARED on the next fair delivery (anything that isn't a
        //     wide or no-ball, which means a legal ball OR a bye/leg-bye/
        //     penalty — those count as fair from the umpire's POV).
        //   - When enforceFreeHit is OFF, we never set the flag.
        freeHitActive: !houseRules.enforceFreeHit
          ? false
          : (isNoBall
              ? true
              : (isWide ? scoring.freeHitActive : false)),
      }
    })
  ]);

  if (isOverComplete && bowlerId) {
    const overBalls = await prisma.matchBall.findMany({
      where: {
        matchId: scoring.id,
        inningsIndex: scoring.currentInningsIndex,
        over: overNumber,
        bowlerId: bowlerId
      }
    });

    let totalBowlerRuns = 0;
    for (const b of overBalls) {
      if (!["BYE", "LEG_BYE", "PENALTY"].includes(b.extraType)) {
        totalBowlerRuns += (b.runs || 0) + (b.extraRuns || 0);
      }
    }

    if (totalBowlerRuns === 0) {
      await prisma.matchPlayerStat.updateMany({
        where: { matchId: scoring.id, userId: bowlerId, inningsIndex: scoring.currentInningsIndex },
        data: { bowlingMaidens: { increment: 1 } }
      });
    }
  }

  const [updatedScoring, hostedGame] = await Promise.all([
    prisma.cricketMatch.findUnique({
      where: { id: scoring.id },
      include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
    }),
    prisma.hostedGame.findUnique({
      where: { id: scoring.gameId },
      include: HOSTED_GAME_SCORING_INCLUDE
    })
  ]);

  const mappedHostedGame = mapHostedGame(hostedGame);
  const liveData = computeScoreSnapshot(updatedScoring, mappedHostedGame);

  let finalScoring = updatedScoring;
  if (liveData.isInningsComplete && updatedScoring.timerState === "RUNNING") {
    const now = new Date();
    const elapsedSinceLastStart = updatedScoring.timerLastStartedAt ? Math.floor((now - new Date(updatedScoring.timerLastStartedAt)) / 1000) : 0;
    const newElapsedTime = (updatedScoring.totalDurationSeconds || 0) + elapsedSinceLastStart;

    finalScoring = await prisma.cricketMatch.update({
      where: { id: scoring.id },
      data: {
        timerState: "PAUSED",
        totalDurationSeconds: newElapsedTime,
        timerLastStartedAt: null
      },
      include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: 'desc' } } }
    });
  }

  await liveStateService.setLiveScore(scoring.gameId, liveData);

  const io = getIO();
  if (io) {
    io.to(scoring.gameId).emit(SOCKET.SCORE_UPDATED, liveData);
  }

  // AI Commentary (Async Background Job)
  import('../commentary/commentary.service.js')
    .then(({ commentaryQueue }) => {
      commentaryQueue.add('generate', {
        matchId: scoring.gameId,
        liveData,
        ballEvent: ballData
      });
    })
    .catch(err => logger.error("[Scoring] Failed to load commentary queue:", err));

  return { scoring: finalScoring, liveData };
};

/**
 * Returns formatted match scores, active overs, and user scoreboard snapshot profiles.
 */
export const fetchMatchStatus = async (matchId) => {
  const resolvedId = await resolveGameId(matchId);
  const scoring = await prisma.cricketMatch.findFirst({
    where: {
      OR: [
        { id: resolvedId },
        { gameId: resolvedId }
      ]
    },
    include: {
      innings: true,
      playerStats: true,
      timeline: { take: 10, orderBy: { timestamp: 'desc' } }
    }
  });

  if (scoring) {
    const userIds = scoring.playerStats.map(s => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, profilePicture: true }
    });
    
    const customPlayers = await prisma.customPlayerInvite.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });

    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u));
    customPlayers.forEach(c => userMap.set(c.id, { id: c.id, name: c.name, profilePicture: null }));

    const formattedPlayerStats = scoring.playerStats.map(s => ({
      ...s,
      user: userMap.get(s.userId) || { name: "Player", profilePicture: null }
    }));

    const scoringWithUsers = {
      ...scoring,
      playerStats: formattedPlayerStats
    };

    const hostedGame = await prisma.hostedGame.findUnique({
      where: { id: scoring.gameId },
      include: HOSTED_GAME_SCORING_INCLUDE
    });

    const mappedHostedGame = mapHostedGame(hostedGame);
    const scoringSnapshot = computeScoreSnapshot(scoringWithUsers, mappedHostedGame);

    return { type: "SCORING_EXISTS", scoring: scoringWithUsers, scoringSnapshot, hostedGame: mappedHostedGame };
  }

  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: resolvedId },
    include: {
      host: { select: { name: true, profilePicture: true } },
      turf: true,
      teams: HOSTED_GAME_SCORING_INCLUDE.teams
    }
  });

  if (!hostedGame) {
    throw new NotFoundError("Match not found");
  }

  const mappedHostedGame = mapHostedGame(hostedGame);
  return { type: "HOSTED_GAME_ONLY", hostedGame: mappedHostedGame };
};

/**
 * Resolves a match ID. If it's a shortId, looks up the full UUID from HostedGame.
 */
export const resolveGameId = async (matchId) => {
  if (matchId.length === 36) return matchId;
  const match = await prisma.hostedGame.findFirst({
    where: { shortId: matchId.toUpperCase() },
    select: { id: true }
  });
  return match ? match.id : matchId;
};

/**
 * Generates rich analytics graphs, wickets, boundary hits, and highlights the match MVP.
 */
export const fetchMatchAnalytics = async (matchId) => {
  const resolvedId = await resolveGameId(matchId);
  const scoring = await prisma.cricketMatch.findFirst({
    where: {
      OR: [
        { id: resolvedId },
        { gameId: resolvedId }
      ]
    },
    include: {
      innings: true,
      playerStats: true,
      timeline: true,
      game: {
        include: {
          teams: true
        }
      }
    }
  });

  if (!scoring) {
    throw new NotFoundError("Match data not found");
  }

  const userIds = new Set();
  scoring.playerStats.forEach(s => userIds.add(s.userId));
  scoring.timeline.forEach(ball => {
    userIds.add(ball.batterId);
    userIds.add(ball.bowlerId);
    if (ball.fielderId) userIds.add(ball.fielderId);
  });

  const userIdsArray = Array.from(userIds);
  const users = await prisma.user.findMany({
    where: { id: { in: userIdsArray } },
    select: { id: true, name: true, profilePicture: true }
  });
  
  const customPlayers = await prisma.customPlayerInvite.findMany({
    where: { id: { in: userIdsArray } },
    select: { id: true, name: true }
  });

  const userMap = new Map();
  users.forEach(u => userMap.set(u.id, u));
  customPlayers.forEach(c => userMap.set(c.id, { id: c.id, name: c.name, profilePicture: null }));

  const formattedPlayerStats = scoring.playerStats.map(s => ({
    ...s,
    user: userMap.get(s.userId) || { name: "Player", profilePicture: null }
  }));

  const formattedTimeline = scoring.timeline.map(ball => ({
    ...ball,
    batter: userMap.get(ball.batterId) || { name: "Batter", profilePicture: null },
    bowler: userMap.get(ball.bowlerId) || { name: "Bowler", profilePicture: null },
    fielder: ball.fielderId ? (userMap.get(ball.fielderId) || { name: "Fielder", profilePicture: null }) : null
  }));

  const scoringWithUsers = {
    ...scoring,
    game: mapHostedGame(scoring.game),
    playerStats: formattedPlayerStats,
    timeline: formattedTimeline
  };

  const playerPoints = new Map();
  scoringWithUsers.playerStats.forEach(s => {
    const pts = (s.battingRuns || s.runs || 0) + (s.battingSixes || s.sixes || 0) * 2 + (s.battingFours || s.fours || 0) * 1 + (s.bowlingWickets || s.wickets || 0) * 25;
    playerPoints.set(s.userId, { name: s.user.name, points: pts, profilePicture: s.user.profilePicture });
  });

  scoringWithUsers.timeline.forEach(ball => {
    if (ball.isWicket && ball.fielderId) {
      const current = playerPoints.get(ball.fielderId) || { name: ball.fielder?.name || "Fielder", points: 0, profilePicture: ball.fielder?.profilePicture };
      current.points += 10;
      playerPoints.set(ball.fielderId, current);
    }
  });

  const sortedPlayers = Array.from(playerPoints.values()).sort((a, b) => b.points - a.points);
  const mvp = sortedPlayers[0];

  return {
    scoring: scoringWithUsers,
    analytics: {
      mvp,
      topPerformers: sortedPlayers.slice(0, 3),
      totalFours: scoringWithUsers.playerStats.reduce((acc, curr) => acc + (curr.battingFours || curr.fours || 0), 0),
      totalSixes: scoringWithUsers.playerStats.reduce((acc, curr) => acc + (curr.battingSixes || curr.sixes || 0), 0)
    }
  };
};

/**
 * Returns a live scoreboard snapshot with fast Redis caching gates.
 */
export const fetchLiveScoreSnapshot = async (matchId) => {
  const resolvedId = await resolveGameId(matchId);
  
  const cached = await liveStateService.getLiveScore(resolvedId);
  if (cached) {
    return { data: cached, source: 'redis' };
  }

  const match = await prisma.hostedGame.findUnique({
    where: { id: resolvedId },
    include: HOSTED_GAME_SCORING_INCLUDE
  });

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  const mappedMatch = mapHostedGame(match);

  const scoring = await prisma.cricketMatch.findUnique({
    where: { gameId: matchId },
    include: {
      innings: true,
      playerStats: true,
      timeline: { take: 6, orderBy: { timestamp: 'desc' } }
    }
  });

  let snapshot = null;
  if (scoring) {
    snapshot = computeScoreSnapshot(scoring, mappedMatch);
  }

  if (!snapshot) {
    // Extract professionals from custom objects or official assignments if available
    const professionals = [];
    if (match.umpire?.name) professionals.push({ id: match.umpire.id, name: match.umpire.name, role: 'Umpire', profilePicture: match.umpire.profilePicture });
    else if (match.customUmpire?.name) professionals.push({ name: match.customUmpire.name, role: 'Umpire' });

    if (match.scorer?.name) professionals.push({ id: match.scorer.id, name: match.scorer.name, role: 'Scorer', profilePicture: match.scorer.profilePicture });
    else if (match.customScorer?.name) professionals.push({ name: match.customScorer.name, role: 'Scorer' });

    if (match.streamer?.name) professionals.push({ id: match.streamer.id, name: match.streamer.name, role: 'Streamer', profilePicture: match.streamer.profilePicture });
    else if (match.customStreamer?.name) professionals.push({ name: match.customStreamer.name, role: 'Streamer' });

    if (Array.isArray(match.customProfessionals)) {
      match.customProfessionals.forEach(p => {
        if (p?.name) professionals.push({ name: p.name, role: p.role || 'Official' });
      });
    }

    // Return a minimal placeholder snapshot if scoring hasn't started yet
    snapshot = {
      matchId: match.id,
      status: 'NOT_STARTED',
      matchName: match.name,
      teamA: mappedMatch.teamA,
      teamB: mappedMatch.teamB,
      date: match.date,
      time: match.time,
      scheduledStartAt: match.scheduledStartAt,
      ballType: match.ballType || null,
      format: match.format || match.gameType || null,
      oversPerInnings: match.oversPerInnings,
      tossWinner: null,
      tossDecision: null,
      message: 'Match starts soon',
      tickerTheme: match.tickerTheme || 'neon_classic',
      isLive: match.isLive ?? false,
      location: match.city || match.state ? `${match.city || ''} ${match.state || ''}`.trim() : null,
      venueId: match.turfId || null,
      ground: mappedMatch.ground || match.customVenue || null,
      professionals
    };
  }

  await liveStateService.setLiveScore(matchId, snapshot);
  return { data: snapshot, source: 'prisma' };
};

/**
 * Generates a collision-safe 8-character alphanumeric short ID.
 * Retries up to 10 times using DB uniqueness check, then falls back to
 * a timestamp-prefixed ID to guarantee uniqueness under high concurrency.
 */
const generateUniqueShortId = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    const existing = await prisma.hostedGame.findUnique({ where: { shortId: candidate } });
    if (!existing) return candidate;
  }
  // Fallback: timestamp base36 prefix ensures uniqueness even at massive concurrency
  const tsFragment = Date.now().toString(36).toUpperCase().slice(-4);
  const randFragment = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return tsFragment + randFragment;
};

/**
 * Creates a new ScoringMatch (using the HostedGame model acting as the parent record).
 *
 * Field mapping (HostedGame schema → service):
 *   name            ← matchName
 *   gameType        ← "SCORING_MATCH"
 *   format          ← format
 *   ballType        ← ballType
 *   groundType      ← groundType
 *   youtubeLiveUrl  ← youtubeLiveUrl
 *   scoringPassword ← hashed password (argon2)
 *   maxMembers      ← maxMembers (default 11)
 *   shortId         ← collision-safe alphanumeric ID
 */
export const createScoringMatch = async (userId, matchData) => {
  const {
    matchName,
    format,
    ballType,
    groundType,
    maxMembers,
    teamAId,
    teamBId,
    teamAData,
    teamBData,
    teamAPlayers,
    teamBPlayers,
    venueId,
    customVenue,
    customProfessionals,
    professionals,
    tossWinner,
    tossDecision,
    scoringPassword,
    youtubeLiveUrl,
    location,
    customDays,
    customOversPerDay,
    matchDateTime
  } = matchData;

  // Determine match duration in days based on format
  let resolvedDays = 1;
  let resolvedOversPerDay = 20;

  if (format === 'TEST' || format === '5_DAY') {
    resolvedDays = 5;
    resolvedOversPerDay = 90;
  } else if (format === '1_WEEK') {
    resolvedDays = 7;
    resolvedOversPerDay = 90;
  } else if (format === 'CUSTOM') {
    resolvedDays = customDays ? parseInt(customDays) || 1 : 1;
    resolvedOversPerDay = customOversPerDay ? parseInt(customOversPerDay) || 20 : 20;
  } else {
    resolvedDays = 1;
    resolvedOversPerDay = format === 'ODI' ? 50 : format === 'T10' ? 10 : format === 'THE_HUNDRED' ? 20 : 20;
  }

  // Hash the scoring password for security (argon2)
  let hashedPassword = null;
  if (scoringPassword && scoringPassword.trim() !== '') {
    const argon2 = await import('argon2');
    hashedPassword = await argon2.hash(scoringPassword);
  }

  // Look up team names/images from Team model if IDs are provided
  let teamAName = teamAData?.name || 'Team A';
  let teamAImage = teamAData?.image || null;
  let teamBName = teamBData?.name || 'Team B';
  let teamBImage = teamBData?.image || null;

  if (teamAId) {
    const teamA = await prisma.team.findUnique({
      where: { id: teamAId },
      select: { name: true, logo: true, image: true }
    });
    if (teamA) {
      teamAName = teamA.name;
      teamAImage = teamA.logo || teamA.image || null;
    }
  }
  if (teamBId) {
    const teamB = await prisma.team.findUnique({
      where: { id: teamBId },
      select: { name: true, logo: true, image: true }
    });
    if (teamB) {
      teamBName = teamB.name;
      teamBImage = teamB.logo || teamB.image || null;
    }
  }

  // Look up listed professionals if provided and assign roles
  let umpireId = null;
  let scorerId = null;
  let streamerId = null;

  const validProfessionals = (professionals || []).filter(p => typeof p === 'string' && p.trim() !== '');

  if (validProfessionals.length > 0) {
    const profiles = await prisma.ownerProfile.findMany({
      where: { id: { in: validProfessionals } },
      select: { userId: true, user: { select: { role: true } } }
    });
    for (const p of profiles) {
      if (p.user?.role === 'UMPIRE') umpireId = p.userId;
      else if (p.user?.role === 'SCORER') scorerId = p.userId;
      else if (p.user?.role === 'STREAMER') streamerId = p.userId;
    }
  }

  const shortId = await generateUniqueShortId();

  // Create the HostedGame with nested GameTeam records
  const game = await prisma.hostedGame.create({
    data: {
      gameType: 'SCORING_MATCH',
      name: matchName || 'Custom Scoring Match',
      format: format || 'T20',
      ballType: ballType || 'TENNIS',
      groundType: groundType || 'OUTDOOR',
      shortId,
      hostId: userId,
      turfId: venueId || null,
      customVenue: customVenue || null,
      customProfessionals: customProfessionals || null,
      city: location || null,
      umpireId: umpireId || null,
      scorerId: scorerId || null,
      streamerId: streamerId || null,
      status: 'ACTIVE',
      scoringStatus: 'NOT_STARTED',
      scoringPassword: hashedPassword,
      youtubeLiveUrl: youtubeLiveUrl || null,
      maxMembers: maxMembers || 11,
      customDays: resolvedDays,
      customOversPerDay: resolvedOversPerDay,
      date: matchDateTime ? new Date(matchDateTime) : new Date(),
      time: matchDateTime ? new Date(matchDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toTimeString().split(' ')[0],
      scheduledStartAt: matchDateTime ? new Date(matchDateTime) : null,
      oversPerInnings: format === 'T20' ? 20 : format === 'ODI' ? 50 : format === 'T10' ? 10 : format === 'CUSTOM' ? resolvedOversPerDay : 20,
      teams: {
        create: [
          {
            teamKey: 'teamA',
            name: teamAName,
            image: teamAImage,
          },
          {
            teamKey: 'teamB',
            name: teamBName,
            image: teamBImage,
          }
        ]
      }
    },
    include: {
      teams: true
    }
  });

  // Assign players to GameSlots for each team
  const slotCreates = [];

  const processPlayerSlot = async (p, teamRecord) => {
    if (p.isCustom) {
      // Create CustomPlayerInvite
      const customInvite = await prisma.customPlayerInvite.create({
        data: {
          gameId: game.id,
          name: p.name,
          email: `${p.id}@kridaz.custom`, // Dummy email
          inviteStatus: 'ACCEPTED',
        }
      });
      return {
        gameId: game.id,
        teamId: teamRecord.id,
        userId: null,
        customPlayerId: customInvite.id,
        status: 'CONFIRMED',
        role: p.role || 'PLAYER'
      };
    } else {
      return {
        gameId: game.id,
        teamId: teamRecord.id,
        userId: p.id || p.userId,
        status: 'CONFIRMED',
        role: p.role || 'PLAYER'
      };
    }
  };

  const teamARecord = game.teams.find(t => t.teamKey === 'teamA');
  if (teamARecord && teamAPlayers && teamAPlayers.length > 0) {
    const aSlots = await Promise.all(teamAPlayers.map(p => processPlayerSlot(p, teamARecord)));
    slotCreates.push(...aSlots);
  }

  const teamBRecord = game.teams.find(t => t.teamKey === 'teamB');
  if (teamBRecord && teamBPlayers && teamBPlayers.length > 0) {
    const bSlots = await Promise.all(teamBPlayers.map(p => processPlayerSlot(p, teamBRecord)));
    slotCreates.push(...bSlots);
  }

  if (slotCreates.length > 0) {
    await prisma.gameSlot.createMany({ data: slotCreates });
  }

  if (tossWinner && tossDecision) {
    let battingTeamKey = 'teamA';
    if (tossWinner === teamAId) {
      battingTeamKey = tossDecision === 'BAT' ? 'teamA' : 'teamB';
    } else if (tossWinner === teamBId) {
      battingTeamKey = tossDecision === 'BAT' ? 'teamB' : 'teamA';
    }

    try {
      await initializeScoringSession(game.id, battingTeamKey, userId, 'ADMIN');

      await prisma.cricketMatch.update({
        where: { gameId: game.id },
        data: {
          tossWinner: tossWinner === teamAId ? teamAName : teamBName,
          tossDecision: tossDecision
        }
      });
    } catch (err) {
      console.error("Error auto-initializing scoring session:", err);
    }
  }

  // Create CustomPlayerInvite for custom professionals
  if (customProfessionals && customProfessionals.length > 0) {
    const proCreates = customProfessionals.map(pro => ({
      gameId: game.id,
      name: pro.name,
      phone: pro.phone || null,
      email: `${game.id}_${pro.name.replace(/\s+/g, '')}@kridaz.custom`,
      role: pro.role || 'UMPIRE',
      isProfessional: true,
      inviteStatus: 'PENDING'
    }));
    await prisma.customPlayerInvite.createMany({ data: proCreates });
  }

  // Return full game with teams + player slots
  return await prisma.hostedGame.findUnique({
    where: { id: game.id },
    include: {
      teams: {
        include: {
          slots: {
            include: {
              user: { select: { id: true, name: true, profilePicture: true } },
              customPlayer: true
            }
          }
        }
      }
    }
  });
};


/**
 * Get all scoring games associated with the user
 */
export const getUserScoringGames = async (userId) => {
  return await prisma.hostedGame.findMany({
    where: {
      OR: [
        { hostId: userId },
        { umpireId: userId }
      ],
      gameType: "SCORING_MATCH",
    },
    include: {
      teams: {
        include: {
          slots: {
            include: {
              user: { select: { id: true, name: true, profilePicture: true } },
              customPlayer: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

/**
 * Get a single scoring game by ID with full team/player/match details.
 */
export const getScoringGameById = async (gameId) => {
  return await prisma.hostedGame.findUnique({
    where: { id: gameId },
    include: {
      teams: {
        include: {
          slots: {
            include: {
              user: { select: { id: true, name: true, profilePicture: true, username: true } },
              customPlayer: true
            }
          }
        }
      },
      cricketMatch: {
        select: {
          id: true,
          status: true,
          tossWinner: true,
          tossDecision: true,
          currentInningsIndex: true,
          oversPerInnings: true,
          strikerId: true,
          nonStrikerId: true,
          bowlerId: true,
        }
      },
      turf: {
        select: { id: true, name: true, location: true, city: true, image: true }
      },
      umpire: {
        select: { id: true, name: true, profilePicture: true, username: true }
      },
      scorer: {
        select: { id: true, name: true, profilePicture: true, username: true }
      },
      streamer: {
        select: { id: true, name: true, profilePicture: true, username: true }
      }
    }
  });
};

/**
 * Verify the scoring app password for a game.
 * Returns a short-lived JWT scoped to this specific game with SCORER role.
 * Throws named errors for controller-level HTTP status mapping.
 */
export const verifyScoringPassword = async (gameId, password) => {
  const game = await prisma.hostedGame.findUnique({
    where: { id: gameId },
    select: { id: true, scoringPassword: true, hostId: true, shortId: true }
  });

  if (!game) {
    throw new NotFoundError("GAME_NOT_FOUND");
  }

  if (!game.scoringPassword) {
    // No password set — allow open access
    const token = jwt.sign(
      { gameId: game.id, role: 'SCORER', shortId: game.shortId },
      getAccessSecret(),
      { expiresIn: '8h' }
    );
    return { token };
  }

  // Verify with argon2 (same lib used across the codebase)
  const argon2 = await import('argon2');
  const isValid = await argon2.verify(game.scoringPassword, password);
  if (!isValid) {
    throw new UnauthorizedError("INVALID_PASSWORD");
  }

  const token = jwt.sign(
    { gameId: game.id, role: 'SCORER', shortId: game.shortId },
    getAccessSecret(),
    { expiresIn: '8h' }
  );
  return { token };
};

/**
 * Delete match permanently (placeholder for actual implementation)
 */
export const deleteScoringMatch = async (matchId, userId) => {
  // Add appropriate validation
  const game = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!game) {
    throw new NotFoundError("MATCH_NOT_FOUND");
  }

  // Delete the match
  await prisma.hostedGame.delete({ where: { id: matchId } });
  return true;
};
export const toggleMatchTimer = async (scoringId) => {
  const match = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { playerStats: true }
  });

  if (!match) throw new Error("Match not found");

  const now = new Date();
  let newTimerState;
  let newTotalDuration = match.totalDurationSeconds;
  let newTimerLastStartedAt = match.timerLastStartedAt;

  if (match.timerState === "NOT_STARTED" || match.timerState === "PAUSED") {
    newTimerState = "RUNNING";
    newTimerLastStartedAt = now;
  } else if (match.timerState === "RUNNING") {
    newTimerState = "PAUSED";
    if (match.timerLastStartedAt) {
      const diffSecs = Math.floor((now.getTime() - match.timerLastStartedAt.getTime()) / 1000);
      newTotalDuration += diffSecs;
    }
    newTimerLastStartedAt = null;
  } else {
    throw new Error("Match already ended");
  }

  const newMatchStatus = newTimerState === "RUNNING" ? "LIVE" : "PAUSED";

  const updatedMatch = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: {
      timerState: newTimerState,
      totalDurationSeconds: newTotalDuration,
      timerLastStartedAt: newTimerLastStartedAt,
      status: newMatchStatus
    }
  });

  await prisma.hostedGame.update({
    where: { id: match.gameId },
    data: { scoringStatus: newMatchStatus }
  });

  const activeIds = [match.strikerId, match.nonStrikerId, match.bowlerId].filter(Boolean);

  for (const stat of match.playerStats) {
    if (activeIds.includes(stat.userId)) {
      if (newTimerState === "RUNNING") {
        await prisma.matchPlayerStat.update({
          where: { id: stat.id },
          data: { timerLastStartedAt: now }
        });
      } else if (newTimerState === "PAUSED") {
        const timeDiff = stat.timerLastStartedAt ? Math.floor((now.getTime() - stat.timerLastStartedAt.getTime()) / 1000) : 0;
        await prisma.matchPlayerStat.update({
          where: { id: stat.id },
          data: {
            timeSpentSeconds: stat.timeSpentSeconds + timeDiff,
            timerLastStartedAt: null
          }
        });
      }
    }
  }

  const io = getIO();
  if (io) {
    const fullUpdatedMatch = await prisma.cricketMatch.findUnique({
      where: { id: scoringId },
      include: {
        game: { include: HOSTED_GAME_SCORING_INCLUDE },
        innings: true,
        timeline: { orderBy: { timestamp: 'desc' }, take: 10 },
        playerStats: true
      }
    });
    const liveData = computeScoreSnapshot(fullUpdatedMatch, mapHostedGame(fullUpdatedMatch.game));
    await liveStateService.setLiveScore(fullUpdatedMatch.gameId, liveData);
    io.to(fullUpdatedMatch.gameId).emit(SOCKET.SCORE_UPDATED, liveData);
  }

  return { updatedMatch };
};

export const addPenaltyRuns = async (scoringId, runs, teamId) => {
  const match = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true }
  });

  if (!match) throw new Error("Match not found");

  const currentInnings = match.innings.find(i => i.inningsIndex === match.currentInningsIndex);
  if (!currentInnings) throw new Error("Innings not active");

  // Casual / pickup games often disable penalties entirely.
  const houseRules = resolveHouseRules(match.houseRules);
  if (!houseRules.penaltyEnabled) {
    throw new BadRequestError(
      "Penalty runs are disabled for this match.",
      { code: "PENALTY_DISABLED" }
    );
  }

  // teamId is the team the penalty is awarded AGAINST. Per MCC Law 41:
  //   - Penalty against fielding team → batting side gains <runs> in CURRENT innings.
  //   - Penalty against batting team  → fielding side gains <runs>, applied to
  //     their CURRENT or NEXT innings depending on phase of the match.
  //
  // Previous version routed the second case to the "other innings" — which
  // doesn't exist during innings 0. The penalty silently no-op'd, so umpires
  // thought they'd awarded runs that never landed. In every case now we
  // apply to the current innings; the rare "credit the bowling side's next
  // innings" case is left for umpire reconciliation rather than silently
  // dropping the runs.
  const penaltyRuns = parseInt(runs);
  const over = Math.floor(currentInnings.totalBalls / 6);
  const ballInOver = currentInnings.totalBalls % 6;

  const newBall = await prisma.matchBall.create({
    data: {
      matchId: scoringId,
      inningsIndex: currentInnings.inningsIndex,
      over,
      ballInOver,
      batterId: match.strikerId || "PENALTY",
      bowlerId: match.bowlerId || "PENALTY",
      runs: 0,
      isExtra: true,
      extraType: "PENALTY",
      extraRuns: penaltyRuns,
      commentary: `Penalty of ${penaltyRuns} runs awarded.`
    }
  });

  const updatedInnings = await prisma.innings.update({
    where: { id: currentInnings.id },
    data: { totalRuns: { increment: penaltyRuns } }
  });

  // io may be null in unit tests / smoke scripts without a running socket.
  const io = getIO();
  if (io) {
    io.to(match.gameId).emit('scoreUpdated', {
      ballId: newBall.id,
      type: 'penalty',
      runs: penaltyRuns,
      match: match
    });
  }

  return { newBall, updatedInnings };
};

/**
 * Update per-match house rules (consecutive-over block, free hit, ballsPerOver,
 * lastManStands, penaltyEnabled, etc.). The caller can change one key or many
 * — partial overrides merge with stored values; null/undefined incoming values
 * are ignored. To revert a key to MCC default, send it as null inside the
 * incoming object; the service strips nulls then merges, so `null` effectively
 * means "drop this override".
 *
 * Authorization: caller must be either
 *   (a) the assigned umpire on the HostedGame,
 *   (b) the assigned scorer on the HostedGame, OR
 *   (c) holding a SCORER token derived from the scoring-app password
 *       (role === 'scorer' or 'SCORER' in the JWT payload).
 *
 * @param {string} scoringId  CricketMatch.id
 * @param {object} viewer     req.user (with id and role)
 * @param {object} incoming   partial houseRules payload
 */
export const updateHouseRules = async (scoringId, viewer, incoming) => {
  if (!viewer || (!viewer.id && viewer.role?.toLowerCase() !== "scorer")) {
    const err = new UnauthorizedError("Authentication required to change house rules.");
    err.meta = { code: "AUTH_REQUIRED" };
    throw err;
  }

  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    select: { id: true, gameId: true, houseRules: true, status: true },
  });
  if (!scoring) {
    throw new NotFoundError("Scoring session not found");
  }

  if (scoring.status === "COMPLETED") {
    throw new BadRequestError(
      "Cannot change house rules after the match is finalized.",
      { code: "MATCH_ALREADY_COMPLETE" }
    );
  }

  const game = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    select: { umpireId: true, scorerId: true },
  });

  const role = (viewer.role || "").toLowerCase();
  const isScorerToken = role === "scorer";
  const isAssignedUmpire = viewer.id && game?.umpireId === viewer.id;
  const isAssignedScorer = viewer.id && game?.scorerId === viewer.id;

  if (!isScorerToken && !isAssignedUmpire && !isAssignedScorer) {
    const err = new ForbiddenError(
      "Only the umpire, the scorer, or a scoring-password holder can change house rules."
    );
    // ForbiddenError's constructor doesn't accept meta in the current
    // @kridaz/common build, so attach the code post-construction. The error
    // middleware reads meta.code the same way either path.
    err.meta = { code: "FORBIDDEN_HOUSE_RULES" };
    throw err;
  }

  // Allowlist of toggles — anything else the caller sends is silently dropped
  // (rather than persisting arbitrary JSON that the engine wouldn't read).
  const ALLOWED_KEYS = [
    "enforceConsecutiveOverBlock",
    "enforceFreeHit",
    "penaltyEnabled",
    "wideIsLegalBall",
    "noBallIsLegalBall",
    "ballsPerOver",
    "playersPerTeam",
    "lastManStands",
    "maxRunsPerBall",
    "mvpWeights",
  ];

  const stored = (scoring.houseRules && typeof scoring.houseRules === "object")
    ? scoring.houseRules
    : {};
  const merged = { ...stored };
  for (const key of ALLOWED_KEYS) {
    if (!(key in incoming)) continue;
    const v = incoming[key];
    if (v === null) {
      delete merged[key]; // null = remove override / revert to default
    } else {
      merged[key] = v;
    }
  }

  // Validate numeric bounds — protects the engine from poison values like
  // ballsPerOver=0 (divide by zero) or playersPerTeam=1 (always all-out).
  if (merged.ballsPerOver != null && (!Number.isInteger(merged.ballsPerOver) || merged.ballsPerOver < 1 || merged.ballsPerOver > 12)) {
    throw new BadRequestError("ballsPerOver must be an integer between 1 and 12.", { code: "INVALID_BALLS_PER_OVER" });
  }
  if (merged.playersPerTeam != null && (!Number.isInteger(merged.playersPerTeam) || merged.playersPerTeam < 2 || merged.playersPerTeam > 30)) {
    throw new BadRequestError("playersPerTeam must be an integer between 2 and 30.", { code: "INVALID_PLAYERS_PER_TEAM" });
  }
  if (merged.maxRunsPerBall != null && (!Number.isInteger(merged.maxRunsPerBall) || merged.maxRunsPerBall < 1 || merged.maxRunsPerBall > 12)) {
    throw new BadRequestError("maxRunsPerBall must be an integer between 1 and 12.", { code: "INVALID_MAX_RUNS_PER_BALL" });
  }

  const next = Object.keys(merged).length ? merged : null;

  const updated = await prisma.cricketMatch.update({
    where: { id: scoringId },
    data: { houseRules: next },
    select: { id: true, gameId: true, houseRules: true },
  });

  // Push a fresh snapshot so any connected scoring/overlay clients pick up
  // the new rules immediately (the snapshot reads houseRules to derive CRR,
  // ball-progress, all-out etc.).
  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: updated.gameId },
    include: HOSTED_GAME_SCORING_INCLUDE,
  });
  const fullScoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    include: { innings: true, playerStats: true, timeline: { orderBy: { timestamp: "desc" } } },
  });
  const liveData = computeScoreSnapshot(fullScoring, mapHostedGame(hostedGame));
  await liveStateService.setLiveScore(updated.gameId, liveData);

  const io = getIO();
  if (io) {
    io.to(updated.gameId).emit(SOCKET.SCORE_UPDATED, liveData);
  }

  return { houseRules: updated.houseRules, liveData };
};

export const getMatchReport = async (matchId) => {
  const match = await prisma.cricketMatch.findUnique({
    where: { id: matchId },
    include: {
      game: true,
      innings: true,
      playerStats: true,
      timeline: true
    }
  });

  if (!match) throw new Error("Match not found");

  return match;
};
