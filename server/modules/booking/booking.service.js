/**
 * @module BookingService
 * @description Pure business logic layer for the Booking domain.
 *
 * ARCHITECTURE RULE: This layer has NO knowledge of HTTP (req/res).
 * Functions here accept plain data and return plain data or throw errors.
 * This makes the logic reusable in:
 *   - Controllers (HTTP handlers)
 *   - Cron jobs (scheduled settlement)
 *   - Admin scripts (manual operations)
 *   - Tests (unit testing without HTTP stack)
 */

import { prisma } from "../../config/prisma.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "@kridaz/common";
import razorpay, { createOrder } from "../../config/razorpay.js";
import crypto from "crypto";
import generateQRCode from "../../utils/generateQRCode.js";
import adjustTime from "../../utils/adjustTime.js";
import { generateHTMLContent } from "../../utils/generateEmail.js";
import { generateInvoice } from "../../utils/generateInvoice.js";
import NotificationService from "../../services/notification.service.js";
import WalletService from "../../services/wallet.service.js";
import { format, parseISO, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import logger from "../../utils/logger.js";
import { BOOKING_STATUS } from "@kridaz/shared-constants/bookingStatus";
import { bookingCreatedTotal, paymentTotal } from "../../utils/metrics.js";

/**
 * Checks if a time slot is available for a given turf and date range.
 * @param {string} turfId - The turf to check availability for.
 * @param {Date} startTime - The requested start time.
 * @param {Date} endTime - The requested end time.
 * @returns {Promise<boolean>} True if the slot is available.
 */
export const isSlotAvailable = async (turfId, startTime, endTime) => {
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      turfId,
      status: { notIn: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED] },
      timeSlot: {
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    },
  });
  return !conflictingBooking;
};

/**
 * Fetches full booking details by ID, including turf and user information.
 * @param {string} bookingId - The booking UUID.
 * @returns {Promise<import('@prisma/client').Booking | null>}
 */
export const findBookingById = async (bookingId) => {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      turf: {
        select: {
          id: true,
          name: true,
          location: true,
          city: true,
          state: true,
          owner: { select: { id: true, businessName: true } },
        },
      },
      timeSlot: true,
    },
  });
};

/**
 * Returns all bookings for a specific user, ordered newest first.
 * @param {string} userId - The user's UUID.
 * @returns {Promise<import('@prisma/client').Booking[]>}
 */
export const findBookingsByUser = async (userId) => {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      turf: { select: { id: true, name: true, city: true, image: true } },
      timeSlot: true,
    },
  });
};

/**
 * Returns all bookings for a given owner (all their turfs combined).
 * @param {string} ownerId - The OwnerProfile UUID.
 * @returns {Promise<import('@prisma/client').Booking[]>}
 */
export const findBookingsByOwner = async (ownerId) => {
  return prisma.booking.findMany({
    where: {
      turf: { ownerId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      turf: { select: { id: true, name: true } },
      timeSlot: true,
    },
  });
};

/**
 * Computes the refund amount for a cancellation based on the 30% policy.
 * Only applies when the booking was paid and is in CONFIRMED status.
 * @param {object} booking - The full booking record from Prisma.
 * @returns {number} Refund amount in INR.
 */
export const calculateCancellationRefund = (booking) => {
  if (
    booking.status !== BOOKING_STATUS.CONFIRMED ||
    booking.paymentStatus !== "SUCCESS"
  ) {
    return 0;
  }
  return parseFloat((booking.paidAmount * 0.3).toFixed(2));
};

// --- ENTERPRISE-GRADE SERVICE METHODS EXTRACTED ---

/**
 * Initializes a Razorpay booking order for a customer.
 * @param {string} userId - ID of the booking user.
 * @param {number} totalPrice - Total price for the booking in INR.
 * @returns {Promise<{ order: any, user: any }>}
 */
export const createRazorpayOrder = async (userId, totalPrice) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!user) {
    throw new NotFoundError("Account not found.", {
      code: "ACCOUNT_NOT_FOUND",
    });
  }

  const options = {
    amount: Math.round(totalPrice * 100),
    currency: "INR",
    receipt: `receipt${Date.now()}`,
  };

  const order = await createOrder.fire(options);
  return { order, user };
};

