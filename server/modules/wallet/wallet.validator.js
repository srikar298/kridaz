import { z } from "zod";

export const createTopupSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be greater than 0"),
    couponCode: z.string().optional(),
  }),
});

export const verifyTopupSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1, "Order ID is required"),
    razorpay_payment_id: z.string().min(1, "Payment ID is required"),
    razorpay_signature: z.string().min(1, "Signature is required"),
  }),
});

export const requestWithdrawalSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .min(500, "Minimum withdrawal is Rs 500")
      .max(100000, "Maximum withdrawal is Rs 1,00,000"),
    bankDetails: z.record(z.any()).optional(),
  }),
});
