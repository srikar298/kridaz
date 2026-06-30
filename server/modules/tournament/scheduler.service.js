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
        matches.push({ home, away });
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

  let allMatches = [];

  // 1. Generate unordered pairings for each pool
  for (const pool of tournament.pools) {
    const pairings = generateRoundRobinMatches(pool.teams);
    for (const pair of pairings) {
      allMatches.push({
        poolId: pool.id,
        team1Id: pair.home,
        team2Id: pair.away,
      });
    }
  }

  // Shuffle matches slightly to mix pools, or interleave them
  // A simple interleaving:
  const interleavedMatches = [];
  // (In a real scenario, you'd balance matches better so one team doesn't play twice a day, but keeping it simple for now)

  let currentDate = parseISO(startDate || new Date().toISOString());
  let slotIndex = 0;

  const gamesToCreate = allMatches.map((match, i) => {
    // Determine the date and time for this match
    if (slotIndex >= slotTimes.length) {
      slotIndex = 0;
      currentDate = addDays(currentDate, 1);
    }

    const timeString = slotTimes[slotIndex];
    const scheduledAt = new Date(
      `${format(currentDate, "yyyy-MM-dd")}T${timeString}:00`
    );

    slotIndex++;

    return {
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
    };
  });

  // 2. Save matches to DB
  const createdGames = [];
  for (const gameData of gamesToCreate) {
    const { teams, ...gameDetails } = gameData;
    const created = await prisma.hostedGame.create({
      data: {
        ...gameDetails,
        teams: teams,
      },
    });
    createdGames.push(created);
  }

  return createdGames;
};

/**
 * Calculates Standings (Points, NRR) based on CricketMatch data.
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

      // DLS adjustment: if revisedTarget is set, the team batting first is credited with (revisedTarget - 1)
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

      // Calculate balls faced & bowled under All-Out laws
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
 * Creates a manual scheduled game
 */
export const createManualScheduledGame = async (
  tournamentId,
  stage,
  poolId,
  scheduledAt,
  team1Id,
  team2Id
) => {
  return await prisma.hostedGame.create({
    data: {
      tournamentId,
      tournamentStage: stage,
      tournamentPoolId: poolId,
      status: "SCHEDULED",
      requestType: "TOURNAMENT_MATCH",
      scheduledAt: new Date(scheduledAt),
      teams: {
        create: [
          { teamId: team1Id, score: 0, status: "ACCEPTED" },
          { teamId: team2Id, score: 0, status: "ACCEPTED" },
        ],
      },
    },
  });
};
