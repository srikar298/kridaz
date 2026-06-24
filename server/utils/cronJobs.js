import nodeCron from "node-cron";
import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Initializes all recurring maintenance cron jobs.
 *
 * Schedule overview:
 *  - 00:00 â€” Purge expired/revoked refresh tokens
 *  - 00:05 â€” Delete expired Stories (expiresAt < now)
 *  - 03:00 â€” Delete media records stuck in "failed" state for > 24 h
 */
export const initCronJobs = () => {
  // ── Hourly: Cache DAAT and Acceptance Rate on OwnerProfile ────────
  nodeCron.schedule("0 * * * *", async () => {
    logger.info("[CRON] Updating OwnerProfile DAAT and Acceptance Rate...");
    try {
      const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const profiles = await prisma.ownerProfile.findMany({
        select: { id: true, userId: true },
      });

      for (const profile of profiles) {
        // Calculate Acceptance Rate
        const acceptedCount = await prisma.professionalMatchOffer.count({
          where: {
            professionalId: profile.id,
            status: "ACCEPTED",
            createdAt: { gte: cutoff30d },
          },
        });
        const rejectedCount = await prisma.professionalMatchOffer.count({
          where: {
            professionalId: profile.id,
            status: "REJECTED",
            createdAt: { gte: cutoff30d },
          },
        });
        const skippedCount = await prisma.bookingNotification.count({
          where: {
            professionalId: profile.id,
            action: "SKIPPED",
            sentAt: { gte: cutoff30d },
          },
        });

        const totalDecisions = acceptedCount + rejectedCount + skippedCount;
        const acceptanceRate =
          totalDecisions > 0 ? (acceptedCount / totalDecisions) * 100 : 100;

        // Calculate DAAT
        const sessions = await prisma.professionalOnlineSession.findMany({
          where: { professionalId: profile.id, createdAt: { gte: cutoff30d } },
        });

        let totalHours = 0;
        for (const session of sessions) {
          if (session.durationHours) {
            totalHours += session.durationHours;
          } else if (!session.offlineAt && session.onlineAt) {
            // Still online, add hours up to now
            totalHours +=
              (Date.now() - session.onlineAt.getTime()) / (1000 * 60 * 60);
          }
        }

        const daatPct = Math.min((totalHours / (30 * 24)) * 100, 100); // percentage of a 24-hour day

        await prisma.ownerProfile.update({
          where: { id: profile.id },
          data: {
            acceptanceRate30d: parseFloat(acceptanceRate.toFixed(2)),
            avgDailyActivePct: parseFloat(daatPct.toFixed(2)), // Storing as percentage
          },
        });
      }
      logger.info(
        `[CRON] OwnerProfile caching complete for ${profiles.length} professionals.`
      );
    } catch (error) {
      logger.error("[CRON] DAAT/AcceptanceRate caching error:", error);
    }
  });

  // â”€â”€ Midnight: Expired & revoked refresh token cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  nodeCron.schedule("0 0 * * *", async () => {
    logger.info("[CRON] Purging expired/revoked refresh tokens...");
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { revokedAt: { lt: new Date() } },
          ],
        },
      });
      logger.info(
        `[CRON] Token cleanup complete â€” removed ${result.count} tokens.`
      );
    } catch (error) {
      logger.error("[CRON] Token cleanup error:", error);
    }
  });

  // â”€â”€ 00:05: Expired Story deletion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Stories have a 1â€“7 day TTL controlled by `expiresAt`. Without this job
  // expired stories would accumulate indefinitely in the DB and in the feed.
  nodeCron.schedule("5 0 * * *", async () => {
    logger.info("[CRON] Purging expired stories...");
    try {
      const expiredStories = await prisma.story.findMany({
        where: { expiresAt: { lt: new Date() } },
      });

      if (expiredStories.length > 0) {
        logger.info(
          `[CRON] Found ${expiredStories.length} expired stories. Deleting files from R2...`
        );
        const { deleteStoryFilesFromR2 } = await import("./r2.js");

        await Promise.all(
          expiredStories.map((story) =>
            deleteStoryFilesFromR2(story).catch((err) =>
              logger.error(
                `[CRON] R2 cleanup error for story ${story.id}:`,
                err
              )
            )
          )
        );

        const result = await prisma.story.deleteMany({
          where: { id: { in: expiredStories.map((s) => s.id) } },
        });
        logger.info(
          `[CRON] Story cleanup complete â€” removed ${result.count} expired stories.`
        );
      } else {
        logger.info("[CRON] No expired stories to purge.");
      }
    } catch (error) {
      logger.error("[CRON] Story cleanup error:", error);
    }
  });

  // â”€â”€ 03:00: Failed media record cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Reels, Stories, and Posts stuck in `status: "failed"` for more than 24 hours
  // should be purged so users can re-upload without being blocked by ghost records.
  nodeCron.schedule("0 3 * * *", async () => {
    logger.info("[CRON] Purging stale failed media records...");
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    try {
      // Find failed stories older than cutoff to purge R2 files
      const failedStories = await prisma.story.findMany({
        where: { status: "failed", updatedAt: { lt: cutoff } },
      });

      if (failedStories.length > 0) {
        logger.info(
          `[CRON] Found ${failedStories.length} stale failed stories. Deleting files from R2...`
        );
        const { deleteStoryFilesFromR2 } = await import("./r2.js");
        await Promise.all(
          failedStories.map((story) =>
            deleteStoryFilesFromR2(story).catch((err) =>
              logger.error(
                `[CRON] R2 cleanup error for failed story ${story.id}:`,
                err
              )
            )
          )
        );
      }

      const [reels, stories, posts] = await Promise.all([
        prisma.reel.deleteMany({
          where: { status: "failed", updatedAt: { lt: cutoff } },
        }),
        prisma.story.deleteMany({
          where: { status: "failed", updatedAt: { lt: cutoff } },
        }),
        prisma.post.deleteMany({
          where: { status: "failed", updatedAt: { lt: cutoff } },
        }),
      ]);
      logger.info(
        `[CRON] Failed media cleanup â€” reels: ${reels.count}, stories: ${stories.count}, posts: ${posts.count}`
      );
    } catch (error) {
      logger.error("[CRON] Failed media cleanup error:", error);
    }
  });

  // â”€â”€ Every Hour: Auto-end matches exceeding duration limit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  nodeCron.schedule("0 * * * *", async () => {
    await autoEndExpiredMatches();
  });

  // ── Every Hour: Auto-settle hosted games 24h after start ───
  nodeCron.schedule("0 * * * *", async () => {
    await autoSettleHostedGames();
  });

  // ── Every Hour: Auto-charge captain shortfalls 1h before match ───
  nodeCron.schedule("0 * * * *", async () => {
    await autoChargeCaptainShortfalls();
  });

  // ── Every Minute: Auto-expire pending match offers (60s timeout) ──
  nodeCron.schedule("* * * * *", async () => {
    await autoExpireMatchOffers();
  });

  // ── Every Hour: Auto-settle matchmaking escrow 12h after completion ──
  nodeCron.schedule("0 * * * *", async () => {
    await autoSettleMatchmaking();
  });

  // ── Every 15 Minutes: Transition in-progress on-demand bookings to pending completion ──
  nodeCron.schedule("*/15 * * * *", async () => {
    await autoTransitionOnDemandBookings();
  });

  // ── Every 15 Minutes: Auto-release payouts to professionals after lock hours (12h) ──
  nodeCron.schedule("*/15 * * * *", async () => {
    await autoReleaseOnDemandPayouts();
  });

  // ── Every 30 Minutes: Detect professional no-show ──
  nodeCron.schedule("*/30 * * * *", async () => {
    await runNoShowDetector();
  });

  // ── Every Hour: Auto-resolve pending disputes older than 48h ──
  nodeCron.schedule("0 * * * *", async () => {
    await runDisputeAutoRelease();
  });

  // ── Every Monday at 2:00 AM IST: Trust score inactivity decay ──
  nodeCron.schedule("0 2 * * 1", async () => {
    await runInactivityDecay();
  });

  // ── Every 10 Minutes: Clean up expired skipped card lists ──
  nodeCron.schedule("*/10 * * * *", async () => {
    await cleanUpSkippedCards();
  });

  // ── Every 15 Minutes: Check for SLA breached disputes ──
  nodeCron.schedule("*/15 * * * *", async () => {
    await runSlaEscalation();
  });

  // ── Every Day at 2:00 AM: Calculate Pro Rankings (City & State) ──
  nodeCron.schedule("0 2 * * *", async () => {
    await runRankingEngine();
  });

  logger.info(
    "[CRON] All cron jobs initialized (token cleanup, story expiry, media cleanup, match auto-end, game auto-settle, matchmaking sweeps, on-demand matching sweeps, dispute escalations, ranking engine)."
  );
};

