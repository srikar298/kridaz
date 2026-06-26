import { z } from "zod";

export const transactionTypeSchema = z.enum([
  "DEPOSIT",
  "WITHDRAW",
  "PAYMENT",
  "REFUND",
]);

export const transactionStatusSchema = z.enum(["PENDING", "SUCCESS", "FAILED"]);

export const transactionSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  amount: z.number().positive(),
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  description: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const walletSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  balance: z.number().nonnegative().default(0),
  currency: z.string().default("INR"),
  transactions: z.array(transactionSchema).default([]),
});

export const addFundsSchema = z.object({
  amount: z.number().positive("Amount to add must be greater than 0"),
  paymentMethod: z.enum(["RAZORPAY", "STRIPE", "UPI"]).default("RAZORPAY"),
});

export const createTopupBodySchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  couponCode: z.string().optional(),
});

export const createTopupSchema = z.object({
  body: createTopupBodySchema,
});

export const verifyTopupBodySchema = z.object({
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
});

export const verifyTopupSchema = z.object({
  body: verifyTopupBodySchema,
});

export const requestWithdrawalBodySchema = z.object({
  amount: z
    .number()
    .min(500, "Minimum withdrawal is Rs 500")
    .max(100000, "Maximum withdrawal is Rs 1,00,000"),
  bankDetails: z.record(z.any()).optional(),
});

export const requestWithdrawalSchema = z.object({
  body: requestWithdrawalBodySchema,
});

// Inferred types
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type AddFundsInput = z.infer<typeof addFundsSchema>;
export type CreateTopupBody = z.infer<typeof createTopupBodySchema>;
export type VerifyTopupBody = z.infer<typeof verifyTopupBodySchema>;
export type RequestWithdrawalBody = z.infer<typeof requestWithdrawalBodySchema>;
