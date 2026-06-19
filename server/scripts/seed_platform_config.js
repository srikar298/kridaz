import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const seedConfigs = async () => {
  try {
    const defaultConfigs = [
      {
        key: "COMMISSION_PERCENTAGE",
        value: "10",
        description:
          "Platform commission percentage deducted from bookings (e.g. 10 for 10%)",
      },
      {
        key: "MIN_PLATFORM_BUDGET",
        value: "500",
        description:
          "Minimum platform budget required for booking a professional (in Rs.)",
      },
      {
        key: "TRAVEL_SPEED_KMH",
        value: "30",
        description:
          "Average travel speed in km/h used for travel feasibility calculations",
      },
      {
        key: "TRAVEL_BUFFER_HOURS",
        value: "1",
        description:
          "Buffer time in hours added to travel duration for travel feasibility checks",
      },
      {
        key: "INITIAL_SEARCH_RADIUS",
        value: "50",
        description: "Initial geographic search radius in kilometers",
      },
      {
        key: "MAX_SEARCH_RADIUS",
        value: "100",
        description: "Maximum expanded geographic search radius in kilometers",
      },
      {
        key: "MIN_RADIUS_PROFESSIONAL_COUNT",
        value: "3",
        description:
          "Minimum number of matching professionals required before expanding search radius",
      },
      {
        key: "NOTIFICATION_WINDOW_SECONDS",
        value: "30",
        description:
          "Time window in seconds for a professional to accept or reject an offer",
      },
      {
        key: "SKIPPED_CARD_EXPIRY_MINUTES",
        value: "10",
        description:
          "Time in minutes before ignored offers auto-expire from skipped requests screen after Cycle 2 ends",
      },
      {
        key: "ONBOARDING_TRUST_SCORE",
        value: "100",
        description:
          "Initial trust score points awarded to newly registered professionals",
      },
      {
        key: "MAX_TRUST_SCORE",
        value: "300",
        description: "Maximum limit for raw trust score points",
      },
      {
        key: "DECAY_INACTIVE_DAYS",
        value: "7",
        description:
          "Number of consecutive days of inactivity (no sessions) that triggers trust score decay",
      },
      {
        key: "DISPUTE_AUTO_RELEASE_HOURS",
        value: "48",
        description:
          "Time in hours before an unresolved dispute is automatically resolved in favor of the professional",
      },
      {
        key: "PAYOUT_LOCK_HOURS",
        value: "12",
        description:
          "Lock window in hours after match completion before funds are automatically released to the professional",
      },
      {
        key: "NO_SHOW_LOCK_HOURS",
        value: "12",
        description:
          "Time window in hours for a user to raise a dispute for a professional's no-show",
      },
    ];

    logger.info("Seeding platform configurations...");

    for (const cfg of defaultConfigs) {
      await prisma.platformConfig.upsert({
        where: { key: cfg.key },
        update: {
          value: cfg.value,
          description: cfg.description,
        },
        create: cfg,
      });
      logger.info(`Seeded config: ${cfg.key}`);
    }

    logger.info("✅ Platform configurations seeded successfully.");
    process.exit(0);
  } catch (err) {
    logger.error("❌ Seeding platform configurations failed:", err);
    process.exit(1);
  }
};

seedConfigs();
