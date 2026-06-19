import { prisma } from "../config/prisma.js";
import { getIO } from "../config/socket.js";
import logger from "../utils/logger.js";

/**
 * OTPService
 * Generates, stores, and validates plain-text session check-in OTP codes.
 */
export class OTPService {
  /**
   * Generate a 6-digit check-in OTP for a booking.
   * @param {string} bookingId - ID of the OnDemandProfessionalBooking
   * @returns {Promise<string>} The generated OTP code
   */
  static async generateOTP(bookingId) {
    try {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      await prisma.onDemandProfessionalBooking.update({
        where: { id: bookingId },
        data: {
          otpCode,
          otpAttempts: 0,
        },
      });

      logger.info(
        `[OTPService] Generated check-in OTP for booking ${bookingId}`
      );
      return otpCode;
    } catch (error) {
      logger.error(
        `[OTPService] Failed to generate OTP for booking ${bookingId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Verify the check-in OTP entered by the professional.
   * @param {string} bookingId - ID of the OnDemandProfessionalBooking
   * @param {string} enteredOtp - The OTP code entered by the professional
   * @returns {Promise<object>} The verification result object
   */
  static async verifyOTPCheckIn(bookingId, enteredOtp) {
    try {
      // 1. Fetch booking
      const booking = await prisma.onDemandProfessionalBooking.findUnique({
        where: { id: bookingId },
        include: { user: true, professional: true },
      });

      if (!booking) {
        return {
          success: false,
          status: "NOT_FOUND",
          message: "Booking not found",
        };
      }

      if (booking.status !== "CONFIRMED") {
        return {
          success: false,
          status: "INVALID_STATE",
          message: `Booking must be in CONFIRMED status to check in. Current status: ${booking.status}`,
        };
      }

      // Check locked limit
      if (booking.otpAttempts >= 3) {
        await prisma.onDemandProfessionalBooking.update({
          where: { id: bookingId },
          data: { otpAttempts: 0 },
        });
        return {
          success: false,
          status: "LOCKED",
          message: "Ask user to share OTP again",
        };
      }

      // 2. Validate OTP
      if (booking.otpCode === enteredOtp) {
        // Success check-in! Transition to IN_PROGRESS
        const updatedBooking = await prisma.onDemandProfessionalBooking.update({
          where: { id: bookingId },
          data: {
            status: "IN_PROGRESS",
            otpEnteredAt: new Date(),
            otpAttempts: 0,
          },
        });

        logger.info(
          `[OTPService] Check-in successful for booking ${bookingId}`
        );

        // Notify user and professional via socket
        const io = getIO();
        if (io) {
          io.to(booking.userId).emit("professional:checked_in", {
            bookingId,
            message: "Professional has checked in. Match has started!",
          });
          if (booking.professional?.userId) {
            io.to(booking.professional.userId).emit(
              "professional:check_in_success",
              {
                bookingId,
                message: "Check-in successful. Enjoy the session!",
              }
            );
          }
        }

        return {
          success: true,
          status: "IN_PROGRESS",
          booking: updatedBooking,
        };
      } else {
        // Incorrect OTP
        const newAttempts = booking.otpAttempts + 1;

        if (newAttempts >= 3) {
          // Lock state and reset attempts
          await prisma.onDemandProfessionalBooking.update({
            where: { id: bookingId },
            data: { otpAttempts: 0 },
          });
          logger.warn(
            `[OTPService] Booking ${bookingId} check-in locked due to 3 failed attempts.`
          );
          return {
            success: false,
            status: "LOCKED",
            message: "Ask user to share OTP again",
          };
        } else {
          // Increment attempts
          await prisma.onDemandProfessionalBooking.update({
            where: { id: bookingId },
            data: { otpAttempts: newAttempts },
          });
          return {
            success: false,
            status: "INVALID",
            attemptsRemaining: 3 - newAttempts,
            message: "Invalid OTP",
          };
        }
      }
    } catch (error) {
      logger.error(
        `[OTPService] Error verifying OTP check-in for booking ${bookingId}:`,
        error
      );
      return { success: false, status: "ERROR", message: error.message };
    }
  }
}

export default OTPService;