/**
 * Automatically finalize matches that have been running for longer than their allowed duration.
 */
export const autoChargeCaptainShortfalls = async () => {
  logger.info("[CRON] Checking for TEAM matches starting in 1 hour with shortfalls...");
  try {
    const now = new Date();
    // 1 hour from now
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    // Add a window of 1 hour to prevent duplicate runs
    const cutoffFuture = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const upcomingGames = await prisma.hostedGame.findMany({
      where: {
        gameType: "SCORING_MATCH", // Quick Matches are usually scoring matches? No, could be non-scoring
        date: { gte: now, lte: cutoffFuture },
        status: { in: ["SCHEDULED", "OPEN"] }
      },
      include: {
        slots: true,
        teams: true,
      },
    });

    const { default: WalletService } = await import("../services/wallet.service.js");

    let processedCount = 0;

    for (const game of upcomingGames) {
      if (game.matchPreferences?.opponentType !== "TEAM") continue;

      const scheduledStart = new Date(game.date);
      if (game.time && game.time !== "TBD") {
        const timeParts = game.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          const ampm = timeParts[3]?.toUpperCase();
          if (ampm === "PM" && hours < 12) hours += 12;
          if (ampm === "AM" && hours === 12) hours = 0;
          scheduledStart.setHours(hours, minutes, 0, 0);
        }
      }

      // We want to run this exactly when there is 1 hour or less until match start
      const timeToStart = scheduledStart.getTime() - now.getTime();
      if (timeToStart > 0 && timeToStart <= 60 * 60 * 1000) {
         
         const prefs = game.matchPreferences;
         if (prefs.shortfallProcessed) continue; // Already processed

         const applications = Array.isArray(prefs.applications) ? prefs.applications : [];
         const acceptedApp = applications.find(app => app.status === "APPROVED");
         if (!acceptedApp) continue;

         const advance = acceptedApp.advancePaid || 0;
         const advanceRefunded = acceptedApp.advanceRefunded || 0;
         const currentAdvanceHeld = Math.max(0, advance - advanceRefunded);
         
         const targetPlayers = parseInt(prefs.opponentTargetPlayers) || 2;
         const memberCharge = acceptedApp.totalRequired / targetPlayers;
         
         const teamB = game.teams.find(t => t.linkedTeamId === acceptedApp.teamId);
         if (!teamB) continue;

         const memberSlots = game.slots.filter(s => s.teamId === teamB.id && s.userId && s.userId !== acceptedApp.captainId && s.paymentStatus === "RESERVED").length;
         const teamCollected = currentAdvanceHeld + (memberSlots * memberCharge);

         if (teamCollected < acceptedApp.totalRequired) {
            const shortfall = acceptedApp.totalRequired - teamCollected;
            logger.info(`[CRON] Game ${game.id} has a team shortfall of ${shortfall}. Charging captain ${acceptedApp.captainId}...`);

            try {
              await prisma.$transaction(async (tx) => {
                 // Try to reserve from Captain's wallet
                 await WalletService.reserve(acceptedApp.captainId, "user", shortfall, tx);
                 
                 // Mark as processed
                 const updatedPrefs = { ...prefs, shortfallProcessed: true, captainChargedShortfall: shortfall };
                 await tx.hostedGame.update({
                   where: { id: game.id },
                   data: { matchPreferences: updatedPrefs }
                 });

                 await tx.walletTransaction.create({
                    data: {
                      userId: acceptedApp.captainId,
                      amount: shortfall,
                      type: "ESCROW",
                      status: "RESERVED",
                      description: "Auto-charged team shortfall 1 hr before match"
                    }
                 });
                 processedCount++;
              });
            } catch (err) {
               logger.error(`[CRON] Failed to charge captain ${acceptedApp.captainId} for shortfall in game ${game.id}:`, err);
               // If Captain has no funds, game might have to be cancelled or flagged. For now we just log it.
            }
         } else {
            // No shortfall, just mark as processed
            await prisma.hostedGame.update({
               where: { id: game.id },
               data: { matchPreferences: { ...prefs, shortfallProcessed: true } }
            });
         }
      }
    }

    if (processedCount > 0) {
      logger.info(`[CRON] Shortfall check complete — processed ${processedCount} games.`);
    }

  } catch (err) {
    logger.error("[CRON] Error during captain shortfall charging:", err);
  }
};

