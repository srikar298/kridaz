const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const reels = await prisma.reel.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  for (const reel of reels) {
    const interactions = await prisma.reelInteraction.findMany({
      where: { reelId: reel.id, type: "like" }
    });
    console.log(`Reel ${reel.id}: likes=${reel.likes}`);
    console.log(`Interactions (count=${interactions.length}):`);
    for (const int of interactions) {
      console.log(`  - User: ${int.userId}, Type: ${int.type}`);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
