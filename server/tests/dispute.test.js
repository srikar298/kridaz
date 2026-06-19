import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const emailUser = `dispute_u_${ts}@kridaz.test`;
const emailOwner = `dispute_o_${ts}@kridaz.test`;
const emailAdmin = `dispute_a_${ts}@kridaz.test`;

let userToken = "";
let adminToken = "";
let ownerToken = "";

let testUser = null;
let testOwnerUser = null;
let testOwnerProfile = null;
let testTurf = null;

// Store created booking/dispute IDs for step-by-step validation
const bookings = [];
const disputes = [];

describe("Support Dispute Resolution Domain Integration Tests", () => {
  beforeAll(async () => {
    // 1. Database Teardown/Clean-up
    const oldUsers = await prisma.user.findMany({
      where: {
        email: { in: [emailUser, emailOwner, emailAdmin] },
      },
    });

    for (const u of oldUsers) {
      await prisma.disputeReply
        .deleteMany({ where: { senderId: u.id } })
        .catch(() => {});
      await prisma.dispute
        .deleteMany({ where: { raisedById: u.id } })
        .catch(() => {});
      await prisma.walletTransaction
        .deleteMany({ where: { userId: u.id } })
        .catch(() => {});
      await prisma.booking
        .deleteMany({ where: { userId: u.id } })
        .catch(() => {});
      await prisma.ownerProfile
        .deleteMany({ where: { userId: u.id } })
        .catch(() => {});
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }

    // 2. Seed Users
    testUser = await prisma.user.create({
      data: {
        name: "Dispute User",
        email: emailUser,
        username: `dispute_u_${ts}`,
        password: "User@Pass123",
        role: "USER",
        phone: "9555512345",
        isVerified: true,
      },
    });

    testOwnerUser = await prisma.user.create({
      data: {
        name: "Dispute Turf Owner",
        email: emailOwner,
        username: `dispute_o_${ts}`,
        password: "Owner@Pass123",
        role: "VENUE_OWNER",
        phone: "9666612345",
        isVerified: true,
      },
    });

    // Admin user does not necessarily need a database record for JWT verification,
    // but creating one ensures robust support logs/replies linking
    const testAdminUser = await prisma.user.create({
      data: {
        name: "Dispute Admin",
        email: emailAdmin,
        username: `dispute_a_${ts}`,
        password: "Admin@Pass123",
        role: "ADMIN",
        phone: "9777712345",
        isVerified: true,
      },
    });

    // 3. Generate JWT Tokens
    const secret = process.env.JWT_SECRET || "fallback_secret";
    userToken = jwt.sign({ id: testUser.id, role: testUser.role }, secret);
    ownerToken = jwt.sign(
      { id: testOwnerUser.id, role: testOwnerUser.role },
      secret
    );
    adminToken = jwt.sign(
      { id: testAdminUser.id, role: testAdminUser.role },
      secret
    );

    // 4. Create OwnerProfile with initial balances
    testOwnerProfile = await prisma.ownerProfile.create({
      data: {
        userId: testOwnerUser.id,
        businessName: "Dispute Turf Arena Ltd",
        verified: true,
        walletBalance: 0.0,
        reservedBalance: 0.0,
        pendingBalance: 0.0,
        inProgressBalance: 15000.0, // Enough to support decrement operations
        disputeBalance: 0.0,
        withdrawnBalance: 0.0,
      },
    });

    // 5. Create Turf belonging to this Owner
    testTurf = await prisma.turf.create({
      data: {
        ownerId: testOwnerProfile.id,
        name: "Wembley Dispute Turf",
        description: "Perfect turf with dispute isolation validation",
        location: "London Wembley Stadium Route",
        city: "London",
        state: "Greater London",
        image: "turf_ Wembley.jpg",
        images: ["turf_ Wembley1.jpg", "turf_ Wembley2.jpg"],
        sportTypes: ["Football", "Rugby"],
        groundTypes: ["Hybrid Grass"],
        facilities: ["Showers", "Parking", "Floodlights"],
        pricePerHour: 1000.0,
        openTime: "08:00",
        closeTime: "22:00",
        availableDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        offDays: [],
        isActive: true,
        status: "approved",
      },
    });

    // 6. Create 4 Booking records in IN_REVIEW_WINDOW
    const bookingDetails = [
      {
        id: `b1_${ts}`,
        totalPrice: 1000.0,
        paidAmount: 1000.0,
        ownerRevenue: 900.0,
      },
      {
        id: `b2_${ts}`,
        totalPrice: 2000.0,
        paidAmount: 2000.0,
        ownerRevenue: 1800.0,
      },
      {
        id: `b3_${ts}`,
        totalPrice: 3000.0,
        paidAmount: 3000.0,
        ownerRevenue: 2700.0,
      },
      {
        id: `b4_${ts}`,
        totalPrice: 4000.0,
        paidAmount: 4000.0,
        ownerRevenue: 3600.0,
      },
    ];

    for (const b of bookingDetails) {
      const createdBooking = await prisma.booking.create({
        data: {
          id: b.id,
          userId: testUser.id,
          turfId: testTurf.id,
          totalPrice: b.totalPrice,
          paidAmount: b.paidAmount,
          balanceAmount: 0.0,
          advanceAmount: 0.0,
          platformFee: b.totalPrice - b.ownerRevenue,
          gstAmount: 0.0,
          ownerRevenue: b.ownerRevenue,
          status: "IN_REVIEW_WINDOW",
          revenueStatus: "IN_PROGRESS",
          bookingSource: "USER",
          paymentMethod: "WALLET",
          paymentType: "FULL",
          paymentStatus: "SUCCESS",
        },
      });
      bookings.push(createdBooking);
    }
  }, 30000);

  afterAll(async () => {
    // Teardown created data
    if (testUser) {
      await prisma.disputeReply
        .deleteMany({
          where: { dispute: { raisedById: testUser.id } },
        })
        .catch(() => {});

      await prisma.dispute
        .deleteMany({
          where: { raisedById: testUser.id },
        })
        .catch(() => {});

      await prisma.walletTransaction
        .deleteMany({
          where: { userId: { in: [testUser.id, testOwnerUser.id] } },
        })
        .catch(() => {});

      await prisma.booking
        .deleteMany({
          where: { userId: testUser.id },
        })
        .catch(() => {});
    }

    if (testTurf) {
      await prisma.turf.delete({ where: { id: testTurf.id } }).catch(() => {});
    }

    if (testOwnerProfile) {
      await prisma.ownerProfile
        .delete({ where: { id: testOwnerProfile.id } })
        .catch(() => {});
    }

    if (testUser || testOwnerUser) {
      await prisma.user
        .deleteMany({
          where: { id: { in: [testUser.id, testOwnerUser.id] } },
        })
        .catch(() => {});
    }
  });

  describe("1. Dispute Creation & Validation Paths", () => {
    it("should reject raising a dispute on a non-existent or ineligible booking", async () => {
      const res = await request(app)
        .post("/api/user/dispute/raise")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          bookingId: "non_existent_booking_id",
          reason: "VENUE_CLOSED",
          description: "This booking is fake and doesn't exist",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not eligible");
    });

    it("should raise a dispute successfully on Booking 1 and freeze funds from OwnerProfile", async () => {
      const booking = bookings[0];
      const res = await request(app)
        .post("/api/user/dispute/raise")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          bookingId: booking.id,
          reason: "VENUE_CLOSED",
          description: "The venue was completely closed during my slot timing.",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.status).toBe("OPEN");

      disputes.push(res.body.data);

      // Verify booking status is now DISPUTED
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(updatedBooking.status).toBe("DISPUTED");

      // Verify owner balances update correctly
      const updatedOwner = await prisma.ownerProfile.findUnique({
        where: { id: testOwnerProfile.id },
      });
      // 15000.00 initial - 900.00 decremented = 14100.00
      expect(Number(updatedOwner.inProgressBalance)).toBe(14100.0);
      // 0.00 initial + 900.00 incremented = 900.00
      expect(Number(updatedOwner.disputeBalance)).toBe(900.0);

      // Verify WalletTransaction created
      const txLog = await prisma.walletTransaction.findFirst({
        where: {
          bookingId: booking.id,
          type: "DISPUTE_FREEZE",
        },
      });
      expect(txLog).toBeDefined();
      expect(Number(txLog.amount)).toBe(900.0);
      expect(txLog.status).toBe("SUCCESS");
    });

    it("should prevent raising duplicate disputes on the same booking", async () => {
      const booking = bookings[0];
      const res = await request(app)
        .post("/api/user/dispute/raise")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          bookingId: booking.id,
          reason: "OVERBOOKING",
          description: "Another duplicate dispute attempt",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/eligible|active/);
    });

    it("should raise disputes on Bookings 2, 3, and 4 to prepare for other resolution paths", async () => {
      for (let i = 1; i <= 3; i++) {
        const booking = bookings[i];
        const res = await request(app)
          .post("/api/user/dispute/raise")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            bookingId: booking.id,
            reason:
              i === 1
                ? "OVERBOOKING"
                : i === 2
                  ? "FACILITIES_MISSING"
                  : "Other",
            customReason: i === 3 ? "Dirty pitch environment" : undefined,
            description: `Seeded dispute for resolution path tests. Index: ${i}`,
          });

        expect(res.statusCode).toBe(201);
        disputes.push(res.body.data);
      }

      // Assert dispute counts
      expect(disputes.length).toBe(4);
    }, 15000);
  });

  describe("2. Dispute Conversation Reply Threads", () => {
    it("should add a user reply to Dispute 1 successfully", async () => {
      const dispute = disputes[0];
      const res = await request(app)
        .post(`/api/user/dispute/${dispute.id}/reply`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          message: "Adding user evidence to the dispute thread.",
          senderRole: "USER",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("OPEN");

      const updatedDispute = await prisma.dispute.findUnique({
        where: { id: dispute.id },
        include: { replies: true },
      });
      expect(updatedDispute.replies.length).toBe(1);
      expect(updatedDispute.replies[0].message).toBe(
        "Adding user evidence to the dispute thread."
      );
    });

    it("should add an admin reply to Dispute 1 and transition status to INVESTIGATING", async () => {
      const dispute = disputes[0];
      const res = await request(app)
        .post(`/api/admin/dispute/${dispute.id}/reply`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          message:
            "Admin is investigating. Please wait while we verify with the venue.",
          senderRole: "ADMIN",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("INVESTIGATING");

      const updatedDispute = await prisma.dispute.findUnique({
        where: { id: dispute.id },
        include: { replies: true },
      });
      // 1 user reply + 1 admin reply = 2 replies
      expect(updatedDispute.replies.length).toBe(2);
      expect(updatedDispute.replies[1].senderType).toBe("ADMIN");
    });
  });

  describe("3. Admin Dispute Resolution Action Mappings", () => {
    it("should resolve Dispute 1 with RELEASE_TO_OWNER and release dispute funds to Owner's walletBalance", async () => {
      const dispute = disputes[0];
      const booking = bookings[0];

      const res = await request(app)
        .post(`/api/admin/dispute/${dispute.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          resolutionAction: "RELEASE_TO_OWNER",
          resolutionNotes:
            "Verifications complete, booking was valid. Releasing funds to owner.",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("RESOLVED");
      expect(res.body.data.resolution.action).toBe("RELEASE_TO_OWNER");

      // Verify booking status resolved to COMPLETED/SETTLED
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(updatedBooking.status).toBe("COMPLETED");
      expect(updatedBooking.revenueStatus).toBe("SETTLED");
      expect(updatedBooking.settledAt).toBeDefined();

      // Verify owner balances update correctly
      const updatedOwner = await prisma.ownerProfile.findUnique({
        where: { id: testOwnerProfile.id },
      });
      // walletBalance incremented by 900.00 = 900.00
      expect(Number(updatedOwner.walletBalance)).toBe(900.0);
      // disputeBalance decremented by 900.00 = 0.00 + other active bookings (1800 + 2700 + 3600 = 8100)
      expect(Number(updatedOwner.disputeBalance)).toBe(8100.0);

      // Verify DISPUTE_RELEASE transaction log
      const txLog = await prisma.walletTransaction.findFirst({
        where: {
          bookingId: booking.id,
          type: "DISPUTE_RELEASE",
        },
      });
      expect(txLog).toBeDefined();
      expect(Number(txLog.amount)).toBe(900.0);
    });

    it("should resolve Dispute 2 with REFUND_TO_USER and subtract dispute balance without crediting owner", async () => {
      const dispute = disputes[1];
      const booking = bookings[1];

      const res = await request(app)
        .post(`/api/admin/dispute/${dispute.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          resolutionAction: "REFUND_TO_USER",
          resolutionNotes:
            "Venue confirmed overbooking error. Fully refunding user.",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify booking status is CANCELLED and revenueStatus is REFUNDED
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(updatedBooking.status).toBe("CANCELLED");
      expect(updatedBooking.revenueStatus).toBe("REFUNDED");

      // Verify owner balances update correctly
      const updatedOwner = await prisma.ownerProfile.findUnique({
        where: { id: testOwnerProfile.id },
      });
      // walletBalance remains 900.00
      expect(Number(updatedOwner.walletBalance)).toBe(900.0);
      // disputeBalance decremented by 1800.00 = 8100.00 - 1800.00 = 6300.00
      expect(Number(updatedOwner.disputeBalance)).toBe(6300.0);
    });

    it("should resolve Dispute 3 with PARTIAL_REFUND and credit split proportions to Owner/User", async () => {
      const dispute = disputes[2];
      const booking = bookings[2]; // ownerRevenue = 2700.00

      const res = await request(app)
        .post(`/api/admin/dispute/${dispute.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          resolutionAction: "PARTIAL_REFUND",
          resolutionNotes:
            "Facility issues reported. Splitting owner revenue: 1000 partial refund to user.",
          partialAmount: 1000.0,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify booking status is COMPLETED and revenueStatus is SETTLED
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(updatedBooking.status).toBe("COMPLETED");
      expect(updatedBooking.revenueStatus).toBe("SETTLED");

      // Verify owner balances update correctly
      const updatedOwner = await prisma.ownerProfile.findUnique({
        where: { id: testOwnerProfile.id },
      });
      // amountToOwner = 2700.00 - 1000.00 = 1700.00. walletBalance = 900.00 + 1700.00 = 2600.00
      expect(Number(updatedOwner.walletBalance)).toBe(2600.0);
      // disputeBalance decremented by 2700.00 = 6300.00 - 2700.00 = 3600.00
      expect(Number(updatedOwner.disputeBalance)).toBe(3600.0);

      // Verify splitting DISPUTE_RELEASE transaction log
      const txLog = await prisma.walletTransaction.findFirst({
        where: {
          bookingId: booking.id,
          type: "DISPUTE_RELEASE",
        },
      });
      expect(txLog).toBeDefined();
      expect(Number(txLog.amount)).toBe(1700.0);
    });

    it("should resolve Dispute 4 with CLOSE_NO_ACTION and release entire frozen amount to Owner's wallet", async () => {
      const dispute = disputes[3];
      const booking = bookings[3]; // ownerRevenue = 3600.00

      const res = await request(app)
        .post(`/api/admin/dispute/${dispute.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          resolutionAction: "CLOSE_NO_ACTION",
          resolutionNotes:
            "No substantial evidence found. Closing dispute and releasing all funds.",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify booking status resolved to COMPLETED/SETTLED
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(updatedBooking.status).toBe("COMPLETED");
      expect(updatedBooking.revenueStatus).toBe("SETTLED");

      // Verify owner balances update correctly
      const updatedOwner = await prisma.ownerProfile.findUnique({
        where: { id: testOwnerProfile.id },
      });
      // walletBalance incremented by 3600.00 = 2600.00 + 3600.00 = 6200.00
      expect(Number(updatedOwner.walletBalance)).toBe(6200.0);
      // disputeBalance decremented by 3600.00 = 3600.00 - 3600.00 = 0.00
      expect(Number(updatedOwner.disputeBalance)).toBe(0.0);
    });

    it("should reject resolution actions on an already resolved dispute", async () => {
      const dispute = disputes[0];

      const res = await request(app)
        .post(`/api/admin/dispute/${dispute.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          resolutionAction: "RELEASE_TO_OWNER",
          resolutionNotes: "Trying to resolve a resolved dispute",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already resolved");
    });
  });
});
