import { prisma } from "../../config/prisma.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
  InternalError,
} from "@kridaz/common";
import NotificationService from "../../services/notification.service.js";
import logger from "../../utils/logger.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

/**
 * USER: Raise a new dispute for a booking in the IN_REVIEW_WINDOW
 */
export const raiseDispute = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      bookingId,
      reason,
      customReason,
      description,
      requestType,
      preferredSlots,
    } = req.body;

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, "disputes");
        imageUrls.push(url);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let booking = await tx.booking.findFirst({
        where: {
          id: bookingId,
          userId: userId,
          status: {
            in: ["CONFIRMED", "PLAYING", "IN_REVIEW_WINDOW", "COMPLETED"],
          },
        },
        include: { turf: true },
      });

      let professionalBooking = null;

      if (!booking) {
        professionalBooking = await tx.onDemandProfessionalBooking.findFirst({
          where: {
            id: bookingId,
            userId: userId,
            status: {
              in: [
                "ASSIGNED",
                "IN_PROGRESS",
                "PENDING_COMPLETION",
                "COMPLETED",
              ],
            },
          },
          include: { professional: true },
        });

        if (!professionalBooking) {
          throw new NotFoundError(
            "Booking not found or not eligible for dispute.",
            { code: "ENTITY_NOT_FOUND" }
          );
        }
      }

      const activeBooking = booking || professionalBooking;

      if (activeBooking.status === "COMPLETED") {
        if (activeBooking.isManuallyCompleted) {
          throw new ConflictError(
            "Cannot raise a dispute for a booking that you manually marked as complete.",
            { code: "CONFLICT" }
          );
        }
        const timeSinceCompletion =
          Date.now() - new Date(activeBooking.updatedAt).getTime();
        if (timeSinceCompletion > 12 * 60 * 60 * 1000) {
          throw new BadRequestError(
            "Dispute window has closed. You can only raise a dispute within 12 hours of auto-completion.",
            { code: "BAD_REQUEST" }
          );
        }
      }

      // Check if dispute already exists
      const existingDispute = await tx.dispute.findFirst({
        where: booking
          ? { bookingId: booking.id }
          : { onDemandBookingId: professionalBooking.id },
      });

      if (existingDispute) {
        throw new ConflictError(
          "A dispute is already active for this booking.",
          { code: "CONFLICT" }
        );
      }

      // Calculate SLA
      let slaDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000); // default 12 hours
      const now = new Date();
      if (booking && booking.playStartTime) {
        if (
          new Date(booking.playStartTime).toDateString() === now.toDateString()
        ) {
          slaDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        }
      } else if (professionalBooking && professionalBooking.matchEndParsed) {
        if (
          new Date(professionalBooking.matchEndParsed).toDateString() ===
          now.toDateString()
        ) {
          slaDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        }
      }

      // 1. Create the dispute
      const disputeReason = reason === "Other" ? customReason : reason;
      const newDispute = await tx.dispute.create({
        data: {
          bookingId: booking ? booking.id : undefined,
          onDemandBookingId: professionalBooking
            ? professionalBooking.id
            : undefined,
          raisedById: userId,
          ownerId: booking
            ? booking.turf.ownerId
            : professionalBooking.professional.id,
          reason: disputeReason,
          description,
          images: imageUrls,
          requestType: requestType || "WALLET_REFUND",
          preferredSlots: preferredSlots || null,
          slaDeadline,
          status: "OPEN",
          bookingDetails: booking
            ? {
                turfName: booking.turf.name,
                playStartTime: booking.playStartTime,
                playEndTime: booking.playEndTime,
                totalPrice: Number(booking.totalPrice),
                ownerRevenue: Number(booking.ownerRevenue),
              }
            : {
                professionalName: professionalBooking.professional.businessName,
                hourlyRate: Number(professionalBooking.hourlyRate),
                blockedAmount: Number(professionalBooking.blockedAmount),
              },
        },
      });

      // 2. Update Booking Status
      if (booking) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "DISPUTED" },
        });
      } else {
        await tx.onDemandProfessionalBooking.update({
          where: { id: professionalBooking.id },
          data: { status: "DISPUTED", disputeRaisedAt: new Date() },
        });
      }

      // 3. Freeze Funds from Owner
      // Determine where the funds currently reside based on the booking's previous status
      let balanceUpdate = {};
      let amountToFreeze = booking
        ? booking.ownerRevenue
        : professionalBooking.blockedAmount;

      if (booking) {
        if (booking.status === "CONFIRMED" || booking.status === "PLAYING") {
          balanceUpdate = {
            pendingBalance: { decrement: amountToFreeze },
            disputeBalance: { increment: amountToFreeze },
          };
        } else if (
          booking.status === "IN_REVIEW_WINDOW" ||
          booking.status === "COMPLETED"
        ) {
          balanceUpdate = {
            inProgressBalance: { decrement: amountToFreeze },
            disputeBalance: { increment: amountToFreeze },
          };
        }
      } else {
        // For professional booking, funds are in pendingBalance if not completed, or inProgress/wallet?
        // We will just move from pendingBalance for now. Let's assume blockedAmount is what the user paid.
        balanceUpdate = {
          pendingBalance: { decrement: amountToFreeze },
          disputeBalance: { increment: amountToFreeze },
        };
      }

      const owner = await tx.ownerProfile.update({
        where: {
          id: booking
            ? booking.turf.ownerId
            : professionalBooking.professional.id,
        },
        data: balanceUpdate,
      });

      await tx.walletTransaction.create({
        data: {
          userId: owner.userId,
          type: "DISPUTE_FREEZE",
          amount: amountToFreeze,
          bookingId: booking ? booking.id : undefined,
          onDemandBookingId: professionalBooking
            ? professionalBooking.id
            : undefined,
          disputeId: newDispute.id,
          status: "SUCCESS",
          description: `Funds frozen due to dispute on booking ${activeBooking.id}`,
        },
      });

      return {
        newDispute,
        activeBooking,
        owner,
        disputeReason,
        isProfessional: !!professionalBooking,
      };
    });

    const { newDispute, activeBooking, owner, disputeReason, isProfessional } =
      result;

    // ── Notifications (Queued) ──────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });

    NotificationService.notifyAdmins({
      title: "New Dispute Raised",
      message: `A dispute has been raised for booking ${activeBooking.id} (${disputeReason}).`,
      type: "SUPPORT",
      link: "/admin/disputes",
    });

    if (owner) {
      NotificationService.sendInApp({
        recipientId: owner.id,
        recipientModel: "Owner",
        title: "Dispute Raised on Booking",
        message: `A user has raised a dispute for your turf booking. Funds have been frozen until resolution.`,
        type: "SUPPORT",
        link: "/venue-owner/dashboard",
      });
    }

    if (user) {
      await NotificationService.publishEvent("DISPUTE_RAISED", {
        email: user.email,
        phone: user.phone,
        recipientId: userId,
        recipientModel: "User",
        bookingId: activeBooking.id,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Dispute raised successfully.",
      data: newDispute,
    });
  } catch (error) {
    logger.error("[DISPUTE] Error raising dispute:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to raise dispute.",
    });
  }
};

