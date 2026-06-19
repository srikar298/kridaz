import { z } from "zod";

export const turfSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Turf name is required"),
  location: z.string().min(1, "Location is required"),
  price: z.number().min(0, "Price must be positive"),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().nonnegative().optional(),
  images: z.array(z.string()).default([]),
  sports: z.array(z.string()).default([]),
  status: z.enum(["APPROVED", "PENDING", "REJECTED"]).default("PENDING"),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const createTurfSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  price: z.number().min(0, "Price must be at least 0"),
  amenities: z.array(z.string()).default([]),
  sports: z.array(z.string()).min(1, "At least one sport must be selected"),
  images: z.array(z.string()).optional(),
});

export type Turf = z.infer<typeof turfSchema>;
export type CreateTurfInput = z.infer<typeof createTurfSchema>;