/**
 * Verifies Razorpay payment signature and completes booking process.
 * @param {string} userId - The user ID.
 * @param {object} paymentData - Body parameters from payment verification.
 * @returns {Promise<object>} The confirmed booking record.
 */
export const verifyBookingPayment = async (userId, paymentData) => {
  const {
    turfId: bodyTurfId,
    id,
    startTime,
    endTime,
    selectedTurfDate,
    totalPrice,
    advanceAmount,
    balanceAmount,
    paymentType,
    paymentId,
    orderId,
    razorpay_signature,
    paymentMethod = "ONLINE",
  } = paymentData;

  const turfId = bodyTurfId || id;
  const formattedStartTime = format(parseISO(startTime), "hh:mm a");
  const formattedEndTime = format(parseISO(endTime), "hh:mm a");
  const formattedDate = format(parseISO(selectedTurfDate), "d MMM yyyy");

  // Verify Signature
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${orderId}|${paymentId}`);
  const generatedSignature = hmac.digest("hex");
  if (generatedSignature !== razorpay_signature) {
    throw new BadRequestError("Payment verification failed.", {
      code: "PAYMENT_VERIFICATION_FAILED",
    });
  }

  const adjustedStartTime = adjustTime(startTime, selectedTurfDate);
  const adjustedEndTime = adjustTime(endTime, selectedTurfDate);

  const [user, turf, settingsDoc] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        walletBalance: true,
      },
    }),
    prisma.turf.findUnique({
      where: { id: turfId },
      include: {
        owner: {
          include: { user: { select: { email: true, name: true } } },
        },
      },
    }),
    prisma.systemSetting.findUnique({ where: { key: "PAYOUT_CONFIG" } }),
  ]);

  if (!user || !turf || !turf.owner) {
    throw new NotFoundError(
      !turf
        ? "Turf not found"
        : !turf.owner
          ? "Turf owner not found."
          : "Account not found.",
      {
        code: !turf
          ? "TURF_NOT_FOUND"
          : !turf.owner
            ? "TURF_OWNER_NOT_FOUND"
            : "ACCOUNT_NOT_FOUND",
      }
    );
  }

  const settings = settingsDoc?.value || {};
  const gstPercentage =
    typeof settings.gstPercentage !== "undefined"
      ? Number(settings.gstPercentage)
      : 0;
  const platformFeePercentage =
    typeof settings.platformFeePercentage !== "undefined"
      ? Number(settings.platformFeePercentage)
      : 5;

  // Configuration Expiry Guard
  const startOfSelectedDate = new Date(selectedTurfDate);
  startOfSelectedDate.setHours(0, 0, 0, 0);

  if (
    turf.slotsConfigDuration === "Fixed Weeks" &&
    turf.slotsConfigExpiry &&
    startOfSelectedDate > turf.slotsConfigExpiry
  ) {
    throw new BadRequestError("This slot is no longer available.", {
      code: "SLOT_UNAVAILABLE",
    });
  }

  const gstAmountCalc = Math.round(
    totalPrice * (gstPercentage / (100 + gstPercentage))
  );
  const baseAmount = totalPrice - gstAmountCalc;
  const platformFee = Math.round(baseAmount * (platformFeePercentage / 100));

  const amountPaidOnline = advanceAmount || totalPrice;
  const ownerRevenue = amountPaidOnline - platformFee - gstAmountCalc;

  // Create booking transaction
  const booking = await prisma.$transaction(async (tx) => {
    // 1. Acquire row-level lock on Turf to serialize concurrent booking attempts
    await tx.$queryRaw`SELECT id FROM "Turf" WHERE id = ${turfId} FOR UPDATE`;

    // 2. Overlap Guard (Inside transaction)
    const overlappingSlot = await tx.timeSlot.findFirst({
      where: {
        turfId: turfId,
        OR: [
          { startTime: { lt: adjustedEndTime, gte: adjustedStartTime } },
          { endTime: { gt: adjustedStartTime, lte: adjustedEndTime } },
          {
            startTime: { lte: adjustedStartTime },
            endTime: { gte: adjustedEndTime },
          },
        ],
      },
    });

    if (overlappingSlot) {
      throw new BadRequestError("This slot is no longer available.", {
        code: "SLOT_UNAVAILABLE",
      });
    }

    const timeSlot = await tx.timeSlot.create({
      data: {
        turfId: turfId,
        startTime: adjustedStartTime,
        endTime: adjustedEndTime,
        price: totalPrice,
      },
    });

    const newBooking = await tx.booking.create({
      data: {
        userId,
        turfId,
        timeSlotId: timeSlot.id,
        playStartTime: adjustedStartTime,
        playEndTime: adjustedEndTime,
        totalPrice,
        paidAmount: advanceAmount || totalPrice,
        balanceAmount: balanceAmount || 0,
        advanceAmount: advanceAmount || 0,
        paymentType: paymentType || "FULL",
        paymentMethod,
        orderId,
        paymentId,
        paymentSignature: razorpay_signature,
        paymentStatus: "SUCCESS",
        status: BOOKING_STATUS.CONFIRMED,
        revenueStatus: "PENDING",
        platformFee,
        gstAmount: gstAmountCalc,
        ownerRevenue,
      },
    });

    await tx.ownerProfile.update({
      where: { id: turf.owner.id },
      data: { pendingBalance: { increment: ownerRevenue } },
    });

    return newBooking;
  });

  // Track Metrics
  bookingCreatedTotal.inc();
  paymentTotal.inc({ status: "success" });

  const QRcode = await generateQRCode(
    `${process.env.USER_URL || "https://kridaz.com"}/booking-pass/${booking.id}`
  );
  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { qrCode: QRcode },
  });

  // Generate & send invoice and dispatch notifications
  const duration = Math.ceil(
    (new Date(adjustedEndTime) - new Date(adjustedStartTime)) / (1000 * 60 * 60)
  );
  const invoiceBooking = {
    ...updatedBooking,
    selectedTurfDate: formattedDate,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    duration,
  };

  generateInvoice(invoiceBooking, turf, user)
    .then((pdfBuffer) => {
      NotificationService.publishEvent("BOOKING_COMPLETED", {
        recipientId: turf.owner.userId,
        recipientModel: "User",
        ownerId: turf.owner.userId,
        email: user.email,
        phone: user.phone,
        playerName: user.name || "Player",
        turfName: turf.name,
        date: formattedDate,
        time: formattedStartTime,
        amount: totalPrice,
        currency: "₹",
        attachments: [
          {
            filename: `Invoice-KRZ-${booking.id.slice(-6).toUpperCase()}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
    })
    .catch((err) => {
      logger.error("[INVOICE] Failed to generate/queue invoice:", err.message);
    });

  return updatedBooking;
};

