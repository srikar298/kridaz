// Backfill Turf.pricePerHour from generatedSlots for rows where it is 0.
//
// Usage:
//   node server/scripts/backfillPricePerHour.js --dry-run
//   node server/scripts/backfillPricePerHour.js
//
// Safe to re-run; only touches rows where pricePerHour is 0 and the slots
// yield a computable lowest hourly rate. The column is non-nullable
// (Decimal NOT NULL DEFAULT 0) so we don't filter on null.

import { prisma } from "../config/prisma.js";
import { invalidateCache } from "../utils/cache.js";
import { computeLowestHourlyRate } from "../utils/turfPricing.js";

const BATCH = 50;
const dryRun = process.argv.includes("--dry-run");

async function run() {
  const turfs = await prisma.turf.findMany({
    where: { pricePerHour: 0 },
    select: { id: true, name: true, generatedSlots: true },
  });

  console.log(
    `[backfill] candidates: ${turfs.length}${dryRun ? " (dry-run)" : ""}`
  );

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < turfs.length; i += BATCH) {
    const batch = turfs.slice(i, i + BATCH);
    const writes = [];

    for (const t of batch) {
      const lowest = computeLowestHourlyRate(t.generatedSlots || []);
      if (lowest == null) {
        skipped++;
        continue;
      }
      console.log(`[backfill] ${t.id} (${t.name}): -> ${lowest}/hr`);
      if (!dryRun) {
        writes.push(
          prisma.turf.update({
            where: { id: t.id },
            data: { pricePerHour: lowest },
          })
        );
      }
      updated++;
    }

    if (writes.length) {
      await prisma.$transaction(writes);
    }
  }

  if (!dryRun && updated > 0) {
    await invalidateCache("turfs:list:*");
  }

  console.log(
    `[backfill] done. updated=${updated} skipped=${skipped} dryRun=${dryRun}`
  );
}

run()
  .catch((err) => {
    console.error("[backfill] error", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
