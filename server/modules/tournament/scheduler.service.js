import { prisma } from "../../config/prisma.js";
import { addDays, parseISO, format } from "date-fns";

/**
 * Standard Round-Robin Match Generator for a pool.
 * Generates matches so every team plays every other team once.
 */
const generateRoundRobinMatches = (teams) => {
  const matches = [];
  const n = teams.length;
  if (n < 2) return [];

  const teamIds = teams.map((t) => t.teamId);
  const isOdd = n % 2 !== 0;
  if (isOdd) teamIds.push("BYE");

  const totalRounds = teamIds.length - 1;
  const matchesPerRound = teamIds.length / 2;

  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = teamIds[match];
      const away = teamIds[teamIds.length - 1 - match];

      if (home !== "BYE" && away !== "BYE") {
        matches.push({ home, away, byeTeam: null });
      } else {
        // Track which team has the bye so we can award them walkover points in standings
        const realTeam = home === "BYE" ? away : home;
        matches.push({ home: null, away: null, byeTeam: realTeam });
      }
    }
    // Rotate array, keeping the first element fixed
    teamIds.splice(1, 0, teamIds.pop());
  }

  return matches;
};

/**
 * Auto-generates group stage matches and distributes them over dates based on slot preferences.
 *
 * @param {string} tournamentId
 * @param {Date} startDate
 * @param {Array<string>} slotTimes - e.g. ["09:00", "14:00", "19:00"]
 */
export const autoGenerateGroupStage = async (
  tournamentId,
  startDate,
  slotTimes
) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      pools: {
        include: { teams: true },
      },
    },
  });

  if (!tournament) throw new Error("Tournament not found");
  if (!slotTimes || slotTimes.length === 0)
    throw new Error("Please provide slot times");

  // Edge Case 25: Partial payment defaulter exclusion
  // Teams that have never paid anything (PENDING) are excluded from schedule generation
  const pendingDefaulters = [];
  for (const pool of tournament.pools) {
    for (const team of pool.teams) {
      if (team.paymentStatus === "PENDING") {
        pendingDefaulters.push(team.teamId);
      }
    }
  }
  if (pendingDefaulters.length > 0) {
    throw new Error(
      `Cannot generate schedule: ${pendingDefaulters.length} team(s) have not completed their registration payment. ` +
      `Please approve or remove these teams before scheduling.`
    );
  }

  let allMatches = [];

  // 1. Generate unordered pairings for each pool (includes BYE pairings)
  for (const pool of tournament.pools) {
    const pairings = generateRoundRobinMatches(pool.teams);
    for (const pair of pairings) {
      allMatches.push({
        poolId: pool.id,
        team1Id: pair.home,
        team2Id: pair.away,
        byeTeam: pair.byeTeam,
      });
    }
  }

  // Edge Case 22: Multi-venue rest collision guard
  // Ensure no team plays twice in a 2-hour window on the same day
  const teamDaySlots = {}; // key: `${teamId}:${dateStr}`, value: [scheduledAt timestamps]
  const MIN_REST_MS = 2 * 60 * 60 * 1000; // 2 hours

  let currentDate = parseISO(startDate || new Date().toISOString());
  let slotIndex = 0;

  // Pre-compute all slot times to check for collisions
  const tentativeSlots = allMatches.map((match) => {
    if (slotIndex >= slotTimes.length) {
      slotIndex = 0;
      currentDate = addDays(currentDate, 1);
    }
    const timeString = slotTimes[slotIndex];
    const scheduledAt = new Date(
      `${format(currentDate, "yyyy-MM-dd")}T${timeString}:00`
    );
    slotIndex++;
    return { match, scheduledAt };
  });

  // Check for collision — any team with <2h gap between matches on same day
  for (const { match, scheduledAt } of tentativeSlots) {
    const teamsToCheck = [match.team1Id, match.team2Id].filter(Boolean);
    for (const teamId of teamsToCheck) {
      const dateStr = format(scheduledAt, "yyyy-MM-dd");
      const key = `${teamId}:${dateStr}`;
      if (!teamDaySlots[key]) teamDaySlots[key] = [];

      for (const existingTime of teamDaySlots[key]) {
        const diff = Math.abs(scheduledAt.getTime() - existingTime.getTime());
        if (diff < MIN_REST_MS) {
          throw new Error(
            `Schedule conflict detected: Team ${teamId} is scheduled for two matches within 2 hours on ${dateStr}. ` +
            `Please add more slot times or spread matches across more days.`
          );
        }
      }
      teamDaySlots[key].push(scheduledAt);
    }
  }

  // 2. Save real matches to DB (skip BYE placeholder pairings — they get walkover points in standings)
  const createdGames = [];
  for (const { match, scheduledAt } of tentativeSlots) {
    if (match.byeTeam !== null) {
      // BYE round — no game created, walkover handled in standings calculation
      continue;
    }

    const { teams: _teams, byeTeam: _bye, ...gameDetails } = match;

    const created = await prisma.hostedGame.create({
      data: {
        tournamentId,
        tournamentStage: "GROUP",
        tournamentPoolId: match.poolId,
        status: "SCHEDULED",
        requestType: "TOURNAMENT_MATCH",
        scheduledAt,
        teams: {
          create: [
            { teamId: match.team1Id, score: 0, status: "ACCEPTED" },
            { teamId: match.team2Id, score: 0, status: "ACCEPTED" },
          ],
        },
      },
    });
    createdGames.push(created);
  }

  return createdGames;
};

