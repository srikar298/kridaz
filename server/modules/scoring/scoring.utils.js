import crypto from "crypto";

/**
 * House-rule defaults — MCC-standard cricket. Any field a particular match
 * doesn't override stays here, so existing matches keep working unchanged.
 *
 *   enforceConsecutiveOverBlock — Law 17.6. Reject same bowler back-to-back.
 *   enforceFreeHit              — Law 21.18. Set freeHit on no-ball; reject
 *                                 BOWLED/LBW/CAUGHT/STUMPED/HIT_WICKET while active.
 *   penaltyEnabled              — allow addPenaltyRuns() at all.
 *   wideIsLegalBall             — count wides toward totalBalls + bowlingBalls
 *                                 (rare; some tape-ball formats do this).
 *   noBallIsLegalBall           — same for no-balls.
 *   ballsPerOver                — 6 default. Beach cricket uses 4; historical
 *                                 8-ball overs were used in test cricket.
 *   playersPerTeam              — falls back to HostedGame.maxMembers if null.
 *   lastManStands               — when true, all-out is never declared (the
 *                                 last batter bats alone). Gully cricket staple.
 *   maxRunsPerBall              — soft cap exposed for clients; the validator
 *                                 still hard-caps at 6 off-the-bat to keep
 *                                 z-schema static.
 */
// MVP scoring weights. Defaults are the ones the engine has always used —
// product can tune via PATCH /scoring/house-rules with `mvpWeights: { ... }`.
const DEFAULT_MVP_WEIGHTS = Object.freeze({
  perRun: 1,
  bonus30: 10, bonus50: 20, bonus100: 30,
  srMinBalls: 10, srThreshold: 150, srBonus: 15,
  perWicket: 20,
  bonus3w: 10, bonus5w: 25,
  econMinBalls: 12, econThreshold: 6.0, econBonus: 15,
});

export const DEFAULT_HOUSE_RULES = Object.freeze({
  enforceConsecutiveOverBlock: true,
  enforceFreeHit: true,
  penaltyEnabled: true,
  wideIsLegalBall: false,
  noBallIsLegalBall: false,
  ballsPerOver: 6,
  playersPerTeam: null,   // null → derive from match.maxMembers (default 11)
  lastManStands: false,
  maxRunsPerBall: 6,
  mvpWeights: { ...DEFAULT_MVP_WEIGHTS },
});

/**
 * Merge stored houseRules with defaults. Treats null/missing values as
 * "use default" so a partial override only specifies the keys it cares about.
 *
 * @param {object} [stored]  the value of cricketMatch.houseRules
 * @returns {typeof DEFAULT_HOUSE_RULES}
 */
export const resolveHouseRules = (stored) => {
  if (!stored || typeof stored !== "object") return { ...DEFAULT_HOUSE_RULES };
  const out = { ...DEFAULT_HOUSE_RULES };
  for (const key of Object.keys(DEFAULT_HOUSE_RULES)) {
    if (stored[key] !== undefined && stored[key] !== null) out[key] = stored[key];
  }
  return out;
};

/**
 * Generates a unique short ID for matches
 * Format: KRZ-XXXX (e.g., KRZ-A92B)
 */
export const generateShortId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const randomBytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return `KRZ-${result}`;
};

/**
 * Computes a comprehensive snapshot of the live score for overlays and broadcast.
 * @param {Object} scoring - The CricketMatch Prisma object (includes innings, playerStats, timeline).
 * @param {Object} match - The HostedGame Prisma object (includes teams/slots).
 */
