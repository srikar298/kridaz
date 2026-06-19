import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const ts = Date.now();
const emailUser = `upload_u_${ts}@kridaz.test`;
let userToken = "";

describe("Upload Module API Integration Tests", () => {
  beforeAll(async () => {
    // Register USER directly via prisma
    const user = await prisma.user.create({
      data: {
        name: "Upload Test User",
        email: emailUser,
        username: `upload_u_${ts}`,
        phone: `77777${String(ts).slice(-5)}`,
        password: "User@Pass123",
      },
    });

    const jwt = (await import("jsonwebtoken")).default;
    userToken = jwt.sign(
      { id: user.id, email: user.email, role: "USER" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );
  }, 30000);

  afterAll(async () => {
    const user = await prisma.user.findFirst({ where: { email: emailUser } });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }
  });

  describe("POST /api/upload", () => {
    it("should reject upload without file", async () => {
      const res = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("No file provided");
    });

    it("should process valid image upload successfully", async () => {
      const buffer = Buffer.from("fake image content");

      const res = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("file", buffer, "test_image.png");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("url");
    });
  });
});