/**
 * Handles slot booking using customer's wallet balance.
 * @param {string} userId - The user ID.
 * @param {object} bookingData - Wallet booking body params.
 * @returns {Promise<object>} The confirmed booking details.
 */
export const processWalletBooking = async (userId, bookingData) => {
  const {
    turfId: bodyTurfId,
    id,
    startTime,
    endTime,
    selectedTurfDate,
    totalPrice: originalPrice,
    couponCode,
    balanceAmount: bodyBalanceAmount,
    paymentType: bodyPaymentType,
    advanceAmount: bodyAdvanceAmount,
  } = bookingData;

  const turfId = bodyTurfId || id;
  const formattedStartTime = format(parseISO(startTime), "hh:mm a");
  const formattedEndTime = format(parseISO(endTime), "hh:mm a");
  const formattedDate = format(parseISO(selectedTurfDate), "d MMM yyyy");

  const adjustedStartTime = adjustTime(startTime, selectedTurfDate);
  const adjustedEndTime = adjustTime(endTime, selectedTurfDate);

  const [user, turf, settingsDoc] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    }),
    prisma.turf.findUnique({
      where: { id: turfId },
      include: {
        owner: {
          include: { user: { select: { email: true, name: true } } },
        },
      },
    }),
    prisma.systemSetting.findUnique({ where: { key: "PAYOUT_CONFIG" } }),
  ]);

  if (!user || !turf || !turf.owner) {
    throw new NotFoundError(
      !turf
        ? "Turf not found"
        : !turf.owner
          ? "Turf owner not found."
          : "Account not found.",
      {
        code: !turf
          ? "TURF_NOT_FOUND"
          : !turf.owner
            ? "TURF_OWNER_NOT_FOUND"
            : "ACCOUNT_NOT_FOUND",
      }
    );
  }

  const settings = settingsDoc?.value || {};
  const gstPercentage = Number(settings.gstPercentage || 0);
  const platformFeePercentage = Number(settings.platformFeePercentage || 5);

  const finalPrice = originalPrice;
  const amountToDeduct =
    bodyPaymentType === "PARTIAL" && bodyAdvanceAmount
      ? bodyAdvanceAmount
      : finalPrice;

  const gstAmountCalc = Math.round(
    finalPrice * (gstPercentage / (100 + gstPercentage))
  );
  const baseAmount = finalPrice - gstAmountCalc;
  const platformFee = Math.round(baseAmount * (platformFeePercentage / 100));
  const ownerRevenue = amountToDeduct - platformFee - gstAmountCalc;

  const wallet = await WalletService.getWallet(userId, "user");

  if (wallet.usableBalance < amountToDeduct) {
    throw new BadRequestError("Insufficient wallet balance.", {
      code: "INSUFFICIENT_WALLET_BALANCE",
    });
  }

  // Overlap Guard is moved inside the transaction to prevent race conditions

  const booking = await prisma.$transaction(async (tx) => {
    // 1. Acquire row-level lock on Turf to serialize concurrent booking attempts
    await tx.$queryRaw`SELECT id FROM "Turf" WHERE id = ${turfId} FOR UPDATE`;

    // 2. Overlap Guard (Inside transaction)
    const overlappingSlot = await tx.timeSlot.findFirst({
      where: {
        turfId: turfId,
        OR: [
          { startTime: { lt: adjustedEndTime, gte: adjustedStartTime } },
          { endTime: { gt: adjustedStartTime, lte: adjustedEndTime } },
          {
            startTime: { lte: adjustedStartTime },
            endTime: { gte: adjustedEndTime },
          },
        ],
      },
    });

    if (overlappingSlot) {
      throw new BadRequestError("This slot is no longer available.", {
        code: "SLOT_UNAVAILABLE",
      });
    }

    // Deduct from wallet
    await WalletService.debit(userId, "user", amountToDeduct, tx);

    await tx.user.update({
      where: { id: userId },
      data: {
        bookingCount: { increment: 1 },
      },
    });

    // Create TimeSlot
    const timeSlot = await tx.timeSlot.create({
      data: {
        turfId: turfId,
        startTime: adjustedStartTime,
        endTime: adjustedEndTime,
        price: finalPrice,
      },
    });

    // Create Booking
    const newBooking = await tx.booking.create({
      data: {
        userId,
        turfId,
        timeSlotId: timeSlot.id,
        playStartTime: adjustedStartTime,
        playEndTime: adjustedEndTime,
        totalPrice: finalPrice,
        paidAmount: amountToDeduct,
        balanceAmount: bodyBalanceAmount ?? finalPrice - amountToDeduct,
        advanceAmount: amountToDeduct,
        paymentType:
          bodyPaymentType ?? (amountToDeduct < finalPrice ? "PARTIAL" : "FULL"),
        paymentMethod: "WALLET",
        orderId: "WALLET",
        paymentId: `WAL_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        paymentStatus: "SUCCESS",
        status: BOOKING_STATUS.CONFIRMED,
        revenueStatus: "PENDING",
        platformFee,
        gstAmount: gstAmountCalc,
        ownerRevenue,
      },
    });

    // Update Owner pending balance
    await tx.ownerProfile.update({
      where: { id: turf.owner.id },
      data: { pendingBalance: { increment: ownerRevenue } },
    });

    // Update Coupon usage
    if (couponCode) {
      const appliedCoupon = await tx.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), isActive: true },
      });
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { timesUsed: { increment: 1 } },
        });
      }
    }

    // Create Wallet transaction
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: amountToDeduct,
        type: "DEBIT",
        status: "SUCCESS",
        description: `Booking at ${turf.name}`,
        bookingId: newBooking.id,
      },
    });

    // Handle Cashback logic
    const cashbackPercentage = settings.cashbackPercentage || 5;
    const cashbackAmount = Math.round(finalPrice * (cashbackPercentage / 100));
    if (cashbackAmount > 0) {
      if (user) {
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: cashbackAmount } },
        });
      } else {
        await tx.ownerProfile.update({
          where: { userId: userId },
          data: { walletBalance: { increment: cashbackAmount } },
        });
      }

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: cashbackAmount,
          type: "OFFER",
          status: "SUCCESS",
          description: `${cashbackPercentage}% Cashback for booking #${newBooking.id.slice(-6).toUpperCase()}`,
          bookingId: newBooking.id,
        },
      });
    }

    return newBooking;
  });

  // Track Metrics
  bookingCreatedTotal.inc();
  paymentTotal.inc({ status: "success" });

  const QRcode = await generateQRCode(
    `${process.env.USER_URL || "https://kridaz.com"}/booking-pass/${booking.id}`
  );
  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { qrCode: QRcode },
  });

  // Notify Owner & User
  NotificationService.publishEvent("WALLET_BOOKING_CONFIRMED", {
    booking: updatedBooking,
    turf,
    user,
    ownerId: turf.owner.userId,
    formattedDate,
    formattedStartTime,
    formattedEndTime: format(adjustedEndTime, "hh:mm a"),
    ticketUrl: `${process.env.USER_URL || "https://kridaz.com"}/booking-pass/${booking.id}`,
    invoiceUrl: `${process.env.APP_BASE_URL || "https://api.kridaz.com"}/api/booking/user/invoice/${booking.id}`,
  });

  return updatedBooking;
};

