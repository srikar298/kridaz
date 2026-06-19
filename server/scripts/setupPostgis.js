import pg from "pg";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const { Client } = pg;

const setupPostgis = async () => {
  logger.info("🚀 Connecting to database to setup PostGIS...");
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    logger.info("✅ Connected to database.");

    // 1. Enable PostGIS extension
    logger.info("📦 Enabling PostGIS extension...");
    await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    logger.info("✔️ PostGIS extension is enabled.");

    // 2. Check if geoPoint exists on Team table and add it
    logger.info('📐 Verifying "geoPoint" column on "Team" table...');
    await client.query(`
      ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "geoPoint" geography(Point, 4326);
    `);
    logger.info('✔️ "geoPoint" column added/verified on "Team".');

    // 3. Check if geoPoint exists on User table and add it
    logger.info('📐 Verifying "geoPoint" column on "User" table...');
    await client.query(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "geoPoint" geography(Point, 4326);
    `);
    logger.info('✔️ "geoPoint" column added/verified on "User".');

    // 4. Backfill geoPoint values from latitude/longitude columns if available
    logger.info('🔄 Backfilling "geoPoint" from latitude/longitude fields...');
    const teamBackfill = await client.query(`
      UPDATE "Team" 
      SET "geoPoint" = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography 
      WHERE longitude IS NOT NULL AND latitude IS NOT NULL AND "geoPoint" IS NULL;
    `);
    logger.info(`✔️ Backfilled ${teamBackfill.rowCount} teams.`);

    const userBackfill = await client.query(`
      UPDATE "User" 
      SET "geoPoint" = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::geography 
      WHERE longitude IS NOT NULL AND latitude IS NOT NULL AND "geoPoint" IS NULL;
    `);
    logger.info(`✔️ Backfilled ${userBackfill.rowCount} users.`);

    logger.info(
      "✨ PostGIS Setup and geoPoint backfilling completed successfully!"
    );
  } catch (error) {
    logger.error(`❌ PostGIS Setup failed: ${error.message}`);
  } finally {
    await client.end();
  }
};

setupPostgis();
