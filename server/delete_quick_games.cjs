const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.hostedGame.deleteMany({
    where: {
      gameMode: {
        in: ['QUICK', 'LOOKING_FOR']
      }
    }
  });
  console.log('Deleted join games / looking for games:', result.count);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
