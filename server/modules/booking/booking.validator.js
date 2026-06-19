import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    totalPrice: z.number().min(1, "Total price must be greater than 0"),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z
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
    }),
});

export const bookWithWalletSchema = z.object({
  body: z
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
    }),
});