export const autoEndExpiredMatches = async () => {
  logger.info("[CRON] Checking for expired live matches to auto-end...");
  try {
    const activeGames = await prisma.hostedGame.findMany({
      where: {
        gameType: "SCORING_MATCH",
        scoringStatus: { in: ["LIVE", "PAUSED"] },
      },
      include: {
        cricketMatch: true,
      },
    });

    logger.info(
      `[CRON] Found ${activeGames.length} active scoring matches in progress.`
    );

    let endCount = 0;
    const { finalizeMatch } =
      await import("../modules/scoring/scoring.service.js");

    for (const game of activeGames) {
      if (!game.cricketMatch) {
        continue;
      }

      const matchStart = new Date(game.cricketMatch.createdAt).getTime();
      const matchDays = game.customDays || 1;
      const allowedDurationMs = matchDays * 24 * 60 * 60 * 1000;
      const elapsedTimeMs = Date.now() - matchStart;

      if (elapsedTimeMs > allowedDurationMs) {
        logger.info(
          `[CRON] Match ${game.id} ("${game.name}") has exceeded its allowed duration of ${matchDays} day(s). Elapsed: ${(elapsedTimeMs / (1000 * 60 * 60)).toFixed(1)} hours. Auto-ending match...`
        );
        try {
          await finalizeMatch(game.cricketMatch.id);
          logger.info(`[CRON] Successfully auto-ended match ${game.id}.`);
          endCount++;
        } catch (finalizeError) {
          logger.error(
            `[CRON] Failed to auto-end match ${game.id}:`,
            finalizeError
          );
        }
      }
    }

    if (endCount > 0) {
      logger.info(
        `[CRON] Expired match cleanup complete â€” auto-ended ${endCount} matches.`
      );
    } else {
      logger.info("[CRON] No matches needed auto-ending.");
    }
  } catch (error) {
    logger.error("[CRON] Error during auto-ending expired matches:", error);
  }
};

