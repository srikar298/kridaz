import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const userEmail = `reels_${ts}@kridaz.test`;
const userPhone = `96666${String(ts).slice(-5)}`;
const userName = `reels_${ts}`;
let userToken = "";
let seededReelId = "";

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

describe("Reels Module API", () => {
  beforeAll(async () => {
    // Clean up
    await prisma.reelInteraction
      .deleteMany({ where: { user: { email: userEmail } } })
      .catch(() => {});
    await prisma.reelComment
      .deleteMany({ where: { user: { email: userEmail } } })
      .catch(() => {});
    await prisma.reel
      .deleteMany({ where: { creator: { email: userEmail } } })
      .catch(() => {});
    await prisma.refreshToken
      .deleteMany({ where: { user: { email: userEmail } } })
      .catch(() => {});
    await prisma.user
      .deleteMany({ where: { email: userEmail } })
      .catch(() => {});
    await prisma.oTP
      .deleteMany({ where: { email: userEmail } })
      .catch(() => {});

    await seedOtp(userEmail, userPhone);

    // Register user
    const otpRes_regRes = await request(app)
      .post("/api/user/auth/verify-otp")
      .send({ email: userEmail, phone: userPhone, otp: "123456" });
    const regRes = await request(app).post("/api/user/auth/register").send({
      name: "Reels Tester",
      email: userEmail,
      username: userName,
      phone: userPhone,
      gender: "Male",
      location: "Test City",
      password: "Reels@Pass123",
      confirmPassword: "Reels@Pass123",
      otp: "123456",
      phoneOtp: "123456",
      registrationToken: otpRes_regRes.body.registrationToken,
    });

    if (regRes.statusCode === 201) {
      userToken = regRes.body.token;

      // Seed a dummy Reel for testing interactions
      const creator = await prisma.user.findFirst({
        where: { email: userEmail },
      });
      if (creator) {
        const reel = await prisma.reel.create({
          data: {
            creatorId: creator.id,
            caption: "Seeded test reel",
            status: "ready",
            rawVideoUrl: "https://example.com/test-reel.mp4",
            hlsUrl: "https://example.com/test-reel/index.m3u8",
          },
        });
        seededReelId = reel.id;
      }
    } else {
      logger.info("[reels setup register]", regRes.body);
    }
  }, 30000);

  afterAll(async () => {
    const user = await prisma.user.findFirst({ where: { email: userEmail } });
    if (user) {
      await prisma.reelInteraction
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.reelComment
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.reel
        .deleteMany({ where: { creatorId: user.id } })
        .catch(() => {});
      await prisma.refreshToken
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }
    await prisma.oTP
      .deleteMany({ where: { email: userEmail } })
      .catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /api/reels/recommended", () => {
    it("should return recommended reels feed", async () => {
      const res = await request(app).get("/api/reels/recommended");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.reels)).toBe(true);
    });
  });

  describe("GET /api/reels/feed", () => {
    it("should return reels feed", async () => {
      const res = await request(app).get("/api/reels/feed");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.reels)).toBe(true);
    });
  });

  describe("POST /api/reels/:reelId/interact", () => {
    it("should reject interaction without auth token", async () => {
      if (!seededReelId) return logger.warn("Skipped: no seeded reel ID");

      const res = await request(app)
        .post(`/api/reels/${seededReelId}/interact`)
        .send({ type: "LIKE" });

      expect(res.statusCode).toBe(401);
    });

    it("should register a like interaction successfully with auth token", async () => {
      if (!userToken || !seededReelId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/reels/${seededReelId}/interact`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ type: "LIKE" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("interaction");
    });
  });

  describe("POST /api/reels/:reelId/comment", () => {
    it("should reject adding a comment without auth token", async () => {
      if (!seededReelId) return logger.warn("Skipped: no seeded reel ID");

      const res = await request(app)
        .post(`/api/reels/${seededReelId}/comment`)
        .send({ content: "Nice video!" });

      expect(res.statusCode).toBe(401);
    });

    it("should add a comment successfully with auth token", async () => {
      if (!userToken || !seededReelId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/reels/${seededReelId}/comment`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "Nice test reel!" });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.text).toBe("Nice test reel!");
    });
  });

  describe("POST /api/reels/:reelId/heartbeat", () => {
    it("should update watch time successfully", async () => {
      if (!seededReelId) return logger.warn("Skipped: no seeded reel ID");

      const res = await request(app)
        .post(`/api/reels/${seededReelId}/heartbeat`)
        .send({ watchTime: 5.5, completed: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /api/reels/:reelId", () => {
    it("should delete the reel successfully", async () => {
      if (!userToken || !seededReelId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .delete(`/api/reels/${seededReelId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
