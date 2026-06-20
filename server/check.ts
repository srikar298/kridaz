import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log("Fetching Turfs/Venues...");
  const turfs = await prisma.turf.findMany({ take: 3, select: { id: true, name: true, image: true, images: true }});
  console.log("Turfs:", JSON.stringify(turfs, null, 2));
  
  console.log("Fetching AdBanners...");
  const banners = await prisma.adBanner.findMany({ take: 3 });
  console.log("Banners:", JSON.stringify(banners, null, 2));
}
main().finally(() => prisma.$disconnect());
