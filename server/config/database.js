import { prisma } from "./prisma.js";
import logger from "../utils/logger.js";

export default async function connectDB() {
  logger.info("[DATABASE] Verifying PostgreSQL connection...");
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("[DATABASE] Success! Connected to PostgreSQL.");
    return true;
  } catch (err) {
    logger.error("[DATABASE] PostgreSQL Connection Failed!", err);
    throw err;
  }
}
