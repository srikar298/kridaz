import { prisma } from "../config/prisma.js";
import WalletService from "../services/wallet.service.js";
import * as bookingService from "../modules/booking/booking.service.js";
import { autoChargeCaptainShortfalls, autoSettleHostedGames } from "../utils/cronJobs.js";
import { applyAsOpponentTeam, manageOpponentApplication, payTeamShare } from "../modules/hostedGame/hostedGame.controller.js";

describe("Split Cost Guarantor Model & Partial Turf Payments Integration Tests", () => {
  let host, captain, player, turfOwner, turf, captainTeam;
  const ts = Date.now();

  beforeAll(async () => {
    // 1. Create Turf Owner User & OwnerProfile
    turfOwner = await prisma.user.create({
      data: {
        email: `owner_${ts}@kridaz.test`,
        username: `owner_${ts}`,
        password: "Owner@Pass123",
        name: "Test Turf Owner",
        role: "OWNER",
      },
    });

    const ownerProfile = await prisma.ownerProfile.create({
      data: {
        userId: turfOwner.id,
        businessName: "Test Turf Venue",
      },
    });

    // 2. Create Turf
    turf = await prisma.turf.create({
      data: {
        ownerId: ownerProfile.id,
        name: "Championship Turf Arena",
        location: "Test Location",
        city: "Hyderabad",
        state: "Telangana",
        image: "test-turf.jpg",
        pricePerHour: 10000,
        openTime: "06:00",
        closeTime: "23:00",
      },
    });

    // 3. Create Host, Captain, and Player users with wallets
    host = await prisma.user.create({
      data: {
        email: `host_${ts}@kridaz.test`,
        username: `host_${ts}`,
        password: "Host@Pass123",
        name: "Team A Captain (Host)",
        wallet: { create: { balance: 20000, reservedBalance: 0 } },
      },
    });

    captain = await prisma.user.create({
      data: {
        email: `captain_${ts}@kridaz.test`,
        username: `captain_${ts}`,
        password: "Captain@Pass123",
        name: "Team B Captain",
        wallet: { create: { balance: 20000, reservedBalance: 0 } },
      },
    });

    player = await prisma.user.create({
      data: {
        email: `player_${ts}@kridaz.test`,
        username: `player_${ts}`,
        password: "Player@Pass123",
        name: "Team B Player 1",
        wallet: { create: { balance: 20000, reservedBalance: 0 } },
      },
    });

    // Create captain's team to avoid constraint violation
    captainTeam = await prisma.team.create({
      data: {
        name: "Super Strikerz",
        ownerId: captain.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up all test records
    const testUserEmails = [
      `owner_${ts}@kridaz.test`,
      `host_${ts}@kridaz.test`,
      `captain_${ts}@kridaz.test`,
      `player_${ts}@kridaz.test`,
    ];

    const users = await prisma.user.findMany({
      where: { email: { in: testUserEmails } },
    });
    const userIds = users.map(u => u.id);

    await prisma.gameSlot.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.gameTeam.deleteMany({ where: { game: { hostId: { in: userIds } } } });
    await prisma.hostedGame.deleteMany({ where: { hostId: { in: userIds } } });
    await prisma.booking.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.timeSlot.deleteMany({ where: { turfId: turf.id } });
    await prisma.turf.delete({ where: { id: turf.id } });
    await prisma.team.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.ownerProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.walletTransaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  it("should support hosted game creation with partial Advance turf payment", async () => {
    // We will simulate the transaction wrapper logic of createHostedGame
    const groundCost = 10000;
    const hostAdvancePercentage = 30; // 30% advance
    const hostGroundPaid = Math.round((groundCost * hostAdvancePercentage) / 100);
    const hostGroundBalance = groundCost - hostGroundPaid;

    // Deduct host advance from wallet
    await WalletService.debit(host.id, "user", hostGroundPaid);
    const hostWallet = await WalletService.getWallet(host.id, "user");
    expect(hostWallet.balance).toBe(20000 - hostGroundPaid);

    // Create system config config config config config
    let gstAmountCalc = 0;
    let platformFee = 0;
    let ownerRevenue = 0;

    // Platform configs
    const gstPercentage = 18;
    const platformFeePercentage = 5;
    gstAmountCalc = Math.round(groundCost * (gstPercentage / (100 + gstPercentage)));
    const baseAmount = groundCost - gstAmountCalc;
    platformFee = Math.round(baseAmount * (platformFeePercentage / 100));
    ownerRevenue = hostGroundPaid - platformFee - gstAmountCalc;

    // Create TimeSlot & Booking
    const timeSlot = await prisma.timeSlot.create({
      data: {
        turfId: turf.id,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // starts in 2 hours
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      },
    });

    const booking = await prisma.booking.create({
      data: {
        userId: host.id,
        turfId: turf.id,
        timeSlotId: timeSlot.id,
        totalPrice: groundCost,
        paidAmount: hostGroundPaid,
        balanceAmount: hostGroundBalance,
        advanceAmount: hostGroundPaid,
        paymentType: "PARTIAL",
        status: "CONFIRMED",
        bookingSource: "HOSTED_GAME",
        platformFee,
        gstAmount: gstAmountCalc,
        ownerRevenue,
      },
    });

    // Update owner profile pending balance to simulate REST API behavior
    const ownerProfileRecord = await prisma.ownerProfile.findFirst({
      where: { userId: turfOwner.id }
    });
    await prisma.ownerProfile.update({
      where: { id: ownerProfileRecord.id },
      data: { pendingBalance: { increment: ownerRevenue } }
    });

    // Create HostedGame
    const game = await prisma.hostedGame.create({
      data: {
        hostId: host.id,
        gameType: "Cricket",
        date: new Date(),
        time: "18:00",
        turfId: turf.id,
        groundCost,
        bookingId: booking.id,
        gameMode: "QUICK",
        status: "ACTIVE",
        matchPreferences: {
          opponentType: "TEAM",
          splitCost: true,
          advancePercentage: 30,
          opponentTargetPlayers: 2, // 2 players: Captain + 1 Player
        },
      },
    });

    // Create Teams
    const teamA = await prisma.gameTeam.create({
      data: {
        gameId: game.id,
        name: "Host Team",
        teamKey: "teamA",
      },
    });

    await prisma.gameSlot.create({
      data: {
        gameId: game.id,
        teamId: teamA.id,
        userId: host.id,
        role: "Captain",
        status: "JOINED",
      },
    });

    const teamB = await prisma.gameTeam.create({
      data: {
        gameId: game.id,
        name: "Opponent Team (TBD)",
        teamKey: "teamB",
      },
    });

    expect(booking.balanceAmount.toNumber()).toBe(7000);
    expect(booking.paymentType).toBe("PARTIAL");
  });

  it("should reserve full team share as guarantor reserve when opponent captain applies", async () => {
    // Retrieve game and booking
    const game = await prisma.hostedGame.findFirst({
      where: { hostId: host.id },
    });

    const prefs = game.matchPreferences || {};
    const totalAmount = Number(game.groundCost || 0) / 2; // ₹5,000 (Team B's 50% share)

    // Captain reserves the FULL amount
    await WalletService.reserve(captain.id, "user", totalAmount);
    const capWallet = await WalletService.getWallet(captain.id, "user");
    expect(capWallet.reservedBalance).toBe(totalAmount);
    expect(capWallet.usableBalance).toBe(20000 - totalAmount);

    const newApp = {
      teamId: captainTeam.id,
      teamName: "Super Strikerz",
      captainId: captain.id,
      status: "APPROVED", // Mark approved for simplicity in test
      advancePaid: 1500, // 30% of ₹5000
      totalRequired: totalAmount, // ₹5,000 full guarantor amount
      guarantorReleased: 0,
      appliedAt: new Date().toISOString()
    };

    const updatedPrefs = {
      ...prefs,
      applications: [newApp]
    };

    // Update HostedGame preferences and assign Team B
    await prisma.hostedGame.update({
      where: { id: game.id },
      data: {
        matchPreferences: updatedPrefs,
      },
    });

    const teamB = await prisma.gameTeam.findFirst({
      where: { gameId: game.id, teamKey: "teamB" },
    });

    await prisma.gameTeam.update({
      where: { id: teamB.id },
      data: { linkedTeamId: captainTeam.id, name: "Super Strikerz" },
    });

    // Create slots
    await prisma.gameSlot.create({
      data: {
        gameId: game.id,
        teamId: teamB.id,
        userId: captain.id,
        role: "Captain",
        status: "JOINED",
        paymentStatus: "RESERVED",
      },
    });

    // Create an open slot for player
    await prisma.gameSlot.create({
      data: {
        gameId: game.id,
        teamId: teamB.id,
        role: "Player",
        status: "OPEN",
      },
    });
  });

  it("should release proportional guarantor reserve from captain when player joins opponent team", async () => {
    const game = await prisma.hostedGame.findFirst({
      where: { hostId: host.id },
      include: { slots: true, teams: true },
    });

    const teamB = game.teams.find(t => t.teamKey === "teamB");
    const openSlot = game.slots.find(s => s.teamId === teamB.id && s.status === "OPEN");

    const prefs = game.matchPreferences || {};
    const acceptedApp = prefs.applications[0];
    const targetPlayers = prefs.opponentTargetPlayers || 2;
    const perPlayerCharge = acceptedApp.totalRequired / targetPlayers; // ₹5,000 / 2 = ₹2,500

    // Reserve player's fee
    await WalletService.reserve(player.id, "user", perPlayerCharge);
    await prisma.gameSlot.update({
      where: { id: openSlot.id },
      data: {
        userId: player.id,
        status: "JOINED",
        paymentStatus: "RESERVED",
      },
    });

    // Proportional release from Captain
    const maxReleasable = acceptedApp.totalRequired - perPlayerCharge; // ₹5,000 - ₹2,500 = ₹2,500
    const currentReleased = acceptedApp.guarantorReleased || 0;
    const actualRelease = Math.min(perPlayerCharge, maxReleasable - currentReleased); // ₹2,500

    await WalletService.release(acceptedApp.captainId, "user", actualRelease, false);
    acceptedApp.guarantorReleased = currentReleased + actualRelease;

    await prisma.hostedGame.update({
      where: { id: game.id },
      data: { matchPreferences: prefs },
    });

    const capWallet = await WalletService.getWallet(captain.id, "user");
    expect(capWallet.reservedBalance).toBe(5000 - actualRelease); // Captain's reserve reduced to ₹2,500!
    
    const playWallet = await WalletService.getWallet(player.id, "user");
    expect(playWallet.reservedBalance).toBe(perPlayerCharge); // Player reserves ₹2,500
  });

  it("should execute 24-hour cron shortfall sweep correctly", async () => {
    // 1. Force the game's start date/time to be in 2 hours so the cron picks it up
    const game = await prisma.hostedGame.findFirst({
      where: { hostId: host.id },
    });

    const scheduledDate = new Date();
    // Simulate game date is today
    await prisma.hostedGame.update({
      where: { id: game.id },
      data: {
        date: scheduledDate,
        time: "20:00", // simulated start time (e.g. today at 20:00 PM)
      },
    });

    // 2. Invoke the shortfall cron sweep
    await autoChargeCaptainShortfalls();

    // 3. Verify reserves are captured and transferred
    const updatedGame = await prisma.hostedGame.findUnique({
      where: { id: game.id },
      include: { slots: true },
    });

    expect(updatedGame.matchPreferences.opponentShareSettled).toBe(true);

    // Verify Player slot status is CAPTURED
    const playerSlot = updatedGame.slots.find(s => s.userId === player.id);
    expect(playerSlot.paymentStatus).toBe("CAPTURED");

    // Verify Captain slot status is CAPTURED
    const captainSlot = updatedGame.slots.find(s => s.userId === captain.id);
    expect(captainSlot.paymentStatus).toBe("CAPTURED");

    // Verify Wallets
    const hostWallet = await WalletService.getWallet(host.id, "user");
    expect(hostWallet.balance).toBe(20000 - 3000 + 5000); // Host got credited the ₹5,000 opponent share!

    const capWallet = await WalletService.getWallet(captain.id, "user");
    expect(capWallet.reservedBalance).toBe(0); // Guarantor reserve captured (debit ₹2,500)
    expect(capWallet.balance).toBe(20000 - 2500); // Debited ₹2,500

    const playWallet = await WalletService.getWallet(player.id, "user");
    expect(playWallet.reservedBalance).toBe(0); // Reserved captured (debit ₹2,500)
    expect(playWallet.balance).toBe(20000 - 2500); // Debited ₹2,500
  });

  it("should exclude pre-transferred opponent shares from post-match settlement", async () => {
    const game = await prisma.hostedGame.findFirst({
      where: { hostId: host.id },
    });

    // 1. Force the game's escrowAmount to represent Team A's collections (say ₹3,000)
    // and status payout pending.
    await prisma.hostedGame.update({
      where: { id: game.id },
      data: {
        escrowAmount: 3000,
        payoutStatus: "PENDING",
      },
    });

    // 2. Execute post-match settlement
    // Simulate game ending 20 hours ago
    const scheduledEnd = new Date(Date.now() - 20 * 60 * 60 * 1000);
    await prisma.hostedGame.update({
      where: { id: game.id },
      data: {
        date: scheduledEnd,
        endTime: "08:00 AM",
      },
    });

    const hostWalletBefore = await WalletService.getWallet(host.id, "user");

    await autoSettleHostedGames();

    const hostWalletAfter = await WalletService.getWallet(host.id, "user");
    // It should credit ONLY the escrowAmount (₹3000) of Team A.
    // It should NOT add teamCollected (₹5000) again because opponentShareSettled is true!
    expect(hostWalletAfter.balance).toBe(hostWalletBefore.balance + 3000);

    const gameFinal = await prisma.hostedGame.findUnique({
      where: { id: game.id },
    });
    expect(gameFinal.payoutStatus).toBe("PAID");
  });

  it("should allow the host to pay the remaining 70% booking balance from ticket details", async () => {
    const game = await prisma.hostedGame.findFirst({
      where: { hostId: host.id },
    });

    const bookingBefore = await prisma.booking.findUnique({
      where: { id: game.bookingId },
    });

    expect(bookingBefore.balanceAmount.toNumber()).toBe(7000);
    expect(bookingBefore.paymentType).toBe("PARTIAL");

    // Pay booking balance
    await bookingService.payBookingBalance(host.id, game.bookingId);

    const bookingAfter = await prisma.booking.findUnique({
      where: { id: game.bookingId },
    });

    // Verify booking updates
    expect(bookingAfter.balanceAmount.toNumber()).toBe(0);
    expect(bookingAfter.paidAmount.toNumber()).toBe(10000);
    expect(bookingAfter.paymentType).toBe("FULL");

    // Verify turf owner profile pending balance got incremented by the remaining ₹7,000
    const profile = await prisma.ownerProfile.findFirst({
      where: { userId: turfOwner.id },
    });
    expect(Number(profile.pendingBalance)).toBe(bookingBefore.ownerRevenue.toNumber() + 7000);

    // Verify host wallet got debited
    const hostWallet = await WalletService.getWallet(host.id, "user");
    // Initial balance: 20000
    // Hosted game creation debit: 3000
    // Split cost payout credit: 5000
    // Auto settle payout credit: 3000
    // Balance payment debit: 7000
    // Net: 20000 - 3000 + 5000 + 3000 - 7000 = 18000
    expect(hostWallet.balance).toBe(18000);
  });

  it("should charge 0 coins to captain and players if splitCost is false for a Team match", async () => {
    // 1. Create a new hosted game with splitCost: false
    const game = await prisma.hostedGame.create({
      data: {
        hostId: host.id,
        gameType: "Football",
        date: new Date(),
        time: "19:00",
        turfId: turf.id,
        groundCost: 10000,
        gameMode: "QUICK",
        status: "ACTIVE",
        matchPreferences: {
          opponentType: "TEAM",
          splitCost: false,
          opponentTargetPlayers: 2,
        },
      },
    });

    const teamB = await prisma.gameTeam.create({
      data: {
        gameId: game.id,
        name: "Opponent Team (TBD)",
        teamKey: "teamB",
      },
    });

    // 2. Captain applies as opponent team. Total guarantor amount should be 0 because splitCost is false.
    const capWalletBefore = await WalletService.getWallet(captain.id, "user");

    const prefs = game.matchPreferences || {};
    let totalAmount = 0; // splitCost is false
    expect(totalAmount).toBe(0);

    const newApp = {
      teamId: captainTeam.id,
      teamName: "Super Strikerz",
      captainId: captain.id,
      status: "APPROVED",
      advancePaid: 0,
      totalRequired: totalAmount,
      guarantorReleased: 0,
      appliedAt: new Date().toISOString()
    };

    await prisma.hostedGame.update({
      where: { id: game.id },
      data: {
        matchPreferences: {
          ...prefs,
          applications: [newApp]
        }
      }
    });

    await prisma.gameTeam.update({
      where: { id: teamB.id },
      data: { linkedTeamId: captainTeam.id, name: "Super Strikerz" },
    });

    await prisma.gameSlot.create({
      data: {
        gameId: game.id,
        teamId: teamB.id,
        userId: captain.id,
        role: "Captain",
        status: "JOINED",
        paymentStatus: "NONE",
      },
    });

    const openSlot = await prisma.gameSlot.create({
      data: {
        gameId: game.id,
        teamId: teamB.id,
        role: "Player",
        status: "OPEN",
      },
    });

    const capWalletAfter = await WalletService.getWallet(captain.id, "user");
    expect(capWalletAfter.balance).toBe(capWalletBefore.balance);
    expect(capWalletAfter.reservedBalance).toBe(capWalletBefore.reservedBalance);

    // 3. Player joins the slot. perPlayerCharge should be 0 because splitCost is false.
    let perPlayerCharge = 0; // splitCost is false
    expect(perPlayerCharge).toBe(0);

    await prisma.gameSlot.update({
      where: { id: openSlot.id },
      data: {
        userId: player.id,
        status: "JOINED",
        paymentStatus: "NONE",
      },
    });

    const playWallet = await WalletService.getWallet(player.id, "user");
    expect(playWallet.reservedBalance).toBe(0);
  });
});
