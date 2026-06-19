import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const ts = Date.now();
const emailAdmin = `admin_test_${ts}@kridaz.test`;
let adminToken = "";

describe("Admin Module API Integration Tests", () => {
  beforeAll(async () => {
    // Clean up
    const existingAdmin = await prisma.user.findFirst({
      where: { email: emailAdmin },
    });
    if (existingAdmin) {
      await prisma.user
        .delete({ where: { id: existingAdmin.id } })
        .catch(() => {});
    }

    // Register ADMIN directly via prisma (assuming no open register endpoint for admin)
    const adminUser = await prisma.user.create({
      data: {
        name: "Test Admin",
        email: emailAdmin,
        username: `admin_test_${ts}`,
        phone: `77777${String(ts).slice(-5)}`,
        password: "Admin@Pass123", // Assuming no hashing for simple test or bypass in auth mock
        role: "ADMIN",
      },
    });

    // We can use a direct login or mock token for Admin tests
    // Assuming /api/user/auth/login works for ADMIN role if we bypass otp or seed it
    await prisma.oTP.create({
      data: {
        email: emailAdmin,
        phone: `77777${String(ts).slice(-5)}`,
        emailOtp: "123456",
        phoneOtp: "123456",
        expiresAt: new Date(Date.now() + 600000),
      },
    });

    // In a real test environment, we might use a special test endpoint or mock.
    // Let's generate a valid token manually using jsonwebtoken for testing, assuming we know the secret
    const jwt = (await import("jsonwebtoken")).default;
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: "ADMIN" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );
  }, 30000);

  afterAll(async () => {
    const admin = await prisma.user.findFirst({ where: { email: emailAdmin } });
    if (admin) {
      await prisma.user.delete({ where: { id: admin.id } }).catch(() => {});
    }
  });

  describe("GET /api/admin/dashboard", () => {
    it("should fetch admin dashboard overview successfully", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("totalUsers");
      expect(res.body).toHaveProperty("totalTurfs");
    });
  });

  describe("GET /api/admin/users/all", () => {
    it("should fetch all users for admin", async () => {
      const res = await request(app)
        .get("/api/admin/users/all")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe("GET /api/admin/owners/all", () => {
    it("should fetch all turf owners for admin", async () => {
      const res = await request(app)
        .get("/api/admin/owners/all")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.owners)).toBe(true);
    });
  });
});