/**
 * Calculates Standings (Points, NRR) based on CricketMatch data.
 * Handles:
 *  - ICC All-Out overs quota rule
 *  - DLS first-innings NRR adjustment
 *  - Super Over exclusion
 *  - Abandoned / No-Result matches (1 point each, no NRR impact)
 *  - BYE team walkover points (2 points for the real team, no NRR impact)
 */
export const getTournamentStandings = async (tournamentId) => {
  const games = await prisma.hostedGame.findMany({
    where: { tournamentId, tournamentStage: "GROUP" },
    include: {
      teams: { include: { linkedTeam: true } },
      cricketMatch: {
        include: { innings: true },
      },
    },
  });

  // Initialize standings map
  const standings = {};

  const initTeam = (poolId, teamId, teamName) => {
    if (!standings[poolId]) standings[poolId] = {};
    if (!standings[poolId][teamId]) {
      standings[poolId][teamId] = {
        teamId,
        teamName,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        points: 0,
        runsScored: 0,
        ballsFaced: 0,
        runsConceded: 0,
        ballsBowled: 0,
        nrr: 0.0,
      };
    }
  };

  for (const game of games) {
    if (!game.tournamentPoolId) continue;

    for (const gt of game.teams) {
      if (gt.linkedTeamId && gt.linkedTeam) {
        initTeam(game.tournamentPoolId, gt.linkedTeamId, gt.linkedTeam.name);
      }
    }

    // Edge Case 19: Abandoned / No-Result matches
    // 1 point each, completely excluded from NRR calculations
    if (game.status === "ABANDONED" || game.status === "NO_RESULT") {
      for (const gt of game.teams) {
        if (gt.linkedTeamId && standings[game.tournamentPoolId]?.[gt.linkedTeamId]) {
          const s = standings[game.tournamentPoolId][gt.linkedTeamId];
          s.played += 1;
          s.noResult += 1;
          s.points += 1; // Standard rule: 1 point each for abandoned match
          // NRR accumulators intentionally NOT updated
        }
      }
      continue;
    }

    if (game.status === "COMPLETED" && game.cricketMatch) {
      const match = game.cricketMatch;
      
      const gtA = game.teams.find((t) => t.teamKey === "teamA");
      const gtB = game.teams.find((t) => t.teamKey === "teamB");
      
      if (!gtA || !gtB || !gtA.linkedTeamId || !gtB.linkedTeamId) continue;
      
      const sA = standings[game.tournamentPoolId][gtA.linkedTeamId];
      const sB = standings[game.tournamentPoolId][gtB.linkedTeamId];
      
      if (!sA || !sB) continue;

      sA.played += 1;
      sB.played += 1;

      // Extract normal innings, excluding Super Overs
      const normalInnings = match.innings.filter(i => !i.isSuperOver);
      const inningsA = normalInnings.find(i => i.battingTeam === "teamA");
      const inningsB = normalInnings.find(i => i.battingTeam === "teamB");

      const ballsPerOver = match.houseRules?.ballsPerOver || 6;
      const maxOvers = match.revisedOvers != null ? match.revisedOvers : match.oversPerInnings;
      const maxBalls = Math.floor(maxOvers * ballsPerOver);

      const playersPerTeam = match.houseRules?.playersPerTeam || 11;
      const wicketsForAllOut = playersPerTeam - 1;

      const isTeamAAllOut = inningsA && inningsA.totalWickets >= wicketsForAllOut;
      const isTeamBAllOut = inningsB && inningsB.totalWickets >= wicketsForAllOut;

      let runsScoredA = inningsA ? inningsA.totalRuns : 0;
      let runsScoredB = inningsB ? inningsB.totalRuns : 0;

      // Edge Case 20: DLS adjustment
      // If revisedTarget is set, the team batting first is credited with (revisedTarget - 1) for NRR
      // Their overs are also set to revisedOvers (the reduced quota for the chasing team)
      if (match.revisedTarget != null) {
        const firstInnings = normalInnings.find(i => i.inningsIndex === 0);
        if (firstInnings) {
          if (firstInnings.battingTeam === "teamA") {
            runsScoredA = Math.max(0, match.revisedTarget - 1);
          } else {
            runsScoredB = Math.max(0, match.revisedTarget - 1);
          }
        }
      }

      // ICC All-Out law: bowled-out team counted as using full quota of overs for NRR
      let ballsFacedA = inningsA ? inningsA.totalBalls : 0;
      if (isTeamAAllOut) {
        ballsFacedA = maxBalls;
      }

      let ballsFacedB = inningsB ? inningsB.totalBalls : 0;
      if (isTeamBAllOut) {
        ballsFacedB = maxBalls;
      }

      // Accumulate stats
      sA.runsScored += runsScoredA;
      sA.ballsFaced += ballsFacedA;
      sA.runsConceded += runsScoredB;
      sA.ballsBowled += ballsFacedB;

      sB.runsScored += runsScoredB;
      sB.ballsFaced += ballsFacedB;
      sB.runsConceded += runsScoredA;
      sB.ballsBowled += ballsFacedA;

      // Determine Winner from completed result string
      const resultStr = match.result || "";
      const teamAName = gtA.name || gtA.linkedTeam.name;
      const teamBName = gtB.name || gtB.linkedTeam.name;

      if (resultStr.toLowerCase().includes("tied") || resultStr.toLowerCase().includes("draw")) {
        sA.tied += 1;
        sB.tied += 1;
        sA.points += 1;
        sB.points += 1;
      } else if (resultStr.includes(teamAName)) {
        sA.won += 1;
        sA.points += 2;
        sB.lost += 1;
      } else if (resultStr.includes(teamBName)) {
        sB.won += 1;
        sB.points += 2;
        sA.lost += 1;
      }
    }
  }

  // Edge Case 21: BYE team walkover points
  // Fetch the pool structures to compute BYE rounds (odd-number pools)
  // Any team in an odd-sized pool gets one automatic walkover win (2 pts) per round they had a bye
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      pools: { include: { teams: { include: { team: true } } } },
    },
  });

  if (tournament) {
    for (const pool of tournament.pools) {
      if (pool.teams.length % 2 !== 0 && standings[pool.id]) {
        // Odd-sized pool: each team gets exactly 1 BYE round in the round-robin
        // Award each active team 1 walkover win worth 2 points
        // (The BYE round is distributed evenly, one per team across all rounds)
        // We represent this as: each team in the pool gets a BYE walkover once
        const byeRounds = generateRoundRobinMatches(pool.teams).filter(p => p.byeTeam !== null);
        for (const byeRound of byeRounds) {
          const s = standings[pool.id]?.[byeRound.byeTeam];
          if (s) {
            s.played += 1;
            s.won += 1;
            s.points += 2;
            // NRR accumulators intentionally NOT updated for walkover wins
          }
        }
      }
    }
  }

  // Calculate NRR and sort
  const result = [];
  for (const poolId in standings) {
    const teamsInPool = Object.values(standings[poolId]);
    for (const team of teamsInPool) {
      const oversFacedFraction = team.ballsFaced / 6;
      const oversBowledFraction = team.ballsBowled / 6;
      
      const rf = oversFacedFraction > 0 ? team.runsScored / oversFacedFraction : 0;
      const ra = oversBowledFraction > 0 ? team.runsConceded / oversBowledFraction : 0;
      team.nrr = parseFloat((rf - ra).toFixed(3));
    }

    // Sort by Points, then NRR
    teamsInPool.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });

    result.push({
      poolId,
      teams: teamsInPool,
    });
  }

  return result;
};

