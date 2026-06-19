const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const turfs = await prisma.turf.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      status: true,
      isActive: true,
    },
  });
  console.log(JSON.stringify(turfs, null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
