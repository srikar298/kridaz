import { prisma } from './config/prisma.js';
import fs from 'fs';

async function main() {
  const data = JSON.parse(fs.readFileSync('test_data_dump.json', 'utf8'));
  const turfIds = data.turfs.map(t => t.id);
  const userIds = data.users.map(u => u.id);

  console.log(`Starting deletion for ${turfIds.length} turfs and ${userIds.length} users...`);

  // Delete associated records for the turfs first
  if (turfIds.length > 0) {
    console.log("Deleting associated records for turfs...");
    try { await prisma.timeSlot.deleteMany({ where: { turfId: { in: turfIds } } }); } catch (e) {}
    try { await prisma.turfInteraction.deleteMany({ where: { turfId: { in: turfIds } } }); } catch (e) {}
    try { await prisma.review.deleteMany({ where: { turfId: { in: turfIds } } }); } catch (e) {}
    try { await prisma.booking.deleteMany({ where: { turfId: { in: turfIds } } }); } catch (e) {}
    try { await prisma.coupon.deleteMany({ where: { turfId: { in: turfIds } } }); } catch (e) {}
    try { await prisma.hostedGame.deleteMany({ where: { turfId: { in: turfIds } } }); } catch (e) {}
    try { await prisma.venueInvite.deleteMany({ where: { turfId: { in: turfIds } } }); } catch (e) {}
    try { await prisma.tournamentVenue.deleteMany({ where: { turfId: { in: turfIds } } }); } catch (e) {}
  }

  // Delete Turfs before Users, since Turfs depend on User(ownerId)
  if (turfIds.length > 0) {
    console.log("Deleting turfs...");
    try {
      const deletedTurfs = await prisma.turf.deleteMany({
        where: { id: { in: turfIds } }
      });
      console.log(`Successfully deleted ${deletedTurfs.count} Turfs.`);
    } catch (e) {
      console.error("Error deleting turfs:", e.message);
    }
  }

  // Delete associated records for the users
  if (userIds.length > 0) {
    console.log("Deleting associated records for users...");
    // Wallet transactions must go before wallets
    try { await prisma.walletTransaction.deleteMany({ where: { userId: { in: userIds } } }); } catch (e) {}
    try { await prisma.walletTransaction.deleteMany({ where: { wallet: { userId: { in: userIds } } } }); } catch (e) {}
    try { await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } }); } catch (e) {}
    try { await prisma.ownerProfile.deleteMany({ where: { userId: { in: userIds } } }); } catch (e) {}
    
    // Others
    try { await prisma.oTP.deleteMany({ where: { userId: { in: userIds } } }); } catch (e) {}
    try { await prisma.turfInteraction.deleteMany({ where: { userId: { in: userIds } } }); } catch (e) {}
    try { await prisma.review.deleteMany({ where: { userId: { in: userIds } } }); } catch (e) {}
    try { await prisma.booking.deleteMany({ where: { userId: { in: userIds } } }); } catch (e) {}
    try { await prisma.coupon.deleteMany({ where: { userId: { in: userIds } } }); } catch (e) {}
    try { await prisma.matchRequest.deleteMany({ where: { userId: { in: userIds } } }); } catch (e) {}
    try { await prisma.matchRequest.deleteMany({ where: { receiverId: { in: userIds } } }); } catch (e) {}
    try { await prisma.hostedGame.deleteMany({ where: { hostId: { in: userIds } } }); } catch (e) {}
  }

  try {
    if (userIds.length > 0) {
      console.log("Deleting users...");
      const deletedUsers = await prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });
      console.log(`Successfully deleted ${deletedUsers.count} Users.`);
    }
    console.log("Deletion process completed successfully.");
  } catch (error) {
    console.error("Error during user deletion:", error.message.split('\\n').pop());
    
    // One by one fallback
    let userSuccessCount = 0;
    for (const uid of userIds) {
      try {
        await prisma.user.delete({ where: { id: uid } });
        userSuccessCount++;
      } catch (e) {
        console.log(`Failed to delete user ${uid}: ${e.message.split('\\n').pop()}`);
      }
    }
    console.log(`One-by-one deletion: Deleted ${userSuccessCount} users this time.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
