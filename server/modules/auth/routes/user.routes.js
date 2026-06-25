import express from "express";
import {
  registerUser,
  login,
  sendOtp,
  verifyOtp,
  loginStep1,
  googleAuth,
  appleAuth,
  getMe,
  logout,
  logoutAll,
  refreshToken,
  updateProfile,
  updateProfilePicture,
  updateBannerPicture,
  checkUsername,
  generateRecoveryTokens,
  loginWithRecoveryToken,
  upgradeRequest,
  sendPhoneVerificationOtp,
  verifyPhoneOtp,
  forgotPasswordOtp,
  resetPassword,
  sendEmailVerificationLink,
  verifyEmailToken,
  verifyEmailGoogle,
  updateProfileEmailWithGoogle,
  updateProfileEmailWithOtp,
} from "../auth.controller.js";
import {
  userRegisterSchema,
  userLoginSchema,
  sendOtpSchema,
  loginStep1Schema,
} from "../auth.validator.js";
import { validate } from "../../../middleware/validate.middleware.js";
import userAuth from "../../../middleware/jwt/user.middleware.js";
import upload from "../../../middleware/uploads/upload.middleware.js";
import {
  authLimiter,
  otpLimiter,
} from "../../../middleware/rateLimiter.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and profile management
 */

// â”€â”€ Public Routes (Registration / Login) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Auth]
 */
router.post("/send-otp", otpLimiter, validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/send-email-verification", authLimiter, sendEmailVerificationLink);
router.post("/verify-email", verifyEmailToken);
router.post("/verify-email-google", authLimiter, verifyEmailGoogle);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post(
  "/register",
  authLimiter,
  validate(userRegisterSchema),
  registerUser
);

/**
 * @swagger
 * /auth/login-step1:
 *   post:
 *     summary: Login Step 1 - Password verification
 *     tags: [Auth]
 */
router.post("/login-step1", validate(loginStep1Schema), loginStep1);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login Step 2 - Complete login
 *     tags: [Auth]
 */
router.post("/login", authLimiter, validate(userLoginSchema), login);

/**
 * @swagger
 * /auth/google-auth:
 *   post:
 *     summary: Google OAuth Login/Register
 *     tags: [Auth]
 */
router.post("/google-auth", authLimiter, googleAuth);

/**
 * @swagger
 * /auth/apple-auth:
 *   post:
 *     summary: Apple Sign-In Login/Register
 *     tags: [Auth]
 */
router.post("/apple-auth", authLimiter, appleAuth);

/**
 * @swagger
 * /auth/check-username:
 *   get:
 *     summary: Check username availability
 *     tags: [Auth]
 */
router.get("/check-username", checkUsername);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /auth/recovery/login:
 *   post:
 *     summary: Login using a recovery token
 *     tags: [Auth]
 */
router.post("/recovery/login", loginWithRecoveryToken);

// â”€â”€ Authenticated Routes (Profile / Session) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * @swagger
 * /auth/getMe:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.get("/getMe", userAuth, getMe);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 */
router.post("/logout", logout);

/**
 * @swagger
 * /user/auth/logout-all:
 *   post:
 *     summary: Log out from every device by bumping User.tokenVersion.
 *     description: |
 *       Every access token issued before this call carries the old tokenVersion
 *       in its payload, so middleware will reject them with code: TOKEN_REVOKED.
 *       Refresh tokens are also revoked server-side.
 *     tags: [Auth]
 */
router.post("/logout-all", userAuth, logoutAll);

/**
 * @swagger
 * /auth/updateProfile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.put("/updateProfile", userAuth, updateProfile);
router.post(
  "/profile-picture",
  userAuth,
  upload.single("profilePicture"),
  updateProfilePicture
);
router.post(
  "/banner-picture",
  userAuth,
  upload.single("bannerPicture"),
  updateBannerPicture
);
router.post("/send-phone-verification-otp", userAuth, sendPhoneVerificationOtp);
router.post("/verify-phone-otp", userAuth, verifyPhoneOtp);
router.post(
  "/profile/verify-email-google",
  userAuth,
  updateProfileEmailWithGoogle
);
router.post("/profile/verify-email-otp", userAuth, updateProfileEmailWithOtp);

/**
 * @swagger
 * /auth/recovery/generate:
 *   post:
 *     summary: Generate backup recovery tokens
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.post("/recovery/generate", userAuth, generateRecoveryTokens);

/**
 * @swagger
 * /auth/upgrade-request:
 *   post:
 *     summary: Submit a role upgrade request
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/upgrade-request",
  userAuth,
  upload.array("documents", 10),
  upgradeRequest
);

// â”€â”€ Password Reset Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post("/forgot-password-otp", forgotPasswordOtp);
router.post("/reset-password", resetPassword);

// Triggering restart for banner upload fix
export default router;
