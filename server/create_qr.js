import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './config/prisma.js';

async function main() {
  const qr = await prisma.dynamicQRCode.create({
    data: {
      name: "Kridaz Official",
      targetUrl: "https://kridaz.com",
      fallbackUrl: "https://kridaz.com",
      isActive: true
    }
  });
  console.log("Created QR Code:", qr);
}

main().catch(console.error).finally(() => prisma.$disconnect());
