import { prisma } from "../../config/prisma.js";
import razorpay, { createOrder } from "../../config/razorpay.js";
import crypto from "crypto";
import NotificationService from "../../services/notification.service.js";
import WalletService from "../../services/wallet.service.js";
import logger from "../../utils/logger.js";

export const validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code || !amount) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and amount are required",
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid coupon code" });
    }

    if (!coupon.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "This coupon is no longer active" });
    }

    if (new Date(coupon.validUntil) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "This coupon has expired" });
    }

    if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon usage limit reached" });
    }

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (Number(amount) * Number(coupon.discountValue)) / 100;
    } else {
      discount = Number(coupon.discountValue);
    }

    discount = Math.min(discount, Number(amount));
    const payableAmount = Number(amount) - discount;

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discount,
      payableAmount,
      couponId: coupon.id,
    });
  } catch (error) {
    logger.error("Error in validateCoupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not validate coupon." });
  }
};

export const createTopupOrder = async (req, res) => {
  const userId = req.user.id || req.user.user;
  try {
    const { amount, couponCode } = req.body; // Amount in INR

    if (!amount) {
      return res.status(400).json({ message: "Top-up amount is required" });
    }

    const minTopup = Number(process.env.WALLET_MIN_TOPUP) || 500;
    const maxTopup = Number(process.env.WALLET_MAX_TOPUP) || 10000;

    if (amount < minTopup) {
      return res
        .status(400)
        .json({ message: `Minimum top-up amount is Rs ${minTopup}` });
    }

    if (amount > maxTopup) {
      return res.status(400).json({
        message: `Maximum top-up amount is Rs ${maxTopup.toLocaleString("en-IN")}`,
      });
    }

    let payableAmount = Number(amount);
    let couponId = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (
        coupon &&
        coupon.isActive &&
        new Date(coupon.validUntil) > new Date() &&
        (coupon.usageLimit === 0 || coupon.timesUsed < coupon.usageLimit)
      ) {
        let discount = 0;
        if (coupon.discountType === "PERCENTAGE") {
          discount = (Number(amount) * Number(coupon.discountValue)) / 100;
        } else {
          discount = Number(coupon.discountValue);
        }
        discount = Math.min(discount, Number(amount));
        payableAmount = Number(amount) - discount;
        couponId = coupon.id;
      } else {
        return res
          .status(400)
          .json({ message: "Invalid or expired coupon code" });
      }
    }

    if (payableAmount === 0) {
      // 100% discount, bypass Razorpay entirely and just credit the wallet.
      const newBalance = await prisma.$transaction(async (tx) => {
        const balance = await WalletService.credit(
          userId,
          "user",
          Number(amount),
          tx
        );

        await tx.walletTransaction.create({
          data: {
            userId: userId,
            amount: Number(amount),
            payableAmount: 0,
            couponId: couponId,
            type: "TOPUP",
            status: "SUCCESS",
            description: "Wallet Top-up (100% Discount)",
            razorpayOrderId: null,
          },
        });

        if (couponId) {
          await tx.coupon.update({
            where: { id: couponId },
            data: { timesUsed: { increment: 1 } },
          });
        }

        return balance;
      });

      return res.status(200).json({
        order: null,
        payableAmount: 0,
        message: "Wallet topped up successfully",
        balance: newBalance,
      });
    }

    if (payableAmount < 1) payableAmount = 1;

    const options = {
      amount: Math.round(payableAmount * 100), // Razorpay takes amount in paise
      currency: "INR",
      receipt: `topup_${Date.now()}`,
    };

    const order = await createOrder.fire(options);

    // Create a pending transaction
    await prisma.walletTransaction.create({
      data: {
        userId: userId,
        amount: Number(amount),
        payableAmount: payableAmount,
        couponId: couponId,
        type: "TOPUP",
        status: "PENDING",
        description: "Wallet Top-up",
        razorpayOrderId: order.id,
      },
    });

    return res.status(200).json({ order, payableAmount });
  } catch (error) {
    logger.error("Error in createTopupOrder:", error);
    
    // Extract Razorpay error if available
    const errorMessage = error?.error?.description || error?.message || "Internal Server Error";
    
    return res
      .status(500)
      .json({ 
        success: false, 
        message: "Could not create top-up order.",
        error: errorMessage
      });
  }
};

