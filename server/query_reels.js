import { prisma } from "./config/prisma.js";

async function main() {
  const reels = await prisma.reel.findMany({
    select: { id: true, caption: true, likes: true },
  });
  console.log(reels);
  await prisma.$disconnect();
}

main().catch(console.error);
