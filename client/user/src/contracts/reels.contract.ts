import { z } from "zod";

export const reelSchema = z.object({
  id: z.string().uuid(),
  videoUrl: z.string().url("Invalid video URL"),
  thumbnailUrl: z.string().url().optional(),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  userId: z.string().uuid(),
  likesCount: z.number().nonnegative().default(0),
  commentsCount: z.number().nonnegative().default(0),
  viewsCount: z.number().nonnegative().default(0),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime().optional(),
});

export const createReelSchema = z.object({
  videoUrl: z.string().url("Enter a valid video URL"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
});

export type Reel = z.infer<typeof reelSchema>;
export type CreateReelInput = z.infer<typeof createReelSchema>;
