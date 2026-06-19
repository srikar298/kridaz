import { z } from "zod";

export const raiseDisputeSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    reason: z.string().min(1, "Reason is required"),
    customReason: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    images: z.array(z.string()).optional(),
  }),
});

export const replyToDisputeSchema = z.object({
  params: z.object({
    disputeId: z.string().min(1, "Dispute ID is required"),
  }),
  body: z.object({
    message: z.string().min(1, "Message cannot be empty"),
    senderRole: z.enum(["USER", "ADMIN", "OWNER"]).optional(),
  }),
});

export const resolveDisputeSchema = z.object({
  params: z.object({
    disputeId: z.string().min(1, "Dispute ID is required"),
  }),
  body: z.object({
    resolutionAction: z.enum([
      "RELEASE_TO_OWNER",
      "REFUND_TO_USER",
      "PARTIAL_REFUND",
      "CLOSE_NO_ACTION",
    ]),
    resolutionNotes: z.string().optional(),
    partialAmount: z.number().min(0).optional(),
  }),
});

// Inferred Types
export type RaiseDisputeInput = z.infer<typeof raiseDisputeSchema>;
export type ReplyToDisputeInput = z.infer<typeof replyToDisputeSchema>;
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;
