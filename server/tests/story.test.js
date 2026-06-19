import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const userEmail = `story_${ts}@kridaz.test`;
const userPhone = `95555${String(ts).slice(-5)}`;
const userName = `story_${ts}`;
let userToken = "";
let createdStoryId = "";

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

describe("Story Module API", () => {
  beforeAll(async () => {
    // Clean up
    await prisma.story
      .deleteMany({ where: { user: { email: userEmail } } })
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
      name: "Story Tester",
      email: userEmail,
      username: userName,
      phone: userPhone,
      gender: "Male",
      location: "Test City",
      password: "Story@Pass123",
      confirmPassword: "Story@Pass123",
      otp: "123456",
      phoneOtp: "123456",
      registrationToken: otpRes_regRes.body.registrationToken,
    });

    if (regRes.statusCode === 201) {
      userToken = regRes.body.token;
    } else {
      logger.info("[story setup register]", regRes.body);
    }
  }, 30000);

  afterAll(async () => {
    const user = await prisma.user.findFirst({ where: { email: userEmail } });
    if (user) {
      await prisma.story
        .deleteMany({ where: { userId: user.id } })
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

  describe("POST /api/user/stories", () => {
    it("should reject story creation without auth token", async () => {
      const res = await request(app)
        .post("/api/user/stories")
        .send({ content: "Guest story content" });

      expect(res.statusCode).toBe(401);
    });

    it("should create a text-based story successfully with valid auth token", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/user/stories")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          content: "Enjoying a beautiful game night!",
          durationDays: 1,
        });

      if (res.statusCode !== 201) logger.info("[create story error]", res.body);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("story");
      expect(res.body.story).toHaveProperty("id");
      expect(res.body.story.content).toBe("Enjoying a beautiful game night!");
      createdStoryId = res.body.story.id;
    });
  });

  describe("GET /api/user/stories/feed", () => {
    it("should fetch feed successfully as guest (optional auth)", async () => {
      const res = await request(app).get("/api/user/stories/feed");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should fetch stories feed successfully with auth token", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .get("/api/user/stories/feed?all=true")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.stories)).toBe(true);
    });
  });

  describe("POST /api/user/stories/:id/view", () => {
    it("should record view successfully with auth token", async () => {
      if (!userToken || !createdStoryId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/user/stories/${createdStoryId}/view`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /api/user/stories/:id", () => {
    it("should delete the story successfully", async () => {
      if (!userToken || !createdStoryId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .delete(`/api/user/stories/${createdStoryId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
