import { z } from "zod";

export const userRoleSchema = z.enum([
  // Platform Level Roles
  "BMSP_SUPER_ADMIN",
  "BMSP_ADMIN",
  "BMSP_FINANCE_ADMIN",
  "BMSP_VENUES_ADMIN",
  "BMSP_REGIONAL_VENUES_ADMIN",
  "BMSP_BOOKINGS_ADMIN",
  "BMSP_CUSTOMER_CARE",
  // Venue Level Roles
  "VENUE_OWNER",
  "SECONDARY_VENUE_NAME_MANAGER",
  "VENUE_OPERATIONS_MANAGER",
  "VENUE_BOOKING_MANAGER",
  // Standard Client Level Roles
  "USER",
  // System Internal Roles
  "SYSTEM",
  "ANONYMOUS",
]);

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  otp: z.string().optional(),
});

export const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    location: z.string().min(1, "Location is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const authResponseSchema = z.object({
  success: z.boolean(),
  token: z.string().optional(),
  role: userRoleSchema,
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    profilePicture: z.string().optional(),
    isVerified: z.boolean(),
  }),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