/**
 * Creates a manual scheduled game.
 * Edge Case 22: Validates no team plays twice within 2 hours on the same day.
 */
export const createManualScheduledGame = async (
  tournamentId,
  stage,
  poolId,
  scheduledAt,
  team1Id,
  team2Id
) => {
  const scheduled = new Date(scheduledAt);
  const dateStr = format(scheduled, "yyyy-MM-dd");
  const MIN_REST_MS = 2 * 60 * 60 * 1000;

  // Check for same-day rest collision against existing games
  const existingGames = await prisma.hostedGame.findMany({
    where: {
      tournamentId,
      scheduledAt: {
        gte: new Date(`${dateStr}T00:00:00`),
        lte: new Date(`${dateStr}T23:59:59`),
      },
      status: { in: ["SCHEDULED", "LIVE"] },
    },
    include: { teams: true },
  });

  for (const existingGame of existingGames) {
    const existingTeamIds = existingGame.teams.map((t) => t.teamId);
    const conflicting = [team1Id, team2Id].filter((id) => existingTeamIds.includes(id));
    if (conflicting.length > 0) {
      const diff = Math.abs(scheduled.getTime() - existingGame.scheduledAt.getTime());
      if (diff < MIN_REST_MS) {
        throw new Error(
          `Schedule conflict: Team(s) ${conflicting.join(", ")} already have a match scheduled within 2 hours on ${dateStr}.`
        );
      }
    }
  }

  return await prisma.hostedGame.create({
    data: {
      tournamentId,
      tournamentStage: stage,
      tournamentPoolId: poolId,
      status: "SCHEDULED",
      requestType: "TOURNAMENT_MATCH",
      scheduledAt: scheduled,
      teams: {
        create: [
          { teamId: team1Id, score: 0, status: "ACCEPTED" },
          { teamId: team2Id, score: 0, status: "ACCEPTED" },
        ],
      },
    },
  });
};
