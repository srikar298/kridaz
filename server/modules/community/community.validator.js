import { z } from "zod";

export const getUploadUrlSchema = z.object({
  query: z.object({
    contentType: z.string().min(1, "Content type is required"),
    fileName: z.string().optional(),
  }),
});

export const confirmPostSchema = z.object({
  body: z.object({
    postId: z.string().min(1, "Post ID is required"),
    key: z.string().min(1, "Media key is required"),
    mediaType: z.enum(["image", "video"]),
    title: z.string().optional(),
    content: z.string().optional(),
    mediaItems: z
      .array(
        z.object({
          key: z.string(),
          mediaType: z.string(),
        })
      )
      .optional(),
    sport: z.string().optional(),
  }),
});

export const commentSchema = z.object({
  body: z.object({
    text: z.string().min(1, "Comment text cannot be empty"),
  }),
});

export const reportPostSchema = z.object({
  body: z.object({
    reason: z.string().min(1, "Reason cannot be empty"),
  }),
});