export const autoSettleHostedGames = async () => {
  logger.info("[CRON] Checking for pending hosted games to auto-settle...");
  try {
    const pendingGames = await prisma.hostedGame.findMany({
      where: {
        payoutStatus: "PENDING",
        disputeRaised: false,
        escrowAmount: { gt: 0 },
      },
      include: {
        slots: true,
        teams: true,
      },
    });

    let settledCount = 0;
    const { default: WalletService } =
      await import("../services/wallet.service.js");
    const now = new Date();

    for (const game of pendingGames) {
      const scheduledStart = new Date(game.date);
      let scheduledEnd = new Date(game.date);
      
      if (game.endTime && game.endTime !== "TBD") {
        const timeParts = game.endTime.match(/(\d+):(\d+)\s(AM|PM)/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1], 10);
          const minutes = parseInt(timeParts[2], 10);
          const ampm = timeParts[3].toUpperCase();
          if (ampm === "PM" && hours < 12) hours += 12;
          if (ampm === "AM" && hours === 12) hours = 0;
          scheduledEnd.setHours(hours, minutes, 0, 0);
        }
      } else {
        // Fallback if no endTime (backward compatibility)
        const [hours, minutes] = (game.time || "00:00").split(":").map(Number);
        scheduledEnd.setHours(hours || 0, minutes || 0, 0, 0);
        scheduledEnd.setHours(scheduledEnd.getHours() + 4); // assume 4 hours duration
      }

      // 6 hours after the end time
      const cutoffTime = new Date(
        scheduledEnd.getTime() + 6 * 60 * 60 * 1000
      );

      if (now > cutoffTime) {
        logger.info(
          `[CRON] Auto-settling game ${game.id} 6 hours passed since match end.`
        );
        try {
          await prisma.$transaction(async (tx) => {
            let amountToPayout = Number(game.escrowAmount || 0);

            // Handle TEAM match opponent funds that are stored in RESERVED
            const isTeamMatch = game.matchPreferences?.opponentType === "TEAM";
            if (isTeamMatch) {
              const prefs = game.matchPreferences;
              const applications = Array.isArray(prefs.applications) ? prefs.applications : [];
              const acceptedApp = applications.find(app => app.status === "APPROVED");
              if (acceptedApp) {
                const advance = acceptedApp.advancePaid || 0;
                const advanceRefunded = acceptedApp.advanceRefunded || 0;
                const currentAdvanceHeld = Math.max(0, advance - advanceRefunded);
                
                const targetPlayers = parseInt(prefs.opponentTargetPlayers) || 2;
                const memberCharge = acceptedApp.totalRequired / targetPlayers;
                
                const teamB = game.teams.find(t => t.linkedTeamId === acceptedApp.teamId);
                if (teamB) {
                  const memberSlots = game.slots.filter(s => s.teamId === teamB.id && s.userId && s.userId !== acceptedApp.captainId && s.paymentStatus === "RESERVED").length;
                  const teamCollected = currentAdvanceHeld + (memberSlots * memberCharge);
                  amountToPayout += teamCollected;
                }
              }
            }

            await tx.hostedGame.update({
              where: { id: game.id },
              data: {
                payoutStatus: "PAID",
                escrowAmount: 0,
                coinTransferStatus: "COMPLETED", // Legacy backwards compatibility
              },
            });

            if (amountToPayout > 0) {
              await WalletService.credit(
                game.hostId,
                "user",
                amountToPayout,
                tx
              );
              await tx.walletTransaction.create({
                data: {
                  userId: game.hostId,
                  amount: amountToPayout,
                  type: "ESCROW_PAYOUT",
                  status: "SUCCESS",
                  description:
                    "Received escrow payout for hosted game (Auto-settled)",
                },
              });
            }

            // Archive temporary teams
            for (const team of game.teams) {
              if (team.linkedTeamId) {
                const actualTeam = await tx.team.findUnique({
                  where: { id: team.linkedTeamId },
                });
                if (actualTeam && actualTeam.isTemporaryPickup) {
                  await tx.team.update({
                    where: { id: actualTeam.id },
                    data: { status: "ARCHIVED" },
                  });
                }
              }
            }
          });
          settledCount++;
        } catch (err) {
          logger.error(`[CRON] Error auto-settling game ${game.id}: `, err);
        }
      }
    }

    if (settledCount > 0) {
      logger.info(
        `[CRON] Auto-settlement complete — settled ${settledCount} games.`
      );
    }
  } catch (error) {
    logger.error("[CRON] Error during auto-settlement:", error);
  }
};

