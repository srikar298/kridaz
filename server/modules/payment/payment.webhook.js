import asyncHandler from "../../utils/asyncHandler.js";
import crypto from "crypto";
import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";
import {
  paymentTotal,
  paymentSuccessTotal,
  walletTopupTotal,
  bookingConfirmedTotal,
} from "../../utils/metrics.js";
import WalletService from "../../services/wallet.service.js";

/**
 * Handle Razorpay Webhooks
 * This endpoint should be public and not require authentication.
 * It uses Razorpay Signature validation to ensure the request is genuine.
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("[WEBHOOK] Missing RAZORPAY_WEBHOOK_SECRET in environment");
    return res
      .status(500)
      .json({ status: "error", message: "Webhook secret not configured" });
  }
  const signature = req.headers["x-razorpay-signature"];
  // 1. Verify Signature
  if (!req.rawBody) {
    logger.error("[WEBHOOK] req.rawBody is missing. Cannot verify signature.");
    return res.status(400).json({ status: "bad_request", message: "Missing rawBody" });
  }

  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(req.rawBody);
  const digest = shasum.digest("hex");
  if (digest !== signature) {
    logger.error("[WEBHOOK] Invalid signature detected");
    return res.status(400).json({
      status: "invalid_signature",
    });
  }
  const event = req.body.event;
  const payload = req.body.payload;
  logger.info(`[WEBHOOK] Received event: ${event}`);

  // 2. Handle Events
  switch (event) {
    case "payment.captured":
      if (payload?.payment?.entity) {
        await handlePaymentCaptured(payload.payment.entity);
      } else {
        logger.error("[WEBHOOK] Malformed payment.captured payload.");
      }
      break;
    case "order.paid":
      // Usually order.paid is triggered when the full amount is captured
      break;
    default:
      logger.info(`[WEBHOOK] Unhandled event: ${event}`);
  }
  return res.status(200).json({
    status: "ok",
  });
});

/**
 * Handle payment.captured event
 * Useful for Wallet Topups and Booking confirmations as a fallback
 */
async function handlePaymentCaptured(payment) {
  const { order_id, id: payment_id, status } = payment;
  const alreadyProcessed = await prisma.walletTransaction.findFirst({
    where: {
      razorpayPaymentId: payment_id,
    },
  });
  if (alreadyProcessed) {
    logger.info(
      `[WEBHOOK] Idempotency: payment ${payment_id} already processed. Skipping.`
    );
    return;
  }

  // Check if it's a Wallet Topup
  const transaction = await prisma.walletTransaction.findFirst({
    where: {
      razorpayOrderId: order_id,
      status: "PENDING",
    },
  });
  if (transaction) {
    logger.info(`[WEBHOOK] Processing wallet topup for order: ${order_id}`);

    // Find the user or owner
    const user = await prisma.user.findUnique({
      where: {
        id: transaction.userId,
      },
    });
    const owner = !user
      ? await prisma.ownerProfile.findFirst({
          where: {
            userId: transaction.userId,
          },
        })
      : null;
    if (user || owner) {
      await prisma.$transaction(async (tx) => {
        await WalletService.credit(
          transaction.userId,
          user ? "user" : "venue_owner",
          transaction.amount,
          tx
        );

        await tx.walletTransaction.update({
          where: {
            id: transaction.id,
          },
          data: {
            status: "SUCCESS",
            razorpayPaymentId: payment_id,
          },
        });

        if (transaction.couponId) {
          await tx.coupon.update({
            where: { id: transaction.couponId },
            data: { timesUsed: { increment: 1 } },
          });
        }
      });
      logger.info(
        `[WEBHOOK] Wallet topped up for ${user?.name || owner?.businessName}`
      );
      paymentTotal.inc({
        status: "success",
      });
      paymentSuccessTotal.inc({
        gateway: "razorpay",
        type: "wallet_topup",
      });
      walletTopupTotal.inc();
    }
    return;
  }

  // Check if it's a Booking
  const booking = await prisma.booking.findFirst({
    where: {
      orderId: order_id,
      status: "PENDING",
    },
  });
  if (booking) {
    logger.info(
      `[WEBHOOK] Processing booking confirmation for order: ${order_id}`
    );
    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: "CONFIRMED",
        paymentId: payment_id,
        paymentStatus: "SUCCESS",
      },
    });
    paymentTotal.inc({
      status: "success",
    });
    paymentSuccessTotal.inc({
      gateway: "razorpay",
      type: "booking",
    });
    bookingConfirmedTotal.inc({
      payment_method: "online",
    });
  }
}
