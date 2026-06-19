// Local-only recovery seed.
//
// For any turf where generatedSlots IS NULL, populate a basic hour-by-hour
// schedule from openTime → closeTime at pricePerHour per slot, all active.
//
// Safe to re-run — only touches NULL rows. Does NOT overwrite existing slot
// configurations. Idempotent.
//
// Usage:
//   node server/scripts/seedNullSlots.js --dry-run
//   node server/scripts/seedNullSlots.js
import { prisma } from "../config/prisma.js";
import { invalidateCache } from "../utils/cache.js";

const dryRun = process.argv.includes("--dry-run");

const parseHHMM = (s) => {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*$/i.exec(s || "");
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = (m[3] || "").toUpperCase();
  if (ampm === "AM" && h === 12) h = 0;
  if (ampm === "PM" && h !== 12) h += 12;
  return h + min / 60;
};

const fmtHHMM = (h) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const generateHourlySlots = (open, close, price) => {
  // openTime/closeTime live as "06:00" / "23:00" style. Walk hourly buckets.
  let o = parseHHMM(open) ?? 6;
  let c = parseHHMM(close) ?? 23;
  if (c <= o) c = o + 1;
  const slots = [];
  for (let h = o; h + 1 <= c; h++) {
    slots.push({
      startTime: fmtHHMM(h),
      endTime: fmtHHMM(h + 1),
      price: Number(price) || 0,
      isActive: true,
    });
  }
  return slots;
};

async function run() {
  // Prisma's JsonNullValueFilter doesn't reliably match SQL NULL on every
  // driver/version pair — filter client-side so we always catch nulls AND
  // empty arrays (both render the same UX-blank).
  const all = await prisma.turf.findMany({
    select: {
      id: true,
      name: true,
      openTime: true,
      closeTime: true,
      pricePerHour: true,
      generatedSlots: true,
    },
  });
  const turfs = all.filter(
    (t) =>
      t.generatedSlots === null ||
      (Array.isArray(t.generatedSlots) && t.generatedSlots.length === 0)
  );

  console.log(
    `[seed] turfs needing seed: ${turfs.length} / ${all.length} total${dryRun ? " (dry-run)" : ""}`
  );
  if (!turfs.length) return;

  let updated = 0;
  for (const t of turfs) {
    const price = Number(t.pricePerHour) || 0;
    const slots = generateHourlySlots(t.openTime, t.closeTime, price);
    console.log(
      `[seed] ${t.id} ${t.name} → ${slots.length} hourly slots @ ${price}/hr (${t.openTime}-${t.closeTime})`
    );
    if (!dryRun) {
      await prisma.turf.update({
        where: { id: t.id },
        data: { generatedSlots: slots },
      });
      updated++;
    }
  }

  if (!dryRun && updated > 0) {
    await invalidateCache("turfs:list:*");
  }
  console.log(`[seed] done. updated=${updated}`);
}

run()
  .catch((err) => {
    console.error("[seed] error", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
