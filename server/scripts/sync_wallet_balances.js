import { prisma } from "../config/prisma.js";

async function run() {
  const users = await prisma.user.findMany({
    include: { wallet: true },
  });

  console.log("=== Syncing Wallet Balances ===");
  for (let u of users) {
    if (u.wallet) {
      const userBalance = Number(u.walletBalance);
      const walletBalance = Number(u.wallet.balance);

      if (walletBalance < userBalance) {
        console.log(
          `User ${u.username || u.email}: Wallet balance (${walletBalance}) is less than User.walletBalance (${userBalance}). Updating wallet balance to match...`
        );
        await prisma.wallet.update({
          where: { id: u.wallet.id },
          data: { balance: userBalance },
        });
      } else {
        console.log(
          `User ${u.username || u.email}: Wallet balance (${walletBalance}) is already synced/correct.`
        );
      }
    } else {
      console.log(
        `User ${u.username || u.email}: No wallet row found. Creating one with balance ${u.walletBalance}...`
      );
      await prisma.wallet.create({
        data: {
          userId: u.id,
          balance: u.walletBalance,
          reservedBalance: 0,
        },
      });
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
