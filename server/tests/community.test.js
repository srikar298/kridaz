import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const ts = Date.now();
const userEmail = `comm_${ts}@kridaz.test`;
const userPhone = `94444${String(ts).slice(-5)}`;
const userName = `comm_${ts}`;
let userToken = "";
let createdPostId = "";
let createdCommentId = "";

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

describe("Community Module API", () => {
  beforeAll(async () => {
    // Clean up
    await prisma.comment
      .deleteMany({ where: { user: { email: userEmail } } })
      .catch(() => {});
    await prisma.post
      .deleteMany({ where: { author: { email: userEmail } } })
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
      name: "Community Tester",
      email: userEmail,
      username: userName,
      phone: userPhone,
      gender: "Male",
      location: "Test City",
      password: "Comm@Pass123",
      confirmPassword: "Comm@Pass123",
      otp: "123456",
      phoneOtp: "123456",
      registrationToken: otpRes_regRes.body.registrationToken,
    });

    if (regRes.statusCode === 201) {
      userToken = regRes.body.token;
    } else {
      logger.info("[community setup register]", regRes.body);
    }
  }, 30000);

  afterAll(async () => {
    const user = await prisma.user.findFirst({ where: { email: userEmail } });
    if (user) {
      await prisma.comment
        .deleteMany({ where: { userId: user.id } })
        .catch(() => {});
      await prisma.post
        .deleteMany({ where: { authorId: user.id } })
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

  describe("GET /api/user/community/stats", () => {
    it("should return community feed statistics", async () => {
      const res = await request(app).get("/api/user/community/stats");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("stats");
      expect(res.body.stats).toHaveProperty("members");
      expect(res.body.stats).toHaveProperty("posts");
    });
  });

  describe("GET /api/user/community", () => {
    it("should return public community feed posts", async () => {
      const res = await request(app).get("/api/user/community");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.posts)).toBe(true);
    });
  });

  describe("POST /api/user/community", () => {
    it("should reject post creation without auth token", async () => {
      const res = await request(app)
        .post("/api/user/community")
        .send({ title: "Guest Post", content: "Guest Content" });

      expect(res.statusCode).toBe(401);
    });

    it("should create a text post successfully with auth token", async () => {
      if (!userToken) return logger.warn("Skipped: no user token");

      const res = await request(app)
        .post("/api/user/community")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "My First Test Post",
          content:
            "Hello community, this is a test post from integration tests!",
        });

      if (res.statusCode !== 201) logger.info("[create post error]", res.body);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.post).toHaveProperty("id");
      expect(res.body.post.title).toBe("My First Test Post");
      createdPostId = res.body.post.id;
    });
  });

  describe("POST /api/user/community/:id/like", () => {
    it("should reject like/unlike without auth", async () => {
      if (!createdPostId) return logger.warn("Skipped: no created post ID");

      const res = await request(app).post(
        `/api/user/community/${createdPostId}/like`
      );

      expect(res.statusCode).toBe(401);
    });

    it("should like a post successfully", async () => {
      if (!userToken || !createdPostId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/user/community/${createdPostId}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isLiked).toBe(true);
      expect(res.body.likesCount).toBe(1);
    });

    it("should unlike a post successfully on second click", async () => {
      if (!userToken || !createdPostId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/user/community/${createdPostId}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isLiked).toBe(false);
      expect(res.body.likesCount).toBe(0);
    });
  });

  describe("POST /api/user/community/:id/comment", () => {
    it("should reject adding a comment without auth", async () => {
      if (!createdPostId) return logger.warn("Skipped: no created post ID");

      const res = await request(app)
        .post(`/api/user/community/${createdPostId}/comment`)
        .send({ text: "Super comment!" });

      expect(res.statusCode).toBe(401);
    });

    it("should reject comment if validation fails", async () => {
      if (!userToken || !createdPostId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/user/community/${createdPostId}/comment`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ text: "" }); // Empty text

      expect(res.statusCode).toBe(422);
    });

    it("should add a comment successfully with valid text", async () => {
      if (!userToken || !createdPostId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/user/community/${createdPostId}/comment`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ text: "This is a great test comment!" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.comments)).toBe(true);
      expect(res.body.comments.length).toBe(1);
      expect(res.body.comments[0].text).toBe("This is a great test comment!");
      createdCommentId = res.body.comments[0].id;
    });
  });

  describe("PUT /api/user/community/:id/comment/:commentId", () => {
    it("should update a comment successfully", async () => {
      if (!userToken || !createdPostId || !createdCommentId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .put(`/api/user/community/${createdPostId}/comment/${createdCommentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ text: "This is an updated test comment!" });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.comments[0].text).toBe(
        "This is an updated test comment!"
      );
    });
  });

  describe("DELETE /api/user/community/:id/comment/:commentId", () => {
    it("should delete a comment successfully", async () => {
      if (!userToken || !createdPostId || !createdCommentId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .delete(
          `/api/user/community/${createdPostId}/comment/${createdCommentId}`
        )
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.comments.length).toBe(0);
    });
  });

  describe("DELETE /api/user/community/:id", () => {
    it("should delete a post successfully", async () => {
      if (!userToken || !createdPostId)
        return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .delete(`/api/user/community/${createdPostId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
