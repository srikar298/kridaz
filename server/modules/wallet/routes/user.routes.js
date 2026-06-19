import { Router } from "express";
import {
  createTopupOrder,
  verifyTopup,
  getWalletData,
  checkPaymentStatus,
  cancelReservation,
  validateCoupon,
} from "../wallet.controller.js";
import verifyToken from "../../../middleware/jwt/user.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { createTopupSchema, verifyTopupSchema } from "../wallet.validator.js";
import { paymentLimiter } from "../../../middleware/rateLimiter.middleware.js";
import { idempotency } from "../../../middleware/idempotency.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: User wallet balance and transactions
 */

router.use(verifyToken);

/**
 * @swagger
 * /wallet/data:
 *   get:
 *     summary: Get wallet balance and transactions
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.get("/data", getWalletData);

/**
 *       - BearerAuth: []
 */
router.post("/topup/validate-coupon", validateCoupon);

/**
 * @swagger
 * /wallet/topup/create-order:
 *   post:
 *     summary: Create wallet top-up order
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/topup/create-order",
  paymentLimiter,
  idempotency,
  validate(createTopupSchema),
  createTopupOrder
);

/**
 * @swagger
 * /wallet/topup/verify:
 *   post:
 *     summary: Verify wallet top-up payment
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/topup/verify",
  paymentLimiter,
  idempotency,
  validate(verifyTopupSchema),
  verifyTopup
);

/**
 * @swagger
 * /wallet/topup/check-status/{orderId}:
 *   get:
 *     summary: Check top-up payment status
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.get("/topup/check-status/:orderId", checkPaymentStatus);

/**
 * @swagger
 * /wallet/transactions/{id}/cancel:
 *   post:
 *     summary: Cancel a RESERVED wallet transaction and release the coins
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 */
router.post("/transactions/:id/cancel", cancelReservation);

export default router;
