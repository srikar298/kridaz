import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const testEmail = `bloguser_${ts}@kridaz.test`;
const testPhone = `94444${String(ts).slice(-5)}`;
const testUsername = `bloguser_${ts}`;
let userToken = "";
let adminToken = "";
let createdBlogId = "";

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

describe("Blog Module API Integration", () => {
  beforeAll(async () => {
    // 1. Clean up potential old tests
    await prisma.refreshToken
      .deleteMany({ where: { user: { email: testEmail } } })
      .catch(() => {});
    await prisma.user
      .deleteMany({ where: { email: testEmail } })
      .catch(() => {});
    await prisma.oTP
      .deleteMany({ where: { email: testEmail } })
      .catch(() => {});

    // Seed OTP
    await seedOtp(testEmail, testPhone);

    // 2. Create mock user directly
    const user = await prisma.user.create({
      data: {
        name: "Blog Tester User",
        email: testEmail,
        username: testUsername,
        phone: testPhone,
        password: "Blog@Pass123",
      },
    });

    const registeredUserId = user.id;
    userToken = jwt.sign(
      { id: registeredUserId, role: "USER" },
      process.env.JWT_SECRET || "fallback_secret"
    );

    // 3. Generate mock Admin token linked to the valid user to satisfy relation constraints
    adminToken = jwt.sign(
      { id: registeredUserId, role: "ADMIN" },
      process.env.JWT_SECRET || "fallback_secret"
    );
  }, 30000);

  afterAll(async () => {
    // Cleanup
    const user = await prisma.user.findFirst({ where: { email: testEmail } });
    if (user) {
      await prisma.refreshToken
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }
    if (createdBlogId) {
      await prisma.blog
        .delete({ where: { id: createdBlogId } })
        .catch(() => {});
    }
    await prisma.oTP
      .deleteMany({ where: { email: testEmail } })
      .catch(() => {});
    await prisma.$disconnect();
  });

  // ── Admin Blog Management (CRUD) ──────────────────────────────────────────
  describe("POST /api/admin/blogs/admin — Create Blog", () => {
    it("should reject blog creation without token", async () => {
      const res = await request(app).post("/api/admin/blogs/admin").send({
        title: "Intruding Blog",
        content: "Should be blocked.",
        imageUrl: "http://example.com/bad.jpg",
      });

      expect(res.statusCode).toBe(401);
    });

    it("should reject blog creation if role is not admin", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/admin/blogs/admin")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "Intruding Blog",
          content: "Should be blocked.",
          imageUrl: "http://example.com/bad.jpg",
        });

      expect(res.statusCode).toBe(403);
    });

    it("should create blog post successfully with Admin authorization", async () => {
      const res = await request(app)
        .post("/api/admin/blogs/admin")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: `Kridaz Championship Series ${ts}`,
          content: "Welcome to the premium tournament of Kridaz matches.",
          summary: "Summary info of championship series",
          imageUrl: "http://example.com/kridaz-series.jpg",
          tags: "cricket, championship, sports",
          status: "published",
        });

      if (res.statusCode !== 201) logger.info("[create blog error]", res.body);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.blog).toHaveProperty("id");
      expect(res.body.blog.title).toContain("Kridaz Championship Series");

      createdBlogId = res.body.blog.id;
    });
  });

  // ── Public Blog Retrievals ────────────────────────────────────────────────
  describe("GET /api/features/blogs — Public Feeds", () => {
    it("should fetch list of all published blogs", async () => {
      const res = await request(app).get("/api/features/blogs");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.blogs)).toBe(true);

      const match = res.body.blogs.find((b) => b.id === createdBlogId);
      expect(match).toBeDefined();
    });

    it("should fetch single blog details", async () => {
      if (!createdBlogId) return logger.warn("Skipped: missing createdBlogId");

      const res = await request(app).get(
        `/api/features/blogs/${createdBlogId}`
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.blog).toHaveProperty("id");
    });
  });

  // ── User Blog Interactions ────────────────────────────────────────────────
  describe("POST /api/user/blogs/:id/like — Liking Posts", () => {
    it("should like a blog successfully", async () => {
      if (!createdBlogId) return logger.warn("Skipped: missing createdBlogId");

      const res = await request(app).post(
        `/api/user/blogs/${createdBlogId}/like`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.blog).toHaveProperty("likes");
    });
  });

  // ── Admin Blog Editing ────────────────────────────────────────────────────
  describe("PUT /api/admin/blogs/admin/:id — Update Blog", () => {
    it("should update blog content successfully", async () => {
      if (!createdBlogId) return logger.warn("Skipped: missing createdBlogId");

      const res = await request(app)
        .put(`/api/admin/blogs/admin/${createdBlogId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: `Updated Title Series ${ts}`,
          content: "Updated content for tournament announcement.",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.blog.title).toContain("Updated Title Series");
    });
  });

  // ── Admin Blog Deletion ───────────────────────────────────────────────────
  describe("DELETE /api/admin/blogs/admin/:id — Delete Blog", () => {
    it("should delete the blog post successfully", async () => {
      if (!createdBlogId) return logger.warn("Skipped: missing createdBlogId");

      const res = await request(app)
        .delete(`/api/admin/blogs/admin/${createdBlogId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const checkRes = await request(app).get(
        `/api/features/blogs/${createdBlogId}`
      );
      expect(checkRes.statusCode).toBe(404);

      createdBlogId = ""; // already deleted
    });
  });
});
