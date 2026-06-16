import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const email1 = `player_t1_${ts}@kridaz.test`;
const phone1 = `96666${String(ts).slice(-5)}`;
const userName1 = `player_t1_${ts}`;

const email2 = `player_t2_${ts}@kridaz.test`;
const phone2 = `97777${String(ts).slice(-5)}`;
const userName2 = `player_t2_${ts}`;

let token1 = "";
let token2 = "";
let userId1 = "";
let userId2 = "";

const seedOtp = async (email, phone) => {
  await prisma.oTP.deleteMany({ where: { email } });
  await prisma.oTP.create({
    data: {
      email,
      phone,
      emailOtp: "123456",
      phoneOtp: "123456",
      expiresAt: new Date(Date.now() + 600000)
    },
  });
};

describe("Player Module API", () => {
  beforeAll(async () => {
    // Clean up potentially existing records
    for (const email of [email1, email2]) {
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        await prisma.userRelationship.deleteMany({
          where: { OR: [{ userId: user.id }, { targetId: user.id }] }
        }).catch(() => {});
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.userProfile.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      }
      await prisma.oTP.deleteMany({ where: { email } }).catch(() => {});
    }

    // Seed OTPs
    await seedOtp(email1, phone1);
    await seedOtp(email2, phone2);

    // Register Player 1
    const otpRes_regRes1 = await request(app).post('/api/user/auth/verify-otp').send({ email: email1, phone: phone1, otp: "123456" });
    const regRes1 = await request(app)
      .post("/api/user/auth/register")
      .send({
        name: "Player One",
        email: email1,
        username: userName1,
        phone: phone1,
        gender: "Male",
        location: "Bengaluru",
        password: "Player@Pass123",
        confirmPassword: "Player@Pass123",
        otp: "123456",
        phoneOtp: "123456", registrationToken: otpRes_regRes1.body.registrationToken});

    if (regRes1.statusCode === 201) {
      token1 = regRes1.body.token;
      userId1 = regRes1.body.user?.id || "";
    } else {
      logger.info("[player setup register 1 error]", regRes1.body);
    }

    // Register Player 2
    const otpRes_regRes2 = await request(app).post('/api/user/auth/verify-otp').send({ email: email2, phone: phone2, otp: "123456" });
    const regRes2 = await request(app)
      .post("/api/user/auth/register")
      .send({
        name: "Player Two",
        email: email2,
        username: userName2,
        phone: phone2,
        gender: "Female",
        location: "Bengaluru",
        password: "Player@Pass123",
        confirmPassword: "Player@Pass123",
        otp: "123456",
        phoneOtp: "123456", registrationToken: otpRes_regRes2.body.registrationToken});

    if (regRes2.statusCode === 201) {
      token2 = regRes2.body.token;
      userId2 = regRes2.body.user?.id || "";
    } else {
      logger.info("[player setup register 2 error]", regRes2.body);
    }

    // Fallback ID discovery if not returned in response body
    if (!userId1 && token1) {
      const decoded1 = JSON.parse(Buffer.from(token1.split(".")[1], "base64").toString());
      userId1 = decoded1.id;
    }
    if (!userId2 && token2) {
      const decoded2 = JSON.parse(Buffer.from(token2.split(".")[1], "base64").toString());
      userId2 = decoded2.id;
    }
  }, 30000);

  afterAll(async () => {
    for (const userId of [userId1, userId2]) {
      if (userId) {
        await prisma.userRelationship.deleteMany({
          where: { OR: [{ userId }, { targetId: userId }] }
        }).catch(() => {});
        await prisma.refreshToken.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.userProfile.deleteMany({ where: { userId } }).catch(() => {});
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      }
    }
    await prisma.oTP.deleteMany({ where: { email: { in: [email1, email2] } } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("POST /api/user/players/location", () => {
    it("should reject updating location without auth token", async () => {
      const res = await request(app)
        .post("/api/user/players/location")
        .send({ lat: 12.9716, lng: 77.5946 });

      expect(res.statusCode).toBe(401);
    });

    it("should update player 1's location successfully", async () => {
      if (!token1) return logger.warn("Skipped: no token1");

      const res = await request(app)
        .post("/api/user/players/location")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          lat: 12.9716,
          lng: 77.5946,
          sharing: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Location updated");
    });

    it("should update player 2's location successfully", async () => {
      if (!token2) return logger.warn("Skipped: no token2");

      const res = await request(app)
        .post("/api/user/players/location")
        .set("Authorization", `Bearer ${token2}`)
        .send({
          lat: 12.9720,
          lng: 77.5950,
          sharing: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /api/user/players/nearby", () => {
    it("should retrieve nearby players for Player 1", async () => {
      if (!token1) return logger.warn("Skipped: no token1");

      const res = await request(app)
        .get("/api/user/players/nearby")
        .set("Authorization", `Bearer ${token1}`)
        .query({
          lat: 12.9716,
          lng: 77.5946,
          radius: 5000
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.players)).toBe(true);
      
      console.log("TEST DEBUG - userId2:", userId2, "res.body.players count:", res.body.players.length, "players:", JSON.stringify(res.body.players, null, 2));

      // Player 2 should be in the list of nearby players
      const p2 = res.body.players.find(p => p.id === userId2);
      expect(p2).toBeDefined();
    });
  });

  describe("GET /api/user/players/search", () => {
    it("should find players matching a query", async () => {
      const res = await request(app)
        .get("/api/user/players/search")
        .query({ query: userName2.slice(0, 15) });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.players)).toBe(true);
      expect(res.body.players.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/user/players/:id/follow", () => {
    it("should allow Player 1 to follow Player 2", async () => {
      if (!token1 || !userId2) return logger.warn("Skipped: missing ids");

      const res = await request(app)
        .post(`/api/user/players/${userId2}/follow`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Followed successfully");
    });
  });

  describe("GET /api/user/players/network", () => {
    it("should return the following network of Player 1", async () => {
      if (!token1) return logger.warn("Skipped: no token1");

      const res = await request(app)
        .get("/api/user/players/network")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.following)).toBe(true);
      const followingIds = res.body.following.map(u => u.id);
      expect(followingIds).toContain(userId2);
    });
  });

  describe("GET /api/user/players/:id", () => {
    it("should retrieve Player 2's profile with stats", async () => {
      if (!userId2) return logger.warn("Skipped: no userId2");

      const res = await request(app)
        .get(`/api/user/players/${userId2}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile).toHaveProperty("id", userId2);
      expect(res.body.profile.username).toBe(userName2);
      expect(res.body.profile.followers).toContain(userId1);
    });
  });

  describe("GET /api/user/players/:id/network", () => {
    it("should retrieve Player 2's network", async () => {
      if (!token1 || !userId2) return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .get(`/api/user/players/${userId2}/network`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.followers)).toBe(true);
      const followerIds = res.body.followers.map(u => u.id);
      expect(followerIds).toContain(userId1);
    });
  });

  describe("PATCH /api/user/players/notification-preferences", () => {
    it("should update notification preferences for Player 1", async () => {
      if (!token1) return logger.warn("Skipped: no token1");

      const res = await request(app)
        .patch("/api/user/players/notification-preferences")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          preferences: {
            push: true,
            email: false,
            sms: true
          }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.preferences.push).toBe(true);
      expect(res.body.preferences.email).toBe(false);
    });
  });

  describe("POST /api/user/players/:id/unfollow", () => {
    it("should allow Player 1 to unfollow Player 2", async () => {
      if (!token1 || !userId2) return logger.warn("Skipped: missing ids");

      const res = await request(app)
        .post(`/api/user/players/${userId2}/unfollow`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Unfollowed successfully");
    });
  });
});
