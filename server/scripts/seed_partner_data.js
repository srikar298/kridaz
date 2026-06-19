import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import * as argon2 from "argon2";
import logger from "../utils/logger.js";

dotenv.config();

const prisma = new PrismaClient();

const COACH_EMAIL = "11saafgdfviksolutions@gmail.com";
const UMPIRE_EMAIL = "saafgdfviksolutions@gmail.com";
const PASSWORD = "364133";

const seedPartnerData = async () => {
  try {
    logger.info("Connecting to database...");
    await prisma.$connect();

    const hashedPassword = await argon2.hash(PASSWORD);

    // 1. Create/Update Coach
    let coachUser = await prisma.user.findUnique({
      where: { email: COACH_EMAIL },
    });
    if (!coachUser) {
      coachUser = await prisma.user.create({
        data: {
          name: "Expert Coach",
          email: COACH_EMAIL,
          username: "expert_coach",
          password: hashedPassword,
          role: "COACH",
        },
      });
    }

    let coachProfile = await prisma.ownerProfile.findUnique({
      where: { userId: coachUser.id },
    });
    if (!coachProfile) {
      coachProfile = await prisma.ownerProfile.create({
        data: {
          userId: coachUser.id,
          businessName: "Coach Academy",
          role: "coach",
          verified: true,
        },
      });
      logger.info("Coach account created.");
    }

    // 2. Create/Update Umpire
    let umpireUser = await prisma.user.findUnique({
      where: { email: UMPIRE_EMAIL },
    });
    if (!umpireUser) {
      umpireUser = await prisma.user.create({
        data: {
          name: "Pro Umpire",
          email: UMPIRE_EMAIL,
          username: "pro_umpire",
          password: hashedPassword,
          role: "UMPIRE",
        },
      });
    }

    let umpireProfile = await prisma.ownerProfile.findUnique({
      where: { userId: umpireUser.id },
    });
    if (!umpireProfile) {
      umpireProfile = await prisma.ownerProfile.create({
        data: {
          userId: umpireUser.id,
          businessName: "Elite Umpiring",
          role: "umpire",
          verified: true,
        },
      });
      logger.info("Umpire account created.");
    }

    // 3. Create some Test Users (Students/Players)
    let players = await prisma.user.findMany({
      take: 5,
      where: { role: "USER" },
    });
    if (players.length === 0) {
      const player = await prisma.user.create({
        data: {
          name: "Test Player",
          email: "player@test.com",
          username: "test_player",
          password: hashedPassword,
          role: "USER",
        },
      });
      players = [player];
      logger.info("Test player created.");
    }

    const playerIds = players.map((p) => p.id);

    // 4. Seed Matches (HostedGame) for Umpire
    await prisma.hostedGame.deleteMany({
      where: { umpireId: umpireUser.id },
    });

    const matchData = [
      {
        hostId: coachUser.id, // Just picking someone as host
        gameType: "Cricket",
        date: new Date(Date.now() + 86400000),
        time: "10:00 AM",
        umpireId: umpireUser.id,
        status: "ACTIVE",
        city: "Mumbai",
        state: "Maharashtra",
      },
      {
        hostId: coachUser.id,
        gameType: "Cricket",
        date: new Date(Date.now() + 172800000),
        time: "04:00 PM",
        umpireId: umpireUser.id,
        status: "ACTIVE",
        city: "Pune",
        state: "Maharashtra",
      },
    ];

    for (const m of matchData) {
      await prisma.hostedGame.create({ data: m });
    }
    logger.info("Matches seeded for Umpire.");

    // 5. Seed Sessions for Coach
    await prisma.professionalSession.deleteMany({
      where: { ownerId: coachProfile.id },
    });

    const sessionData = [
      {
        ownerId: coachProfile.id,
        title: "Advanced Batting Drills",
        type: "GROUP",
        date: new Date(Date.now() + 43200000),
        startTime: "06:00 PM",
        status: "UPCOMING",
        students: {
          connect: playerIds.map((id) => ({ id })),
        },
      },
      {
        ownerId: coachProfile.id,
        title: "Private Bowling Masterclass",
        type: "PRIVATE",
        date: new Date(Date.now() + 259200000),
        startTime: "08:00 AM",
        status: "UPCOMING",
        students: {
          connect: [{ id: playerIds[0] }],
        },
      },
    ];

    for (const s of sessionData) {
      await prisma.professionalSession.create({ data: s });
    }
    logger.info("Sessions seeded for Coach.");

    logger.info("Partner seeding successful!");
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    logger.error("Seeding error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seedPartnerData();
