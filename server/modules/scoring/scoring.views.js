// Shaped-view builders for the four match tabs the mobile app shows:
//   SCORECARD  → batting + bowling + fall-of-wickets + partnerships + extras
//   SQUADS     → Playing XI + Bench per side (left = teamA, right = teamB)
//   OVERS      → per-over breakdown with header "Bowler to Striker(s)" and ball-by-ball tiles
//   LIVE       → already covered by computeScoreSnapshot (existing /live-score/:matchId)
//
// These are pure read functions — they don't touch any state. Heavy lookups
// (users/customPlayers) are batched once and reused across all four views to
// keep per-tab latency consistent.

import crypto from "crypto";
import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "@kridaz/common";
import { resolveHouseRules } from "./scoring.utils.js";

// ── ETag fingerprints ────────────────────────────────────────────────────
//
// All four view endpoints support `If-None-Match` for polling-friendly
// short-circuits. The fingerprint is computed from cheap indexed columns
// (cricketMatch.updatedAt + the latest MatchBall.timestamp) rather than
// hashing the entire payload — so the 304 path is one tiny query, not a
// full view rebuild.
//
// W/"..." (weak ETag) is intentional: minor inconsequential changes
// (e.g. timer-state oscillation) shouldn't bust caches; only score-affecting
// changes do.

const hash = (str) =>
  crypto.createHash("sha1").update(str).digest("hex").slice(0, 16);

/**
 * Etag for /scorecard, /live-score, /overs — anything that depends on the
 * timeline of balls in a single match. Returns null if the match doesn't
 * exist (caller decides whether to 404).
 */
export const computeMatchEtag = async (matchId) => {
  const scoring = await prisma.cricketMatch.findFirst({
    where: { OR: [{ id: matchId }, { gameId: matchId }] },
    select: {
      id: true,
      updatedAt: true,
      status: true,
      currentInningsIndex: true,
      result: true,
      houseRules: true,
    },
  });
  if (!scoring) return null;

  const lastBall = await prisma.matchBall.findFirst({
    where: { matchId: scoring.id },
    select: { id: true, timestamp: true },
    orderBy: { timestamp: "desc" },
  });

  const parts = [
    scoring.updatedAt.getTime(),
    scoring.status,
    scoring.currentInningsIndex,
    scoring.result || "",
    JSON.stringify(scoring.houseRules || {}),
    lastBall?.id || "none",
    lastBall?.timestamp?.getTime?.() || 0,
  ].join(":");
  return `W/"m-${hash(parts)}"`;
};

/**
 * Etag for /squads — depends on the hostedGame + its team/slot rows, not on
 * the ball-by-ball timeline. Cheaper to compute and rarely changes.
 */
export const computeSquadsEtag = async (matchId) => {
  const scoring = await prisma.cricketMatch.findFirst({
    where: { OR: [{ id: matchId }, { gameId: matchId }] },
    select: { gameId: true },
  });
  if (!scoring) return null;
  const game = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    select: { id: true, updatedAt: true },
  });
  // Slot edits don't always bump game.updatedAt, so include max(slot.createdAt)
  // and slot count as a cheap secondary signal.
  const slotAgg = await prisma.gameSlot.aggregate({
    where: { gameId: scoring.gameId },
    _max: { createdAt: true },
    _count: { id: true },
  });
  if (!game) return null;
  const parts = [
    game.updatedAt.getTime(),
    slotAgg._count.id || 0,
    slotAgg._max?.createdAt?.getTime?.() || 0,
  ].join(":");
  return `W/"sq-${hash(parts)}"`;
};

/**
 * Etag for /live — aggregate fingerprint over every live/recently-completed
 * game. Changes whenever any of them ticks.
 */
