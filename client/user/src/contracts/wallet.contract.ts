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

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type AddFundsInput = z.infer<typeof addFundsSchema>;
