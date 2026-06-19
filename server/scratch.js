import { prisma } from "./config/prisma.js";

async function main() {
  const turfs = await prisma.turf.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      isActive: true,
      city: true,
      latitude: true,
      longitude: true,
      generatedSlots: true,
    },
  });
  console.log(JSON.stringify(turfs, null, 2));
}

main().finally(() => prisma.$disconnect());
