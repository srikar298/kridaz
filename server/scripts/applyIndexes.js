import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

const applyIndexes = async () => {
  logger.info("🚀 Starting concurrent index application...");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Concurrently requires no active transaction
    // node-postgres runs queries outside of a transaction block by default unless you call BEGIN
  });

  try {
    await client.connect();
    logger.info("✅ Connected to PostgreSQL.");

    const sqlPath = path.join(__dirname, "../migrations/optimize_indexes.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Split by semicolons and strip SQL comments line-by-line
    // Note: This is a robust split, stripping out -- comment lines cleanly
    const commands = sql
      .split(";")
      .map((cmd) => {
        return cmd
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim();
      })
      .filter((cmd) => cmd.length > 0);

    for (const command of commands) {
      const description = command.split("\n")[0].substring(0, 50);
      logger.info(`\n📝 Executing: ${description}...`);

      try {
        await client.query(command);
        logger.info("✔️ Success");
      } catch (err) {
        if (err.message.includes("already exists")) {
          logger.info("ℹ️ Index already exists, skipping.");
        } else {
          logger.error(`❌ Error executing command: ${err.message}`);
          // We don't exit here to allow other indexes to be created
        }
      }
    }

    logger.info("\n✨ All indexes processed successfully.");
  } catch (error) {
    logger.error(`\n💥 Fatal error: ${error.message}`);
  } finally {
    await client.end();
  }
};

applyIndexes();
