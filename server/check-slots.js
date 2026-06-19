import { prisma } from "./config/prisma.js";

async function main() {
  const turf = await prisma.turf.findFirst({
    where: { name: { contains: "SAAVIK", mode: "insensitive" } },
  });
  console.log("Turf:", turf ? turf.name : "Not Found");
  console.log("Turf generatedSlots:", turf?.generatedSlots);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