export const verifyTopup = async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing Razorpay payment parameters" });
  }

  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Update transaction status to FAILED
      await prisma.walletTransaction.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: "FAILED", description: "Payment Verification Failed" },
      });
      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }

    // Find the pending transaction
    const transaction = await prisma.walletTransaction.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
      },
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction record not found" });
    }

    if (transaction.status === "SUCCESS") {
      const account = await WalletService.getWallet(userId, "user");
      return res.status(200).json({
        success: true,
        message: "Wallet topped up successfully",
        balance: account.balance,
      });
    }

    if (transaction.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "Transaction cannot be verified" });
    }

    const account = await WalletService.getAccountProfile(
      req.user.id,
      req.user.role,
      req.user.ownerId
    );
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    // Atomic wallet credit and status update inside Prisma transaction
    const newBalance = await prisma.$transaction(async (tx) => {
      // Check again to avoid race conditions with webhooks
      const currentTx = await tx.walletTransaction.findUnique({
        where: { id: transaction.id },
      });
      if (currentTx.status !== "PENDING") return null;

      const balance = await WalletService.credit(
        req.user.id,
        "user", // Force role to "user" so top-ups ALWAYS go to the User Wallet
        transaction.amount,
        tx
      );

      // Mark transaction as SUCCESS
      await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id,
        },
      });

      if (transaction.couponId) {
        await tx.coupon.update({
          where: { id: transaction.couponId },
          data: { timesUsed: { increment: 1 } },
        });
      }

      return balance;
    });

    if (newBalance === null) {
      const account = await WalletService.getWallet(userId, "user");
      return res.status(200).json({
        success: true,
        message: "Wallet topped up successfully",
        balance: account.balance,
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user) {
      NotificationService.publishEvent("WALLET_TOPUP_SUCCESS", {
        recipientId: user.id,
        recipientModel: "User",
        email: user.email,
        phone: user.phone,
        userName: user.name || "Player",
        amount: transaction.amount,
        newBalance: newBalance,
        currency: "₹",
        date: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet topped up successfully",
      balance: newBalance,
    });
  } catch (error) {
    logger.error("Error in verifyTopup:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not verify top-up payment." });
  }
};

export const getWalletData = async (req, res) => {
  const userId = req.user.id;
  try {
    const isOwnerRoute = req.originalUrl.includes("/owner");
    const roleToFetch = isOwnerRoute
      ? req.user?.role || req.owner?.role || "VENUE_OWNER"
      : "user";

    const wallet = await WalletService.getWallet(userId, roleToFetch);

    // Define what transaction types belong to which wallet
    const txTypes = isOwnerRoute
      ? [
          "SETTLEMENT",
          "REVENUE",
          "WITHDRAWAL",
          "DISPUTE_FREEZE",
          "DISPUTE_RELEASE",
          "HOST_GAME",
          "JOIN_GAME",
        ]
      : [
          "TOPUP",
          "OFFER",
          "REFUND",
          "SLOT_INCOME",
          "CREDIT",
          "HOST_GAME",
          "JOIN_GAME",
        ];

    const transactions = await prisma.walletTransaction.findMany({
      where: {
        userId: userId,
        type: {
          in: txTypes,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.status(200).json({
      ...wallet,
      transactions: transactions,
    });
  } catch (error) {
    logger.error("Error in getWalletData:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve wallet data.",
      error: error.message,
    });
  }
};

export const checkPaymentStatus = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await razorpay.orders.fetchPayments(orderId);
    const successfulPayment = order.items.find((p) => p.status === "captured");

    if (successfulPayment) {
      // Find the pending transaction
      const transaction = await prisma.walletTransaction.findFirst({
        where: {
          razorpayOrderId: orderId,
          status: "PENDING",
        },
      });

      if (transaction) {
        const user = await prisma.user.findUnique({
          where: { id: transaction.userId },
          select: { role: true },
        });
        const role = user?.role || "user";

        const newBalance = await prisma.$transaction(async (tx) => {
          const balance = await WalletService.credit(
            transaction.userId,
            "user", // Force role to "user" so top-ups ALWAYS go to the User Wallet
            transaction.amount,
            tx
          );

          await tx.walletTransaction.update({
            where: { id: transaction.id },
            data: {
              status: "SUCCESS",
              razorpayPaymentId: successfulPayment.id,
            },
          });

          if (transaction.couponId) {
            await tx.coupon.update({
              where: { id: transaction.couponId },
              data: { timesUsed: { increment: 1 } },
            });
          }

          return balance;
        });

        if (newBalance !== undefined) {
          if (user) {
            NotificationService.publishEvent("WALLET_TOPUP_SUCCESS", {
              recipientId: transaction.userId,
              recipientModel: "User",
              email: user.email,
              phone: user.phone,
              userName: user.name || "Player",
              amount: transaction.amount,
              newBalance: newBalance,
              currency: "₹",
              date: new Date(),
            });
          }

          return res.status(200).json({
            success: true,
            message: "Payment was successful. Wallet updated.",
          });
        }
      }
    }

    return res.status(200).json({
      success: false,
      message: "No successful payment found for this order.",
    });
  } catch (error) {
    logger.error("Error in checkPaymentStatus:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not check payment status." });
  }
};

