import { z } from "zod";

export const approveOwnerRequestSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Request ID is required"),
  }),
  body: z.object({
    adminName: z.string().optional(),
    adminDesignation: z.string().optional(),
  }),
});

export const approveWithdrawalSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Withdrawal ID is required"),
  }),
  body: z.object({
    transactionId: z.string().min(1, "Transaction ID is required"),
    screenshot: z.string().optional(),
    masterPassword: z.string().min(1, "Master payout password is required"),
  }),
});

export const rejectWithdrawalSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Withdrawal ID is required"),
  }),
  body: z.object({
    reason: z.string().min(1, "Reason for rejection is required"),
  }),
});

export const adminUserStatusSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
    status: z.enum(["active", "suspended", "deleted"], {
      errorMap: () => ({ message: "Invalid status" }),
    }),
  }),
});
