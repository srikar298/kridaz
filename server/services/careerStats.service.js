import { prisma } from '../config/prisma.js';
import logger from '../utils/logger.js';

class CareerStatsService {
  /**
   * Aggregates and updates dynamic career-level statistics for all players in a completed match.
   * @param {Object} scoring - The CricketMatch Prisma object containing innings and playerStats.
   * @param {Object} hostedGame - The corresponding HostedGame Prisma object.
   */
  async aggregateMatchCareerStats(scoring, hostedGame) {
    try {
      logger.info(`[CareerStats] Starting career stats aggregation for match: ${scoring.id}`);

      // 1. Fetch deep hosted game details including team slots
      const fullGame = await prisma.hostedGame.findUnique({
        where: { id: hostedGame.id },
        include: {
          teams: {
            include: {
              slots: true
            }
          }
        }
      });

      if (!fullGame) {
        logger.error(`[CareerStats] Hosted game not found: ${hostedGame.id}`);
        return [];
      }

      // 2. Determine match winner ("teamA", "teamB", "TIE", or null)
      const inningsA = scoring.innings.find(i => i.battingTeam === 'teamA');
      const inningsB = scoring.innings.find(i => i.battingTeam === 'teamB');

      const runsA = inningsA ? inningsA.totalRuns : 0;
      const runsB = inningsB ? inningsB.totalRuns : 0;

      let winningTeamKey = null;
      if (runsA > runsB) {
        winningTeamKey = 'teamA';
      } else if (runsB > runsA) {
        winningTeamKey = 'teamB';
      } else if (runsA === runsB && inningsA && inningsB) {
        winningTeamKey = 'TIE';
      }

      // Map player ID to their teamKey
      const playerTeamMap = new Map();
      fullGame.teams.forEach(team => {
        team.slots.forEach(slot => {
          if (slot.userId) {
            playerTeamMap.set(slot.userId, team.teamKey); // "teamA" or "teamB"
          }
        });
      });

      const earnedBadgesReport = [];

      // 3. Process each player's statistics in this match
      for (const stat of scoring.playerStats) {
        const userId = stat.userId;
        const playerTeam = playerTeamMap.get(userId);

        let won = false;
        let lost = false;

        if (winningTeamKey && winningTeamKey !== 'TIE' && playerTeam) {
          if (playerTeam === winningTeamKey) {
            won = true;
          } else {
            lost = true;
          }
        }

        // Fetch current career stats (or initialize if not exist)
        const career = await prisma.playerCareerStats.upsert({
          where: {
            userId_sportType: {
              userId,
              sportType: 'CRICKET'
            }
          },
          update: {},
          create: {
            userId,
            sportType: 'CRICKET'
          }
        });

        // 4. Batting Aggregations
        const runs = stat.battingRuns || 0;
        const balls = stat.battingBalls || 0;
        const fours = stat.battingFours || 0;
        const sixes = stat.battingSixes || 0;
        
        let centuries = 0;
        let halfCenturies = 0;
        if (runs >= 100) centuries = 1;
        else if (runs >= 50) halfCenturies = 1;

        const updatedRuns = career.totalRuns + runs;
        const updatedBallsFaced = career.ballsFaced + balls;
        const updatedMatches = career.matchesPlayed + 1;
        const updatedMatchesWon = career.matchesWon + (won ? 1 : 0);
        const updatedMatchesLost = career.matchesLost + (lost ? 1 : 0);

        const battingAverage = updatedMatches > 0 ? Number((updatedRuns / updatedMatches).toFixed(2)) : 0.0;
        const battingStrikeRate = updatedBallsFaced > 0 ? Number(((updatedRuns / updatedBallsFaced) * 100).toFixed(2)) : 0.0;

        // 5. Bowling Aggregations
        const wickets = stat.bowlingWickets || 0;
        const runsConceded = stat.bowlingRuns || 0;
        const ballsBowled = stat.bowlingBalls || 0;
        const fiveWicketHauls = wickets >= 5 ? 1 : 0;

        let bestWickets = career.bestBowlingWickets;
        let bestRuns = career.bestBowlingRuns;
        if (wickets > bestWickets || (wickets === bestWickets && runsConceded < bestRuns)) {
          bestWickets = wickets;
          bestRuns = runsConceded;
        }

        const updatedBallsBowled = career.ballsBowled + ballsBowled;
        const updatedRunsConceded = career.runsConceded + runsConceded;
        const updatedWickets = career.wickets + wickets;

        const bowlingEconomy = updatedBallsBowled > 0 ? Number(((updatedRunsConceded / updatedBallsBowled) * 6).toFixed(2)) : 0.0;
        const bowlingAverage = updatedWickets > 0 ? Number((updatedRunsConceded / updatedWickets).toFixed(2)) : 0.0;

        // Update Career Stats
        await prisma.playerCareerStats.update({
          where: { id: career.id },
          data: {
            matchesPlayed: updatedMatches,
            matchesWon: updatedMatchesWon,
            matchesLost: updatedMatchesLost,
            winPercentage: updatedMatches > 0 ? Number(((updatedMatchesWon / updatedMatches) * 100).toFixed(2)) : 0.0,
            
            totalRuns: updatedRuns,
            ballsFaced: updatedBallsFaced,
            fours: career.fours + fours,
            sixes: career.sixes + sixes,
            centuries: career.centuries + centuries,
            halfCenturies: career.halfCenturies + halfCenturies,
            highestScore: Math.max(career.highestScore, runs),
            battingAverage,
            battingStrikeRate,

            ballsBowled: updatedBallsBowled,
            runsConceded: updatedRunsConceded,
            wickets: updatedWickets,
            fiveWicketHauls: career.fiveWicketHauls + fiveWicketHauls,
            bestBowlingWickets: bestWickets,
            bestBowlingRuns: bestRuns,
            bowlingEconomy,
            bowlingAverage
          }
        });

        // 6. Badge Gamification Engine
        const playerBadges = await this.checkAndAwardBadges(userId, stat, updatedMatches, updatedMatchesWon);
        if (playerBadges.length > 0) {
          earnedBadgesReport.push({
            userId,
            badges: playerBadges
          });
        }
      }

      logger.info(`[CareerStats] Completed career stats aggregation for match: ${scoring.id}`);
      return earnedBadgesReport;
    } catch (error) {
      logger.error('[CareerStats] Error in aggregateMatchCareerStats:', error);
      return [];
    }
  }

