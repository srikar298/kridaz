import { parse, addHours, format, isBefore, isEqual } from "date-fns";

/**
 * Generates hourly slots between openTime and closeTime
 * @param {string} openTime - e.g. "07:00 AM"
 * @param {string} closeTime - e.g. "01:00 AM" (next day if before openTime)
 * @returns {Array} - Array of slot objects { startTime, endTime, label }
 */
export const generateHourlySlots = (openTime, closeTime) => {
  if (!openTime || !closeTime) return [];

  const slots = [];
  const today = new Date();
  let current = parse(openTime, "hh:mm a", today);
  let end = parse(closeTime, "hh:mm a", today);

  // If closeTime is before or equal to openTime, it means it's the next day
  if (isBefore(end, current) || isEqual(end, current)) {
    end = addHours(end, 24);
  }

  while (isBefore(current, end)) {
    const slotStart = current;
    const slotEnd = addHours(current, 1);

    // Don't add if the slot end exceeds the closing time
    if (isBefore(slotEnd, end) || isEqual(slotEnd, end)) {
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        label: `${format(slotStart, "hh:mm a")} - ${format(slotEnd, "hh:mm a")}`,
      });
    }

    current = slotEnd;
  }

  return slots;
};

/**
 * Checks if a slot is booked based on bookedTime array from backend
 */
export const isSlotBooked = (slot, bookedTimes) => {
  if (!bookedTimes || !Array.isArray(bookedTimes)) return false;

  return bookedTimes.some((booked) => {
    const bookedStart = new Date(booked.startTime);
    const bookedEnd = new Date(booked.endTime);

    // Simple overlap check
    return (
      (slot.startTime >= bookedStart && slot.startTime < bookedEnd) ||
      (slot.endTime > bookedStart && slot.endTime <= bookedEnd)
    );
  });
};
