import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const userEmail = `host_${ts}@kridaz.test`;
const userPhone = `93333${String(ts).slice(-5)}`;
const userName = `host_${ts}`;
let userToken = "";
let createdGameId = "";

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

describe("Hosted Game Module API", () => {
  beforeAll(async () => {
    // Clean up
    await prisma.gameSlot
      .deleteMany({ where: { game: { host: { email: userEmail } } } })
      .catch(() => {});
    await prisma.gameTeam
      .deleteMany({ where: { game: { host: { email: userEmail } } } })
      .catch(() => {});
    await prisma.customPlayerInvite
      .deleteMany({ where: { game: { host: { email: userEmail } } } })
      .catch(() => {});
    await prisma.hostedGame
      .deleteMany({ where: { host: { email: userEmail } } })
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
      name: "Game Host Tester",
      email: userEmail,
      username: userName,
      phone: userPhone,
      gender: "Male",
      location: "Test City",
      password: "Host@Pass123",
      confirmPassword: "Host@Pass123",
      otp: "123456",
      phoneOtp: "123456",
      registrationToken: otpRes_regRes.body.registrationToken,
    });

    if (regRes.statusCode === 201) {
      userToken = regRes.body.token;
    } else {
      logger.info("[hostedGame setup register]", regRes.body);
    }
  }, 30000);

  afterAll(async () => {
    const user = await prisma.user.findFirst({ where: { email: userEmail } });
    if (user) {
      await prisma.gameSlot
        .deleteMany({ where: { game: { hostId: user.id } } })
        .catch(() => {});
      await prisma.gameTeam
        .deleteMany({ where: { game: { hostId: user.id } } })
        .catch(() => {});
      await prisma.customPlayerInvite
        .deleteMany({ where: { game: { hostId: user.id } } })
        .catch(() => {});
      await prisma.hostedGame
        .deleteMany({ where: { hostId: user.id } })
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

  describe("GET /api/hosted-game/grounds", () => {
    it("should return grounds list", async () => {
      const res = await request(app).get("/api/hosted-game/grounds");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.grounds || res.body)).toBe(true);
    });
  });

  describe("GET /api/hosted-game/umpires", () => {
    it("should return umpires list", async () => {
      const res = await request(app).get("/api/hosted-game/umpires");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.umpires || res.body)).toBe(true);
    });
  });

  describe("GET /api/hosted-game/list", () => {
    it("should return hosted games public list", async () => {
      const res = await request(app).get("/api/hosted-game/list");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.games || res.body)).toBe(true);
    });
  });

  describe("POST /api/hosted-game/create", () => {
    it("should reject game creation without auth token", async () => {
      const res = await request(app).post("/api/hosted-game/create").send({
        gameType: "Cricket",
        date: "2026-06-01",
        time: "18:00",
        city: "Test City",
        state: "Test State",
        perPlayerCharge: 0,
      });

      expect(res.statusCode).toBe(401);
    });

    it("should reject creation with missing required fields", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/hosted-game/create")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ gameType: "Cricket" }); // missing date, time, city, state

      expect(res.statusCode).toBe(422);
    });

    it("should create a hosted game successfully with valid payload", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/hosted-game/create")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          gameType: "Cricket",
          date: "2026-06-01",
          time: "18:00",
          city: "Test City",
          state: "Test State",
          perPlayerCharge: 100,
          gameMode: "FRIENDLY",
        });

      if (res.statusCode !== 201)
        logger.info("[create game failure]", res.body);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("game");
      expect(res.body.game).toHaveProperty("id");
      createdGameId = res.body.game.id;
    });
  });

  describe("GET /api/hosted-game/:id", () => {
    it("should return game details by ID", async () => {
      if (!createdGameId) return logger.warn("Skipped: no created game ID");

      const res = await request(app).get(`/api/hosted-game/${createdGameId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("game");
      expect(res.body.game.id).toBe(createdGameId);
    });

    it("should return 404 for non-existent game ID", async () => {
      const res = await request(app).get(
        "/api/hosted-game/00000000-0000-0000-0000-000000000000"
      );
      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /api/hosted-game/join", () => {
    it("should reject join without auth token", async () => {
      if (!createdGameId) return logger.warn("Skipped: no created game ID");

      const res = await request(app)
        .post("/api/hosted-game/join")
        .send({ gameId: createdGameId });

      expect(res.statusCode).toBe(401);
    });
  });
});