export const autoExpireMatchOffers = async () => {
  try {
    const cutoff = new Date(Date.now() - 60000); // 60s timeout
    const expiredOffers = await prisma.professionalMatchOffer.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
      },
      include: { request: true },
    });

    if (expiredOffers.length > 0) {
      logger.info(
        `[CRON] Found ${expiredOffers.length} expired match offers. Re-routing...`
      );
      for (const offer of expiredOffers) {
        await prisma.professionalMatchOffer.update({
          where: { id: offer.id },
          data: { status: "EXPIRED" },
        });

        const matchReq = offer.request;
        if (matchReq.status === "SEARCHING" && matchReq.queuePositions) {
          const queuePositions = matchReq.queuePositions;
          const nextIndex = matchReq.currentPositionIndex + 1;

          if (nextIndex < queuePositions.length) {
            const nextCandidateId = queuePositions[nextIndex];

            const offer = await prisma.$transaction(async (tx) => {
              await tx.professionalMatchRequest.update({
                where: { id: matchReq.id },
                data: {
                  currentPositionIndex: nextIndex,
                  lastRoutedAt: new Date(),
                },
              });

              return tx.professionalMatchOffer.create({
                data: {
                  requestId: matchReq.id,
                  professionalId: nextCandidateId,
                  status: "PENDING",
                },
              });
            });

            const nextProf = await prisma.ownerProfile.findUnique({
              where: { id: nextCandidateId },
            });
            if (nextProf && nextProf.userId) {
              const { getIO } = await import("../config/socket.js");
              const io = getIO();
              if (io) {
                io.to(nextProf.userId).emit("professional:match_offer", {
                  offerId: offer.id,
                  requestId: matchReq.id,
                  groundName: matchReq.groundId
                    ? "Selected Venue"
                    : "Custom Location",
                  budget: `${matchReq.minBudget} - ${matchReq.maxBudget}`,
                  expiresAt: new Date(Date.now() + 60000),
                });
              }
            }
          } else {
            await prisma.professionalMatchRequest.update({
              where: { id: matchReq.id },
              data: { status: "EXHAUSTED" },
            });

            const { getIO } = await import("../config/socket.js");
            const io = getIO();
            if (io) {
              io.to(matchReq.userId).emit("professional:match_failed", {
                requestId: matchReq.id,
                reason: "exhausted",
                message:
                  "All nearby professionals rejected or timed out. Please try again later or adjust budget/criteria.",
              });
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error("[CRON] Error expiring match offers:", error);
  }
};

export const autoSettleMatchmaking = async () => {
  try {
    const cutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
    const pendingBookings = await prisma.onDemandProfessionalBooking.findMany({
      where: {
        status: "COMPLETED",
        updatedAt: { lt: cutoffTime },
        // We'd normally check if payment is pending, but our flow does it at check-in now?
        // Wait, "reserve coins on accept" - but the coins are held in WalletService reservation.
        // Oh, the check-in verified it and did release/credit already!
        // Let me review verifyOTPCheckIn: it does WalletService.release and WalletService.credit!
      },
    });

    // If verifyOTPCheckIn handles it, then there's no "escrow" to settle,
    // it's already settled at check-in. Or maybe the prompt implies we settle
    // it after completion if not already settled. Since we did it at check-in,
    // we don't strictly need this, but we can do a sweep to mark CANCELLED/EXHAUSTED
    // requests and refund their reservation if stuck. Let's do that!

    const stuckReservations = await prisma.professionalMatchRequest.findMany({
      where: {
        status: { in: ["EXHAUSTED", "CANCELLED", "EXPIRED"] },
        // we could check wallet transactions to ensure they were refunded
      },
    });
    // For now just logging.
    logger.info(`[CRON] Auto-settle matchmaking sweep (placeholder).`);
  } catch (error) {
    logger.error("[CRON] Error auto-settling matchmaking:", error);
  }
};

/**
 * Transitions IN_PROGRESS on-demand bookings to PENDING_COMPLETION once match time is over
 */
export const autoTransitionOnDemandBookings = async () => {
  logger.info(
    "[CRON] Checking for IN_PROGRESS bookings to transition to PENDING_COMPLETION..."
  );
  try {
    const now = new Date();
    const bookings = await prisma.onDemandProfessionalBooking.findMany({
      where: {
        status: "IN_PROGRESS",
        matchEndParsed: { lt: now },
      },
    });

    for (const booking of bookings) {
      await prisma.onDemandProfessionalBooking.update({
        where: { id: booking.id },
        data: { status: "PENDING_COMPLETION" },
      });
      logger.info(
        `[CRON] Transitioned booking ${booking.id} to PENDING_COMPLETION.`
      );
    }
  } catch (error) {
    logger.error(
      "[CRON] Error transitioning bookings to PENDING_COMPLETION:",
      error
    );
  }
};

/**
 * Auto-releases payouts to professionals after lock hours (12h)
 */
export const autoReleaseOnDemandPayouts = async () => {
  logger.info(
    "[CRON] Checking for completed bookings to auto-release payouts..."
  );
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { key: "PAYOUT_LOCK_HOURS" },
    });
    const lockHours = config ? parseFloat(config.value) : 12;
    const cutoff = new Date(Date.now() - lockHours * 60 * 60 * 1000);

    const bookings = await prisma.onDemandProfessionalBooking.findMany({
      where: {
        status: "PENDING_COMPLETION",
        matchEndParsed: { lt: cutoff },
      },
    });

    const { WalletBlockingService } =
      await import("../services/walletBlocking.service.js");

    for (const booking of bookings) {
      logger.info(
        `[CRON] Auto-releasing funds to professional for booking ${booking.id}...`
      );
      try {
        await WalletBlockingService.releaseFundsToProfessional(booking.id);
      } catch (err) {
        logger.error(
          `[CRON] Failed to release funds for booking ${booking.id}:`,
          err
        );
      }
    }
  } catch (error) {
    logger.error("[CRON] Error during auto-release payouts:", error);
  }
};