/**
 * Gets detailed booking by ID with full includes.
 * @param {string} id - Booking ID.
 * @returns {Promise<object|null>}
 */
export const findBookingDetailsById = async (id) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      timeSlot: true,
      turf: {
        include: {
          owner: {
            include: { user: true },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          profilePicture: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (booking) return booking;

  // Fallback: Check if the ID belongs to a HostedGame
  const hostedGame = await prisma.hostedGame.findUnique({
    where: { id },
    include: {
      turf: {
        include: {
          owner: {
            include: { user: true },
          },
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          profilePicture: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (hostedGame) {
    let startTime;
    if (hostedGame.time && hostedGame.time.includes(":")) {
      const [startHour, startMinute] = hostedGame.time.split(":");
      startTime = new Date(hostedGame.date);
      startTime.setHours(
        parseInt(startHour, 10),
        parseInt(startMinute, 10),
        0,
        0
      );
    } else {
      startTime = new Date(hostedGame.date);
    }

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 3);

    const turfPrice = hostedGame.turf?.pricePerHour || 1500;
    const finalPrice =
      Number(hostedGame.totalCost) ||
      Number(hostedGame.groundCost) ||
      turfPrice;

    const QRcode = await generateQRCode(
      `${process.env.USER_URL || "https://kridaz.com"}/booking-pass/${hostedGame.id}`
    );

    return {
      id: hostedGame.id,
      userId: hostedGame.hostId,
      turfId: hostedGame.turfId,
      playStartTime: startTime,
      playEndTime: endTime,
      totalPrice: finalPrice,
      paidAmount: finalPrice,
      balanceAmount: 0,
      advanceAmount: finalPrice,
      paymentType: "FULL",
      paymentMethod: "WALLET",
      paymentStatus: "SUCCESS",
      status: "CONFIRMED",
      createdAt: hostedGame.createdAt,
      qrCode: QRcode,
      timeSlot: {
        id: "game_slot_" + hostedGame.id,
        turfId: hostedGame.turfId,
        startTime: startTime,
        endTime: endTime,
        price: finalPrice,
      },
      turf: hostedGame.turf,
      user: hostedGame.host,
      isGameTicket: true,
    };
  }

  return null;
};

/**
 * Gets all bookings made by a user (detailed view).
 * @param {string} userId - User ID.
 * @returns {Promise<Array>}
 */
export const findBookingsByUserDetailed = async (userId) => {
  const standardBookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      timeSlot: true,
      turf: true,
    },
  });

  const hostedGames = await prisma.hostedGame.findMany({
    where: { hostId: userId },
    include: {
      turf: true,
    },
  });

  const formattedHostedGames = hostedGames.map((game) => {
    let startTime;
    if (game.time && game.time.includes(":")) {
      const [startHour, startMinute] = game.time.split(":");
      startTime = new Date(game.date);
      startTime.setHours(
        parseInt(startHour, 10),
        parseInt(startMinute, 10),
        0,
        0
      );
    } else {
      startTime = new Date(game.date);
    }

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 3);

    const turfPrice = game.turf?.pricePerHour || 1500;
    const finalPrice =
      Number(game.totalCost) || Number(game.groundCost) || turfPrice;

    return {
      id: game.id,
      userId: game.hostId,
      turfId: game.turfId,
      playStartTime: startTime,
      playEndTime: endTime,
      totalPrice: finalPrice,
      paidAmount: finalPrice,
      balanceAmount: 0,
      advanceAmount: finalPrice,
      paymentType: "FULL",
      paymentMethod: "WALLET",
      paymentStatus: "SUCCESS",
      status: "CONFIRMED",
      createdAt: game.createdAt,
      timeSlot: {
        id: "game_slot_" + game.id,
        turfId: game.turfId,
        startTime: startTime,
        endTime: endTime,
        price: finalPrice,
      },
      turf: game.turf,
      isGameTicket: true,
    };
  });

  const allBookings = [...standardBookings, ...formattedHostedGames];

  // Sort descending by createdAt
  allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return allBookings;
};

/**
 * Fetches all bookings belonging to turfs of a specific owner, shaped for the client dashboard.
 * @param {string} ownerUserId - Owner's user ID.
 * @returns {Promise<Array>}
 */
export const findBookingsByOwnerDetailed = async (ownerUserId) => {
  const ownedTurfs = await prisma.turf.findMany({
    where: {
      owner: {
        userId: ownerUserId,
      },
    },
    select: { id: true },
  });

  if (ownedTurfs.length === 0) {
    return [];
  }

  const turfIds = ownedTurfs.map((turf) => turf.id);

  const bookings = await prisma.booking.findMany({
    where: {
      turfId: { in: turfIds },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profilePicture: true,
          email: true,
          phone: true,
        },
      },
      turf: true,
      timeSlot: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return bookings.map((b) => ({
    id: b.id,
    turfName: b.turf?.name,
    userName: b.user?.name || b.guestName || "Partner/Other",
    bookingSource: b.bookingSource,
    totalPrice: b.totalPrice,
    bookingDate: b.createdAt,
    startTime: b.timeSlot?.startTime,
    endTime: b.timeSlot?.endTime,
    duration: b.timeSlot
      ? (new Date(b.timeSlot.endTime) - new Date(b.timeSlot.startTime)) /
        (1000 * 60 * 60)
      : 1,
  }));
};

/**
 * Validates a discount coupon and determines eligible discounts.
 * @param {string} code - The coupon code string.
 * @param {string} turfId - Turf ID code is applied to.
 * @param {number} amount - Ground cost value.
 * @returns {Promise<object>} Computed values.
 */
export const verifyCoupon = async (code, turfId, amount) => {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
    },
  });

  if (!coupon) {
    throw new NotFoundError("Invalid or inactive coupon code.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (new Date() > new Date(coupon.validUntil)) {
    throw new BadRequestError("This coupon has expired.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (coupon.turfId && coupon.turfId !== turfId) {
    throw new BadRequestError("This coupon is not valid for this ground.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
    throw new BadRequestError("This coupon's usage limit has been reached.", {
      code: "VALIDATION_ERROR",
    });
  }

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = amount * (coupon.discountValue / 100);
  } else {
    discount = coupon.discountValue;
  }

  const finalAmount = Math.max(0, amount - discount);

  return {
    discount,
    finalAmount,
  };
};

/**
 * Inserts a manual, off-platform booking record created by the turf owner.
 * @param {string} ownerId - Turf owner's user ID.
 * @param {object} manualData - Manual booking form parameters.
 * @returns {Promise<object>} Confirmed manual booking record.
 */
export const processManualBooking = async (ownerId, manualData) => {
  const {
    turfId,
    startTime,
    endTime,
    selectedTurfDate,
    totalPrice,
    paymentMethod,
    customerName,
    customerEmail,
    customerPhone,
  } = manualData;

  const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
  const parseTime = (timeStr) => {
    if (!timeStr) return new Date();
    if (timeStr.includes("T")) return parseISO(timeStr);
    return parse(timeStr, "hh:mm a", new Date());
  };

  const turfDate = parseISO(selectedTurfDate);
  const startTimeDate = parseTime(startTime);
  const endTimeDate = parseTime(endTime);

  const combineDateAndTime = (dateObj, timeObj) => {
    return new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      timeObj.getHours(),
      timeObj.getMinutes()
    );
  };

  const adjustedStartTime = fromZonedTime(
    combineDateAndTime(turfDate, startTimeDate),
    timeZone
  );
  const adjustedEndTime = fromZonedTime(
    combineDateAndTime(turfDate, endTimeDate),
    timeZone
  );

  const turf = await prisma.turf.findUnique({
    where: { id: turfId },
    include: { owner: true },
  });

  if (!turf || turf.owner.userId !== ownerId) {
    throw new ForbiddenError("Unauthorized or Turf not found.", {
      code: "FORBIDDEN",
    });
  }

  // Overlap Guard
  const overlapping = await prisma.timeSlot.findFirst({
    where: {
      turfId,
      OR: [
        { startTime: { lt: adjustedEndTime, gte: adjustedStartTime } },
        { endTime: { gt: adjustedStartTime, lte: adjustedEndTime } },
        {
          startTime: { lte: adjustedStartTime },
          endTime: { gte: adjustedEndTime },
        },
      ],
    },
  });

  if (overlapping) {
    throw new BadRequestError("This slot is no longer available.", {
      code: "SLOT_UNAVAILABLE",
    });
  }

  const booking = await prisma.$transaction(async (tx) => {
    const timeSlot = await tx.timeSlot.create({
      data: {
        turfId,
        startTime: adjustedStartTime,
        endTime: adjustedEndTime,
      },
    });

    return await tx.booking.create({
      data: {
        userId: ownerId,
        turfId,
        timeSlotId: timeSlot.id,
        playStartTime: adjustedStartTime,
        playEndTime: adjustedEndTime,
        totalPrice,
        paidAmount: totalPrice,
        balanceAmount: 0,
        paymentMethod: paymentMethod || "CASH",
        status: "CONFIRMED",
        bookingSource: "PARTNER_MANUAL",
        guestName: customerName,
        guestEmail: customerEmail,
        guestPhone: customerPhone,
      },
    });
  });

  const qrUrl = `${process.env.USER_URL || "https://kridaz.com"}/booking-pass/${booking.id}`;
  const QRcode = await generateQRCode(qrUrl);

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { qrCode: QRcode },
  });

  if (customerEmail || customerPhone) {
    NotificationService.publishEvent("MANUAL_BOOKING_CREATED", {
      booking: updatedBooking,
      turf,
      guestName: customerName || "Guest",
      guestEmail: customerEmail,
      phone: customerPhone,
      email: customerEmail,
      formattedDate: format(turfDate, "d MMM yyyy"),
      formattedStartTime: format(adjustedStartTime, "hh:mm a"),
      formattedEndTime: format(adjustedEndTime, "hh:mm a"),
    });
  }

  return updatedBooking;
};

