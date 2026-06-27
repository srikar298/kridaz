import { Worker } from "bullmq";
import { bullmqConnection } from "../../config/redis.js";
import logger from "../../utils/logger.js";
import { prisma } from "../../config/prisma.js";
import { notificationQueue } from "../notification.queue.js";
import { getIo } from "../../config/socket.js"; // Standard socket.io setup

const queueName = "gameApplicationQueue";

export const gameApplicationWorker = new Worker(
  queueName,
  async (job) => {
    const { gameId, teamId, captainId } = job.data;
    logger.info(`Processing game application for Game ${gameId} / Team ${teamId}`);

    try {
      // 1. Fetch related entities
      const game = await prisma.hostedGame.findUnique({
        where: { id: gameId },
        include: { host: true }
      });

      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      const captain = await prisma.user.findUnique({
        where: { id: captainId }
      });

      if (!game || !team || !captain) {
        throw new Error("Missing entities for application processing");
      }

      // 2. Dispatch Push Notification / In-App Notification to Host
      await notificationQueue.add("sendNotification", {
        userId: game.hostId,
        type: "GAME_APPLICATION_RECEIVED",
        title: "New Team Application!",
        message: `${team.name} (led by ${captain.name}) has applied to play against you in your ${game.gameType} match.`,
        data: {
          url: `/pro-match/${game.id}`,
          gameId: game.id,
          teamId: team.id
        }
      });

      // 3. Optional: Send Email to Host
      // await mailService.sendTeamApplicationEmail(game.host.email, { ... });

      // 4. Broadcast via WebSockets to update the host's UI in real-time
      const io = getIo();
      if (io) {
        io.to(`user_${game.hostId}`).emit("game_application_update", {
          gameId: game.id,
          message: "A new team has applied to your game!"
        });
      }

      logger.info(`Successfully processed game application for Game ${gameId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error processing game application ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: bullmqConnection,
    concurrency: 5, // Process up to 5 concurrent applications
  }
);

gameApplicationWorker.on("completed", (job) => {
  logger.info(`Job ${job.id} has completed!`);
});

gameApplicationWorker.on("failed", (job, err) => {
  logger.error(`Job ${job.id} has failed with ${err.message}`);
});
