import { prisma } from './config/prisma.js';

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
    process.exit(0);
  });
