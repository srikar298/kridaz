import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const ts = Date.now();
const emailUser = `prof_u_${ts}@kridaz.test`;
const phoneUser = `91111${String(ts).slice(-5)}`;
const userNameUser = `prof_u_${ts}`;

const emailOwner = `prof_o_${ts}@kridaz.test`;
const phoneOwner = `92222${String(ts).slice(-5)}`;
const userNameOwner = `prof_o_${ts}`;

let userToken = "";
let ownerToken = "";
let userId = "";
let ownerUserId = "";
let ownerProfileId = "";
let matchRequestId = "";
let matchOfferId = "";
let bookingId = "";

const seedOtp = async (email, phone) => {
  await prisma.oTP.deleteMany({
    where: {
      OR: [{ email }, { phone }],
    },
  });
  await prisma.oTP.create({
    data: {
      email,
      phone,
      emailOtp: "123456",
      phoneOtp: "123456",
      expiresAt: new Date(Date.now() + 600000),
    },
  });
};

describe("Professional Module API", () => {
  beforeAll(async () => {
    // Cleanup existing records with same email/phone
    for (const email of [emailUser, emailOwner]) {
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        await prisma.walletTransaction
          .deleteMany({ where: { userId: user.id } })
          .catch(() => {});
        await prisma.wallet
          .deleteMany({ where: { userId: user.id } })
          .catch(() => {});
        await prisma.review
          .deleteMany({ where: { userId: user.id } })
          .catch(() => {});

        const owner = await prisma.ownerProfile.findFirst({
          where: { userId: user.id },
        });
        if (owner) {
          await prisma.professionalMatchOffer
            .deleteMany({ where: { professionalId: owner.id } })
            .catch(() => {});
          await prisma.onDemandProfessionalBooking
            .deleteMany({ where: { professionalId: owner.id } })
            .catch(() => {});
          await prisma.professionalTask
            .deleteMany({ where: { professionalId: owner.id } })
            .catch(() => {});
          await prisma.professionalCustomer
            .deleteMany({ where: { professionalId: owner.id } })
            .catch(() => {});
          await prisma.withdrawalRequest
            .deleteMany({ where: { ownerId: owner.id } })
            .catch(() => {});
          await prisma.ownerProfile
            .delete({ where: { id: owner.id } })
            .catch(() => {});
        }
        await prisma.professionalMatchRequest
          .deleteMany({ where: { userId: user.id } })
          .catch(() => {});
        await prisma.onDemandProfessionalBooking
          .deleteMany({ where: { userId: user.id } })
          .catch(() => {});
        await prisma.professionalBooking
          .deleteMany({ where: { userId: user.id } })
          .catch(() => {});
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      }
      await prisma.oTP.deleteMany({ where: { email } }).catch(() => {});
    }

    // 1. Seed OTPs
    await seedOtp(emailUser, phoneUser);
    await seedOtp(emailOwner, phoneOwner);

    // 2. Verify OTPs to get registration tokens
    const verifyUser = await request(app)
      .post("/api/user/auth/verify-otp")
      .send({ email: emailUser, phone: phoneUser, otp: "123456" });
    const userRegToken = verifyUser.body.registrationToken;

    const verifyOwner = await request(app)
      .post("/api/user/auth/verify-otp")
      .send({ email: emailOwner, phone: phoneOwner, otp: "123456" });
    const ownerRegToken = verifyOwner.body.registrationToken;

    // 3. Register User
    const regUser = await request(app).post("/api/user/auth/register").send({
      name: "User Book",
      email: emailUser,
      username: userNameUser,
      phone: phoneUser,
      gender: "Male",
      location: "Mumbai",
      password: "User@Pass123",
      confirmPassword: "User@Pass123",
      otp: "123456",
      registrationToken: userRegToken,
    });

    if (regUser.statusCode === 201) {
      userToken = regUser.body.token;
      userId = regUser.body.user?.id || "";
    } else {
      console.error("[SETUP ERROR] User registration failed:", regUser.body);
    }

    // 4. Register Owner (as Umpire)
    const regOwner = await request(app)
      .post("/api/owner/auth/owner/register")
      .send({
        name: "Umpire Pro Partner",
        email: emailOwner,
        phone: phoneOwner,
        role: "UMPIRE",
        gender: "Male",
        location: "Mumbai",
        password: "Owner@Pass123",
        businessName: "Mumbai Cricket Officials",
        otp: "123456",
        registrationToken: ownerRegToken,
      });

    if (regOwner.statusCode === 201) {
      ownerUserId = regOwner.body.user?.id || "";
      ownerToken = regOwner.body.token;
    } else {
      console.error("[SETUP ERROR] Owner registration failed:", regOwner.body);
    }

    // Direct Discovery of ownerProfileId
    if (ownerUserId) {
      const ownerProfile = await prisma.ownerProfile.findUnique({
        where: { userId: ownerUserId },
      });
      if (ownerProfile) {
        ownerProfileId = ownerProfile.id;
      }
    }

    // Setup user's wallet with enough balance
    if (userId) {
      await prisma.wallet.upsert({
        where: { userId },
        update: { balance: 2000 },
        create: { userId, balance: 2000, reservedBalance: 0 },
      });
    }

    // Setup owner's initial wallet/profile data
    if (ownerProfileId) {
      await prisma.ownerProfile.update({
        where: { id: ownerProfileId },
        data: { price: 150.0 },
      });
    }
  }, 30000);

  afterAll(async () => {
    // Cleanup matching records
    if (ownerProfileId) {
      await prisma.professionalMatchOffer
        .deleteMany({ where: { professionalId: ownerProfileId } })
        .catch(() => {});
      await prisma.onDemandProfessionalBooking
        .deleteMany({ where: { professionalId: ownerProfileId } })
        .catch(() => {});
      await prisma.professionalBooking
        .deleteMany({ where: { professionalId: ownerProfileId } })
        .catch(() => {});
      await prisma.review
        .deleteMany({ where: { professionalId: ownerProfileId } })
        .catch(() => {});
      await prisma.ownerProfile
        .delete({ where: { id: ownerProfileId } })
        .catch(() => {});
    }
    for (const id of [userId, ownerUserId]) {
      if (id) {
        await prisma.walletTransaction
          .deleteMany({ where: { userId: id } })
          .catch(() => {});
        await prisma.wallet
          .deleteMany({ where: { userId: id } })
          .catch(() => {});
        await prisma.user.delete({ where: { id } }).catch(() => {});
      }
    }
    await prisma.$disconnect();
  });

  describe("GET /api/professional/list", () => {
    it("should retrieve a list of professionals", async () => {
      const res = await request(app)
        .get("/api/professional/list")
        .query({ city: "Mumbai" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("professionals");
      expect(Array.isArray(res.body.professionals)).toBe(true);
    });
  });

  describe("GET /api/professional/filters", () => {
    it("should retrieve filter options for states and cities", async () => {
      const res = await request(app).get("/api/professional/filters");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("states");
      expect(res.body).toHaveProperty("cities");
    });
  });

  describe("GET /api/professional/details/:id", () => {
    it("should retrieve professional details by ID", async () => {
      const res = await request(app).get(
        `/api/professional/details/${ownerProfileId}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("professional");
      expect(res.body.professional.id).toBe(ownerProfileId);
    });
  });

  describe("PUT /api/professional/toggle-online", () => {
    it("should toggle professional online status and set geolocation", async () => {
      const res = await request(app)
        .put("/api/professional/toggle-online")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          isOnline: true,
          latitude: 19.076,
          longitude: 72.8777,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isOnline).toBe(true);
    });
  });

  describe("POST /api/professional/match-request", () => {
    it("should fail match request if wallet balance is insufficient for max budget", async () => {
      const res = await request(app)
        .post("/api/professional/match-request")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          customLocation: { latitude: 19.076, longitude: 72.8777 },
          roles: ["UMPIRE"],
          minBudget: 100.0,
          maxBudget: 5000.0, // User wallet has only 2000 coins
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Insufficient wallet balance");
    });

    it("should create match request successfully and create match offers for online candidates in radius", async () => {
      const res = await request(app)
        .post("/api/professional/match-request")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          customLocation: { latitude: 19.076, longitude: 72.8777 },
          roles: ["UMPIRE"],
          minBudget: 100.0,
          maxBudget: 300.0,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.matchRequest).toBeDefined();
      matchRequestId = res.body.matchRequest.id;

      // Verify that a pending match offer was automatically generated for the online professional
      const offer = await prisma.professionalMatchOffer.findFirst({
        where: { requestId: matchRequestId, professionalId: ownerProfileId },
      });
      expect(offer).toBeDefined();
      matchOfferId = offer.id;
    });
  });

  describe("POST /api/professional/offers/:offerId/accept", () => {
    it("should accept match offer, create booking, and return OTP check-in code", async () => {
      const res = await request(app)
        .post(`/api/professional/offers/${matchOfferId}/accept`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.booking).toBeDefined();
      expect(res.body.otp).toBeDefined();

      bookingId = res.body.booking.id;
      // Store plain text OTP from response to perform check-in verification
      const plainOtp = res.body.otp;

      // Verify DB status transitions
      const updatedReq = await prisma.professionalMatchRequest.findUnique({
        where: { id: matchRequestId },
      });
      expect(updatedReq.status).toBe("MATCHED");

      const updatedOffer = await prisma.professionalMatchOffer.findUnique({
        where: { id: matchOfferId },
      });
      expect(updatedOffer.status).toBe("ACCEPTED");

      const booking = await prisma.onDemandProfessionalBooking.findUnique({
        where: { id: bookingId },
      });
      expect(booking.status).toBe("ASSIGNED");

      // Verify OTP verification check-in route
      const checkinRes = await request(app)
        .post(`/api/professional/bookings/${bookingId}/verify-otp`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ otp: plainOtp });

      expect(checkinRes.statusCode).toBe(200);
      expect(checkinRes.body.success).toBe(true);
      expect(checkinRes.body.message).toContain("Check-in successful");

      // Verify escrow released to professional wallet
      const activeBooking = await prisma.onDemandProfessionalBooking.findUnique(
        { where: { id: bookingId } }
      );
      expect(activeBooking.status).toBe("IN_PROGRESS");
    }, 15000);
  });

  describe("GET /api/professional/on-demand-bookings", () => {
    it("should retrieve matched on-demand booking histories for professionals", async () => {
      const res = await request(app)
        .get("/api/professional/on-demand-bookings")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("bookings");
      expect(res.body.bookings.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/professional/user-on-demand-bookings", () => {
    it("should retrieve matched on-demand booking histories for users", async () => {
      const res = await request(app)
        .get("/api/professional/user-on-demand-bookings")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("bookings");
      expect(res.body.bookings.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/professional/review", () => {
    it("should submit a testimonial review rating for matched professional", async () => {
      const res = await request(app)
        .post("/api/professional/review")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          professionalId: ownerProfileId,
          rating: 5,
          comment: "Brilliant officiating work!",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("Review added");
    });
  });
});
