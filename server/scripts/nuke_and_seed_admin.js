import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import argon2 from "argon2";
import dotenv from "dotenv";

dotenv.config();

const nukeAndSeed = async () => {
  try {
    console.log("Connecting to database...");
    await prisma.$connect();

    console.log("Nuking database (deleting all records)...");
    const tablenames =
      await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    for (const { tablename } of tablenames) {
      if (tablename !== "_prisma_migrations") {
        try {
          await prisma.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
          );
        } catch (e) {
          console.warn(`Could not truncate table ${tablename}: ${e.message}`);
        }
      }
    }

    console.log("Database cleared successfully.");

    const email = "admin@kridaz.com";
    const password =
      process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(8).toString("hex"); // Fallback to random if env not set // Changed to 3641333 as requested

    console.log(`Hashing password for ${email}...`);
    const hashedPassword = await argon2.hash(password);

    console.log("Creating new admin identity...");

    const newUser = await prisma.user.create({
      data: {
        name: "Super Admin",
        username: "super_admin",
        email: email,
        password: hashedPassword,
        phone: "0000000000",
        role: "ADMIN",
      },
    });

    await prisma.ownerProfile.create({
      data: {
        userId: newUser.id,
        businessName: "Kridaz Admin",
        verified: true,
      },
    });

    console.log("SUCCESS: Database nuked and Admin seeded!");
    console.log(`Email: ${email}`);
    // console.log(`Password: ${password}`); // Removed for security

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error during nuke and seed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

nukeAndSeed();
