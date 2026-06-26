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

export const createOrderBodySchema = z.object({
  totalPrice: z.number().min(1, "Total price must be greater than 0"),
});

export const createOrderSchema = z.object({
  body: createOrderBodySchema,
});

export const verifyPaymentBodySchema = z
  .object({
    id: z.string().optional(),
    turfId: z.string().optional(),
    duration: z.number().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    selectedTurfDate: z.string().min(1, "Selected turf date is required"),
    totalPrice: z.number().min(1, "Total price is required"),
    paymentId: z.string().min(1, "Payment ID is required"),
    orderId: z.string().min(1, "Order ID is required"),
    razorpay_signature: z.string().min(1, "Razorpay signature is required"),
  })
  .refine((data) => data.id || data.turfId, {
    message: "Turf ID is required (either as 'id' or 'turfId')",
    path: ["turfId"],
  });

export const verifyPaymentSchema = z.object({
  body: verifyPaymentBodySchema,
});

export const bookWithWalletBodySchema = z
  .object({
    id: z.string().optional(),
    turfId: z.string().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    selectedTurfDate: z.string().min(1, "Selected turf date is required"),
    totalPrice: z.number().min(1, "Total price is required"),
  })
  .refine((data) => data.id || data.turfId, {
    message: "Turf ID is required (either as 'id' or 'turfId')",
    path: ["turfId"],
  });

export const bookWithWalletSchema = z.object({
  body: bookWithWalletBodySchema,
});

// Inferred types
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type BookWithWalletInput = z.infer<typeof bookWithWalletSchema>;
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type VerifyPaymentBody = z.infer<typeof verifyPaymentBodySchema>;
export type BookWithWalletBody = z.infer<typeof bookWithWalletBodySchema>;
