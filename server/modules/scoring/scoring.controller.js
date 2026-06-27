import * as scoringService from "./scoring.service.js";
import * as scoringViews from "./scoring.views.js";
import logger from "../../utils/logger.js";
import { prisma } from "../../config/prisma.js";
import jwt from "jsonwebtoken";

/**
 * Standard utility to catch thrown errors from the service layer
 * and map them directly to the appropriate HTTP status codes.
 */
const handleControllerError = (
  res,
  error,
  fallbackMsg = "Internal Server Error"
) => {
  const status = error.statusCode || 500;
  res
    .status(status)
    .json({ success: false, message: error.message || fallbackMsg });
};

export const setupScoringGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const matchData = req.body;

    const game = await scoringService.createScoringMatch(userId, matchData);

    res.status(201).json({ success: true, game });
  } catch (error) {
    logger.error("[Scoring] Setup Scoring Game Error:", error);
    handleControllerError(res, error);
  }
};

export const getMyScoringGames = async (req, res) => {
  try {
    const userId = req.user.id;
    const games = await scoringService.getUserScoringGames(userId);

    res.status(200).json({ success: true, games });
  } catch (error) {
    logger.error("[Scoring] Get My Games Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Get a single scoring game by its ID (full details for match dashboard/card)
 */
export const getScoringGameById = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await scoringService.getScoringGameById(gameId);
    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }
    res.status(200).json({ success: true, game });
  } catch (error) {
    logger.error("[Scoring] Get Game By ID Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Authenticate scoring app access with password.
 * Returns a short-lived JWT scoped to the specific game for SCORER role.
 * Password is never returned in any response.
 */
export const authenticateScoringApp = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    const result = await scoringService.verifyScoringPassword(gameId, password);
    // Both top-level (legacy) and data.* (Flutter) — additive envelope.
    res.status(200).json({
      success: true,
      token: result.token,
      gameId,
      data: { token: result.token, gameId },
    });
  } catch (error) {
    logger.error("[Scoring] Auth Error:", error);
    if (
      error.message === "INVALID_PASSWORD" ||
      error.message === "GAME_NOT_FOUND"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid password or game not found",
      });
    }
    handleControllerError(res, error);
  }
};
/**
 * Dispatches notifications to players in the match
 */