export const requestWithdrawal = async (req, res) => {
  const { amount, bankDetails } = req.body;

  try {
    if (req.user.role === "user") {
      return res
        .status(403)
        .json({ message: "Only partners can request withdrawals" });
    }

    const owner = await WalletService.getAccountProfile(
      req.user.id,
      req.user.role,
      req.user.ownerId
    );

    if (!owner) {
      return res.status(404).json({ message: "Account not found" });
    }

    const usableBalance =
      Number(owner.walletBalance) - Number(owner.reservedBalance);
    if (usableBalance < amount) {
      return res.status(400).json({ message: "Insufficient usable balance" });
    }

    // 1. Create withdrawal request
    const request = await prisma.withdrawalRequest.create({
      data: {
        ownerId: owner.id,
        amount: Number(amount),
        bankDetails,
        status: "PENDING",
      },
    });

    // 2. Reserve the amount
    await prisma.ownerProfile.update({
      where: { id: owner.id },
      data: { reservedBalance: { increment: Number(amount) } },
    });

    // 3. Notify Admin
    NotificationService.notifyAdmins({
      title: "Withdrawal Requested",
      message: `Partner ${owner.name} requested a withdrawal of Rs ${amount}.`,
      type: "WITHDRAWAL",
      link: "/admin/withdrawals",
    });

    const ownerUser = await prisma.user.findUnique({
      where: { id: owner.userId },
    });
    NotificationService.publishEvent("WITHDRAWAL_REQUESTED", {
      recipientId: owner.userId,
      recipientModel: "User",
      email: ownerUser?.email,
      phone: ownerUser?.phone,
      amount: amount,
      currency: "₹",
      ownerName: owner.name,
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      request: request,
    });
  } catch (error) {
    logger.error("Error in requestWithdrawal:", error);
    return res.status(500).json({
      success: false,
      message: "Could not process withdrawal request.",
    });
  }
};

export const getOwnerWithdrawals = async (req, res) => {
  try {
    const owner = await WalletService.getAccountProfile(
      req.user.id,
      req.user.role,
      req.user.ownerId
    );

    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner account not found" });
    }

    const requests = await prisma.withdrawalRequest.findMany({
      where: { ownerId: owner.id },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      requests: requests,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Could not retrieve withdrawals." });
  }
};

/**
 * Cancel a RESERVED wallet transaction. Releases the reserved coins back
 * to usable balance. Only the owner can cancel; only RESERVED rows are
 * eligible (SUCCESS / FAILED / REFUNDED already settled).
 */
export const cancelReservation = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    const { id } = req.params;

    const tx = await prisma.walletTransaction.findUnique({ where: { id } });
    if (!tx || tx.userId !== userId) {
      return res.status(404).json({
        success: false,
        code: "TRANSACTION_NOT_FOUND",
        message: "Transaction not found.",
      });
    }
    if (tx.status !== "RESERVED") {
      return res.status(400).json({
        success: false,
        code: "TRANSACTION_NOT_RESERVED",
        message: "Only RESERVED transactions can be cancelled.",
      });
    }

    // Wallet.reservedBalance is a cached column — decrement alongside the
    // status flip so the next getWalletData read sees the freed coins.
    const amount = Number(tx.amount);
    await prisma.$transaction([
      prisma.walletTransaction.update({
        where: { id },
        data: { status: "CANCELLED" },
      }),
      prisma.wallet.update({
        where: { userId },
        data: { reservedBalance: { decrement: amount } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: { id, status: "CANCELLED", releasedAmount: amount },
    });
  } catch (error) {
    logger.error("cancelReservation error:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Could not cancel reservation.",
    });
  }
};
