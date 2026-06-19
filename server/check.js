import { prisma } from "./config/prisma.js";
async function main() {
  try {
    const otps = await prisma.oTP.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.log("Recent OTPs in database:", JSON.stringify(otps, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
