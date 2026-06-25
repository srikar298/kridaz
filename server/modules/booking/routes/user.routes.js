import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  bookWithWallet,
  getUserBookings,
  getBookingById,
  validateCoupon,
  downloadInvoice,
  cancelBooking,
  payBalance,
} from "../booking.controller.js";
import {
  createOrderSchema,
  verifyPaymentSchema,
  bookWithWalletSchema,
} from "../booking.validator.js";
import { validate } from "../../../middleware/validate.middleware.js";
import verifyToken from "../../../middleware/jwt/user.middleware.js";
import { paymentLimiter } from "../../../middleware/rateLimiter.middleware.js";
import { idempotency } from "../../../middleware/idempotency.middleware.js";

/**
 * @module UserBookingRoutes
 * @description User-facing booking endpoints. Rate limiting for payment operations
 * is applied at the route level, not in app.js, keeping security concerns co-located
 * with the domain they protect.
 *
 * All routes are mounted under /api/booking/user (via booking.routes.js).
 */

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Booking
 *   description: Turf slot reservations and payment management
 */

/**
 * @swagger
 * /booking/user/create-order:
 *   post:
 *     summary: Create a Razorpay booking order
 *     description: Initializes a Razorpay payment order for a turf slot reservation.
 *     tags: [Booking]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [totalPrice]
 *             properties:
 *               totalPrice: { type: number, example: 500, description: "Total booking amount in INR" }
 *     responses:
 *       200:
 *         description: Razorpay order created successfully
 *       429:
 *         description: Too many payment requests
 */
router.post(
  "/create-order",
  paymentLimiter,
  verifyToken,
  idempotency,
  validate(createOrderSchema),
  createOrder
);

/**
 * @swagger
 * /booking/user/verify-payment:
 *   post:
 *     summary: Verify payment and confirm booking
 *     description: Verifies the Razorpay signature, creates the booking record, and sends a confirmation email with QR code.
 *     tags: [Booking]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime, selectedTurfDate, totalPrice, paymentId, orderId, razorpay_signature]
 *             properties:
 *               turfId: { type: string, format: uuid }
 *               startTime: { type: string, example: "10:00" }
 *               endTime: { type: string, example: "11:00" }
 *               selectedTurfDate: { type: string, format: date }
 *               totalPrice: { type: number }
 *               paymentId: { type: string }
 *               orderId: { type: string }
 *               razorpay_signature: { type: string }
 *     responses:
 *       200:
 *         description: Payment verified and booking confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       429:
 *         description: Too many payment requests
 */
router.post(
  "/verify-payment",
  paymentLimiter,
  verifyToken,
  idempotency,
  validate(verifyPaymentSchema),
  verifyPayment
);

/**
 * @swagger
 * /booking/user/book-with-wallet:
 *   post:
 *     summary: Book a slot using wallet balance
 *     description: Deducts the full amount from the user's Kridaz wallet and confirms the booking instantly.
 *     tags: [Booking]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startTime, endTime, selectedTurfDate, totalPrice]
 *             properties:
 *               turfId: { type: string, format: uuid }
 *               startTime: { type: string }
 *               endTime: { type: string }
 *               selectedTurfDate: { type: string, format: date }
 *               totalPrice: { type: number }
 *     responses:
 *       200:
 *         description: Booking confirmed via wallet
 *       429:
 *         description: Too many payment requests
 */
router.post(
  "/book-with-wallet",
  paymentLimiter,
  verifyToken,
  idempotency,
  validate(bookWithWalletSchema),
  bookWithWallet
);

/**
 * @swagger
 * /booking/user/validate-coupon:
 *   post:
 *     summary: Validate a discount coupon
 *     description: Checks if a coupon code is valid for a given turf and returns the discount amount.
 *     tags: [Booking]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [couponCode, turfId]
 *             properties:
 *               couponCode: { type: string }
 *               turfId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Coupon is valid
 *       400:
 *         description: Coupon is invalid or expired
 */
router.post("/validate-coupon", verifyToken, validateCoupon);

/**
 * @swagger
 * /booking/user/all:
 *   get:
 *     summary: Get all bookings for the logged-in user
 *     description: Returns a paginated list of all bookings made by the authenticated user.
 *     tags: [Booking]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get("/all", verifyToken, getUserBookings);
router.get("/get-bookings", verifyToken, getUserBookings);

/**
 * @swagger
 * /booking/user/cancel/{id}:
 *   post:
 *     summary: Cancel a booking
 *     description: Cancels an active booking and initiates a refund to the user's wallet if applicable.
 *     tags: [Booking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found
 */
router.post("/cancel/:id", verifyToken, cancelBooking);
router.post("/pay-balance", verifyToken, payBalance);

/**
 * @swagger
 * /booking/user/invoice/{id}:
 *   get:
 *     summary: Download booking invoice
 *     description: Generates and streams a PDF invoice for the specified booking. Publicly accessible via direct link.
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: PDF invoice file
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
router.get("/invoice/:id", downloadInvoice);

/**
 * @swagger
 * /booking/user/{id}:
 *   get:
 *     summary: Get a specific booking by ID
 *     description: Returns detailed information about a booking. Publicly accessible for QR-code based check-ins.
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 */
router.get("/:id", getBookingById);

export default router;
