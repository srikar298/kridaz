import { prisma } from "../config/prisma.js";

async function run() {
  const users = await prisma.user.findMany({
    include: { wallet: true },
  });

  const usersWithoutWallet = users.filter((u) => !u.wallet);
  console.log(`Found ${usersWithoutWallet.length} users without wallets.`);

  for (let u of usersWithoutWallet) {
    await prisma.wallet.create({
      data: {
        userId: u.id,
        balance: 50,
        reservedBalance: 0,
      },
    });
    console.log(`Created wallet for user: ${u.username || u.email}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
