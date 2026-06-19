import { prisma } from "./config/prisma.js";
import argon2 from "argon2";
import crypto from "crypto";

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@kridaz.com";
  const adminPhone = process.env.ADMIN_SEED_PHONE || "+910000000000";
  const adminUsername = "kridazadmin";
  const adminPassword =
    process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(12).toString("hex");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { phone: adminPhone },
        { username: adminUsername },
      ],
    },
  });

  if (existingAdmin) {
    console.log("Admin user already exists. ID:", existingAdmin.id);
    return;
  }

  const hashedPassword = await argon2.hash(adminPassword);

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: adminEmail,
      phone: adminPhone,
      username: adminUsername,
      password: hashedPassword,
      role: "ADMIN",
      isVerified: true,
      isOnboarded: true,
      status: "active",
    },
  });

  console.log("====================================");
  console.log("Admin seeded successfully!");
  console.log("ID:", admin.id);
  console.log("Email:", adminEmail);
  console.log("Username:", adminUsername);
  if (process.env.NODE_ENV !== "production") {
    console.log("Password:", adminPassword);
  } else {
    console.log("Password: [set via ADMIN_SEED_PASSWORD env var]");
  }
  console.log("====================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