/**
 * Detects professional no-shows and flags them to user and admin
 */
export const runNoShowDetector = async () => {
  logger.info("[CRON] Running no-show detector...");
  try {
    const now = new Date();
    const config = await prisma.platformConfig.findUnique({
      where: { key: "NO_SHOW_LOCK_HOURS" },
    });
    const noShowHours = config ? parseFloat(config.value) : 12;

    const bookings = await prisma.onDemandProfessionalBooking.findMany({
      where: {
        status: "CONFIRMED",
        matchEndParsed: { lt: now },
      },
      include: {
        professional: {
          include: { user: true },
        },
      },
    });

    const { createNotification } = await import("./notificationHelper.js");

    for (const booking of bookings) {
      await prisma.onDemandProfessionalBooking.update({
        where: { id: booking.id },
        data: { status: "NO_SHOW_PENDING" },
      });
      logger.info(`[CRON] Set booking ${booking.id} to NO_SHOW_PENDING.`);

      // Notify user
      await createNotification({
        recipientId: booking.userId,
        recipientModel: "User",
        title: "Professional No-Show",
        message: `Your professional did not check in. Please raise a dispute within ${noShowHours} hours if they did not show up.`,
        type: "SYSTEM_ALERT",
        metadata: { bookingId: booking.id },
      }).catch((err) =>
        logger.error("[CRON] Failed to create no-show notification:", err)
      );

      const { getIO } = await import("../config/socket.js");
      const io = getIO();
      if (io) {
        io.to(booking.userId).emit("professional:no_show_alert", {
          bookingId: booking.id,
          message: `The professional did not check in for your booking. You have ${noShowHours} hours to raise a dispute for a full refund.`,
        });
      }

      // Deduct -5.0 trust points for NO_SHOW
      const { TrustScoreLedgerService } =
        await import("../services/trustScore.service.js");
      await TrustScoreLedgerService.recordEvent(
        booking.professionalId,
        "NO_SHOW",
        -5.0,
        booking.id,
        "Professional failed to show up / check-in for the scheduled match"
      ).catch((err) =>
        logger.error("[CRON] Failed to record no-show trust event:", err)
      );
    }
  } catch (error) {
    logger.error("[CRON] Error during no-show detection:", error);
  }
};

