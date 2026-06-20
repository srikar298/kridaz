const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking Venues...");
    const venues = await prisma.venue.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        images: true
      }
    });
    console.log("Venues found:", venues.length);
    console.log(JSON.stringify(venues, null, 2));

    console.log("\nChecking available models to find Ads/Banners...");
    const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
    console.log(models);

    if (prisma.banner) {
        console.log("\nChecking Banners...");
        const banners = await prisma.banner.findMany({ take: 5 });
        console.log(JSON.stringify(banners, null, 2));
    }
    
    if (prisma.ad) {
        console.log("\nChecking Ads...");
        const ads = await prisma.ad.findMany({ take: 5 });
        console.log(JSON.stringify(ads, null, 2));
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
