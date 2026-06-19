import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "FAILED",
]);

export const bookingSchema = z.object({
  id: z.string().uuid(),
  turfId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive("Amount must be greater than zero"),
  status: bookingStatusSchema,
  date: z.string(), // ISO Date String
  timeSlot: z.string().min(1, "Time slot is required"),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const createBookingSchema = z.object({
  turfId: z.string().uuid("Invalid Turf ID"),
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
  amount: z.number().positive(),
  paymentMethod: z.enum(["RAZORPAY", "WALLET", "FREE"]).default("RAZORPAY"),
});

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