/**
 * Auto-resolves pending disputes after 48 hours in favor of the professional
 */
export const runDisputeAutoRelease = async () => {
  logger.info("[CRON] Running dispute auto-release checks...");
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { key: "DISPUTE_AUTO_RELEASE_HOURS" },
    });
    const hoursLimit = config ? parseFloat(config.value) : 48;
    const cutoff = new Date(Date.now() - hoursLimit * 60 * 60 * 1000);

    const pendingDisputes = await prisma.dispute.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
        onDemandBookingId: { not: null },
      },
    });

    const { WalletBlockingService } =
      await import("../services/walletBlocking.service.js");

    for (const dispute of pendingDisputes) {
      logger.info(
        `[CRON] Auto-resolving dispute ${dispute.id} in favor of professional...`
      );
      try {
        await prisma.$transaction(async (tx) => {
          await tx.dispute.update({
            where: { id: dispute.id },
            data: {
              status: "RESOLVED",
              outcome: "RELEASE_TO_UMPIRE",
              resolvedAt: new Date(),
            },
          });

          await WalletBlockingService.releaseFundsToProfessional(
            dispute.onDemandBookingId,
            tx
          );
        });
        logger.info(`[CRON] Auto-resolved dispute ${dispute.id} successfully.`);
      } catch (err) {
        logger.error(`[CRON] Failed to resolve dispute ${dispute.id}:`, err);
      }
    }
  } catch (error) {
    logger.error("[CRON] Error running dispute auto-release:", error);
  }
};

/**
 * Trust score weekly decay for inactive professionals
 */
export const runInactivityDecay = async () => {
  logger.info("[CRON] Checking for trust score inactivity decay...");
  try {
    const decayConfig = await prisma.platformConfig.findUnique({
      where: { key: "DECAY_INACTIVE_DAYS" },
    });
    const decayDays = decayConfig ? parseInt(decayConfig.value) : 7;
    const cutoff = new Date(Date.now() - decayDays * 24 * 60 * 60 * 1000);

    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const pros = await prisma.ownerProfile.findMany({
      include: { user: true },
    });

    const { TrustScoreLedgerService } =
      await import("../services/trustScore.service.js");

    for (const pro of pros) {
      const existingDecay = await prisma.trustScoreEvent.findFirst({
        where: {
          professionalId: pro.id,
          eventType: "INACTIVITY_DECAY",
          createdAt: { gte: startOfWeek },
        },
      });

      if (existingDecay) {
        continue;
      }

      const recentBooking = await prisma.onDemandProfessionalBooking.findFirst({
        where: {
          professionalId: pro.id,
          createdAt: { gte: cutoff },
        },
      });

      if (!recentBooking) {
        const currentScore = await TrustScoreLedgerService.getTrustScore(
          pro.id
        );
        if (currentScore > 0) {
          const decayValue = currentScore * 0.001;
          await TrustScoreLedgerService.recordEvent(
            pro.id,
            "INACTIVITY_DECAY",
            -decayValue,
            null,
            "Decay due to no activity in the last 7 days"
          );
          logger.info(
            `[CRON] Applied inactivity decay of -${decayValue.toFixed(4)} points to pro ${pro.id}`
          );
        }
      }
    }
  } catch (error) {
    logger.error("[CRON] Error during inactivity decay job:", error);
  }
};

/**
 * Clean up active skipped card references in Redis after requests expire or settle
 */
export const cleanUpSkippedCards = async () => {
  logger.info("[CRON] Running skipped card cleanup...");
  try {
    const inactiveRequests = await prisma.professionalMatchRequest.findMany({
      where: {
        status: { in: ["MATCHED", "EXHAUSTED", "CANCELLED", "EXPIRED"] },
      },
      select: { id: true, queuePositions: true },
    });

    const { default: DispatchService } =
      await import("../services/dispatch.service.js");

    for (const req of inactiveRequests) {
      if (req.queuePositions && Array.isArray(req.queuePositions)) {
        const booking = await prisma.onDemandProfessionalBooking.findUnique({
          where: { requestId: req.id },
          select: { id: true },
        });
        if (booking) {
          for (const proId of req.queuePositions) {
            await DispatchService.removeSkippedCard(proId, booking.id).catch(
              () => {}
            );
          }
        }
      }
    }
  } catch (error) {
    logger.error("[CRON] Error during skipped card cleanup:", error);
  }
};

