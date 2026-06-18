import { prisma } from "../config/prisma.js";
import { redisClient } from "../config/redis.js";
import { getIO } from "../config/socket.js";
import { notificationQueue } from "../queues/notification.queue.js";
import { MatchingService } from "./matching.service.js";
import { WalletBlockingService } from "./walletBlocking.service.js";
import { TrustScoreLedgerService } from "./trustScore.service.js";
import { NotificationService } from "./notification.service.js";
import logger from "../utils/logger.js";

/**
 * DispatchService
 * Orchestrates the matching loop, notification dispatches, and timeouts.
 */
export class DispatchService {
  /**
   * Start dispatch process for a matching request
   * @param {string} requestId - The ID of the ProfessionalMatchRequest
   */
  static async startDispatch(requestId) {
    try {
      logger.info(`[DispatchService] Starting dispatch for request ${requestId}`);

      // 1. Load request
      const matchRequest = await prisma.professionalMatchRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!matchRequest || matchRequest.status !== "SEARCHING") {
        logger.warn(`[DispatchService] Request ${requestId} not found or not in SEARCHING status.`);
        return false;
      }

      // 2. Run matching engines to get prioritized candidate pool
      const filtered = await MatchingService.runFilteringEngine({
        sport: "CRICKET", // Default sport context
        role: matchRequest.roles[0], // Primary role requested
        latitude: parseFloat(matchRequest.latitude),
        longitude: parseFloat(matchRequest.longitude),
        startTime: matchRequest.matchStartTime,
        endTime: matchRequest.matchEndTime,
        maxBudget: parseFloat(matchRequest.maxBudget),
      });

      const sorted = await MatchingService.runPrioritizationEngine(filtered);

      if (sorted.length === 0) {
        logger.info(`[DispatchService] No candidates found for request ${requestId}. Failing match.`);
        
        // Update request status
        await prisma.professionalMatchRequest.update({
          where: { id: requestId },
          data: { status: "EXHAUSTED" },
        });

        // Notify user via Socket
        const io = getIO();
        if (io) {
          io.to(matchRequest.userId).emit("professional:match_failed", {
            requestId,
            reason: "no_candidates",
            message: "No professionals available near this location. Try a different time, location, or budget.",
          });
        }

        return false;
      }

      // 3. Save queuePositions in request
      const queuePositions = sorted.map((p) => p.id);
      await prisma.professionalMatchRequest.update({
        where: { id: requestId },
        data: {
          queuePositions,
          currentPositionIndex: 0,
          lastRoutedAt: new Date(),
        },
      });

      // 4. Create the OnDemandProfessionalBooking record in NOTIFYING status
      const firstCandidate = sorted[0];
      const startReq = new Date(matchRequest.matchStartTime);
      const endReq = new Date(matchRequest.matchEndTime);
      const durationHours = (endReq - startReq) / (1000 * 60 * 60);

      // Generate a mock hash for otpHash field constraint
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const booking = await prisma.onDemandProfessionalBooking.create({
        data: {
          requestId,
          userId: matchRequest.userId,
          professionalId: firstCandidate.id,
          role: matchRequest.roles[0],
          groundId: matchRequest.groundId,
          customLocation: matchRequest.customLocation,
          latitude: matchRequest.latitude,
          longitude: matchRequest.longitude,
          hourlyRate: parseFloat(firstCandidate.price),
          blockedAmount: parseFloat(matchRequest.maxBudget),
          matchStartTime: matchRequest.matchStartTime,
          matchEndTime: matchRequest.matchEndTime,
          matchEndParsed: endReq,
          status: "NOTIFYING",
          lockedForProId: firstCandidate.id,
          cycleNumber: 1,
          otpHash: "OTP_HASH_PLACEHOLDER", // Constraint field
          otpCode: otpCode,
        },
      });

      // 5. Reserve funds in user's wallet
      await WalletBlockingService.reserveFunds(matchRequest.userId, booking.id, matchRequest.maxBudget);

      // 6. Notify the first candidate
      await this.notifyCandidate(booking.id, firstCandidate.id, 1);
      return true;
    } catch (error) {
      logger.error(`[DispatchService] Error in startDispatch for request ${requestId}:`, error);
      return false;
    }
  }

  /**
   * Send notification to a specific candidate professional
   */
  static async notifyCandidate(bookingId, professionalId, cycleNumber) {
    try {
      const expiresAt = new Date(Date.now() + 30000); // 30 seconds

      // 1. Create BookingNotification record
      const notification = await prisma.bookingNotification.create({
        data: {
          bookingId,
          professionalId,
          expiresAt,
        },
      });

      // 2. Lock the booking row for this professional
      await prisma.onDemandProfessionalBooking.update({
        where: { id: bookingId },
        data: {
          lockedForProId: professionalId,
          professionalId,
          cycleNumber,
        },
      });

      // 3. Load professional details to get userId
      const pro = await prisma.ownerProfile.findUnique({
        where: { id: professionalId },
        include: { user: true },
      });

      const booking = await prisma.onDemandProfessionalBooking.findUnique({
        where: { id: bookingId },
        include: { ground: true },
      });

      // 4. Send socket event to professional
      const io = getIO();
      if (io && pro.user) {
        const start = new Date(booking.matchStartTime);
        const end = new Date(booking.matchEndTime);
        const durationHours = (end - start) / (1000 * 60 * 60);
        const payout = parseFloat(pro.price) * durationHours;

        const distance = booking.latitude && pro.latitude
          ? MatchingService.calculateDistance ? MatchingService.calculateDistance(booking.latitude, booking.longitude, pro.latitude, pro.longitude) : 5.0
          : 5.0;

        io.to(pro.user.id).emit("professional:booking_offered", {
          notificationId: notification.id,
          bookingId,
          sport: "CRICKET",
          groundName: booking.ground?.name || "Custom Location",
          distance: parseFloat(distance.toFixed(1)),
          duration: durationHours,
          payout: parseFloat(payout.toFixed(2)),
          expiresAt: expiresAt.toISOString(),
        });
      }

      // 5. Queue delayed BullMQ expiry job
      await notificationQueue.add(
        "PRO_OFFER_EXPIRY",
        { bookingId, notificationId: notification.id },
        { delay: 30000 }
      );

      logger.info(`[DispatchService] Dispatched offer notification ${notification.id} to pro ${professionalId}`);
    } catch (error) {
      logger.error(`[DispatchService] Failed to notify candidate pro ${professionalId}:`, error);
      throw error;
    }
  }

  /**
   * Cascade dispatch to the next candidate professional in the queue
   */
  static async dispatchNext(bookingId) {
    try {
      const booking = await prisma.onDemandProfessionalBooking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.status !== "NOTIFYING") {
        logger.warn(`[DispatchService] Booking ${bookingId} not in NOTIFYING status. Stopping dispatch.`);
        return;
      }

      const matchRequest = await prisma.professionalMatchRequest.findUnique({
        where: { id: booking.requestId },
      });

      const queuePositions = matchRequest.queuePositions;
      const nextIndex = matchRequest.currentPositionIndex + 1;

      if (nextIndex < queuePositions.length) {
        // We have a next candidate in this cycle!
        await prisma.professionalMatchRequest.update({
          where: { id: matchRequest.id },
          data: {
            currentPositionIndex: nextIndex,
            lastRoutedAt: new Date(),
          },
        });

        const nextProId = queuePositions[nextIndex];
        await this.notifyCandidate(bookingId, nextProId, booking.cycleNumber);
      } else {
        // End of Cycle candidates reached!
        if (booking.cycleNumber === 1) {
          logger.info(`[DispatchService] Cycle 1 exhausted for booking ${bookingId}. Initiating Cycle 1 skip penalties & Cycle 2.`);

          // 1. Deduct -0.5 trust score from ignores in Cycle 1
          await this.applyCycleSkipPenalties(bookingId, 1);

          // 2. Start Cycle 2: reset index to 0
          await prisma.professionalMatchRequest.update({
            where: { id: matchRequest.id },
            data: {
              currentPositionIndex: 0,
              lastRoutedAt: new Date(),
            },
          });

          // Notify user of search progress
          const io = getIO();
          if (io) {
            io.to(booking.userId).emit("professional:search_cycle_2", {
              bookingId,
              message: "Still searching for a professional. Beginning Cycle 2 search...",
            });
          }

          const firstProId = queuePositions[0];
          await this.notifyCandidate(bookingId, firstProId, 2);
        } else {
          // Cycle 2 exhausted! Match FAILED.
          logger.info(`[DispatchService] Cycle 2 exhausted for booking ${bookingId}. Failing booking.`);

          // 1. Deduct -0.5 trust score from ignores in Cycle 2
          await this.applyCycleSkipPenalties(bookingId, 2);

          // 2. Update booking and request statuses
          await prisma.$transaction([
            prisma.onDemandProfessionalBooking.update({
              where: { id: bookingId },
              data: {
                status: "FAILED",
                lockedForProId: null,
              },
            }),
            prisma.professionalMatchRequest.update({
              where: { id: booking.requestId },
              data: { status: "EXHAUSTED" },
            }),
          ]);

          // 3. Refund user's blocked funds
          await WalletBlockingService.releaseBlockedFunds(booking.userId, bookingId, booking.blockedAmount, false);

          // 4. Notify user via Socket
          const io = getIO();
          if (io) {
            io.to(booking.userId).emit("professional:match_failed", {
              bookingId,
              reason: "exhausted",
              message: "No professional accepted the matching request. Funds have been refunded to your wallet.",
            });

            // Broadcast skipped card removed to all pros
            io.emit("professional:skipped_card_removed", { bookingId });
          }

          const customerUser = await prisma.user.findUnique({ where: { id: booking.userId } });
          NotificationService.publishEvent("PRO_ONDEMAND_EXPIRED", {
            recipientId: booking.userId,
            recipientModel: "User",
            email: customerUser?.email,
            phone: customerUser?.phone,
            customerName: customerUser?.name || "Player"
          });

          // 5. Clean up expired skipped card lists 10 minutes later (via background cron or BullMQ delay)
        }
      }
    } catch (error) {
      logger.error(`[DispatchService] Error in dispatchNext for booking ${bookingId}:`, error);
    }
  }

  /**
   * Handle response from a professional (ACCEPT or REJECT)
   */
  static async handleOfferResponse(notificationId, proId, response) {
    try {
      logger.info(`[DispatchService] Pro ${proId} responded ${response} to notification ${notificationId}`);

      const notification = await prisma.bookingNotification.findUnique({
        where: { id: notificationId },
        include: { booking: true },
      });

      if (!notification || notification.action !== null) {
        return { success: false, status: 400, message: "Offer has already been processed or expired." };
      }

      const booking = notification.booking;

      // Atomic Accept Check (SELECT FOR UPDATE equivalent row check)
      if (response === "ACCEPT") {
        if (booking.lockedForProId && booking.lockedForProId !== proId) {
          // Locked for another candidate (simultaneous skipped card accept race condition)
          return {
            success: false,
            status: 409,
            message: "This booking was accepted by another professional.",
          };
        }

        // Professional wins the lock! Update booking to CONFIRMED
        await prisma.$transaction([
          prisma.bookingNotification.update({
            where: { id: notificationId },
            data: {
              action: "ACCEPTED",
              actedAt: new Date(),
            },
          }),
          prisma.onDemandProfessionalBooking.update({
            where: { id: booking.id },
            data: {
              status: "CONFIRMED",
              professionalId: proId,
              lockedForProId: proId, // Keep locked for active pro
              verifiedAt: new Date(),
            },
          }),
          prisma.professionalMatchRequest.update({
            where: { id: booking.requestId },
            data: { status: "MATCHED" },
          }),
        ]);

        // Reset Skip Counter on active session
        await prisma.umpireSession.updateMany({
          where: { professionalId: proId, sessionEnd: null },
          data: { consecutiveSkipCount: 0 },
        });

        // Add trust score event for booking acceptance (+1 point)
        await TrustScoreLedgerService.recordEvent(proId, "BOOKING_ACCEPTED", 1, booking.id, "Accepted booking");

        // Broadcast skipped card removal to other professionals
        const io = getIO();
        if (io) {
          io.emit("professional:skipped_card_removed", { bookingId: booking.id });
          io.to(booking.userId).emit("professional:match_confirmed", {
            bookingId: booking.id,
            otpCode: booking.otpCode,
          });
        }

        // Clean up this pro's skipped requests list
        await this.removeSkippedCard(proId, booking.id);

        return { success: true, bookingId: booking.id, status: "CONFIRMED" };
      } else {
        // REJECT
        await prisma.bookingNotification.update({
          where: { id: notificationId },
          data: {
            action: "REJECTED",
            actedAt: new Date(),
          },
        });

        // Reset Skip Counter on active session (explicit reject resets skips)
        await prisma.umpireSession.updateMany({
          where: { professionalId: proId, sessionEnd: null },
          data: { consecutiveSkipCount: 0 },
        });

        // Unlock booking from this pro
        await prisma.onDemandProfessionalBooking.update({
          where: { id: booking.id },
          data: { lockedForProId: null },
        });

        logger.info(`[DispatchService] Pro ${proId} rejected offer. Cascading to next candidate.`);
        
        // Immediate cascade to next pro
        await this.dispatchNext(booking.id);

        return { success: true, status: "REJECTED" };
      }
    } catch (error) {
      logger.error(`[DispatchService] Error handling offer response:`, error);
      return { success: false, status: 500, message: error.message };
    }
  }

  /**
   * Handle timeout expiry of a notification offer (SKIPPED)
   */
  static async handleOfferExpiry(bookingId, notificationId) {
    try {
      const notification = await prisma.bookingNotification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.action !== null) {
        // Already responded (ACCEPTED/REJECTED)
        return;
      }

      logger.info(`[DispatchService] Notification offer ${notificationId} expired (SKIPPED) for booking ${bookingId}`);

      const proId = notification.professionalId;

      // 1. Mark notification as SKIPPED
      await prisma.bookingNotification.update({
        where: { id: notificationId },
        data: {
          action: "SKIPPED",
          actedAt: new Date(),
        },
      });

      // 2. Add booking card to skipped requests list in Redis
      const skippedListKey = `umpire:skipped_bookings:${proId}`;
      await redisClient.lpush(skippedListKey, bookingId);
      await redisClient.expire(skippedListKey, 86400); // 24 hours expiry

      // 3. Emit skipped card socket update to pro
      const io = getIO();
      const pro = await prisma.ownerProfile.findUnique({
        where: { id: proId },
      });

      if (io && pro) {
        io.to(pro.userId).emit("professional:skipped_card_added", { bookingId });
      }

      // 4. Increment consecutiveSkipCount on active session. Force offline if >= 2 skips.
      await this.handleConsecutiveSkips(proId);

      // 5. Unlock booking
      await prisma.onDemandProfessionalBooking.update({
        where: { id: bookingId },
        data: { lockedForProId: null },
      });

      // 6. Cascade dispatch to the next candidate pro
      await this.dispatchNext(bookingId);
    } catch (error) {
      logger.error(`[DispatchService] Error in handleOfferExpiry:`, error);
    }
  }

  /**
   * Helper: Handle skipped skips session tracking and force offline logic
   */
  static async handleConsecutiveSkips(proId) {
    try {
      let activeSession = await prisma.umpireSession.findFirst({
        where: { professionalId: proId, sessionEnd: null },
      });

      if (!activeSession) {
        activeSession = await prisma.umpireSession.create({
          data: { professionalId: proId, consecutiveSkipCount: 0 },
        });
      }

      const newSkipCount = activeSession.consecutiveSkipCount + 1;

      if (newSkipCount >= 2) {
        // Set offline & End session!
        await prisma.$transaction([
          prisma.umpireSession.update({
            where: { id: activeSession.id },
            data: {
              consecutiveSkipCount: 2,
              sessionEnd: new Date(),
            },
          }),
          prisma.ownerProfile.update({
            where: { id: proId },
            data: { isOnline: false },
          }),
        ]);

        logger.info(`[DispatchService] Pro ${proId} forced OFFLINE after 2 consecutive skips.`);

        // Socket notification for forced offline
        const io = getIO();
        if (io && activeSession.professional?.userId) {
          io.to(activeSession.professional.userId).emit("professional:forced_offline", {
            message: "You missed 2 consecutive bookings and have been set offline. Tap to go back online.",
          });
        }
      } else {
        // Just increment skip count
        await prisma.umpireSession.update({
          where: { id: activeSession.id },
          data: { consecutiveSkipCount: newSkipCount },
        });
      }
    } catch (error) {
      logger.error(`[DispatchService] Error in handleConsecutiveSkips for pro ${proId}:`, error);
    }
  }

  /**
   * Helper: Apply trust score deductions at the end of a cycle for skips
   */
  static async applyCycleSkipPenalties(bookingId, cycleNumber) {
    try {
      const skippedNotifications = await prisma.bookingNotification.findMany({
        where: {
          bookingId,
          action: "SKIPPED",
        },
      });

      for (const notif of skippedNotifications) {
        await TrustScoreLedgerService.recordEvent(
          notif.professionalId,
          `SKIP_PENALTY_CYCLE_${cycleNumber}`,
          -0.5,
          bookingId,
          `Ignored notification in dispatch Cycle ${cycleNumber}`
        );
      }
    } catch (error) {
      logger.error(`[DispatchService] Failed to apply cycle skip penalties:`, error);
    }
  }

  /**
   * Helper: Clean up skipped request item in Redis list
   */
  static async removeSkippedCard(proId, bookingId) {
    try {
      const key = `umpire:skipped_bookings:${proId}`;
      const list = await redisClient.lrange(key, 0, -1);
      const filtered = list.filter((id) => id !== bookingId);
      
      await redisClient.del(key);
      if (filtered.length > 0) {
        // Push items back in reverse order since lpush unshifts
        for (const id of filtered.reverse()) {
          await redisClient.lpush(key, id);
        }
      }
    } catch (error) {
      logger.error(`[DispatchService] Failed to remove skipped card in Redis for pro ${proId}:`, error);
    }
  }
}
export default DispatchService;
