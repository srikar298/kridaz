import { PrismaClient } from '@prisma/client';
import { addDays, parseISO, format } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Standard Round-Robin Match Generator for a pool.
 * Generates matches so every team plays every other team once.
 */
const generateRoundRobinMatches = (teams) => {
  const matches = [];
  const n = teams.length;
  if (n < 2) return [];

  const teamIds = teams.map(t => t.teamId);
  const isOdd = n % 2 !== 0;
  if (isOdd) teamIds.push('BYE');

  const totalRounds = teamIds.length - 1;
  const matchesPerRound = teamIds.length / 2;

  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = teamIds[match];
      const away = teamIds[teamIds.length - 1 - match];

      if (home !== 'BYE' && away !== 'BYE') {
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
export const autoGenerateGroupStage = async (tournamentId, startDate, slotTimes) => {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      pools: {
        include: { teams: true }
      }
    }
  });

  if (!tournament) throw new Error("Tournament not found");
  if (!slotTimes || slotTimes.length === 0) throw new Error("Please provide slot times");

  let allMatches = [];
  
  // 1. Generate unordered pairings for each pool
  for (const pool of tournament.pools) {
    const pairings = generateRoundRobinMatches(pool.teams);
    for (const pair of pairings) {
      allMatches.push({
        poolId: pool.id,
        team1Id: pair.home,
        team2Id: pair.away
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
    const scheduledAt = new Date(\`\${format(currentDate, 'yyyy-MM-dd')}T\${timeString}:00\`);

    slotIndex++;

    return {
      tournamentId,
      tournamentStage: 'GROUP',
      tournamentPoolId: match.poolId,
      status: 'SCHEDULED',
      requestType: 'TOURNAMENT_MATCH',
      scheduledAt,
      teams: {
        create: [
          { teamId: match.team1Id, score: 0, status: 'ACCEPTED' },
          { teamId: match.team2Id, score: 0, status: 'ACCEPTED' }
        ]
      }
    };
  });

  // 2. Save matches to DB
  const createdGames = [];
  for (const gameData of gamesToCreate) {
    const { teams, ...gameDetails } = gameData;
    const created = await prisma.hostedGame.create({
      data: {
        ...gameDetails,
        teams: teams
      }
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
    where: { tournamentId, tournamentStage: 'GROUP' },
    include: {
      teams: { include: { team: true } },
      cricketMatch: {
        include: { teams: true }
      }
    }
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
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0,
        nrr: 0.0
      };
    }
  };

  for (const game of games) {
    if (!game.tournamentPoolId) continue;
    
    for (const gt of game.teams) {
      initTeam(game.tournamentPoolId, gt.teamId, gt.team.name);
    }

    if (game.status === 'COMPLETED' && game.cricketMatch) {
      const match = game.cricketMatch;
      const t1 = match.teams[0];
      const t2 = match.teams[1];
      
      if (!t1 || !t2) continue;

      const team1Id = game.teams.find(t => t.id === t1.teamId)?.teamId; // mapping HostedGame team to global Team
      const team2Id = game.teams.find(t => t.id === t2.teamId)?.teamId;
      
      // Wait, CricketMatch Teams usually map back to actual teams?
      // HostedGame.teams -> GameTeam. GameTeam.id is what CricketMatch.teams points to.
      // So t1.teamId is GameTeam.id. We need to find the GameTeam to get the real global teamId.
      const gt1 = game.teams.find(t => t.id === t1.teamId);
      const gt2 = game.teams.find(t => t.id === t2.teamId);

      if (!gt1 || !gt2) continue;

      const s1 = standings[game.tournamentPoolId][gt1.teamId];
      const s2 = standings[game.tournamentPoolId][gt2.teamId];

      s1.played += 1;
      s2.played += 1;

      // Runs & Overs logic for NRR (simplified)
      s1.runsScored += t1.score || 0;
      s1.oversFaced += t1.overs || 0; // Note: In real cricket NRR, 19.3 overs is 19.5 overs in math (19 + 3/6). Ensure `overs` is numeric decimal.
      s1.runsConceded += t2.score || 0;
      s1.oversBowled += t2.overs || 0;

      s2.runsScored += t2.score || 0;
      s2.oversFaced += t2.overs || 0;
      s2.runsConceded += t1.score || 0;
      s2.oversBowled += t1.overs || 0;

      // Determine Winner
      if (match.result === 'TEAM1_WON') {
        s1.won += 1;
        s1.points += 2;
        s2.lost += 1;
      } else if (match.result === 'TEAM2_WON') {
        s2.won += 1;
        s2.points += 2;
        s1.lost += 1;
      } else if (match.result === 'DRAW' || match.result === 'TIE') {
        s1.tied += 1;
        s2.tied += 1;
        s1.points += 1;
        s2.points += 1;
      }
    }
  }

  // Calculate NRR and sort
  const result = [];
  for (const poolId in standings) {
    const teamsInPool = Object.values(standings[poolId]);
    for (const team of teamsInPool) {
      const rf = team.oversFaced > 0 ? (team.runsScored / team.oversFaced) : 0;
      const ra = team.oversBowled > 0 ? (team.runsConceded / team.oversBowled) : 0;
      team.nrr = parseFloat((rf - ra).toFixed(3));
    }
    
    // Sort by Points, then NRR
    teamsInPool.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });

    result.push({
      poolId,
      teams: teamsInPool
    });
  }

  return result;
};

/**
 * Creates a manual scheduled game
 */
export const createManualScheduledGame = async (tournamentId, stage, poolId, scheduledAt, team1Id, team2Id) => {
  return await prisma.hostedGame.create({
    data: {
      tournamentId,
      tournamentStage: stage,
      tournamentPoolId: poolId,
      status: 'SCHEDULED',
      requestType: 'TOURNAMENT_MATCH',
      scheduledAt: new Date(scheduledAt),
      teams: {
        create: [
          { teamId: team1Id, score: 0, status: 'ACCEPTED' },
          { teamId: team2Id, score: 0, status: 'ACCEPTED' }
        ]
      }
    }
  });
};
