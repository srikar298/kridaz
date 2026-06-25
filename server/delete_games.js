import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to Prisma...');
  
  try {
    // Delete related entities first to avoid foreign key constraints
    console.log('Deleting GameDisputes...');
    await prisma.gameDispute.deleteMany();
    
    console.log('Deleting GameTeams...');
    await prisma.gameTeam.deleteMany();
    
    console.log('Deleting GameSlots...');
    await prisma.gameSlot.deleteMany();
    
    console.log('Deleting HostedGames...');
    await prisma.hostedGame.deleteMany();
    
    console.log('Successfully deleted all Magic Game (Join Game) posts!');
  } catch (error) {
    console.error('Error deleting games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