export const computeScoreSnapshot = (scoring, match) => {
  const currentInningsIndex = scoring.currentInningsIndex || 0;
  const currentInnings = scoring.innings.find(i => i.inningsIndex === currentInningsIndex);
  
  if (!currentInnings) return null;

  const houseRules = resolveHouseRules(scoring.houseRules);
  const ballsPerOver = houseRules.ballsPerOver || 6;

  const isTeamABatting = currentInnings.battingTeam === "teamA";
  const battingTeamName = isTeamABatting ? (match.teamA?.name || "Team A") : (match.teamB?.name || "Team B");

  // Calculate Overs & Balls (ballsPerOver may be 4 / 6 / 8 depending on format)
  const totalValidBalls = currentInnings.totalBalls || 0;
  const overs = Math.floor(totalValidBalls / ballsPerOver);
  const balls = totalValidBalls % ballsPerOver;
  const overString = `${overs}.${balls}`;

  // Current Run Rate
  const totalRuns = currentInnings.totalRuns || 0;
  const totalWickets = currentInnings.totalWickets || 0;
  const crr = totalValidBalls > 0 ? (totalRuns / (totalValidBalls / ballsPerOver)).toFixed(2) : "0.00";

  // Last 6 balls from timeline
  // Last-6 labels follow Cricinfo convention so commentators can read the
  // sequence at a glance: "6", "W", "4b", "1nb", "6nb", "Wnb", "5p".
  // Suffix legend: nb = no-ball, wd = wide, b = bye, lb = leg-bye, p = penalty.
  const EXTRA_SUFFIX = {
    NO_BALL: 'nb',
    WIDE: 'wd',
    BYE: 'b',
    LEG_BYE: 'lb',
    PENALTY: 'p',
  };
  const lastBalls = (scoring.timeline || []).slice(-6).map(ball => {
    const suffix = EXTRA_SUFFIX[ball.extraType] || '';
    const extraRuns = ball.extraRuns || 0;
    const offBat = ball.runs || 0;
    // Wicket overrides — keep "W" prominent but annotate if it was off an extra.
    if (ball.isWicket) {
      return { type: 'wicket', label: suffix ? `W${suffix}` : 'W', isExtra: ball.isExtra };
    }
    // Boundary off the bat.
    if (ball.isFour) {
      return { type: 'boundary', label: suffix ? `4${suffix}` : '4', isExtra: ball.isExtra };
    }
    if (ball.isSix) {
      return { type: 'boundary', label: suffix ? `6${suffix}` : '6', isExtra: ball.isExtra };
    }
    // Pure penalty (no batting involvement): "5p".
    if (ball.extraType === 'PENALTY') {
      return { type: 'run', label: `${extraRuns || offBat}p`, isExtra: true };
    }
    // For byes/leg-byes the runs live on extraRuns; for wides/no-balls the
    // total is offBat + extraRuns (e.g. no-ball + 2 ran off bat = "3nb").
    const total =
      (ball.extraType === 'BYE' || ball.extraType === 'LEG_BYE')
        ? extraRuns
        : offBat + extraRuns;
    return { type: 'run', label: suffix ? `${total}${suffix}` : `${total}`, isExtra: ball.isExtra };
  });

  // Target & Chase Info.
  //
  // DLS-lite: when an umpire calls `reviseTargetAndOvers` (rain interruption),
  // CricketMatch.revisedTarget and revisedOvers hold the new par. We prefer
  // those over the naive "first-innings + 1" math. Anything missing falls back
  // to the original calculation so non-revised matches behave unchanged.
  let target = null;
  let runsNeeded = null;
  let ballsRemaining = null;
  let isRevised = false;

  if (currentInningsIndex === 1) {
    const firstInnings = scoring.innings.find(i => i.inningsIndex === 0);

    if (scoring.revisedTarget != null) {
      target = Number(scoring.revisedTarget);
      isRevised = true;
    } else {
      target = (firstInnings?.totalRuns || 0) + 1;
    }
    runsNeeded = Math.max(0, target - totalRuns);

    const effectiveMaxOvers = scoring.revisedOvers != null
      ? Number(scoring.revisedOvers)
      : (match.oversPerInnings || 20);
    if (scoring.revisedOvers != null) isRevised = true;
    ballsRemaining = Math.max(0, Math.floor(effectiveMaxOvers * ballsPerOver) - totalValidBalls);
  }

  // Resolver for player names using slots
  const getPlayerName = (userId) => {
    if (!userId) return "Unknown";
    const allSlots = [
      ...(match.teamA?.slots || []),
      ...(match.teamB?.slots || [])
    ];
    const slot = allSlots.find(s => s.userId === userId || s.customPlayerId === userId || s.id === userId);
    return slot?.user?.name || slot?.customPlayer?.name || "Player";
  };

  // Resolver for player profile pictures using slots
  const getPlayerImage = (userId) => {
    if (!userId) return null;
    const allSlots = [
      ...(match.teamA?.slots || []),
      ...(match.teamB?.slots || [])
    ];
    const slot = allSlots.find(s => s.userId === userId || s.customPlayerId === userId || s.id === userId);
    return slot?.user?.profilePicture || null;
  };

  // Active Batters
  const activeBatters = [scoring.strikerId, scoring.nonStrikerId].filter(id => id).map(id => {
    const stat = scoring.playerStats.find(s => s.userId === id);
    return {
      id: id,
      name: getPlayerName(id),
      profilePicture: getPlayerImage(id),
      runs: stat?.battingRuns || 0,
      balls: stat?.battingBalls || 0,
      fours: stat?.battingFours || 0,
      sixes: stat?.battingSixes || 0,
      strikeRate: stat?.battingBalls > 0 ? Number(((stat.battingRuns / stat.battingBalls) * 100).toFixed(2)) : 0
    };
  });

  // Current Bowler
  let currentBowler = null;
  if (scoring.bowlerId) {
    const bStat = scoring.playerStats.find(s => s.userId === scoring.bowlerId);
    currentBowler = {
      id: scoring.bowlerId,
      name: getPlayerName(scoring.bowlerId),
      profilePicture: getPlayerImage(scoring.bowlerId),
      overs: bStat ? Math.floor(bStat.bowlingBalls / ballsPerOver) : 0,
      balls: bStat ? (bStat.bowlingBalls % ballsPerOver) : 0,
      runs: bStat?.bowlingRuns || 0,
      wickets: bStat?.bowlingWickets || 0,
      economy: bStat?.bowlingBalls > 0 ? Number(((bStat.bowlingRuns / bStat.bowlingBalls) * ballsPerOver).toFixed(2)) : 0
    };
  }

  const battingTeamImage = isTeamABatting ? match.teamA?.image : match.teamB?.image;

  // --- Phase 6: Worm Chart Data ---
  const wormData = [];
  let currentOversRuns = 0;
  let currentOversWickets = 0;
  let validBallsInInnings = 0;

  // timeline is ordered by timestamp desc, so we reverse to process chronologically
  const chronologicalTimeline = [...(scoring.timeline || [])].reverse();
  for (const ball of chronologicalTimeline) {
    currentOversRuns += ball.runs + (ball.extraRuns || 0);
    if (ball.isWicket) currentOversWickets++;
    
    // Legal-delivery counter must match the main engine (processScoreUpdate)
    // and undo path. Penalties never count; wides/no-balls only count when
    // house rules promote them.
    const ballIsLegal =
      ball.extraType !== 'PENALTY' &&
      (ball.extraType !== 'WIDE'    || houseRules.wideIsLegalBall) &&
      (ball.extraType !== 'NO_BALL' || houseRules.noBallIsLegalBall);
    if (ballIsLegal) {
      validBallsInInnings++;
    }

    if (validBallsInInnings > 0 && validBallsInInnings % ballsPerOver === 0) {
      // Avoid pushing multiple times for the same over if consecutive extras happen
      const currentOver = validBallsInInnings / ballsPerOver;
      if (!wormData.find(w => w.over === currentOver)) {
        wormData.push({ over: currentOver, runs: currentOversRuns, wickets: currentOversWickets });
      }
    }
  }
  if (validBallsInInnings % ballsPerOver !== 0) {
    wormData.push({ over: Number((validBallsInInnings / ballsPerOver).toFixed(1)), runs: currentOversRuns, wickets: currentOversWickets });
  }

  // --- Phase 6: NRR Effective Overs ---
  const maxOvers = match.oversPerInnings || 20;
  // All-out = wickets-down equals (playersPerTeam - 1). House rules may
  // override playersPerTeam; otherwise we fall back to match.maxMembers.
  // When `lastManStands` is on (gully cricket), all-out is never declared —
  // the innings ends only via overs exhausted (or target reached for chase).
  const playersPerTeam = houseRules.playersPerTeam || match.maxMembers || 11;
  const wicketsForAllOut = Math.max(1, playersPerTeam - 1);
  const isAllOut = !houseRules.lastManStands && totalWickets >= wicketsForAllOut;
  const nrrEffectiveBalls = (currentInnings.isCompleted && isAllOut) ? (maxOvers * ballsPerOver) : totalValidBalls;
  const nrrEffectiveOvers = nrrEffectiveBalls / ballsPerOver;

  // --- Phase 6: MVP/Player of the Match Engine ---
  // Weights are configurable per match via houseRules.mvpWeights. Any field
  // not overridden falls back to DEFAULT_MVP_WEIGHTS.
  const w = { ...DEFAULT_MVP_WEIGHTS, ...(houseRules.mvpWeights || {}) };
  const mvpLeaderboard = (scoring.playerStats || []).map(stat => {
    let points = 0;
    // Batting
    points += (stat.battingRuns || 0) * w.perRun;
    if (stat.battingRuns >= 30)  points += w.bonus30;
    if (stat.battingRuns >= 50)  points += w.bonus50;
    if (stat.battingRuns >= 100) points += w.bonus100;

    const sr = stat.battingBalls > 0 ? (stat.battingRuns / stat.battingBalls) * 100 : 0;
    if (stat.battingBalls >= w.srMinBalls && sr > w.srThreshold) points += w.srBonus;

    // Bowling
    points += (stat.bowlingWickets || 0) * w.perWicket;
    if (stat.bowlingWickets >= 3) points += w.bonus3w;
    if (stat.bowlingWickets >= 5) points += w.bonus5w;

    const econ = stat.bowlingBalls > 0 ? (stat.bowlingRuns / stat.bowlingBalls) * ballsPerOver : 0;
    if (stat.bowlingBalls >= w.econMinBalls && econ < w.econThreshold) points += w.econBonus;

    return {
      userId: stat.userId,
      name: getPlayerName(stat.userId),
      profilePicture: getPlayerImage(stat.userId),
      points,
    };
  }).sort((a, b) => b.points - a.points).slice(0, 5);

  // --- Innings & Match Completion Detection ---
  // Use revisedOvers when present (rain interruption) so the chase ends at
  // the umpire-imposed cut-off, not the original maxOvers.
  const effectiveMaxOvers = (currentInningsIndex === 1 && scoring.revisedOvers != null)
    ? Number(scoring.revisedOvers)
    : maxOvers;
  const oversFinished = totalValidBalls >= Math.floor(effectiveMaxOvers * ballsPerOver);
  let isInningsComplete = isAllOut || oversFinished;
  let isMatchComplete = false;
  let matchResult = null;

  if (currentInningsIndex === 1) {
    const targetReached = target !== null && totalRuns >= target;
    if (targetReached) {
      isInningsComplete = true;
    }
    isMatchComplete = isInningsComplete;

    if (isMatchComplete) {
      const firstInnings = scoring.innings.find(i => i.inningsIndex === 0);
      // For a revised chase, the "par score" the defending side is compared
      // against is target - 1, not the raw innings total.
      const defendingScore = isRevised
        ? Math.max(0, target - 1)
        : (firstInnings?.totalRuns || 0);
      const chasingScore = totalRuns;
      const teamAName = match.teamA?.name || 'Team A';
      const teamBName = match.teamB?.name || 'Team B';
      const chasingTeamName = battingTeamName;
      const defendingTeamName = chasingTeamName === teamAName ? teamBName : teamAName;
      const wicketsRemaining = Math.max(0, wicketsForAllOut - totalWickets);
      const tag = isRevised ? ' (DLS)' : '';

      if (targetReached) {
        matchResult = wicketsRemaining > 0
          ? `${chasingTeamName} won by ${wicketsRemaining} wicket${wicketsRemaining === 1 ? '' : 's'}${tag}`
          : `${chasingTeamName} won${tag}`;
      } else if (chasingScore === defendingScore) {
        matchResult = `Match Tied${tag}`;
      } else {
        const runMargin = defendingScore - chasingScore;
        matchResult = `${defendingTeamName} won by ${runMargin} run${runMargin === 1 ? '' : 's'}${tag}`;
      }
    }
  }

  return {
    matchId: scoring.gameId,
    battingTeamName,
    battingTeamImage,
    date: match.date,
    time: match.time,
    scheduledStartAt: match.scheduledStartAt,
    totalRuns,
    totalWickets,
    runs: totalRuns,
    wickets: totalWickets,
    overs,
    balls,
    overString,
    crr,
    target,
    runsNeeded,
    ballsRemaining,
    rrr: (runsNeeded && ballsRemaining) ? ((runsNeeded / ballsRemaining) * ballsPerOver).toFixed(2) : null,
    last6Balls: lastBalls,
    lastBallRaw: scoring.timeline && scoring.timeline.length > 0 ? scoring.timeline[0] : null,
    batters: activeBatters,
    bowler: currentBowler,
    result: scoring.status === "COMPLETED" ? "Match Ended" : null,
    status: match.scoringStatus || match.status,
    pauseReason: scoring.status,
    timerState: scoring.timerState,
    isLive: (match.scoringStatus || match.status) === "LIVE" ? true : (match.isLive ?? false),
    matchName: match.name,
    teamA: match.teamA,
    teamB: match.teamB,
    tickerTheme: match.tickerTheme || "neon_classic",
    youtubeVideoId: match.youtubeLiveUrl ? extractYouTubeId(match.youtubeLiveUrl) : (match.streamConfig?.youtubeVideoId ? extractYouTubeId(match.streamConfig.youtubeVideoId) || match.streamConfig.youtubeVideoId : null),
    wormData,
    nrrEffectiveOvers,
    mvpLeaderboard,
    reviews: {
      batting: currentInnings.battingTeamReviews ?? 2,
      fielding: currentInnings.fieldingTeamReviews ?? 2
    },
    powerplayOvers: currentInnings.powerplayOvers || 0,
    isInningsComplete,
    isMatchComplete,
    // DLS-lite signals — UI can show "Revised Target: 142 in 18 overs" etc.
    revisedTarget:  scoring.revisedTarget ?? null,
    revisedOvers:   scoring.revisedOvers ?? null,
    isRevised,
    // Human-readable result string when the match is done. Null otherwise.
    // Examples: "Team A won by 24 runs", "Team B won by 6 wickets", "Match Tied".
    matchResult,
    currentInningsIndex,
    location: match.city || match.state ? `${match.city || ''} ${match.state || ''}`.trim() : null,
    venueId: match.turfId || null,
    ground: match.ground || match.customVenue || null,
    ballType: match.ballType || null,
    format: match.format || match.gameType || null,
    professionals: (() => {
      const pros = [];
      if (match.umpire?.name) pros.push({ id: match.umpire.id, name: match.umpire.name, role: 'Umpire', profilePicture: match.umpire.profilePicture });
      else if (match.customUmpire?.name) pros.push({ name: match.customUmpire.name, role: 'Umpire' });

      if (match.scorer?.name) pros.push({ id: match.scorer.id, name: match.scorer.name, role: 'Scorer', profilePicture: match.scorer.profilePicture });
      else if (match.customScorer?.name) pros.push({ name: match.customScorer.name, role: 'Scorer' });

      if (match.streamer?.name) pros.push({ id: match.streamer.id, name: match.streamer.name, role: 'Streamer', profilePicture: match.streamer.profilePicture });
      else if (match.customStreamer?.name) pros.push({ name: match.customStreamer.name, role: 'Streamer' });

      if (Array.isArray(match.customProfessionals)) {
        match.customProfessionals.forEach(p => {
          if (p?.name) pros.push({ name: p.name, role: p.role || 'Official' });
        });
      }
      return pros;
    })(),
  };
};

function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