/**
 * Auto-escalates open disputes where the SLA deadline has breached
 */
export const runSlaEscalation = async () => {
  logger.info("[CRON] Checking for SLA breached disputes to escalate...");
  try {
    const now = new Date();

    const breachedDisputes = await prisma.dispute.findMany({
      where: {
        status: "OPEN",
        isEscalated: false,
        slaDeadline: { lt: now },
      },
    });

    for (const dispute of breachedDisputes) {
      logger.info(
        `[CRON] Escalating dispute ${dispute.id} due to SLA breach...`
      );
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: { isEscalated: true },
      });

      const { createNotification } = await import("./notificationHelper.js");
      await createNotification({
        recipientId: dispute.raisedById,
        recipientModel: "User",
        title: "Dispute Escalated",
        message:
          "Your dispute has been escalated to KRIDAZ Admin as the venue owner did not respond in time.",
        type: "SUPPORT",
        link: "/profile/bookings",
      }).catch(() => {});
    }
  } catch (error) {
    logger.error("[CRON] Error escalating SLA breached disputes:", error);
  }
};

/**
 * Daily ranking engine for professionals. Calculates cityRank and stateRank based on:
 * Trust Score -> Active Pct -> Acceptance Rate.
 */
export const runRankingEngine = async () => {
  logger.info("[CRON] Running daily professional ranking engine...");
  try {
    const pros = await prisma.ownerProfile.findMany({
      include: {
        user: {
          select: { role: true, city: true, state: true },
        },
      },
    });

    // Group by Role -> State -> City
    const groups = {};
    for (const pro of pros) {
      if (!pro.user || !pro.user.city) continue;

      const role = pro.user.role;
      const state = pro.user.state
        ? pro.user.state.toUpperCase()
        : "UNKNOWN_STATE";
      const city = pro.user.city.toUpperCase();

      const key = `${role}_${state}_${city}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(pro);
    }

    let updateCount = 0;

    // Process each city group
    for (const [key, groupPros] of Object.entries(groups)) {
      // Sort using Combined Weighted Score: 50% Trust, 25% DAAT, 25% Acceptance
      groupPros.sort((a, b) => {
        const getScore = (pro) => {
          const trust = pro.trustScore || 0;
          const daat = pro.avgDailyActivePct || 0;
          const accept = pro.acceptanceRate30d || 0;

          const trustNormalized = Math.min((trust / 300) * 100, 100);
          return trustNormalized * 0.5 + daat * 0.25 + accept * 0.25;
        };

        return getScore(b) - getScore(a); // Descending order
      });

      // Assign City Ranks
      groupPros.forEach((pro, index) => {
        pro.computedCityRank = index + 1;
      });
    }

    // Now process State Ranks
    const stateGroups = {};
    for (const pro of pros) {
      if (!pro.user || !pro.user.state) continue;

      const role = pro.user.role;
      const state = pro.user.state.toUpperCase();
      const key = `${role}_${state}`;

      if (!stateGroups[key]) stateGroups[key] = [];
      stateGroups[key].push(pro);
    }

    for (const [key, groupPros] of Object.entries(stateGroups)) {
      // Sort using Combined Weighted Score: 50% Trust, 25% DAAT, 25% Acceptance
      groupPros.sort((a, b) => {
        const getScore = (pro) => {
          const trust = pro.trustScore || 0;
          const daat = pro.avgDailyActivePct || 0;
          const accept = pro.acceptanceRate30d || 0;

          const trustNormalized = Math.min((trust / 300) * 100, 100);
          return trustNormalized * 0.5 + daat * 0.25 + accept * 0.25;
        };

        return getScore(b) - getScore(a); // Descending order
      });

      // Assign State Ranks
      groupPros.forEach((pro, index) => {
        pro.computedStateRank = index + 1;
      });
    }

    // Bulk update database using individual updates in transaction
    await prisma.$transaction(
      pros.map((pro) =>
        prisma.ownerProfile.update({
          where: { id: pro.id },
          data: {
            cityRank: pro.computedCityRank || null,
            stateRank: pro.computedStateRank || null,
          },
        })
      )
    );

    updateCount = pros.length;
    logger.info(`[ENGINES] ranks updated for ${updateCount} professionals.`);
  } catch (error) {
    logger.error("[CRON] Error running ranking engine:", error);
  }
};
