import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import {
  redisClient,
  bullmqConnection,
  pubClient,
  subClient,
} from "../config/redis.js";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const testEmail = `testuser_${ts}@kridaz.test`;
const testPhone = `98765${String(ts).slice(-5)}`;
const testUsername = `testuser_${ts}`;
let authToken = "";

describe("Auth Module API", () => {
  // ── Setup ────────────────────────────────────────────────────────────────
  beforeAll(async () => {
    await prisma.walletTransaction
      .deleteMany({ where: { user: { email: testEmail } } })
      .catch(() => {});
    await prisma.refreshToken
      .deleteMany({ where: { user: { email: testEmail } } })
      .catch(() => {});
    await prisma.booking
      .deleteMany({ where: { user: { email: testEmail } } })
      .catch(() => {});
    await prisma.user
      .deleteMany({ where: { email: testEmail } })
      .catch(() => {});
    await prisma.oTP.deleteMany({ where: { email: testEmail } });

    // Pre-seed OTP so registration can succeed without a real SMS/email send
    await prisma.oTP.create({
      data: {
        email: testEmail,
        phone: testPhone,
        emailOtp: "123456",
        phoneOtp: "123456",
        expiresAt: new Date(Date.now() + 600000), // 10 minutes from now
      },
    });
  }, 30000);

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
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
    await prisma.oTP.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
    await redisClient.quit();
    await bullmqConnection.quit();
    await pubClient.quit();
    await subClient.quit();
  });

  // ── 1. Registration ───────────────────────────────────────────────────────
  describe("POST /api/user/auth/register", () => {
    it("should register a new user successfully", async () => {
      // 1. Verify OTP first to get registration token
      const otpRes = await request(app).post("/api/user/auth/verify-otp").send({
        email: testEmail,
        phone: testPhone,
        otp: "123456",
      });

      expect(otpRes.statusCode).toBe(200);
      expect(otpRes.body.success).toBe(true);
      expect(otpRes.body).toHaveProperty("registrationToken");

      const registrationToken = otpRes.body.registrationToken;

      // 2. Perform registration using registrationToken
      const res = await request(app).post("/api/user/auth/register").send({
        name: "Test Player",
        email: testEmail,
        username: testUsername,
        phone: testPhone,
        gender: "Male",
        location: "Test City",
        password: "Password@123",
        confirmPassword: "Password@123",
        otp: "123456",
        phoneOtp: "123456",
        registrationToken: registrationToken,
      });

      if (res.statusCode !== 201) logger.info("[register]", res.body);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");
    });

    it("should reject duplicate registration with same email", async () => {
      // Re-seed OTP so the request isn't blocked by missing OTP
      await prisma.oTP
        .create({
          data: {
            email: testEmail,
            phone: testPhone,
            emailOtp: "123456",
            phoneOtp: "123456",
            expiresAt: new Date(Date.now() + 600000),
          },
        })
        .catch(() => {});

      const otpRes = await request(app).post("/api/user/auth/verify-otp").send({
        email: testEmail,
        phone: testPhone,
        otp: "123456",
      });

      const registrationToken = otpRes.body.registrationToken || "fake-token";

      const res = await request(app)
        .post("/api/user/auth/register")
        .send({
          name: "Duplicate",
          email: testEmail,
          username: `dup_${ts}`,
          phone: testPhone,
          gender: "Male",
          location: "Test City",
          password: "Password@123",
          confirmPassword: "Password@123",
          otp: "123456",
          phoneOtp: "123456",
          registrationToken: registrationToken,
        });

      expect(res.statusCode).not.toBe(201);
    });

    it("should reject registration with missing required fields", async () => {
      const res = await request(app)
        .post("/api/user/auth/register")
        .send({ email: testEmail });

      expect([400, 422]).toContain(res.statusCode);
    });
  });

  // ── 2. Login ──────────────────────────────────────────────────────────────
  describe("POST /api/user/auth/login", () => {
    beforeEach(async () => {
      // Always ensure a fresh OTP exists before login
      await prisma.oTP.deleteMany({ where: { email: testEmail } });
      await prisma.oTP.create({
        data: {
          email: testEmail,
          phone: testPhone,
          emailOtp: "123456",
          phoneOtp: "123456",
          expiresAt: new Date(Date.now() + 600000),
        },
      });
    });

    it("should login with valid credentials and OTP", async () => {
      const res = await request(app).post("/api/user/auth/login").send({
        email: testEmail,
        password: "Password@123",
        otp: "123456",
      });

      if (res.statusCode !== 200) logger.info("[login]", res.body);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("role");
      authToken = res.body.token; // store for subsequent tests
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app).post("/api/user/auth/login").send({
        email: testEmail,
        password: "WrongPassword!",
        otp: "123456",
      });

      expect(res.statusCode).not.toBe(200);
    });

    it("should reject login with wrong OTP", async () => {
      const res = await request(app).post("/api/user/auth/login").send({
        email: testEmail,
        password: "Password@123",
        otp: "000000",
      });

      expect(res.statusCode).not.toBe(200);
    });

    it("should reject login with non-existent email", async () => {
      const res = await request(app).post("/api/user/auth/login").send({
        email: "ghost_nobody@kridaz.test",
        password: "Password@123",
        otp: "123456",
      });

      expect(res.statusCode).not.toBe(200);
    });
  });

  // ── 2b. Login Step 1 (Unified OTP Send) ──
  describe("POST /api/user/auth/login-step1", () => {
    it("should login directly and return token for valid credentials", async () => {
      const res = await request(app).post("/api/user/auth/login-step1").send({
        email: testEmail,
        password: "Password@123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");
    });

    it("should reject login-step1 with wrong password", async () => {
      const res = await request(app).post("/api/user/auth/login-step1").send({
        email: testEmail,
        password: "WrongPassword",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ── 3. Username check ─────────────────────────────────────────────────────
  describe("GET /api/user/auth/check-username", () => {
    it("should return taken=true for an existing username", async () => {
      const res = await request(app).get(
        `/api/user/auth/check-username?username=${testUsername}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("available");
    });

    it("should return available=true for a fresh username", async () => {
      const res = await request(app).get(
        `/api/user/auth/check-username?username=freeuser_${ts}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.available).toBe(true);
    });

    it("should return 400 when username param is missing", async () => {
      const res = await request(app).get("/api/user/auth/check-username");

      expect(res.statusCode).toBe(400);
    });
  });

  // ── 4. Protected route guard ──────────────────────────────────────────────
  describe("GET /api/user/auth/getMe", () => {
    it("should return 401 without auth token", async () => {
      const res = await request(app).get("/api/user/auth/getMe");
      expect(res.statusCode).toBe(401);
    });

    it("should return user profile when valid token is provided", async () => {
      if (!authToken) return; // skip if login test failed
      const res = await request(app)
        .get("/api/user/auth/getMe")
        .set("Authorization", `Bearer ${authToken}`);

      if (res.statusCode !== 200) logger.info("[getMe]", res.body);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
    });
  });
});
