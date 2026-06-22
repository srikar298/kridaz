import { prisma } from './config/prisma.js';
async function main() {
  const users = await prisma.user.findMany({ where: { phone: { contains: '6205170591' } } });
  console.log(JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());