/**
 * USER/ADMIN: Add a reply to a dispute thread
 */
export const replyToDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { message, senderRole } = req.body; // 'USER' or 'ADMIN'
    const userId = req.user.id;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) {
      return res
        .status(404)
        .json({ success: false, message: "Dispute not found." });
    }

    if (dispute.status === "RESOLVED") {
      return res.status(400).json({
        success: false,
        message: "Cannot reply to a resolved dispute.",
      });
    }

    const reply = await prisma.disputeReply.create({
      data: {
        disputeId,
        senderId: userId,
        senderType:
          senderRole || (req.user.role === "ADMIN" ? "ADMIN" : "USER"),
        message,
        images: [],
      },
    });

    let newStatus = dispute.status;
    if (
      senderRole === "ADMIN" &&
      (dispute.status === "PENDING" || dispute.status === "OPEN")
    ) {
      newStatus = "INVESTIGATING";
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: newStatus,
      },
      include: { replies: true },
    });

    // ── Notifications (Queued) ──────────────────────────────────────────────────────────
    if (senderRole === "ADMIN" || req.user.role === "ADMIN") {
      NotificationService.sendInApp({
        recipientId: updatedDispute.raisedById,
        recipientModel: "User",
        title: "New Message in Dispute",
        message: `An admin has replied to your dispute.`,
        type: "SUPPORT",
        link: "/profile/bookings",
      });
    } else {
      NotificationService.notifyAdmins({
        title: "User replied to Dispute",
        message: `User has replied to the dispute for booking ${updatedDispute.bookingId}.`,
        type: "SUPPORT",
        link: "/admin/disputes",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reply added successfully.",
      data: updatedDispute,
    });
  } catch (error) {
    logger.error("[DISPUTE] Error replying to dispute:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to add reply." });
  }
};

/**
 * USER: Get disputes raised by the user
 */
