import { z } from "zod";

export const mediaTypeSchema = z.enum(["IMAGE", "VIDEO"]);

export const mediaStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const communityPostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Post title/caption is required").max(500),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: mediaTypeSchema.optional(),
  mediaStatus: mediaStatusSchema.default("COMPLETED"),
  authorId: z.string().uuid(),
  authorName: z.string().min(1),
  authorPicture: z.string().optional(),
  likesCount: z.number().nonnegative().default(0),
  commentsCount: z.number().nonnegative().default(0),
  createdAt: z.string().datetime(),
});

export const communityStorySchema = z.object({
  id: z.string().uuid(),
  mediaUrl: z.string().url("Invalid media URL"),
  mediaType: mediaTypeSchema,
  mediaStatus: mediaStatusSchema.default("PENDING"),
  authorId: z.string().uuid(),
  authorName: z.string().min(1),
  authorPicture: z.string().optional(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const createPostSchema = z.object({
  title: z.string().min(1, "Caption must be provided"),
  content: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaType: mediaTypeSchema.optional(),
});

export type MediaType = z.infer<typeof mediaTypeSchema>;
export type MediaStatus = z.infer<typeof mediaStatusSchema>;
export type CommunityPost = z.infer<typeof communityPostSchema>;
export type CommunityStory = z.infer<typeof communityStorySchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
