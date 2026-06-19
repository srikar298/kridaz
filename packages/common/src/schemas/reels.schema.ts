import { z } from "zod";

export const interactSchema = z.object({
  params: z.object({
    reelId: z.string().min(1, "Reel ID is required"),
  }),
  body: z.object({
    type: z.enum(["LIKE", "UNLIKE", "SHARE", "VIEW"]),
  }),
});

export const reelCommentSchema = z.object({
  params: z.object({
    reelId: z.string().min(1, "Reel ID is required"),
  }),
  body: z.object({
    content: z.string().min(1, "Comment content cannot be empty"),
  }),
});

export const confirmUploadSchema = z.object({
  body: z.object({
    key: z.string().min(1, "Media key is required"),
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// Inferred Types
export type InteractInput = z.infer<typeof interactSchema>;
export type ReelCommentInput = z.infer<typeof reelCommentSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
