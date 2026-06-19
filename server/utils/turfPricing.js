/**
 * Compute the lowest per-hour rate across a turf's active generated slots.
 *
 * Per-slot price is treated as the rate for the slot's duration (startTime..endTime);
 * dividing by hours gives a comparable hourly rate. The minimum across active slots
 * is what users see as the "from ₹X/hr" headline on listing cards.
 *
 * @param {Array<{ startTime?: string, endTime?: string, price?: number|string, isActive?: boolean }>} generatedSlots
 * @returns {number|null} lowest hourly rate (rounded to 2 dp) or null if nothing computable
 */
export function computeLowestHourlyRate(generatedSlots = []) {
  if (!Array.isArray(generatedSlots)) return null;

  const perHour = [];
  for (const s of generatedSlots) {
    if (s?.isActive === false) continue;
    const price = Number(s?.price);
    if (!price || price <= 0) continue;
    const start = parseTimeOfDay(s.startTime);
    const end = parseTimeOfDay(s.endTime);
    if (start == null || end == null) continue;
    const hours = end > start ? end - start : 24 - start + end;
    if (hours <= 0) continue;
    perHour.push(price / hours);
  }

  if (!perHour.length) return null;
  return Number(Math.min(...perHour).toFixed(2));
}

/**
 * Parse "HH:MM" or "H:MM AM/PM" into hours-since-midnight (0..24, fractional).
 * Returns null for unparseable input.
 */
export function parseTimeOfDay(s) {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*$/i.exec(s || "");
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = (m[3] || "").toUpperCase();
  if (ampm === "AM" && h === 12) h = 0;
  if (ampm === "PM" && h !== 12) h += 12;
  if (h < 0 || h > 24 || min < 0 || min >= 60) return null;
  return h + min / 60;
}
