import { redisClient } from "./config/redis.js";

async function clearRateLimits() {
  try {
    const keys = await redisClient.keys("rl:*");
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`Cleared ${keys.length} rate limit keys.`);
    } else {
      console.log("No rate limit keys found.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error clearing rate limits:", error);
    process.exit(1);
  }
}

clearRateLimits();
