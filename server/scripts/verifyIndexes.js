import pg from "pg";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const { Client } = pg;

/**
 * Verify Index Script
 * Runs EXPLAIN on key queries to confirm indexes are being used.
 * Each query is isolated — a failure in one (e.g., PostGIS not enabled) won't abort the rest.
 */
const verifyIndexes = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    logger.info("🔍 Verifying Index Usage with EXPLAIN...");

    const queries = [
      {
        name: "Booking Filter (turf + status + playStartTime)",
        sql: 'EXPLAIN SELECT * FROM "Booking" WHERE "turfId" = \'some-uuid\' AND "status" = \'CONFIRMED\' AND "playStartTime" >= NOW() ORDER BY "playStartTime" ASC LIMIT 10;',
      },
      {
        name: "Reel Feed (status + isPrivate + id)",
        sql: 'EXPLAIN SELECT * FROM "Reel" WHERE "status" = \'ready\' AND "isPrivate" = false ORDER BY "id" DESC LIMIT 10;',
      },
      {
        name: "Message History (chatId + createdAt)",
        sql: 'EXPLAIN SELECT * FROM "Message" WHERE "chatId" = \'some-uuid\' ORDER BY "createdAt" ASC LIMIT 50;',
      },
      {
        name: "Turf Search (status + isActive + state + city)",
        sql: 'EXPLAIN SELECT * FROM "Turf" WHERE "status" = \'approved\' AND "isActive" = true AND "state" = \'KA\' AND "city" = \'Bengaluru\' LIMIT 10;',
      },
      {
        // NOTE: This test requires PostGIS extension enabled and the geoPoint column to exist.
        // It will be skipped gracefully if PostGIS is not enabled (Decimal fallback mode active).
        name: "Team Proximity Search (ST_DWithin on geoPoint — PostGIS required)",
        sql: 'EXPLAIN SELECT * FROM "Team" WHERE visibility = \'PUBLIC\' AND ST_DWithin("geoPoint", ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography, 10000) LIMIT 10;',
      },
    ];

    let passed = 0;
    let skipped = 0;
    let warnings = 0;

    for (const q of queries) {
      logger.info(`\n📊 Testing: ${q.name}`);
      try {
        const res = await client.query(q.sql);
        const plan = res.rows.map((r) => r["QUERY PLAN"]).join("\n");
        logger.info(plan);

        if (
          plan.includes("Index Scan") ||
          plan.includes("Index Only Scan") ||
          plan.includes("Bitmap Index Scan")
        ) {
          logger.info("✅ Index successfully utilized.");
          passed++;
        } else {
          logger.warn(
            "⚠️ Sequential Scan detected. Database may need more data or VACUUM ANALYZE to update statistics."
          );
          warnings++;
        }
      } catch (err) {
        if (err.code === "42703" || err.code === "42883") {
          // 42703 = column does not exist, 42883 = function does not exist (PostGIS not installed)
          logger.info(
            `⏭️  SKIPPED — PostGIS or required column not available: ${err.message}`
          );
          skipped++;
        } else {
          logger.error(`❌ Unexpected error: ${err.message}`);
          warnings++;
        }
      }
    }

    logger.info(
      `\n📋 Summary: ${passed} passed | ${warnings} warnings | ${skipped} skipped (requires PostGIS)`
    );
  } catch (error) {
    logger.error(`\n💥 Fatal error during verification: ${error.message}`);
  } finally {
    await client.end();
  }
};

verifyIndexes();
