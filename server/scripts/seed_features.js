import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const seed = async () => {
  try {
    const defaultFlags = [
      {
        key: "find_professionals",
        name: "Find Professionals Section",
        description:
          "Show the Find Professionals card section on the landing page.",
        enabled: true,
      },
      {
        key: "join_games",
        name: "Join Games Near You Section",
        description:
          "Show the Join Games Near You card section on the landing page.",
        enabled: true,
      },
    ];

    await prisma.$transaction(
      defaultFlags.map((df) =>
        prisma.featureFlag.upsert({
          where: { key: df.key },
          update: df,
          create: df,
        })
      )
    );

    logger.info("Feature flags seeded successfully.");
    process.exit(0);
  } catch (err) {
    logger.error("Error:", err);
    process.exit(1);
  }
};

seed();
