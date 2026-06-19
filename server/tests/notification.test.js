import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const ts = Date.now();
const emailUser = `notify_u_${ts}@kridaz.test`;
const phoneUser = `77777${String(ts).slice(-5)}`;
const userNameUser = `notify_u_${ts}`;

let userToken = "";
let userId = "";
let notificationId = "";

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

describe("Notification Module API Integration Tests", () => {
  beforeAll(async () => {
    // Clean up
    const existingUser = await prisma.user.findFirst({
      where: { email: emailUser },
    });
    if (existingUser) {
      await prisma.notification
        .deleteMany({ where: { userId: existingUser.id } })
        .catch(() => {});
      await prisma.userDevice
        .deleteMany({ where: { userId: existingUser.id } })
        .catch(() => {});
      await prisma.user
        .delete({ where: { id: existingUser.id } })
        .catch(() => {});
    }
    await prisma.oTP
      .deleteMany({ where: { email: emailUser } })
      .catch(() => {});

    // Seed OTP
    await seedOtp(emailUser, phoneUser);

    // Register general USER
    const otpRes_regUser = await request(app)
      .post("/api/user/auth/verify-otp")
      .send({ email: emailUser, phone: phoneUser, otp: "123456" });
    const regUser = await request(app).post("/api/user/auth/register").send({
      name: "Notify General User",
      email: emailUser,
      username: userNameUser,
      phone: phoneUser,
      gender: "Male",
      location: "Delhi",
      password: "User@Pass123",
      confirmPassword: "User@Pass123",
      otp: "123456",
      phoneOtp: "123456",
      registrationToken: otpRes_regUser.body.registrationToken,
    });

    if (regUser.statusCode === 201) {
      userToken = regUser.body.token;
      userId = regUser.body.user?.id || "";
    }

    // Seed some notifications with recipientModel: "User"
    if (userId) {
      const notif = await prisma.notification.create({
        data: {
          userId,
          recipientModel: "User",
          title: "Test Notification",
          message: "This is a test notification",
          type: "INFO",
          isRead: false,
        },
      });
      notificationId = notif.id;

      await prisma.notification.create({
        data: {
          userId,
          recipientModel: "User",
          title: "Test Notification 2",
          message: "This is a second test notification",
          type: "INFO",
          isRead: false,
        },
      });
    }
  }, 30000);

  afterAll(async () => {
    const user = await prisma.user.findFirst({ where: { email: emailUser } });
    if (user) {
      await prisma.notification
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.userDevice
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }
    await prisma.oTP
      .deleteMany({ where: { email: emailUser } })
      .catch(() => {});
  });

  describe("GET /api/user/notification - Fetch User Notifications", () => {
    it("should retrieve notifications for authenticated user", async () => {
      const res = await request(app)
        .get("/api/user/notification")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("PUT /api/user/notification/:id/mark-read - Mark Notification as Read", () => {
    it("should mark a specific notification as read", async () => {
      const res = await request(app)
        .put(`/api/user/notification/${notificationId}/mark-read`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const notif = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      expect(notif.isRead).toBe(true);
    });
  });

  describe("PUT /api/user/notification/mark-all-read - Mark All Notifications as Read", () => {
    it("should mark all user notifications as read", async () => {
      const res = await request(app)
        .put("/api/user/notification/mark-all-read")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const unreadCount = await prisma.notification.count({
        where: { userId, recipientModel: "User", isRead: false },
      });
      expect(unreadCount).toBe(0);
    });
  });

  describe("POST /api/user/notification/device-token - Save Device Token", () => {
    it("should reject if token is missing", async () => {
      const res = await request(app)
        .post("/api/user/notification/device-token")
        .set("Authorization", `Bearer ${userToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should successfully save or update device token", async () => {
      const token = `device_token_${ts}`;
      const res = await request(app)
        .post("/api/user/notification/device-token")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ token, platform: "android" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const device = await prisma.userDevice.findUnique({ where: { token } });
      expect(device).toBeDefined();
      expect(device.userId).toBe(userId);
      expect(device.platform).toBe("android");
    });
  });

  describe("DELETE /api/user/notification/clear - Clear Notifications", () => {
    it("should clear all notifications for the user", async () => {
      const res = await request(app)
        .delete("/api/user/notification/clear")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const count = await prisma.notification.count({
        where: { userId, recipientModel: "User" },
      });
      expect(count).toBe(0);
    });
  });
});
