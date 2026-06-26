import asyncHandler from "../../utils/asyncHandler.js";
import * as bookingService from "./booking.service.js";
import { generateInvoice } from "../../utils/generateInvoice.js";
import { format } from "date-fns";
import logger from "../../utils/logger.js";
import { NotFoundError, ForbiddenError } from "@kridaz/common";

const isAuthorizedForBooking = (req, booking) => {
  if (!req.user) return false;
  
  const userId = req.user.id;
  const role = req.user.role?.toUpperCase();
  
  // Platform admins (BMSP_*) are always allowed
  if (role && role.startsWith("BMSP_")) {
    return true;
  }
  
  // Owner is allowed if they own the turf
  if (booking.turf?.owner?.userId === userId) {
    return true;
  }
  
  // User who made the booking is allowed
  if (booking.userId === userId) {
    return true;
  }

  // Host of the game is allowed
  if (booking.hostId === userId) {
    return true;
  }

  return false;
};

// --- USER OPERATIONS ---

/**
 * Creates a Razorpay order for booking.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { order, user } = await bookingService.createRazorpayOrder(
    userId,
    req.body
  );
  return res.status(200).json({
    order,
    user,
  });
});

/**
 * Verifies Razorpay payment signature and completes booking.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const booking = await bookingService.verifyBookingPayment(userId, req.body);
  return res.status(200).json({
    success: true,
    message: "Booking successful, Check your email for the receipt",
    bookingId: booking.id,
  });
});

/**
 * Instantly confirms booking by deducting amount from customer wallet.
 */
export const bookWithWallet = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const booking = await bookingService.processWalletBooking(userId, req.body);
  return res.status(200).json({
    success: true,
    message: "Booking successful with Wallet",
    bookingId: booking.id,
  });
});

/**
 * Retrieves a detailed booking by ID.
 */
export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingService.findBookingDetailsById(id);
  if (!booking)
    throw new NotFoundError("Booking not found", { code: "BOOKING_NOT_FOUND" });
    
  if (!isAuthorizedForBooking(req, booking)) {
    throw new ForbiddenError("Not authorized to view this booking", { code: "FORBIDDEN" });
  }
  
  return res.status(200).json(booking);
});

/**
 * Returns all bookings made by the logged-in user.
 */
export const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const bookings = await bookingService.findBookingsByUserDetailed(userId);
  return res.status(200).json(bookings);
});

// --- OWNER OPERATIONS ---

/**
 * Returns all bookings belonging to the turfs owned by this owner.
 */
export const getOwnerBookings = asyncHandler(async (req, res) => {
  const ownerUserId = req.owner.id;
  const formattedBookings =
    await bookingService.findBookingsByOwnerDetailed(ownerUserId);
  return res.status(200).json(formattedBookings);
});

/**
 * Validates a coupon's active, expiration, and turf limits.
 */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, turfId, amount } = req.body;
  if (!code || !turfId || !amount) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }
  const { discount, finalAmount } = await bookingService.verifyCoupon(
    code,
    turfId,
    amount
  );
  return res.status(200).json({
    success: true,
    discount,
    finalAmount,
    message: "Coupon applied successfully",
  });
});

/**
 * Inserts a manual booking directly from owner control panel.
 */
export const createManualBooking = asyncHandler(async (req, res) => {
  const ownerId = req.owner.id;
  const booking = await bookingService.processManualBooking(ownerId, req.body);
  return res.status(200).json({
    success: true,
    message: "Manual booking created successfully",
    bookingId: booking.id,
  });
});

/**
 * Generates and streams PDF invoice for checking booking check-ins.
 */
export const downloadInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingService.findBookingDetailsById(id);
  if (!booking)
    throw new NotFoundError("Booking not found", { code: "BOOKING_NOT_FOUND" });
    
  if (!isAuthorizedForBooking(req, booking)) {
    throw new ForbiddenError("Not authorized to download this invoice", { code: "FORBIDDEN" });
  }
  
  const customerInfo = booking.user || {
    name: booking.guestName || "Guest Customer",
    email: booking.guestEmail || "N/A",
    phone: booking.guestPhone || "N/A",
  };
  const invoiceBooking = {
    ...booking,
    selectedTurfDate: format(
      new Date(booking.timeSlot?.startTime || booking.createdAt),
      "d MMM yyyy"
    ),
    startTime: format(
      new Date(booking.timeSlot?.startTime || booking.createdAt),
      "hh:mm a"
    ),
    endTime: format(
      new Date(booking.timeSlot?.endTime || booking.createdAt),
      "hh:mm a"
    ),
    duration: booking.timeSlot
      ? Math.ceil(
          (new Date(booking.timeSlot.endTime) -
            new Date(booking.timeSlot.startTime)) /
            (1000 * 60 * 60)
        )
      : 1,
  };
  const pdfBuffer = await generateInvoice(
    invoiceBooking,
    booking.turf,
    customerInfo
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=Invoice-${id.slice(-6).toUpperCase()}.pdf`
  );
  return res.send(pdfBuffer);
});

/**
 * Cancels booking, removes slot, and executes refund (within 72 hour limit).
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.user;
  const { id } = req.params;
  const { refundAmount } = await bookingService.processBookingCancellation(
    userId,
    id
  );
  return res.status(200).json({
    success: true,
    message: `Booking cancelled. Refund of ₹${refundAmount} issued.`,
    refundAmount,
  });
});

// --- ADMIN OPERATIONS ---

/**
 * Fetches platform-wide paginated list of bookings.
 */
export const getAdminAllBookings = asyncHandler(async (req, res) => {
  const { bookings, total } = await bookingService.findAdminBookings(req.query);
  const { page = 1, limit = 20 } = req.query;
  return res.status(200).json({
    success: true,
    data: bookings,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * Processes remaining booking balance payment via user's wallet.
 */
export const payBalance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { bookingId } = req.body;
  
  if (!bookingId) {
    return res.status(400).json({ message: "bookingId is required" });
  }

  const booking = await bookingService.payBookingBalance(userId, bookingId);
  return res.status(200).json({
    success: true,
    message: "Remaining balance paid successfully.",
    bookingId: booking.id,
  });
});