export const getUserDisputes = async (req, res) => {
  try {
    const userId = req.user.id;
    const disputes = await prisma.dispute.findMany({
      where: { raisedById: userId },
      include: {
        booking: {
          select: { qrCode: true, paymentMethod: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    logger.error("[DISPUTE] Error fetching user disputes:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch disputes." });
  }
};

/**
 * ADMIN: List all disputes
 */
export const getAllDisputes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const type = req.query.type;

    const where = {};
    if (status) where.status = status;
    if (type === "professional") {
      where.onDemandBookingId = { not: null };
    } else if (type === "turf") {
      where.bookingId = { not: null };
    }
    if (req.query.all !== "true") {
      where.isEscalated = true;
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          raisedBy: { select: { name: true, email: true, phone: true } },
          owner: { select: { id: true, businessName: true } },
          onDemandBooking: {
            include: {
              professional: { select: { id: true, businessName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: disputes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("[DISPUTE] Error fetching all disputes:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch disputes." });
  }
};

/**
 * ADMIN: Get single dispute details
 */
export const getDisputeById = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        raisedBy: { select: { name: true, email: true, phone: true } },
        owner: { select: { id: true, businessName: true } },
        replies: true,
        booking: {
          include: { turf: { select: { name: true, location: true } } },
        },
        onDemandBooking: {
          include: {
            professional: { select: { businessName: true, phone: true } },
          },
        },
      },
    });

    if (!dispute) {
      return res
        .status(404)
        .json({ success: false, message: "Dispute not found." });
    }

    return res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    logger.error("[DISPUTE] Error fetching dispute details:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch dispute details." });
  }
};

/**
 * ADMIN: Resolve a dispute (Release funds to owner or Refund to user)
 */
