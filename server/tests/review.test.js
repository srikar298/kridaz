import { jest } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import cloudinary from "../utils/cloudinary.js";
import dotenv from "dotenv";

dotenv.config();

const ts = Date.now();
const testUserEmail = `reviewuser_${ts}@kridaz.test`;
const testUserPhone = `92222${String(ts).slice(-5)}`;
const testUserUsername = `reviewuser_${ts}`;

const testOwnerEmail = `reviewowner_${ts}@kridaz.test`;
const testOwnerPhone = `93333${String(ts).slice(-5)}`;
const testOwnerUsername = `reviewowner_${ts}`;

let userToken = "";
let ownerToken = "";
let ownerId = "";
let createdTurfId = "";

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

const getTestImageBuffer = () => {
  return Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
    "base64"
  );
};

describe("Review Module API Integration", () => {
  let cloudinarySpy;

  beforeAll(async () => {
    cloudinarySpy = jest
      .spyOn(cloudinary.uploader, "upload_stream")
      .mockImplementation((options, callback) => {
        return {
          end: () => {
            callback(null, {
              secure_url: "https://mock.cloudinary.com/image.jpg",
            });
          },
        };
      });

    console.log("DB URL inside beforeAll:", process.env.DATABASE_URL);
    // 1. Cleanup old records if any exist
    await prisma.review
      .deleteMany({
        where: {
          OR: [
            { user: { email: testUserEmail } },
            { turf: { owner: { user: { email: testOwnerEmail } } } },
          ],
        },
      })
      .catch(() => {});

    await prisma.turf
      .deleteMany({
        where: { owner: { user: { email: testOwnerEmail } } },
      })
      .catch(() => {});

    await prisma.ownerProfile
      .deleteMany({
        where: { user: { email: testOwnerEmail } },
      })
      .catch(() => {});

    await prisma.user
      .deleteMany({
        where: { OR: [{ email: testUserEmail }, { email: testOwnerEmail }] },
      })
      .catch(() => {});

    // 2. Seed OTPs
    await seedOtp(testUserEmail, testUserPhone);
    await seedOtp(testOwnerEmail, testOwnerPhone);

    // 3. Register user (player)
    const otpRes_userRegRes = await request(app)
      .post("/api/user/auth/verify-otp")
      .send({ email: testUserEmail, phone: testUserPhone, otp: "123456" });
    const userRegRes = await request(app).post("/api/user/auth/register").send({
      name: "Reviewer Player",
      email: testUserEmail,
      username: testUserUsername,
      phone: testUserPhone,
      gender: "Male",
      location: "Review City",
      password: "Review@Pass123",
      confirmPassword: "Review@Pass123",
      otp: "123456",
      phoneOtp: "123456",
      registrationToken: otpRes_userRegRes.body.registrationToken,
    });

    console.log("User Register Status:", userRegRes.statusCode);
    if (userRegRes.statusCode === 201) {
      userToken = userRegRes.body.token;
    } else {
      console.error(
        "[SETUP ERROR] User registration failed:",
        userRegRes.statusCode,
        userRegRes.body
      );
    }

    // 4. Register owner
    const otpRes_owner = await request(app)
      .post("/api/user/auth/verify-otp")
      .send({ email: testOwnerEmail, phone: testOwnerPhone, otp: "123456" });
    const ownerRegRes = await request(app)
      .post("/api/owner/auth/owner/register")
      .send({
        name: "Review Venue Owner",
        email: testOwnerEmail,
        username: testOwnerUsername,
        phone: testOwnerPhone,
        gender: "Male",
        location: "Review Owner City",
        password: "Owner@Pass123",
        confirmPassword: "Owner@Pass123",
        otp: "123456",
        phoneOtp: "123456",
        role: "VENUE_OWNER",
        registrationToken: otpRes_owner.body.registrationToken,
      });

    console.log("Owner Register Status:", ownerRegRes.statusCode);
    if (ownerRegRes.statusCode !== 201) {
      console.error(
        "[SETUP ERROR] Owner registration failed:",
        ownerRegRes.statusCode,
        ownerRegRes.body
      );
    }

    // Seed OTP and Login to get proper Owner Token
    await seedOtp(testOwnerEmail, testOwnerPhone);
    const ownerLoginRes = await request(app)
      .post("/api/owner/auth/login")
      .send({
        email: testOwnerEmail,
        password: "Owner@Pass123",
        otp: "123456",
      });

    console.log("Owner Login Status:", ownerLoginRes.statusCode);
    if (ownerLoginRes.statusCode === 200) {
      ownerToken = ownerLoginRes.body.token;
      console.log("Owner Token received:", ownerToken);
    } else {
      console.error(
        "[SETUP ERROR] Owner login failed:",
        ownerLoginRes.statusCode,
        ownerLoginRes.body
      );
    }

    // Explicitly check role of registered owner in database
    const ownerUserInDb = await prisma.user.findFirst({
      where: { email: testOwnerEmail },
      include: { ownerProfile: true },
    });
    console.log("Owner User in DB:", JSON.stringify(ownerUserInDb));

    // Force role: "VENUE_OWNER" in database just in case!
    if (ownerUserInDb) {
      await prisma.user.update({
        where: { id: ownerUserInDb.id },
        data: { role: "VENUE_OWNER" },
      });
      console.log("Forced role update to VENUE_OWNER in database");
    }

    ownerId = ownerUserInDb?.ownerProfile?.id || ownerUserInDb?.id;

    // 5. Register Turf venue under the Owner
    if (ownerToken) {
      const policies = "A".repeat(210);
      const turfRes = await request(app)
        .post("/api/owner/turf/owner/register")
        .set("Authorization", `Bearer ${ownerToken}`)
        .field("name", `Review Ground ${ts}`)
        .field("description", "Premium venue for ratings verification")
        .field("location", "456 Stadium Road, Rating City")
        .field("city", "Rating City")
        .field("state", "Rating State")
        .field("sportTypes", "Football")
        .field("pricePerHour", "800")
        .field("openTime", "08:00 AM")
        .field("closeTime", "11:00 PM")
        .field("policies", policies)
        .attach("images", getTestImageBuffer(), {
          filename: "turf.jpg",
          contentType: "image/jpeg",
        });

      console.log("Turf Registration Status:", turfRes.statusCode);
      if (turfRes.statusCode === 201) {
        createdTurfId = turfRes.body.turf.id;
      } else {
        console.error(
          "[SETUP ERROR] Turf registration failed:",
          turfRes.statusCode,
          turfRes.body
        );
      }
    }
  }, 40000);

  afterAll(async () => {
    if (cloudinarySpy) {
      cloudinarySpy.mockRestore();
    }
    // Cleanup created reviews
    await prisma.review
      .deleteMany({
        where: { turfId: createdTurfId },
      })
      .catch(() => {});

    // Cleanup turf
    if (createdTurfId) {
      await prisma.turf
        .delete({ where: { id: createdTurfId } })
        .catch(() => {});
    }

    // Cleanup owners/users
    const ownerUser = await prisma.user.findFirst({
      where: { email: testOwnerEmail },
    });
    if (ownerUser) {
      await prisma.ownerProfile
        .deleteMany({ where: { userId: ownerUser.id } })
        .catch(() => {});
      await prisma.refreshToken
        .deleteMany({ where: { userId: ownerUser.id } })
        .catch(() => {});
      await prisma.user.delete({ where: { id: ownerUser.id } }).catch(() => {});
    }

    const playerUser = await prisma.user.findFirst({
      where: { email: testUserEmail },
    });
    if (playerUser) {
      await prisma.refreshToken
        .deleteMany({ where: { userId: playerUser.id } })
        .catch(() => {});
      await prisma.user
        .delete({ where: { id: playerUser.id } })
        .catch(() => {});
    }

    await prisma.oTP
      .deleteMany({ where: { email: testUserEmail } })
      .catch(() => {});
    await prisma.oTP
      .deleteMany({ where: { email: testOwnerEmail } })
      .catch(() => {});

    await prisma.$disconnect();
  });

  // ── User Review Submission validation ──────────────────────────────────────
  describe("POST /api/user/review/:id — Submit Review", () => {
    it("should reject review submission if user token is missing", async () => {
      const targetId = createdTurfId || "dummy-id";
      const res = await request(app).post(`/api/user/review/${targetId}`).send({
        rating: 4,
        review: "Decent venue",
      });

      expect(res.statusCode).toBe(401);
    });

    it("should reject review submission if fields are missing", async () => {
      if (!userToken) return console.warn("Skipped: no userToken");
      const targetId = createdTurfId || "dummy-id";

      const res = await request(app)
        .post(`/api/user/review/${targetId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          rating: 4,
        });

      expect(res.statusCode).toBe(400);
    });

    it("should add a review successfully", async () => {
      expect(createdTurfId).toBeTruthy();
      expect(userToken).toBeTruthy();

      const res = await request(app)
        .post(`/api/user/review/${createdTurfId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          rating: 4,
          review: "Excellent court quality, lighting is brilliant!",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toContain("successfully");
    });
  });

  // ── Public Ratings Aggregates ──────────────────────────────────────────────
  describe("GET /api/user/review/:id — Fetch and Calculate Averages", () => {
    it("should fetch ratings and calculate accurate aggregate scores", async () => {
      expect(createdTurfId).toBeTruthy();

      const addRes = await request(app)
        .post(`/api/user/review/${createdTurfId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          rating: 5,
          review: "Best turf in town!",
        });
      expect(addRes.statusCode).toBe(201);

      const res = await request(app).get(`/api/user/review/${createdTurfId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("retrieved successfully");
      expect(Array.isArray(res.body.reviews)).toBe(true);
      expect(res.body.reviews.length).toBe(2);
      expect(res.body.averageRating).toBe(4.5);
    });
  });

  // ── Owner Review Summaries ─────────────────────────────────────────────────
  describe("GET /api/owner/reviews/owner/turfs-with-reviews — Partner Summaries", () => {
    it("should retrieve full metrics summaries for owner turf ratings", async () => {
      expect(ownerToken).toBeTruthy();
      expect(createdTurfId).toBeTruthy();

      const res = await request(app)
        .get("/api/owner/reviews/owner/turfs-with-reviews")
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const turfSummary = res.body.find((t) => t.id === createdTurfId);
      expect(turfSummary).toBeDefined();
      expect(turfSummary.name).toContain("Review Ground");
      expect(turfSummary.reviewCount).toBe(2);
      expect(turfSummary.avgRating).toBe(4.5);
      expect(Array.isArray(turfSummary.reviews)).toBe(true);
    });
  });
});