  /**
   * Evaluates achievements and awards dynamic badges to the player.
   */
  async checkAndAwardBadges(userId, matchStat, totalMatches, totalWins) {
    try {
      const existingBadges = await prisma.userBadge.findMany({
        where: { userId, sportType: 'CRICKET' },
        select: { name: true }
      });
      const badgeNames = new Set(existingBadges.map(b => b.name));
      const newBadgesToInsert = [];

      const runs = matchStat.battingRuns || 0;
      const wickets = matchStat.bowlingWickets || 0;
      const sixes = matchStat.battingSixes || 0;
      const balls = matchStat.battingBalls || 0;

      // 1. Centurion Badge
      if (runs >= 100 && !badgeNames.has('Centurion')) {
        newBadgesToInsert.push({
          userId,
          name: 'Centurion',
          description: 'Scored a magnificent century (100+ runs) in a single match.',
          sportType: 'CRICKET',
          category: 'BATTING',
          badgeIcon: 'GoldShield'
        });
      }

      // 2. Fifer Master Badge
      if (wickets >= 5 && !badgeNames.has('Fifer Master')) {
        newBadgesToInsert.push({
          userId,
          name: 'Fifer Master',
          description: 'Claimed a stellar five-wicket haul (5+ wickets) in an innings.',
          sportType: 'CRICKET',
          category: 'BOWLING',
          badgeIcon: 'RedFire'
        });
      }

      // 3. Sixer King Badge
      if (sixes >= 5 && !badgeNames.has('Sixer King')) {
        newBadgesToInsert.push({
          userId,
          name: 'Sixer King',
          description: 'Launched 5 or more massive sixes in a single innings.',
          sportType: 'CRICKET',
          category: 'BATTING',
          badgeIcon: 'PurpleCrown'
        });
      }

      // 4. Anchor Badge
      const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;
      if (runs >= 50 && strikeRate < 100 && !badgeNames.has('Anchor')) {
        newBadgesToInsert.push({
          userId,
          name: 'Anchor',
          description: 'Showed immense patience, anchoring the innings with a solid 50+ runs at a steady pace.',
          sportType: 'CRICKET',
          category: 'BATTING',
          badgeIcon: 'SilverAnchor'
        });
      }

      // 5. Veteran Badge
      if (totalMatches >= 100 && !badgeNames.has('Veteran')) {
        newBadgesToInsert.push({
          userId,
          name: 'Veteran',
          description: 'Achieved a remarkable milestone of 100 career matches played.',
          sportType: 'CRICKET',
          category: 'MILESTONE',
          badgeIcon: 'PlatinumBadge'
        });
      }

      // 6. Invincible Badge
      if (totalWins >= 10 && !badgeNames.has('Invincible')) {
        newBadgesToInsert.push({
          userId,
          name: 'Invincible',
          description: 'Proved to be unbeatable by claiming 10 dynamic victories.',
          sportType: 'CRICKET',
          category: 'MILESTONE',
          badgeIcon: 'NeonLightning'
        });
      }

      if (newBadgesToInsert.length > 0) {
        await prisma.userBadge.createMany({
          data: newBadgesToInsert
        });
        return newBadgesToInsert.map(b => b.name);
      }

      return [];
    } catch (error) {
      logger.error(`[CareerStats] Error checking/awarding badges for user ${userId}:`, error);
      return [];
    }
  }
}

export default new CareerStatsService();