export const resolveDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { resolutionAction, resolutionNotes, partialAmount } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { booking: true, onDemandBooking: true },
      });
      if (!dispute) {
        throw new NotFoundError("Dispute not found.", {
          code: "ENTITY_NOT_FOUND",
        });
      }

      if (dispute.status === "RESOLVED") {
        throw new ConflictError("Dispute is already resolved.", {
          code: "CONFLICT",
        });
      }

      const isProfessional = !!dispute.onDemandBooking;
      const activeBooking = isProfessional
        ? dispute.onDemandBooking
        : dispute.booking;
      const ownerId = dispute.ownerId;
      const ownerRevenue = isProfessional
        ? Number(activeBooking.blockedAmount)
        : Number(activeBooking.ownerRevenue);

      if (resolutionAction === "RELEASE_TO_OWNER") {
        if (ownerId) {
          await tx.ownerProfile.update({
            where: { id: ownerId },
            data: {
              disputeBalance: { decrement: ownerRevenue },
              walletBalance: { increment: ownerRevenue },
            },
          });

          const owner = await tx.ownerProfile.findUnique({
            where: { id: ownerId },
          });
          await tx.walletTransaction.create({
            data: {
              userId: owner.userId,
              type: "DISPUTE_RELEASE",
              amount: ownerRevenue,
              bookingId: !isProfessional ? activeBooking.id : undefined,
              onDemandBookingId: isProfessional ? activeBooking.id : undefined,
              disputeId: dispute.id,
              status: "SUCCESS",
              description: `Funds released from dispute for booking ${activeBooking.id}`,
            },
          });
        }

        if (!isProfessional) {
          await tx.booking.update({
            where: { id: activeBooking.id },
            data: {
              status: "COMPLETED",
              revenueStatus: "SETTLED",
              settledAt: new Date(),
            },
          });
        } else {
          await tx.onDemandProfessionalBooking.update({
            where: { id: activeBooking.id },
            data: {
              status: "COMPLETED",
              fundsReleasedAt: new Date(),
            },
          });
        }
      } else if (resolutionAction === "REFUND_TO_USER") {
        if (ownerId) {
          await tx.ownerProfile.update({
            where: { id: ownerId },
            data: { disputeBalance: { decrement: ownerRevenue } },
          });
        }

        // Refund user wallet
        if (activeBooking.userId) {
          await tx.user.update({
            where: { id: activeBooking.userId },
            data: { walletBalance: { increment: ownerRevenue } },
          });

          await tx.walletTransaction.create({
            data: {
              userId: activeBooking.userId,
              type: "DISPUTE_REFUND",
              amount: ownerRevenue,
              bookingId: !isProfessional ? activeBooking.id : undefined,
              onDemandBookingId: isProfessional ? activeBooking.id : undefined,
              disputeId: dispute.id,
              status: "SUCCESS",
              description: `Full refund from dispute resolution for booking ${activeBooking.id}`,
            },
          });
        }

        if (!isProfessional) {
          await tx.booking.update({
            where: { id: activeBooking.id },
            data: {
              status: "CANCELLED",
              revenueStatus: "REFUNDED",
            },
          });
        } else {
          await tx.onDemandProfessionalBooking.update({
            where: { id: activeBooking.id },
            data: {
              status: "CANCELLED", // Or however cancelled is tracked
            },
          });
        }
      } else if (resolutionAction === "PARTIAL_REFUND") {
        const pAmount = Number(partialAmount);
        if (!pAmount || pAmount <= 0 || pAmount > ownerRevenue) {
          throw new BadRequestError("Invalid partial refund amount.", {
            code: "BAD_REQUEST",
          });
        }

        const amountToOwner = ownerRevenue - pAmount;
        if (ownerId) {
          await tx.ownerProfile.update({
            where: { id: ownerId },
            data: {
              disputeBalance: { decrement: ownerRevenue },
              walletBalance: { increment: amountToOwner },
            },
          });

          const owner = await tx.ownerProfile.findUnique({
            where: { id: ownerId },
          });
          await tx.walletTransaction.create({
            data: {
              userId: owner.userId,
              type: "DISPUTE_RELEASE",
              amount: amountToOwner,
              bookingId: !isProfessional ? activeBooking.id : undefined,
              onDemandBookingId: isProfessional ? activeBooking.id : undefined,
              disputeId: dispute.id,
              status: "SUCCESS",
              description: `Partial funds released (₹${amountToOwner}) after dispute resolution.`,
            },
          });
        }

        // Refund partial amount to user wallet
        if (activeBooking.userId) {
          await tx.user.update({
            where: { id: activeBooking.userId },
            data: { walletBalance: { increment: pAmount } },
          });

          await tx.walletTransaction.create({
            data: {
              userId: activeBooking.userId,
              type: "DISPUTE_REFUND",
              amount: pAmount,
              bookingId: !isProfessional ? activeBooking.id : undefined,
              onDemandBookingId: isProfessional ? activeBooking.id : undefined,
              disputeId: dispute.id,
              status: "SUCCESS",
              description: `Partial refund (₹${pAmount}) from dispute resolution for booking ${activeBooking.id}`,
            },
          });
        }

        if (!isProfessional) {
          await tx.booking.update({
            where: { id: activeBooking.id },
            data: {
              status: "COMPLETED",
              revenueStatus: "SETTLED",
            },
          });
        } else {
          await tx.onDemandProfessionalBooking.update({
            where: { id: activeBooking.id },
            data: {
              status: "COMPLETED",
              fundsReleasedAt: new Date(),
            },
          });
        }
      } else if (resolutionAction === "CLOSE_NO_ACTION") {
        if (ownerId) {
          await tx.ownerProfile.update({
            where: { id: ownerId },
            data: {
              disputeBalance: { decrement: ownerRevenue },
              walletBalance: { increment: ownerRevenue },
            },
          });
        }

        if (!isProfessional) {
          await tx.booking.update({
            where: { id: activeBooking.id },
            data: {
              status: "COMPLETED",
              revenueStatus: "SETTLED",
            },
          });
        } else {
          await tx.onDemandProfessionalBooking.update({
            where: { id: activeBooking.id },
            data: {
              status: "COMPLETED",
              fundsReleasedAt: new Date(),
            },
          });
        }
      } else {
        throw new BadRequestError("Invalid resolution action.", {
          code: "BAD_REQUEST",
        });
      }

      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: "RESOLVED",
          resolution: {
            action: resolutionAction,
            notes: resolutionNotes,
            partialAmount: partialAmount || 0,
            resolvedAt: new Date(),
          },
        },
      });

      return {
        dispute: updatedDispute,
        activeBooking,
        ownerId,
        isProfessional,
      };
    });

    const { dispute, activeBooking, ownerId, isProfessional } = result;

    // ── Notifications (Queued) ──────────────────────────────────────────────────────────
    const raisingUser = await prisma.user.findUnique({
      where: { id: dispute.raisedById },
      select: { email: true, phone: true },
    });

    if (raisingUser) {
      await NotificationService.publishEvent("DISPUTE_RESOLVED", {
        email: raisingUser.email,
        phone: raisingUser.phone,
        recipientId: dispute.raisedById,
        recipientModel: "User",
        bookingId: activeBooking.id,
        resolutionAction,
      });
    }

    if (ownerId) {
      const owner = await prisma.ownerProfile.findUnique({
        where: { id: ownerId },
        include: { user: true },
      });
      if (owner) {
        await NotificationService.publishEvent("DISPUTE_RESOLVED", {
          email: owner.email,
          phone: owner.user?.phone,
          recipientId: owner.userId,
          recipientModel: "User",
          bookingId: activeBooking.id,
          resolutionAction,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Dispute resolved successfully. Action: ${resolutionAction}`,
      data: dispute,
    });
  } catch (error) {
    logger.error("[DISPUTE] Error resolving dispute:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to resolve dispute.",
    });
  }
};

/**
 * OWNER: Take action on a dispute (APPROVE_REFUND, APPROVE_RESCHEDULE, REJECT)
 */
export const ownerActionDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { action, reason } = req.body;
    const ownerUserId = req.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { booking: true, onDemandBooking: true },
      });

      if (!dispute)
        throw new NotFoundError("Dispute not found.", { code: "NOT_FOUND" });
      if (dispute.isEscalated || dispute.status === "RESOLVED") {
        throw new BadRequestError("Dispute is already escalated or resolved.", {
          code: "BAD_REQUEST",
        });
      }

      // Verify the caller is the owner
      const ownerProfile = await tx.ownerProfile.findUnique({
        where: { userId: ownerUserId },
      });
      if (!ownerProfile || ownerProfile.id !== dispute.ownerId) {
        throw new ForbiddenError("You are not the owner of this dispute.", {
          code: "FORBIDDEN",
        });
      }

      const isProfessional = !!dispute.onDemandBooking;
      const activeBooking = isProfessional
        ? dispute.onDemandBooking
        : dispute.booking;
      const ownerRevenue = isProfessional
        ? Number(activeBooking.blockedAmount)
        : Number(activeBooking.ownerRevenue);

      let newStatus = "RESOLVED";

      if (action === "APPROVE_REFUND") {
        await tx.ownerProfile.update({
          where: { id: ownerProfile.id },
          data: { disputeBalance: { decrement: ownerRevenue } },
        });

        if (activeBooking.userId) {
          await tx.user.update({
            where: { id: activeBooking.userId },
            data: { walletBalance: { increment: ownerRevenue } },
          });

          await tx.walletTransaction.create({
            data: {
              userId: activeBooking.userId,
              type: "DISPUTE_REFUND",
              amount: ownerRevenue,
              bookingId: !isProfessional ? activeBooking.id : undefined,
              onDemandBookingId: isProfessional ? activeBooking.id : undefined,
              disputeId: dispute.id,
              status: "SUCCESS",
              description: `Owner approved full refund for booking ${activeBooking.id}`,
            },
          });
        }

        if (!isProfessional) {
          await tx.booking.update({
            where: { id: activeBooking.id },
            data: { status: "CANCELLED", revenueStatus: "REFUNDED" },
          });
        } else {
          await tx.onDemandProfessionalBooking.update({
            where: { id: activeBooking.id },
            data: { status: "CANCELLED" },
          });
        }
      } else if (action === "APPROVE_RESCHEDULE") {
        // Let's just mark as RESOLVED for now. Follow-up new booking logic will consume wallet.
      } else if (action === "REJECT") {
        newStatus = "OPEN";
      } else {
        throw new BadRequestError("Invalid action", { code: "BAD_REQUEST" });
      }

      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          ownerAction: action,
          ownerActionReason: reason,
          status: newStatus,
          ...(newStatus === "RESOLVED" && {
            resolvedAt: new Date(),
            outcome: "OWNER_RESOLVED",
          }),
        },
      });

      return { updatedDispute, activeBooking };
    });

    return res.status(200).json({
      success: true,
      message: `Dispute action ${action} recorded`,
      data: result.updatedDispute,
    });
  } catch (error) {
    logger.error("[DISPUTE] Error processing owner action:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to process owner action.",
    });
  }
};

/**
 * USER: Escalate dispute to admin
 */
export const escalateDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const userId = req.user.id;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute)
      return res
        .status(404)
        .json({ success: false, message: "Dispute not found" });

    if (dispute.raisedById !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    if (dispute.status === "RESOLVED") {
      return res
        .status(400)
        .json({ success: false, message: "Already resolved" });
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: { isEscalated: true },
    });

    return res.status(200).json({
      success: true,
      message: "Dispute escalated to KRIDAZ Admin",
      data: updatedDispute,
    });
  } catch (error) {
    logger.error("[DISPUTE] Error escalating:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to escalate.",
    });
  }
};
