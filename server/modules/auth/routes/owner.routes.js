import express from "express";
import {
  registerOwner,
  login,
  loginStep1,
  sendOtp,
  googleAuth,
  ownerRequest,
  getMe,
  logout,
  refreshToken,
} from "../auth.controller.js";
import {
  ownerRegisterSchema,
  userLoginSchema,
  sendOtpSchema,
  loginStep1Schema,
  ownerRequestSchema,
} from "../auth.validator.js";
import { validate } from "../../../middleware/validate.middleware.js";
import ownerAuth from "../../../middleware/jwt/owner.middleware.js";
import {
  authLimiter,
  otpLimiter,
} from "../../../middleware/rateLimiter.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Owner Auth
 *   description: Turf owner authentication and management
 */

// â”€â”€ Public Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * @swagger
 * /auth/owner/register:
 *   post:
 *     summary: Register as a turf owner
 *     tags: [Owner Auth]
 */
router.post(
  "/register",
  authLimiter,
  validate(ownerRegisterSchema),
  registerOwner
);

/**
 * @swagger
 * /auth/owner/send-otp:
 *   post:
 *     summary: Send OTP for owner
 *     tags: [Owner Auth]
 */
router.post("/send-otp", otpLimiter, validate(sendOtpSchema), sendOtp);

/**
 * @swagger
 * /auth/owner/login-step1:
 *   post:
 *     summary: Owner Login Step 1
 *     tags: [Owner Auth]
 */
router.post("/login-step1", validate(loginStep1Schema), loginStep1);

/**
 * @swagger
 * /auth/owner/login:
 *   post:
 *     summary: Owner login
 *     tags: [Owner Auth]
 */
router.post("/login", authLimiter, validate(userLoginSchema), login);

/**
 * @swagger
 * /auth/owner/google-auth:
 *   post:
 *     summary: Owner Google Auth
 *     tags: [Owner Auth]
 */
router.post("/google-auth", authLimiter, googleAuth);

/**
 * @swagger
 * /auth/owner/ownerRequest:
 *   post:
 *     summary: Submit owner partnership request
 *     tags: [Owner Auth]
 */
router.post("/ownerRequest", validate(ownerRequestSchema), ownerRequest);

/**
 * @swagger
 * /auth/owner/refresh:
 *   post:
 *     summary: Refresh token
 *     tags: [Owner Auth]
 */
router.post("/refresh", refreshToken);

// â”€â”€ Authenticated Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * @swagger
 * /auth/owner/getMe:
 *   get:
 *     summary: Get current owner profile
 *     tags: [Owner Auth]
 *     security:
 *       - BearerAuth: []
 */
router.get("/getMe", ownerAuth, getMe);

/**
 * @swagger
 * /auth/owner/logout:
 *   post:
 *     summary: Logout
 *     tags: [Owner Auth]
 */
router.post("/logout", logout);

export default router;
