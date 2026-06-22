import { prisma } from './config/prisma.js';
async function main() {
  // Remove phone from old account
  await prisma.user.update({
    where: { id: '2dd7e1e2-b89b-4ff7-bcd2-01dd713c728e' },
    data: { phone: null } // Freeing up the number
  });
  
  // Also clean up the 'undefined' phone number from current account
  await prisma.user.update({
    where: { id: 'f67b192e-5e15-499e-815a-1393baa62500' },
    data: { phone: null } 
  });
  console.log("Database updated successfully");
}
main().finally(() => prisma.$disconnect());
