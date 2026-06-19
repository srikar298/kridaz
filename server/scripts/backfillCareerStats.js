import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import CareerStatsService from "../services/careerStats.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function backfill() {
  console.log("Starting Career Stats Backfill...");
  try {
    const completedMatches = await prisma.cricketMatch.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        innings: true,
        playerStats: true,
      },
    });

    console.log(
      `Found ${completedMatches.length} completed matches to process.`
    );

    for (const match of completedMatches) {
      console.log(
        `Processing match ID: ${match.id} (Game ID: ${match.gameId})`
      );

      const hostedGame = await prisma.hostedGame.findUnique({
        where: { id: match.gameId },
      });

      if (hostedGame) {
        await CareerStatsService.aggregateMatchCareerStats(match, hostedGame);
      } else {
        console.warn(`HostedGame not found for match ${match.id}`);
      }
    }

    console.log("Backfill completed successfully.");

    // Test: Verify stats are created
    const statsCount = await prisma.playerCareerStats.count();
    console.log(`Total PlayerCareerStats records in DB now: ${statsCount}`);

    const someStats = await prisma.playerCareerStats.findFirst({
      orderBy: { totalRuns: "desc" },
    });
    console.log("Sample top career stats:", someStats);
  } catch (error) {
    console.error("Error during backfill:", error);
  } finally {
    await prisma.$disconnect();
  }
}

backfill();
