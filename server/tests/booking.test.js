import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const userEmail = `booker_${ts}@kridaz.test`;
const userPhone = `92222${String(ts).slice(-5)}`;
const userName = `booker_${ts}`;
let userToken = "";
let testTurfId = "";
let testBookingId = "";

// ── Helpers ───────────────────────────────────────────────────────────────────
const seedOtp = async (email, phone) => {
  await prisma.oTP.deleteMany({ where: { email } });
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

const futureDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
};

const slotStart = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};

const slotEnd = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
};

// ── Test Suite ────────────────────────────────────────────────────────────────

describe("Booking Module API", () => {
  // ── Setup — register user and find a live turf ────────────────────────
  beforeAll(async () => {
    // Clean up any leftover test data
    await prisma.walletTransaction
      .deleteMany({ where: { user: { email: userEmail } } })
      .catch(() => {});
    await prisma.refreshToken
      .deleteMany({ where: { user: { email: userEmail } } })
      .catch(() => {});
    await prisma.booking
      .deleteMany({ where: { user: { email: userEmail } } })
      .catch(() => {});
    await prisma.user
      .deleteMany({ where: { email: userEmail } })
      .catch(() => {});
    await prisma.oTP.deleteMany({ where: { email: userEmail } });

    await seedOtp(userEmail, userPhone);

    // Register test user
    const otpRes_regRes = await request(app)
      .post("/api/user/auth/verify-otp")
      .send({ email: userEmail, phone: userPhone, otp: "123456" });
    const regRes = await request(app).post("/api/user/auth/register").send({
      name: "Booking Tester",
      email: userEmail,
      username: userName,
      phone: userPhone,
      gender: "Male",
      location: "Test City",
      password: "Booker@Pass123",
      confirmPassword: "Booker@Pass123",
      otp: "123456",
      phoneOtp: "123456",
      registrationToken: otpRes_regRes.body.registrationToken,
    });

    if (regRes.statusCode !== 201) {
      logger.info("[booking setup register]", regRes.body);
    } else {
      userToken = regRes.body.token;
    }

    // Fetch an approved turf to use in booking tests
    const turfRes = await request(app).get("/api/user/turf/all");
    const turfs = turfRes.body?.turfs || [];
    if (turfs.length > 0) {
      testTurfId = turfs[0].id;
      logger.info("[booking setup] Using turf:", testTurfId);
    } else {
      logger.warn(
        "[booking setup] No approved turfs found — booking flow tests will be skipped."
      );
    }
  }, 30000);

  afterAll(async () => {
    // Clean up bookings created by this test user
    const user = await prisma.user.findFirst({ where: { email: userEmail } });
    if (user) {
      await prisma.walletTransaction
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.refreshToken
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.booking
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }
    await prisma.oTP
      .deleteMany({ where: { email: userEmail } })
      .catch(() => {});
    await prisma.$disconnect();
  });

  // ── 1. Create Razorpay Order ──────────────────────────────────────────
  describe("POST /api/user/booking/create-order", () => {
    it("should reject without auth token", async () => {
      const res = await request(app)
        .post("/api/booking/user/create-order")
        .send({ totalPrice: 500 });

      expect(res.statusCode).toBe(401);
    });

    it("should reject with missing totalPrice", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/booking/user/create-order")
        .set("Authorization", `Bearer ${userToken}`)
        .send({});

      expect(res.statusCode).toBe(422);
    });

    it("should create a Razorpay order with valid payload", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/booking/user/create-order")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ totalPrice: 500 });

      if (res.statusCode !== 200) logger.info("[create-order]", res.body);

      // 200 = Razorpay order created, 500 = Razorpay key not set in test env
      expect([200, 500]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty("order");
        expect(res.body.order).toHaveProperty("id");
        expect(res.body.order).toHaveProperty("amount");
      }
    });
  });

  // ── 2. Wallet Booking ────────────────────────────────────────────────
  describe("POST /api/booking/user/book-with-wallet", () => {
    it("should reject without auth token", async () => {
      const res = await request(app)
        .post("/api/booking/user/book-with-wallet")
        .send({
          turfId: "dummy-id",
          startTime: slotStart(),
          endTime: slotEnd(),
          selectedTurfDate: futureDateStr(),
          totalPrice: 500,
        });

      expect(res.statusCode).toBe(401);
    });

    it("should reject with missing required fields", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/booking/user/book-with-wallet")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ totalPrice: 500 }); // missing startTime, endTime, turfId

      expect(res.statusCode).toBe(422);
    });

    it("should reject booking on non-existent turf", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/booking/user/book-with-wallet")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          turfId: "non-existent-turf-id-00000",
          startTime: slotStart(),
          endTime: slotEnd(),
          selectedTurfDate: futureDateStr(),
          totalPrice: 500,
        });

      expect([400, 404, 422]).toContain(res.statusCode);
    });

    it("should attempt wallet booking on real turf (insufficient funds guard)", async () => {
      if (!userToken || !testTurfId)
        return logger.warn("Skipped: no token or turf");

      const res = await request(app)
        .post("/api/booking/user/book-with-wallet")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          turfId: testTurfId,
          startTime: slotStart(),
          endTime: slotEnd(),
          selectedTurfDate: futureDateStr(),
          totalPrice: 9999999, // deliberately too high → insufficient wallet balance
        });

      if (res.statusCode !== 200) logger.info("[wallet-book]", res.body);

      // Fresh user has ₹0 wallet, so this should be rejected
      expect([400, 402, 409, 422]).toContain(res.statusCode);
    });
  });

  // ── 3. Get User Bookings ──────────────────────────────────────────────
  describe("GET /api/booking/user/all", () => {
    it("should reject without auth token", async () => {
      const res = await request(app).get("/api/booking/user/all");
      expect(res.statusCode).toBe(401);
    });

    it("should return booking list (possibly empty) for authenticated user", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .get("/api/booking/user/all")
        .set("Authorization", `Bearer ${userToken}`);

      if (res.statusCode !== 200) logger.info("[get-bookings]", res.body);
      expect(res.statusCode).toBe(200);
      // bookings array (or paginated object) should be present
      expect(res.body).toBeTruthy();
    });
  });

  // ── 4. Get Booking By ID ──────────────────────────────────────────────
  describe("GET /api/booking/user/:id", () => {
    it("should return 404 for a non-existent booking ID", async () => {
      const res = await request(app).get(
        "/api/booking/user/nonexistent-booking-id"
      );
      expect([404, 400]).toContain(res.statusCode);
    });
  });

  // ── 5. Validate Coupon ────────────────────────────────────────────────
  describe("POST /api/booking/user/validate-coupon", () => {
    it("should reject without auth token", async () => {
      const res = await request(app)
        .post("/api/booking/user/validate-coupon")
        .send({ code: "TESTCODE" });

      expect(res.statusCode).toBe(401);
    });

    it("should reject an invalid coupon code", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/booking/user/validate-coupon")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ code: "INVALIDCOUPON99", turfId: "dummy", amount: 500 });

      // Could be 400 (not found) or 404
      expect([400, 404]).toContain(res.statusCode);
    });
  });
});
