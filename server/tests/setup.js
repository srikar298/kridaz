import {
  redisClient,
  bullmqConnection,
  pubClient,
  subClient,
} from "../config/redis.js";
import { prisma } from "../config/prisma.js";

// Global teardown to clean up connection pools and prevent Jest open handle warnings/crashes
afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch (err) {
    // Ignore
  }

  try {
    await Promise.all([
      redisClient.quit().catch(() => {}),
      bullmqConnection.quit().catch(() => {}),
      pubClient.quit().catch(() => {}),
      subClient.quit().catch(() => {}),
    ]);
  } catch (err) {
    // Ignore
  }
});