/**
 * Processes cancellation rules and executes refund transaction.
 * @param {string} userId - ID of the user requesting cancellation.
 * @param {string} bookingId - Booking ID to cancel.
 * @returns {Promise<{ booking: object, refundAmount: number }>}
 */
export const processBookingCancellation = async (userId, bookingId) => {
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        turf: { include: { owner: true } },
        timeSlot: true,
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found.", {
        code: "BOOKING_NOT_FOUND",
      });
    }

    if (booking.userId !== userId) {
      throw new ForbiddenError("Unauthorized.", { code: "FORBIDDEN" });
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "PLAYING") {
      throw new BadRequestError(
        "This booking cannot be cancelled at this stage.",
        { code: "BOOKING_CANNOT_CANCEL" }
      );
    }

    const playStartTime = new Date(booking.playStartTime);
    const hoursRemaining = (playStartTime - now) / (1000 * 60 * 60);

    if (hoursRemaining < 72) {
      throw new BadRequestError(
        "Cancellations are only allowed at least 72 hours before the slot time.",
        { code: "CANCELLATION_WINDOW_EXPIRED" }
      );
    }

    const refundAmount = Math.round(booking.paidAmount * 0.3);

    // 1. Update Booking
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        revenueStatus: refundAmount > 0 ? "REFUNDED" : undefined,
      },
    });

    // 2. Refund to User Wallet
    if (refundAmount > 0) {
      await WalletService.credit(userId, "user", refundAmount, tx);

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: refundAmount,
          type: "REFUND",
          status: "SUCCESS",
          description: `30% refund for cancelled booking #${bookingId.slice(-6).toUpperCase()}`,
          bookingId: bookingId,
        },
      });
    }

    // 3. Update Owner Balance
    if (booking.turf?.owner) {
      await tx.ownerProfile.update({
        where: { id: booking.turf.owner.id },
        data: { pendingBalance: { decrement: booking.ownerRevenue } },
      });
    }

    // 4. Delete TimeSlot
    if (booking.timeSlotId) {
      await tx.timeSlot.delete({ where: { id: booking.timeSlotId } });
    }

    // Trigger Notification
    // Trigger Notification
    NotificationService.publishEvent("BOOKING_CANCELLED", {
      recipientId: userId,
      recipientModel: "User",
      email: booking.user?.email,
      phone: booking.user?.phone,
      userName: booking.user?.name || "Player",
      turfName: booking.turf?.name,
      date: booking.timeSlot
        ? format(new Date(booking.timeSlot.startTime), "d MMM yyyy")
        : "the scheduled date",
      refundAmount: refundAmount,
    });

    return { booking: updatedBooking, refundAmount };
  });
};

/**
 * Returns a paginated list of bookings based on optional filters for Admin.
 * @param {object} filters - Paginated filter parameters.
 * @returns {Promise<object>} List of bookings and total matches.
 */
export const findAdminBookings = async (filters) => {
  const {
    status,
    page = 1,
    limit = 20,
    turfId,
    userId,
    startDate,
    endDate,
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;
  if (turfId) where.turfId = turfId;
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        turf: { select: { id: true, name: true, city: true, state: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total };
};
