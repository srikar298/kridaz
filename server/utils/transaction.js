import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Executes a function within a Prisma transaction.
 *
 * @param {Function} callback - The async function to execute. Receives { tx, isTransactional }.
 * @returns {Promise<any>} - The result of the function.
 */
export const runInTransaction = async (callback) => {
  try {
    return await prisma.$transaction(
      async (tx) => {
        logger.info("🔗 Prisma Transaction Started");
        const result = await callback({
          tx,
          session: tx, // for backward compatibility during migration
          isTransactional: true,
        });
        logger.info("✅ Prisma Transaction Committed");
        return result;
      },
      {
        maxWait: 5000,
        timeout: 25000,
      }
    );
  } catch (error) {
    logger.error("❌ Prisma Transaction Failed:", error);
    throw error;
  }
};