export const computeLiveListEtag = async () => {
  const agg = await prisma.hostedGame.aggregate({
    where: {
      scoringStatus: { in: ["LIVE", "PAUSED", "COMPLETED"] },
      cricketMatch: { isNot: null },
    },
    _max: { updatedAt: true },
    _count: { id: true },
  });
  // Also fold in the latest cricketMatch.updatedAt because game.updatedAt
  // doesn't bump on every score change — only the match does.
  const matchAgg = await prisma.cricketMatch.aggregate({
    where: {
      game: {
        scoringStatus: { in: ["LIVE", "PAUSED", "COMPLETED"] },
      },
    },
    _max: { updatedAt: true },
  });
  const parts = [
    agg._count.id || 0,
    agg._max?.updatedAt?.getTime?.() || 0,
    matchAgg._max?.updatedAt?.getTime?.() || 0,
  ].join(":");
  return `W/"ll-${hash(parts)}"`;
};

// ── helpers ──────────────────────────────────────────────────────────────

const TEAM_KEYS = ["teamA", "teamB"];

const buildPlayerLookup = async (cricketMatch, hostedGame) => {
  const userIds = new Set();
  const customIds = new Set();

  // From slot rosters
  for (const team of hostedGame.teams || []) {
    for (const slot of team.slots || []) {
      if (slot.userId) userIds.add(slot.userId);
      if (slot.customPlayerId) customIds.add(slot.customPlayerId);
    }
  }
  // From player stats (covers substitutes who weren't in initial slots)
  for (const s of cricketMatch.playerStats || []) {
    if (s.userId) userIds.add(s.userId);
  }
  // From timeline (fielders / wicket takers / out batters)
  for (const b of cricketMatch.timeline || []) {
    if (b.batterId) userIds.add(b.batterId);
    if (b.bowlerId) userIds.add(b.bowlerId);
    if (b.playerOutId) userIds.add(b.playerOutId);
    if (b.wicketTakerId) userIds.add(b.wicketTakerId);
    if (b.fielderId) userIds.add(b.fielderId);
  }

  const [users, customs] = await Promise.all([
    userIds.size
      ? prisma.user.findMany({
          where: { id: { in: [...userIds] } },
          select: { id: true, name: true, profilePicture: true },
        })
      : Promise.resolve([]),
    customIds.size
      ? prisma.customPlayerInvite.findMany({
          where: { id: { in: [...customIds] } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const map = new Map();
  for (const u of users)
    map.set(u.id, {
      id: u.id,
      name: u.name,
      profilePicture: u.profilePicture,
      isCustom: false,
    });
  for (const c of customs)
    map.set(c.id, {
      id: c.id,
      name: c.name,
      profilePicture: null,
      isCustom: true,
    });

  const get = (id) =>
    id
      ? map.get(id) || {
          id,
          name: "Player",
          profilePicture: null,
          isCustom: false,
        }
      : null;
  return { get, all: map };
};

const teamNameForKey = (hostedGame, teamKey) => {
  const team = hostedGame.teams?.find((t) => t.teamKey === teamKey);
  return team?.name || (teamKey === "teamA" ? "Team A" : "Team B");
};

const sumExtras = (extras) => {
  if (!extras || typeof extras !== "object") return 0;
  return (
    (extras.wides || 0) +
    (extras.noBalls || 0) +
    (extras.byes || 0) +
    (extras.legByes || 0) +
    (extras.penalty || 0)
  );
};

// ── data loader (shared by every endpoint) ───────────────────────────────

export const loadScoringContext = async (matchId) => {
  // matchId can be the CricketMatch.id OR a HostedGame.id — both flow through here.
  const scoring = await prisma.cricketMatch.findFirst({
    where: { OR: [{ id: matchId }, { gameId: matchId }] },
    include: {
      innings: { orderBy: { inningsIndex: "asc" } },
      playerStats: true,
      timeline: { orderBy: { timestamp: "asc" } },
    },
  });
  if (!scoring) throw new NotFoundError("Match not found");

  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    include: {
      teams: {
        include: {
          slots: {
            include: {
              user: { select: { id: true, name: true, profilePicture: true } },
              customPlayer: { select: { id: true, name: true } },
            },
          },
        },
      },
      umpire: { select: { id: true, name: true, profilePicture: true } },
      scorer: { select: { id: true, name: true, profilePicture: true } },
      turf: { select: { id: true, name: true, city: true, state: true } },
    },
  });

  const players = await buildPlayerLookup(scoring, hostedGame);
  return { scoring, hostedGame, players };
};

// ── 1. SCORECARD ─────────────────────────────────────────────────────────
//
// Returns, per innings:
//   - battingTeam header (name, total runs/wickets, overs played)
//   - batters[] each with R, B, 4s, 6s, SR, dismissal-string
//   - bowlers[] each with O, M, R, W, ER (sorted by appearance)
//   - extras { byes, legByes, wides, noBalls, penalty, total }
//   - fallOfWickets[] each with player, score "20-5", over "9.6"
//   - partnerships[] each with playerA(runs, balls), playerB(runs, balls), total

export const buildScorecard = async (matchId) => {
  const { scoring, hostedGame, players } = await loadScoringContext(matchId);
  const houseRules = resolveHouseRules(scoring.houseRules);
  const ballsPerOver = houseRules.ballsPerOver;

  const innings = scoring.innings.map((inn) => {
    const isTeamA =
      inn.battingTeam === "teamA" ||
      inn.battingTeam ===
        hostedGame.teams?.find((t) => t.teamKey === "teamA")?.id;
    const battingTeamKey = isTeamA ? "teamA" : "teamB";
    const battingTeamName = teamNameForKey(hostedGame, battingTeamKey);
    const fieldingTeamName = teamNameForKey(
      hostedGame,
      isTeamA ? "teamB" : "teamA"
    );

    // Per-innings balls + stats
    const inningsBalls = scoring.timeline.filter(
      (b) => b.inningsIndex === inn.inningsIndex
    );
    const inningsStats = scoring.playerStats.filter(
      (s) => s.inningsIndex === inn.inningsIndex
    );

    // --- Batting (in order of first appearance in timeline) ---
    const batterOrder = [];
    const seen = new Set();
    for (const b of inningsBalls) {
      if (b.batterId && !seen.has(b.batterId)) {
        seen.add(b.batterId);
        batterOrder.push(b.batterId);
      }
    }
    // Some batters may have a stat row but never faced a delivery (came in
    // after innings ended). Append them at the bottom.
    for (const s of inningsStats) {
      if (s.userId && !seen.has(s.userId) && s.battingBalls > 0) {
        seen.add(s.userId);
        batterOrder.push(s.userId);
      }
    }

    const batters = batterOrder.map((userId) => {
      const s = inningsStats.find((x) => x.userId === userId) || {};
      const p = players.get(userId);
      // Dismissal string e.g. "lbw b Atkinson", "c Emilio Gay b Robinson", "run out", "not out"
      const dismissal = formatDismissal(s, players);
      const sr =
        s.battingBalls > 0
          ? ((s.battingRuns / s.battingBalls) * 100).toFixed(2)
          : "0.00";
      return {
        id: userId,
        name: p?.name || "Player",
        profilePicture: p?.profilePicture || null,
        runs: s.battingRuns || 0,
        balls: s.battingBalls || 0,
        fours: s.battingFours || 0,
        sixes: s.battingSixes || 0,
        strikeRate: Number(sr),
        outStatus: s.outStatus || "NOT_OUT",
        dismissal,
        isStriker:
          scoring.strikerId === userId &&
          scoring.currentInningsIndex === inn.inningsIndex,
        isNonStriker:
          scoring.nonStrikerId === userId &&
          scoring.currentInningsIndex === inn.inningsIndex,
      };
    });

    // --- Bowling (in order of first over bowled) ---
    const bowlerOrder = [];
    const bSeen = new Set();
    for (const b of inningsBalls) {
      if (b.bowlerId && !bSeen.has(b.bowlerId)) {
        bSeen.add(b.bowlerId);
        bowlerOrder.push(b.bowlerId);
      }
    }
    const bowlers = bowlerOrder.map((userId) => {
      const s = inningsStats.find((x) => x.userId === userId) || {};
      const p = players.get(userId);
      const overs = `${Math.floor((s.bowlingBalls || 0) / ballsPerOver)}.${(s.bowlingBalls || 0) % ballsPerOver}`;
      const er =
        (s.bowlingBalls || 0) > 0
          ? ((s.bowlingRuns / s.bowlingBalls) * ballsPerOver).toFixed(2)
          : "0.00";
      return {
        id: userId,
        name: p?.name || "Bowler",
        profilePicture: p?.profilePicture || null,
        overs,
        maidens: s.bowlingMaidens || 0,
        runs: s.bowlingRuns || 0,
        wickets: s.bowlingWickets || 0,
        wides: s.bowlingWides || 0,
        noBalls: s.bowlingNoBalls || 0,
        economyRate: Number(er),
        isCurrent:
          scoring.bowlerId === userId &&
          scoring.currentInningsIndex === inn.inningsIndex,
      };
    });

    // --- Fall of Wickets ---
    let cumRuns = 0;
    let wicketIdx = 0;
    const validBallsSoFar = (i) => {
      // Count legal balls up to AND including index i.
      let count = 0;
      for (let k = 0; k <= i; k++) {
        const b = inningsBalls[k];
        const legal =
          b.extraType !== "PENALTY" &&
          (b.extraType !== "WIDE" || houseRules.wideIsLegalBall) &&
          (b.extraType !== "NO_BALL" || houseRules.noBallIsLegalBall);
        if (legal) count++;
      }
      return count;
    };
    const fallOfWickets = [];
    for (let i = 0; i < inningsBalls.length; i++) {
      const b = inningsBalls[i];
      cumRuns += (b.runs || 0) + (b.extraRuns || 0);
      if (b.isWicket && b.wicketType !== "RETIRED_HURT") {
        wicketIdx += 1;
        const outId = b.playerOutId || b.batterId;
        const out = players.get(outId);
        const balls = validBallsSoFar(i);
        const over = `${Math.floor(balls / ballsPerOver)}.${balls % ballsPerOver}`;
        fallOfWickets.push({
          wicketNumber: wicketIdx,
          playerId: outId,
          playerName: out?.name || "Player",
          score: `${cumRuns}-${wicketIdx}`,
          runs: cumRuns,
          wicket: wicketIdx,
          over,
        });
      }
    }

    // --- Partnerships ---
    const partnerships = buildPartnerships(inningsBalls, players, ballsPerOver);

    // --- Extras ---
    const extras = inn.extras || {
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      penalty: 0,
    };
    const extrasTotal = sumExtras(extras);

    // --- Innings header totals ---
    const totalValidBalls = inn.totalBalls || 0;
    const oversString = `${Math.floor(totalValidBalls / ballsPerOver)}.${totalValidBalls % ballsPerOver}`;
    const crr =
      totalValidBalls > 0
        ? ((inn.totalRuns / totalValidBalls) * ballsPerOver).toFixed(2)
        : "0.00";

    return {
      inningsIndex: inn.inningsIndex,
      isCompleted: inn.isCompleted,
      battingTeam: { key: battingTeamKey, name: battingTeamName },
      fieldingTeam: { name: fieldingTeamName },
      totalRuns: inn.totalRuns,
      totalWickets: inn.totalWickets,
      totalBalls: totalValidBalls,
      overs: oversString,
      crr: Number(crr),
      extras: { ...extras, total: extrasTotal },
      batters,
      bowlers,
      fallOfWickets,
      partnerships,
      reviews: {
        batting: inn.battingTeamReviews ?? 2,
        fielding: inn.fieldingTeamReviews ?? 2,
      },
      powerplayOvers: inn.powerplayOvers || 0,
    };
  });

  return {
    matchId: scoring.gameId,
    status: scoring.status,
    result: scoring.result,
    teamA: { name: teamNameForKey(hostedGame, "teamA") },
    teamB: { name: teamNameForKey(hostedGame, "teamB") },
    innings,
  };
};

// Format the dismissal string per Cricinfo convention.
//   BOWLED       → "b Atkinson"
//   LBW          → "lbw b Atkinson"
//   CAUGHT       → "c Smith b Atkinson"  (caught-and-bowled: "c & b Atkinson")
//   STUMPED      → "st †Wicket b Atkinson"
//   HIT_WICKET   → "hit wicket b Atkinson"
//   RUN_OUT      → "run out (Fielder)"
//   RETIRED_HURT → "retired hurt"
//   RETIRED_OUT  → "retired out"
//   NOT_OUT      → "not out"  (or "" / "batting" depending on UI)
const formatDismissal = (stat, players) => {
  const status = stat.outStatus || "NOT_OUT";
  if (status === "NOT_OUT") return "not out";

  const bowler = players.get(stat.dismissedById);
  const fielder = players.get(stat.caughtById);
  const bowlerName = bowler?.name?.split(" ").slice(-1)[0] || "";
  const fielderName = fielder?.name || "";

  switch (status) {
    case "BOWLED":
      return bowlerName ? `b ${bowlerName}` : "bowled";
    case "LBW":
      return bowlerName ? `lbw b ${bowlerName}` : "lbw";
    case "CAUGHT":
      if (bowler && fielder && bowler.id === fielder.id)
        return `c & b ${bowlerName}`;
      if (fielder && bowler) return `c ${fielderName} b ${bowlerName}`;
      return "caught";
    case "STUMPED":
      return bowlerName ? `st b ${bowlerName}` : "stumped";
    case "HIT_WICKET":
      return bowlerName ? `hit wicket b ${bowlerName}` : "hit wicket";
    case "RUN_OUT":
      return fielderName ? `run out (${fielderName})` : "run out";
    case "RETIRED_HURT":
      return "retired hurt";
    case "RETIRED_OUT":
      return "retired out";
    case "OBSTRUCTING_FIELD":
      return "obstructing the field";
    case "HIT_BALL_TWICE":
      return "hit ball twice";
    case "HANDLED_BALL":
      return "handled the ball";
    case "TIMED_OUT":
      return "timed out";
    default:
      return status.toLowerCase().replaceAll("_", " ");
  }
};

const buildPartnerships = (inningsBalls, players, ballsPerOver) => {
  const out = [];
  let current = null;
  const startPartnership = (batterA, batterB) => ({
    playerA: { id: batterA, runs: 0, balls: 0 },
    playerB: { id: batterB, runs: 0, balls: 0 },
    runs: 0,
    balls: 0,
  });

  for (const b of inningsBalls) {
    if (!current) {
      // We need the non-striker on the first delivery — derive from the
      // fact that wicket events later carry playerOutId. For the first
      // partnership, we only know who's batting from the ball itself.
      current = startPartnership(b.batterId, null);
    }
    // Attribute runs to whoever's the striker (b.batterId)
    const onStrike = current.playerA.id === b.batterId ? "playerA" : "playerB";
    if (current[onStrike].id !== b.batterId) {
      // First time we see the non-striker — record their id.
      current.playerB = { id: b.batterId, runs: 0, balls: 0 };
    }
    const target = current.playerA.id === b.batterId ? "playerA" : "playerB";
    const offBat = b.runs || 0;
    current[target].runs += offBat;
    // Balls faced = legal deliveries facing this batter
    const isLegal =
      b.extraType !== "PENALTY" &&
      b.extraType !== "WIDE" &&
      b.extraType !== "NO_BALL";
    if (isLegal) {
      current[target].balls += 1;
      current.balls += 1;
    }
    current.runs += offBat + (b.extraRuns || 0);

    if (b.isWicket && b.wicketType !== "RETIRED_HURT") {
      const partner =
        current.playerA.id === b.playerOutId ? "playerB" : "playerA";
      const pA = players.get(current.playerA.id);
      const pB = current.playerB.id ? players.get(current.playerB.id) : null;
      out.push({
        playerA: {
          id: current.playerA.id,
          name: pA?.name || "Player",
          runs: current.playerA.runs,
          balls: current.playerA.balls,
        },
        playerB: pB
          ? {
              id: current.playerB.id,
              name: pB?.name || "Player",
              runs: current.playerB.runs,
              balls: current.playerB.balls,
            }
          : null,
        runs: current.runs,
        balls: current.balls,
      });
      current = null;
    }
  }

  // Trailing (incomplete) partnership while batters are still at the crease.
  if (current) {
    const pA = players.get(current.playerA.id);
    const pB = current.playerB.id ? players.get(current.playerB.id) : null;
    out.push({
      playerA: {
        id: current.playerA.id,
        name: pA?.name || "Player",
        runs: current.playerA.runs,
        balls: current.playerA.balls,
      },
      playerB: pB
        ? {
            id: current.playerB.id,
            name: pB?.name || "Player",
            runs: current.playerB.runs,
            balls: current.playerB.balls,
          }
        : null,
      runs: current.runs,
      balls: current.balls,
      isUnbroken: true,
    });
  }
  return out;
};

// ── 2. SQUADS ────────────────────────────────────────────────────────────
//
// Returns left/right team rosters with Playing XI vs Bench split.
// Slot status === "JOINED" / "FILLED" / "PENDING" with a userId → Playing XI.
// Slot with no userId (still OPEN) OR explicitly marked bench → Bench.

export const buildSquads = async (matchId) => {
  const { hostedGame, players } = await loadScoringContext(matchId);

  const mkSide = (teamKey) => {
    const team = hostedGame.teams?.find((t) => t.teamKey === teamKey);
    if (!team)
      return {
        name: teamKey === "teamA" ? "Team A" : "Team B",
        key: teamKey,
        playingXi: [],
        bench: [],
      };

    const playingXi = [];
    const bench = [];

    for (const slot of team.slots || []) {
      const userInfo = slot.userId ? players.get(slot.userId) : null;
      const customInfo = slot.customPlayerId
        ? players.get(slot.customPlayerId)
        : null;
      const display = userInfo ||
        customInfo || {
          id: slot.id,
          name: slot.customPlayer?.name || "Open Slot",
          profilePicture: null,
        };
      const entry = {
        slotId: slot.id,
        id: display.id,
        name: display.name,
        profilePicture: display.profilePicture,
        role: slot.role || "Player",
        isCustom: !!customInfo,
        isCaptain: slot.role?.toUpperCase().includes("CAPTAIN") || false,
        isWicketKeeper:
          slot.role?.toUpperCase().includes("WICKET") ||
          slot.role?.toUpperCase().includes("WK"),
        status: slot.status,
      };

      // Treat anything assigned to a user/custom as Playing XI; the rest is bench.
      if (slot.userId || slot.customPlayerId) {
        playingXi.push(entry);
      } else {
        bench.push(entry);
      }
    }

    return {
      key: teamKey,
      name: team.name || (teamKey === "teamA" ? "Team A" : "Team B"),
      image: team.image || null,
      playingXi,
      bench,
    };
  };

  return {
    matchId: hostedGame.id,
    teamA: mkSide("teamA"),
    teamB: mkSide("teamB"),
  };
};

// ── 3. OVERS ─────────────────────────────────────────────────────────────
//
// Groups MatchBall rows by over-number for the requested innings.
// Each over has:
//   - overNumber + label "Ov 14"
//   - bowlerName + facedBy (set of striker names — usually one, sometimes two
//     across an over if a wicket fell and a new batter came in)
//   - balls[] each with label ("1", "4", "W", "Wd", "nb 1", "•"), runs, isWicket
//   - runs (sum of runs + extraRuns)
//   - scoreAtEnd (cumulative innings runs after this over) "61-6"

export const buildOvers = async (matchId, requestedInnings, opts = {}) => {
  const { scoring, hostedGame, players } = await loadScoringContext(matchId);
  const houseRules = resolveHouseRules(scoring.houseRules);
  const ballsPerOver = houseRules.ballsPerOver;

  // Default to the first innings the user asks for; otherwise return both.
  const targets =
    requestedInnings != null
      ? scoring.innings.filter(
          (inn) => inn.inningsIndex === Number(requestedInnings)
        )
      : scoring.innings;

  if (!targets.length)
    return { matchId: scoring.gameId, innings: [], nextCursor: null };

  // Cursor support — `afterBallId` lets the client say "I've already seen
  // every ball up to and including this one; only send overs containing a
  // newer ball." Big bandwidth win when polling an in-progress over.
  // We resolve the cursor to (inningsIndex, over, ballInOver) once so the
  // filter below is a simple tuple comparison.
  let cursorPos = null;
  if (opts.afterBallId) {
    const c = await prisma.matchBall.findUnique({
      where: { id: opts.afterBallId },
      select: {
        inningsIndex: true,
        over: true,
        ballInOver: true,
        matchId: true,
      },
    });
    if (c && c.matchId === scoring.id) {
      cursorPos = c;
    }
  }

  const labelFor = (b) => {
    if (b.isWicket && b.runs + (b.extraRuns || 0) === 0) {
      return b.extraType && b.extraType !== "NONE"
        ? `W${suffixFor(b.extraType)}`
        : "W";
    }
    const total = (b.runs || 0) + (b.extraRuns || 0);
    if (b.extraType && b.extraType !== "NONE") {
      return `${total || ""}${suffixFor(b.extraType)}`.trim();
    }
    if (total === 0) return "•";
    return String(total);
  };

  // Track the latest ball id across all returned innings — that's the
  // nextCursor the client should echo next poll.
  let latestBallId = null;
  let latestBallTs = 0;

  const innings = targets.map((inn) => {
    const inningsBalls = scoring.timeline.filter(
      (b) => b.inningsIndex === inn.inningsIndex
    );

    // Group by over number. The "over number" we display is 1-indexed, but
    // MatchBall.over is 0-indexed.
    const byOver = new Map();
    for (const b of inningsBalls) {
      const k = b.over;
      if (!byOver.has(k)) byOver.set(k, []);
      byOver.get(k).push(b);

      // Bump the cursor candidate. timeline is ordered asc, so the last
      // one we see in the loop is the freshest.
      const ts = b.timestamp?.getTime?.() || 0;
      if (ts >= latestBallTs) {
        latestBallTs = ts;
        latestBallId = b.id;
      }
    }

    // Walk in chronological order and build a cumulative score after each over.
    // Cumulative totals always walk every ball (so scoreAtEnd stays correct),
    // but we only push overs that pass the cursor filter into the response.
    const cursorAppliesHere =
      cursorPos && cursorPos.inningsIndex === inn.inningsIndex;
    let cumRuns = 0;
    let cumWickets = 0;
    const overs = [];
    for (const overNumber of [...byOver.keys()].sort((a, b) => a - b)) {
      const balls = byOver.get(overNumber);
      const runsThisOver = balls.reduce(
        (acc, b) => acc + (b.runs || 0) + (b.extraRuns || 0),
        0
      );
      cumRuns += runsThisOver;
      cumWickets += balls.filter(
        (b) => b.isWicket && b.wicketType !== "RETIRED_HURT"
      ).length;

      // Cursor filter — skip overs whose last ball is at-or-before the cursor.
      // The cursor's own over is still emitted if it has NEWER balls than
      // the cursor's ballInOver (i.e. we're mid-over and another ball was
      // bowled since the client last polled).
      if (cursorAppliesHere) {
        if (overNumber < cursorPos.over) continue;
        if (overNumber === cursorPos.over) {
          const hasNewerBall = balls.some(
            (b) => b.ballInOver > cursorPos.ballInOver
          );
          if (!hasNewerBall) continue;
        }
      }
      // If the cursor is for a later innings entirely, skip the whole inning.
      if (cursorPos && cursorPos.inningsIndex > inn.inningsIndex) continue;

      const strikerIds = [
        ...new Set(balls.map((b) => b.batterId).filter(Boolean)),
      ];
      const bowlerId = balls[0]?.bowlerId;
      const bowlerName = players.get(bowlerId)?.name || "Bowler";
      const facedByNames = strikerIds.map(
        (id) => players.get(id)?.name || "Batter"
      );
      const header = `${bowlerName} to ${facedByNames.join(" & ")}`;

      overs.push({
        overNumber: overNumber + 1, // 1-indexed for display
        label: `Ov ${overNumber + 1}`,
        bowler: { id: bowlerId, name: bowlerName },
        facedBy: facedByNames,
        header,
        balls: balls.map((b) => ({
          label: labelFor(b),
          runs: (b.runs || 0) + (b.extraRuns || 0),
          isExtra: b.isExtra,
          extraType: b.extraType,
          isWicket: b.isWicket,
          isFour: b.isFour,
          isSix: b.isSix,
          commentary: b.commentary || null,
        })),
        runs: runsThisOver,
        scoreAtEnd: `${cumRuns}-${cumWickets}`,
      });
    }

    return {
      inningsIndex: inn.inningsIndex,
      battingTeam: {
        name: teamNameForKey(
          hostedGame,
          inn.battingTeam === "teamA" ? "teamA" : "teamB"
        ),
      },
      overs: overs.reverse(), // latest over first (Cricinfo convention)
    };
  });

  return { matchId: scoring.gameId, innings, nextCursor: latestBallId };
};

const suffixFor = (extraType) => {
  switch (extraType) {
    case "WIDE":
      return "wd";
    case "NO_BALL":
      return "nb";
    case "BYE":
      return "b";
    case "LEG_BYE":
      return "lb";
    case "PENALTY":
      return "p";
    default:
      return "";
  }
};

// ── 4. LIVE-MATCHES DISCOVERY ────────────────────────────────────────────
//
// Lists matches in LIVE / PAUSED / RECENTLY_COMPLETED state for the home tab.
// Each card carries: teams, current innings + score, result string if done.

export const listLiveMatches = async ({ limit = 50 } = {}) => {
  const games = await prisma.hostedGame.findMany({
    where: {
      scoringStatus: { in: ["LIVE", "PAUSED", "COMPLETED"] },
      cricketMatch: { isNot: null },
    },
    orderBy: { updatedAt: "desc" },
    take: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
    include: {
      teams: { select: { teamKey: true, name: true, image: true } },
      cricketMatch: {
        select: {
          id: true,
          status: true,
          result: true,
          currentInningsIndex: true,
          oversPerInnings: true,
          houseRules: true,
          innings: {
            select: {
              inningsIndex: true,
              totalRuns: true,
              totalWickets: true,
              totalBalls: true,
              battingTeam: true,
              isCompleted: true,
            },
            orderBy: { inningsIndex: "asc" },
          },
        },
      },
    },
  });

  return {
    items: games.map((g) => shapeLiveCard(g)),
  };
};

const shapeLiveCard = (game) => {
  const teamA = game.teams?.find((t) => t.teamKey === "teamA") || {
    name: "Team A",
  };
  const teamB = game.teams?.find((t) => t.teamKey === "teamB") || {
    name: "Team B",
  };
  const cm = game.cricketMatch;
  const innings = cm?.innings || [];
  const houseRules = resolveHouseRules(cm?.houseRules);
  const ballsPerOver = houseRules.ballsPerOver;

  const shape = (inn) => {
    if (!inn) return null;
    const balls = inn.totalBalls || 0;
    return {
      inningsIndex: inn.inningsIndex,
      battingTeam: inn.battingTeam === "teamA" ? teamA.name : teamB.name,
      runs: inn.totalRuns,
      wickets: inn.totalWickets,
      overs: `${Math.floor(balls / ballsPerOver)}.${balls % ballsPerOver}`,
      isCompleted: inn.isCompleted,
    };
  };

  return {
    gameId: game.id,
    matchId: cm?.id || null,
    name: game.name,
    status: cm?.status || game.scoringStatus,
    scoringStatus: game.scoringStatus,
    teamA: { name: teamA.name, image: teamA.image },
    teamB: { name: teamB.name, image: teamB.image },
    inningsA: shape(innings[0]),
    inningsB: shape(innings[1]),
    result: cm?.result || null,
    oversPerInnings: cm?.oversPerInnings || 20,
  };
};