export const notifyPlayers = async (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId)
      return res
        .status(400)
        .json({ success: false, message: "matchId is required" });

    // Simulate async notification dispatch
    logger.info(
      `[Scoring] Dispatched notifications to players for match ${matchId}`
    );

    res.status(200).json({
      success: true,
      message: "Notifications dispatched successfully",
    });
  } catch (error) {
    logger.error("[Scoring] Notify Players Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Initialize a Live Stream overlay session
 */
export const goLive = async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await scoringService.goLiveSession(matchId, req.user);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("[Scoring] Go Live Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * End Live Broadcast
 */
export const endLive = async (req, res) => {
  try {
    const { matchId } = req.params;
    await scoringService.endLiveSession(matchId, req.user);

    res.status(200).json({ success: true, message: "Live stream ended." });
  } catch (error) {
    logger.error("[Scoring] End Live Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Finalize Cricket Match and run user/umpire stats aggregation.
 */
export const completeMatch = async (req, res) => {
  try {
    const { scoringId } = req.body;
    const { earnedBadges } = await scoringService.finalizeMatch(scoringId, req.user);

    res.status(200).json({
      success: true,
      message: "Match completed and stats aggregated",
      earnedBadges,
    });
  } catch (error) {
    logger.error("[Scoring] Complete Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Search and lookup match details by short ID.
 */
export const searchMatch = async (req, res) => {
  try {
    const { shortId } = req.params;
    const match = await scoringService.lookupMatchByShortId(shortId);

    res.status(200).json({ success: true, match });
  } catch (error) {
    logger.error("[Scoring] Search Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Start or retrieve a live scoring session.
 */
export const startScoring = async (req, res) => {
  try {
    const { matchId, gameId, battingTeamId, battingTeam } = req.body;
    const finalMatchId = matchId || gameId;
    const finalBattingTeam = battingTeamId || battingTeam || "teamA";

    const umpireId = req.user?.id;
    if (!umpireId) {
      return res.status(401).json({
        success: false,
        message: "Umpire identity not found. Please log in again.",
      });
    }

    const scoring = await scoringService.initializeScoringSession(
      finalMatchId,
      finalBattingTeam,
      umpireId,
      req.user?.role,
      req.body.tossWinner,
      req.body.tossDecision
    , req.user);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] Start Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Transition the scoring session to the next innings.
 */
export const startNextInnings = async (req, res) => {
  try {
    const { scoringId, battingTeamId, isFollowOn, isSuperOver } = req.body;
    const scoring = await scoringService.advanceToNextInnings(scoringId, battingTeamId, { isFollowOn, isSuperOver }, req.user);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] StartNextInnings Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Updates the match status (e.g. LIVE, RAIN_DELAY, BAD_LIGHT).
 */
export const updateMatchStatus = async (req, res) => {
  try {
    const { scoringId, status } = req.body;
    const scoring = await scoringService.updateMatchStatus(scoringId, status, req.user);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] UpdateMatchStatus Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Revise match target and overs (DLS / Rain Rule).
 */
export const reviseTargetAndOvers = async (req, res) => {
  try {
    const { scoringId, revisedTarget, revisedOvers } = req.body;
    const scoring = await scoringService.reviseTargetAndOvers(
      scoringId,
      revisedTarget,
      revisedOvers
    , req.user);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] ReviseTarget Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Set Match Officials.
 */
export const setMatchOfficials = async (req, res) => {
  try {
    const { scoringId, officials } = req.body;
    const scoring = await scoringService.setMatchOfficials(
      scoringId,
      officials
    , req.user);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] SetMatchOfficials Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Substitute an on-field player.
 */
export const substitutePlayer = async (req, res) => {
  try {
    const { scoringId, userId, substituteForId, inningsIndex } = req.body;
    const stat = await scoringService.substitutePlayer(
      scoringId,
      userId,
      substituteForId,
      inningsIndex
    , req.user);

    res.status(200).json({ success: true, stat });
  } catch (error) {
    logger.error("[Scoring] SubstitutePlayer Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Use a team review (DRS).
 */
export const useReview = async (req, res) => {
  try {
    const { scoringId, inningsIndex, team, isSuccessful } = req.body;
    const scoring = await scoringService.useReview(
      scoringId,
      inningsIndex,
      team,
      isSuccessful
    , req.user);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] UseReview Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Set Powerplay overs for the current innings.
 */
export const setPowerplayOvers = async (req, res) => {
  try {
    const { scoringId, inningsIndex, overs } = req.body;
    const scoring = await scoringService.setPowerplayOvers(
      scoringId,
      inningsIndex,
      overs
    , req.user);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] SetPowerplayOvers Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Set toss result details.
 */
export const setToss = async (req, res) => {
  try {
    const { scoringId, winnerTeam, wonByTeamId, decision } = req.body;
    const finalWinnerTeam = winnerTeam || wonByTeamId;

    const scoring = await scoringService.updateTossResult(
      scoringId,
      finalWinnerTeam,
      decision
    , req.user);

    res.status(200).json({
      success: true,
      scoring,
      toss: {
        winnerTeam: scoring.tossWinner,
        decision: scoring.tossDecision,
      },
    });
  } catch (error) {
    logger.error("[Scoring] SetToss Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Set active striker, non-striker and bowler.
 */
export const setPlayers = async (req, res) => {
  try {
    const { scoringId, strikerId, nonStrikerId, bowlerId, wicketKeeperId } =
      req.body;
    const scoring = await scoringService.updateActivePlayers(scoringId, {
      strikerId,
      nonStrikerId,
      bowlerId,
      wicketKeeperId,
    }, req.user);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] SetPlayers Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Undo last ball in the database timeline.
 */
export const undoLastBall = async (req, res) => {
  try {
    const { scoringId } = req.body;
    const scoring = await scoringService.revertLastBall(scoringId, req.user);

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    logger.error("[Scoring] Undo Last Ball Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Record a ball and increment score runs, wickets, bounds.
 */
export const updateScore = async (req, res) => {
  try {
    const { scoringId, ballData } = req.body;
    const { scoring, liveData } = await scoringService.processScoreUpdate(
      scoringId,
      ballData
    , req.user);

    res.status(200).json({ success: true, scoring, liveData });
  } catch (error) {
    logger.error("[Scoring] UpdateScore Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Retrieve scoreboard snapshot details.
 */
export const getMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await scoringService.fetchMatchStatus(matchId);

    if (result.type === "SCORING_EXISTS") {
      return res.status(200).json({
        success: true,
        scoring: result.scoring,
        scoringSnapshot: result.scoringSnapshot,
        hostedGame: result.hostedGame,
      });
    }

    return res
      .status(200)
      .json({ success: true, hostedGame: result.hostedGame });
  } catch (error) {
    logger.error("[Scoring] Status Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Get detailed post-match analytics and highlight the MVP.
 */
export const getMatchAnalytics = async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await scoringService.fetchMatchAnalytics(matchId);

    res.status(200).json({
      success: true,
      scoring: result.scoring,
      analytics: result.analytics,
    });
  } catch (error) {
    logger.error("[Scoring] Analytics Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Fast endpoint to get live score dashboard snapshots.
 */
export const getLiveScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { data, source } =
      await scoringService.fetchLiveScoreSnapshot(matchId);

    return res.status(200).json({ success: true, data, source });
  } catch (error) {
    logger.error("[Scoring] Live Score Controller Error:", error);
    handleControllerError(res, error);
  }
};

/**
 * Delete match permanently
 */
export const deleteMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    // For now just pass it to service, or perform basic verification
    await scoringService.deleteScoringMatch(matchId, userId, req.user);
    res
      .status(200)
      .json({ success: true, message: "Match deleted successfully" });
  } catch (error) {
    logger.error("[Scoring] Delete Match Error:", error);
    handleControllerError(res, error);
  }
};

export const updateCommentarySettings = async (req, res) => {
  try {
    const { matchId } = req.params;
    const {
      isAiCommentaryEnabled,
      commentaryVoice,
      commentaryLanguage,
      commentaryStyle,
    } = req.body;
    const updatedGame = await prisma.hostedGame.update({
      where: { id: matchId },
      data: {
        isAiCommentaryEnabled,
        commentaryVoice,
        commentaryLanguage,
        commentaryStyle,
      },
    });
    res.status(200).json({ success: true, data: updatedGame });
  } catch (error) {
    logger.error("[Scoring] Update Commentary Settings Error:", error);
    handleControllerError(res, error);
  }
};

export const getMatchCommentary = async (req, res) => {
  try {
    const { matchId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const commentaryFeed = await prisma.matchBall.findMany({
      where: {
        matchId,
        commentary: { not: null }
      },
      orderBy: { timestamp: "desc" },
      take: limit
    });
    res.status(200).json({ success: true, commentary: commentaryFeed });
  } catch (error) {
    logger.error("[Scoring] Get Match Commentary Error:", error);
    handleControllerError(res, error);
  }
};

export const toggleTimer = async (req, res) => {
  try {
    // Accept both matchId (Flutter) and scoringId (web) for backward compat
    const matchId = req.body.matchId ?? req.body.scoringId;
    if (!matchId) {
      return res
        .status(400)
        .json({ success: false, message: "matchId is required" });
    }
    const result = await scoringService.toggleMatchTimer(matchId, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error("[Scoring] Toggle Timer Error:", error);
    handleControllerError(res, error);
  }
};

export const addPenalty = async (req, res) => {
  try {
    const { scoringId, runs, teamId } = req.body;
    const result = await scoringService.addPenaltyRuns(scoringId, runs, teamId, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error("[Scoring] Add Penalty Error:", error);
    handleControllerError(res, error);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// View-tab controllers — read-only shaped responses for the mobile match UI.
//
// All four endpoints support `If-None-Match` so polling clients short-
// circuit to 304 Not Modified when nothing has changed. The ETag is a weak
// fingerprint of (updatedAt + last-ball) so it changes the moment a ball is
// scored, an innings advances, or house rules are edited — and only then.
// ─────────────────────────────────────────────────────────────────────────

// Cache-Control on the polling routes — tells well-behaved CDNs / proxies
// to short-circuit identical conditional requests too. `must-revalidate`
// means the client/CDN can never serve stale content past 0 seconds without
// re-validating with the origin (our ETag check).
const POLLING_CACHE_CONTROL = "private, max-age=0, must-revalidate";

const handleEtag = (req, res, etag) => {
  if (!etag) return false; // caller will run the full path
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", POLLING_CACHE_CONTROL);
  const inm = req.headers["if-none-match"];
  if (inm && inm === etag) {
    res.status(304).end();
    return true;
  }
  return false;
};

export const getScorecard = async (req, res) => {
  try {
    const etag = await scoringViews.computeMatchEtag(req.params.matchId);
    if (handleEtag(req, res, etag)) return;
    const data = await scoringViews.buildScorecard(req.params.matchId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("[Scoring] Scorecard Error:", error);
    handleControllerError(res, error);
  }
};

export const getSquads = async (req, res) => {
  try {
    const etag = await scoringViews.computeSquadsEtag(req.params.matchId);
    if (handleEtag(req, res, etag)) return;
    const data = await scoringViews.buildSquads(req.params.matchId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("[Scoring] Squads Error:", error);
    handleControllerError(res, error);
  }
};

export const getOvers = async (req, res) => {
  try {
    const { innings, afterBallId } = req.query;
    // ETag still applies — even with a cursor, if nothing changed at all
    // we 304 and skip the whole shaping step.
    const etag = await scoringViews.computeMatchEtag(req.params.matchId);
    if (handleEtag(req, res, etag)) return;
    const data = await scoringViews.buildOvers(req.params.matchId, innings, {
      afterBallId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("[Scoring] Overs Error:", error);
    handleControllerError(res, error);
  }
};

export const getLiveMatches = async (req, res) => {
  try {
    const etag = await scoringViews.computeLiveListEtag();
    if (handleEtag(req, res, etag)) return;
    const data = await scoringViews.listLiveMatches({ limit: req.query.limit });
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("[Scoring] Live Matches Error:", error);
    handleControllerError(res, error);
  }
};

export const updateHouseRules = async (req, res) => {
  try {
    const { scoringId, houseRules } = req.body;
    if (!scoringId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_SCORING_ID",
        message: "scoringId is required",
      });
    }
    if (
      !houseRules ||
      typeof houseRules !== "object" ||
      Array.isArray(houseRules)
    ) {
      return res.status(400).json({
        success: false,
        code: "INVALID_HOUSE_RULES",
        message: "houseRules must be an object",
      });
    }
    const result = await scoringService.updateHouseRules(
      scoringId,
      req.user,
      houseRules
    , req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[Scoring] Update House Rules Error:", error);
    handleControllerError(res, error);
  }
};

export const getMatchReport = async (req, res) => {
  try {
    const { matchId } = req.params;
    const report = await scoringService.getMatchReport(matchId);
    res.status(200).json({ success: true, report });
  } catch (error) {
    logger.error("[Scoring] Get Match Report Error:", error);
    handleControllerError(res, error);
  }
};

export const verifyOverlayToken = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ success: false, message: "Token is required" });
    }

    if (!process.env.OVERLAY_TOKEN_SECRET) {
      return res.status(500).json({ success: false, message: "Overlay configuration error" });
    }

    const decoded = jwt.verify(token, process.env.OVERLAY_TOKEN_SECRET);

    // Resolve match/game ID
    let resolvedGameId = matchId;
    if (!matchId.includes("-")) {
      const game = await prisma.hostedGame.findUnique({
        where: { shortId: matchId },
        select: { id: true },
      });
      if (game) {
        resolvedGameId = game.id;
      }
    }

    if (decoded.matchId !== resolvedGameId) {
      return res.status(403).json({ success: false, message: "Token does not match matchId" });
    }

    return res.status(200).json({ success: true, message: "Token verified successfully" });
  } catch (error) {
    logger.error("[Scoring] Overlay Verification Error:", error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
