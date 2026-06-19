import { Router } from "express";
import {
  getWalletData,
  requestWithdrawal,
  getOwnerWithdrawals,
} from "../wallet.controller.js";
import verifyOwnerToken from "../../../middleware/jwt/owner.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { requestWithdrawalSchema } from "../wallet.validator.js";
import { paymentLimiter } from "../../../middleware/rateLimiter.middleware.js";
import { idempotency } from "../../../middleware/idempotency.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Owner Wallet
 *   description: Wallet and withdrawal management for turf owners
 */

/**
 * @swagger
 * /wallet/owner/data:
 *   get:
 *     summary: Get wallet data
 *     tags: [Owner Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.get("/data", verifyOwnerToken, getWalletData);

/**
 * @swagger
 * /wallet/owner/withdraw:
 *   post:
 *     summary: Request withdrawal
 *     tags: [Owner Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/withdraw",
  paymentLimiter,
  verifyOwnerToken,
  idempotency,
  validate(requestWithdrawalSchema),
  requestWithdrawal
);

/**
 * @swagger
 * /wallet/owner/withdrawals:
 *   get:
 *     summary: Get withdrawal history
 *     tags: [Owner Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.get("/withdrawals", verifyOwnerToken, getOwnerWithdrawals);

export default router;
