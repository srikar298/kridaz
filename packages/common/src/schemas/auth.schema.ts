import { z } from "zod";
import { PHONE_REGEX } from "@kridaz/shared-constants/validation";
import { OWNER_ROLE } from "@kridaz/shared-constants/roles";

// Role definition schema matching client/user/src/contracts/auth.contract.ts
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

export const sendOtpBodySchema = z.object({
  email: z.string().email("Email is invalid"),
});

export const sendOtpSchema = z.object({
  body: sendOtpBodySchema,
});

export const userRegisterBodySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-z0-9_]+$/,
        "Username can only contain lowercase letters, numbers, and underscores"
      )
      .optional(),
    email: z.string().email("Email is invalid"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(PHONE_REGEX, "Enter a valid 10-digit phone number"),
    gender: z.string().min(1, "Gender is required"),
    location: z.string().min(1, "Location is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
    otp: z.string().min(6, "OTP must be 6 characters").optional(),
    phoneOtp: z
      .string()
      .min(6, "WhatsApp OTP must be 6 characters")
      .optional(),
    sportTypes: z.array(z.string()).optional(),
    inviteToken: z.string().optional(),
    umpireInvite: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const userRegisterSchema = z.object({
  body: userRegisterBodySchema,
});

export const loginStep1BodySchema = z.object({
  email: z.string().email("Email is invalid"),
  password: z.string().min(1, "Password is required"),
});

export const loginStep1Schema = z.object({
  body: loginStep1BodySchema,
});

export const userLoginBodySchema = z.object({
  email: z.string().email("Email is invalid"),
  password: z.string().min(1, "Password is required"),
  otp: z.string().min(6, "OTP must be 6 characters").optional(),
});

export const userLoginSchema = z.object({
  body: userLoginBodySchema,
});

export const ownerRegisterBodySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Email is invalid"),
    phone: z.string().min(1, "Phone number is required"),
    gender: z.string().min(1, "Gender is required"),
    location: z.string().min(1, "Location is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
    otp: z.string().min(6, "OTP must be 6 characters"),
    phoneOtp: z.string().min(6, "WhatsApp OTP must be 6 characters"),
    role: z
      .enum(Object.values(OWNER_ROLE) as [string, ...string[]])
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ownerRegisterSchema = z.object({
  body: ownerRegisterBodySchema,
});

export const ownerRequestBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Email is invalid"),
  phone: z.string().regex(PHONE_REGEX, "Phone number must be 10 digits"),
  role: z.string().optional(),
  businessDetails: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pinCode: z.string().optional(),
      zipCode: z.string().optional(),
      experience: z.string().optional(),
      specialization: z.string().optional(),
    })
    .passthrough()
    .optional(),
  documents: z.array(z.any()).optional(),
  username: z.string().optional(),
  gender: z.string().optional(),
  location: z.string().optional(),
  dob: z.any().optional(),
  sportTypes: z.array(z.string()).optional(),
  coachingLevel: z.string().optional(),
  sessionFee: z.any().optional(),
  availabilityTimings: z.string().optional(),
  availabilityMode: z.string().optional(),
  preferredLocations: z.string().optional(),
  bio: z.string().optional(),
  profilePicture: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  otp: z.string().optional(),
});

export const ownerRequestSchema = z.object({
  body: ownerRequestBodySchema,
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

// Inferred Types
export type UserRole = z.infer<typeof userRoleSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type LoginStep1Input = z.infer<typeof loginStep1Schema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type OwnerRegisterInput = z.infer<typeof ownerRegisterSchema>;
export type OwnerRequestInput = z.infer<typeof ownerRequestSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

export type SendOtpBody = z.infer<typeof sendOtpBodySchema>;
export type UserRegisterBody = z.infer<typeof userRegisterBodySchema>;
export type LoginStep1Body = z.infer<typeof loginStep1BodySchema>;
export type UserLoginBody = z.infer<typeof userLoginBodySchema>;
export type OwnerRegisterBody = z.infer<typeof ownerRegisterBodySchema>;
export type OwnerRequestBody = z.infer<typeof ownerRequestBodySchema>;
