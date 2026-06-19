import { prisma } from "../config/prisma.js";
import argon2 from "argon2";

async function main() {
  const email = "team_tester@kridaz.test";
  const password = "Password@123";
  const hashedPassword = await argon2.hash(password);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        name: "Team Tester",
        username: "team_tester",
        role: "USER",
      },
    });
    console.log("Updated team_tester user successfully!");
  } else {
    await prisma.user.create({
      data: {
        name: "Team Tester",
        email,
        username: "team_tester",
        password: hashedPassword,
        role: "USER",
        phone: "1111111111",
      },
    });
    console.log("Created team_tester user successfully!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
