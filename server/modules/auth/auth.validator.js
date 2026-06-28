import { z } from "zod";
import { PHONE_REGEX } from "@kridaz/shared-constants/validation";
import { OWNER_ROLE } from "@kridaz/shared-constants/roles";

export const sendOtpSchema = z.object({
  body: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .refine((data) => data.email || data.phone, {
      message: "Email or Phone is required",
      path: ["email"],
    }),
});

export const createAccountSchema = z.object({
  body: z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    registrationToken: z.string({ required_error: "Registration token is required" }),
  }),
});

export const userRegisterSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Email is invalid").optional().or(z.literal("")),
      phone: z.string().min(1, "Phone number is required"),
      gender: z.string().min(1, "Gender is required"),
      location: z.string().min(1, "Location is required"),
      city: z.string().optional(),
      state: z.string().optional(),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().optional(),
      otp: z.string().optional(),
      phoneOtp: z.string().optional(),
      registrationToken: z.string().optional(),
      phoneRegistrationToken: z.string().optional(),
      dob: z.string().optional(),
      sportTypes: z.array(z.string()).optional(),
    })
    .refine(
      (data) => !data.confirmPassword || data.password === data.confirmPassword,
      {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      }
    )
    .refine((data) => data.otp || data.phoneOtp || data.registrationToken, {
      message: "Either OTP or Registration Token is required",
      path: ["registrationToken"],
    }),
});

export const loginStep1Schema = z.object({
  body: z.object({
    email: z.string().min(1, "Email or Phone is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const userLoginSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email or Phone is required"),
    password: z.string().min(1, "Password is required"),
    otp: z.string().min(6, "OTP must be 6 characters").optional(),
  }),
});

export const ownerRegisterSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Email is invalid").optional().or(z.literal("")),
      phone: z.string().min(1, "Phone number is required"),
      gender: z.string().min(1, "Gender is required"),
      location: z.string().min(1, "Location is required"),
      city: z.string().optional(),
      state: z.string().optional(),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().optional(),
      otp: z.string().optional(),
      phoneOtp: z.string().optional(),
      registrationToken: z.string().optional(),
      phoneRegistrationToken: z.string().optional(),
      role: z.enum(Object.values(OWNER_ROLE)).optional(),
      businessName: z.string().optional(),
    })
    .refine(
      (data) => !data.confirmPassword || data.password === data.confirmPassword,
      {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      }
    )
    .refine((data) => data.otp || data.phoneOtp || data.registrationToken, {
      message: "Either OTP or Registration Token is required",
      path: ["registrationToken"],
    }),
});

export const ownerRequestSchema = z.object({
  body: z.object({
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
  }),
});
