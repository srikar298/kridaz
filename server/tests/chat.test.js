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

dotenv.config();

const ts = Date.now();
const emailA = `chata_${ts}@kridaz.test`;
const emailB = `chatb_${ts}@kridaz.test`;
const phoneA = `91111${String(ts).slice(-5)}`;
const phoneB = `92222${String(ts).slice(-5)}`;
const usernameA = `chata_${ts}`;
const usernameB = `chatb_${ts}`;

let tokenA = "";
let tokenB = "";
let userA = null;
let userB = null;
let chatId = "";
let messageId = "";
let groupId = "";

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

describe("Chat & Message Module Integration Tests", () => {
  beforeAll(async () => {
    // Teardown pre-existing test data if any
    const oldUsers = await prisma.user.findMany({
      where: { email: { in: [emailA, emailB] } },
    });

    for (const u of oldUsers) {
      await prisma.chatParticipant
        .deleteMany({ where: { userId: u.id } })
        .catch(() => {});
      await prisma.message
        .deleteMany({ where: { senderUserId: u.id } })
        .catch(() => {});
      await prisma.refreshToken
        .deleteMany({ where: { userId: u.id } })
        .catch(() => {});
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }
    await prisma.oTP
      .deleteMany({ where: { email: { in: [emailA, emailB] } } })
      .catch(() => {});

    // Seed OTPs
    await seedOtp(emailA, phoneA);
    await seedOtp(emailB, phoneB);

    // Register User A
    const otpRes_regResA = await request(app)
      .post("/api/user/auth/verify-otp")
      .send({ email: emailA, phone: phoneA, otp: "123456" });
    const regResA = await request(app).post("/api/user/auth/register").send({
      name: "Chat User A",
      email: emailA,
      username: usernameA,
      phone: phoneA,
      gender: "Male",
      location: "Test City",
      password: "Password@123",
      confirmPassword: "Password@123",
      otp: "123456",
      phoneOtp: "123456",
      registrationToken: otpRes_regResA.body.registrationToken,
    });
    if (regResA.statusCode !== 201) console.log(regResA.body);
    expect(regResA.statusCode).toBe(201);
    tokenA = regResA.body.token;
    userA = await prisma.user.findUnique({ where: { email: emailA } });

    // Register User B
    const otpRes_regResB = await request(app)
      .post("/api/user/auth/verify-otp")
      .send({ email: emailB, phone: phoneB, otp: "123456" });
    const regResB = await request(app).post("/api/user/auth/register").send({
      name: "Chat User B",
      email: emailB,
      username: usernameB,
      phone: phoneB,
      gender: "Female",
      location: "Test City",
      password: "Password@123",
      confirmPassword: "Password@123",
      otp: "123456",
      phoneOtp: "123456",
      registrationToken: otpRes_regResB.body.registrationToken,
    });
    expect(regResB.statusCode).toBe(201);
    tokenB = regResB.body.token;
    userB = await prisma.user.findUnique({ where: { email: emailB } });
  }, 30000);

  afterAll(async () => {
    // Delete test side effects
    if (userA || userB) {
      const uIds = [userA?.id, userB?.id].filter(Boolean);

      // Clean messages
      await prisma.message
        .deleteMany({
          where: {
            OR: [
              { senderUserId: { in: uIds } },
              { chatId: chatId },
              { chatId: groupId },
            ],
          },
        })
        .catch(() => {});

      // Clean participants
      await prisma.chatParticipant
        .deleteMany({
          where: {
            OR: [
              { userId: { in: uIds } },
              { chatId: chatId },
              { chatId: groupId },
            ],
          },
        })
        .catch(() => {});

      // Clean chats
      await prisma.chat
        .deleteMany({
          where: { id: { in: [chatId, groupId].filter(Boolean) } },
        })
        .catch(() => {});

      // Clean refreshTokens and users
      await prisma.refreshToken
        .deleteMany({ where: { userId: { in: uIds } } })
        .catch(() => {});
      await prisma.user
        .deleteMany({ where: { id: { in: uIds } } })
        .catch(() => {});
    }

    await prisma.oTP
      .deleteMany({ where: { email: { in: [emailA, emailB] } } })
      .catch(() => {});
    await prisma.$disconnect();

    // Close redis & bullmq safely to avoid open handles hanging
    await redisClient.quit();
    await bullmqConnection.quit();
    await pubClient.quit();
    await subClient.quit();
  });

  describe("1. Access / Create 1-on-1 Chat", () => {
    it("should access or create a new 1-on-1 chat room", async () => {
      const res = await request(app)
        .post("/api/chat")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ userId: userB.id });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body.isGroupChat).toBe(false);
      chatId = res.body.id;
    });

    it("should fetch all chats belonging to the user", async () => {
      const res = await request(app)
        .get("/api/chat")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("chats");
      expect(Array.isArray(res.body.chats)).toBe(true);
      const foundChat = res.body.chats.find((c) => c.id === chatId);
      expect(foundChat).toBeDefined();
    });
  });

  describe("2. Messaging Operations", () => {
    it("should send a text message successfully in the chat", async () => {
      const res = await request(app)
        .post("/api/chat/message")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          chatId: chatId,
          content: "Hello User B! This is an automated integration message.",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body.content).toBe(
        "Hello User B! This is an automated integration message."
      );
      expect(res.body.senderUserId).toBe(userA.id);
      messageId = res.body.id;
    });

    it("should retrieve all messages for the specified chat room", async () => {
      const res = await request(app)
        .get(`/api/chat/message/${chatId}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const foundMessage = res.body.find((m) => m.id === messageId);
      expect(foundMessage).toBeDefined();
    });

    it("should mark all messages inside the chat as read", async () => {
      const res = await request(app)
        .put(`/api/chat/message/${chatId}/read`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("3. Chat Actions", () => {
    it("should toggle pinning the chat successfully", async () => {
      const res = await request(app)
        .put("/api/chat/pin")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ chatId });

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(chatId);
    });

    it("should clear the chat content for the active user", async () => {
      const res = await request(app)
        .post("/api/chat/message/clear")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ chatId });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("4. Group Chat / Community Management", () => {
    it("should create a new group chat", async () => {
      const res = await request(app)
        .post("/api/chat/group")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: "Test Integration Group",
          users: JSON.stringify([userB.id]),
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id");
      expect(res.body.isGroupChat).toBe(true);
      expect(res.body.chatName).toBe("Test Integration Group");
      groupId = res.body.id;
    });
  });
});
