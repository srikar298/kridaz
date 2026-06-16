import request from "supertest";
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

dotenv.config();

const ts = Date.now();
const emailA = `team_ta_${ts}@kridaz.test`;
const phoneA = `98888${String(ts).slice(-5)}`;
const usernameA = `team_ta_${ts}`;

const emailB = `team_tb_${ts}@kridaz.test`;
const phoneB = `99999${String(ts).slice(-5)}`;
const usernameB = `team_tb_${ts}`;

let tokenA = "";
let tokenB = "";
let userIdA = "";
let userIdB = "";

let teamIdA = "";
let teamIdB = "";
let teamCodeA = "";
let teamCodeB = "";

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

describe("Team Module API Integration Tests", () => {
  beforeAll(async () => {
    // Clean up potentially existing records
    for (const email of [emailA, emailB]) {
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        // Delete related team members, requests, custom members, and teams
        const ownedTeams = await prisma.team.findMany({ where: { ownerId: user.id } });
        const ownedTeamIds = ownedTeams.map(t => t.id);

        await prisma.teamMember.deleteMany({
          where: { OR: [{ userId: user.id }, { teamId: { in: ownedTeamIds } }] }
        }).catch(() => {});

        await prisma.teamCustomMember.deleteMany({
          where: { teamId: { in: ownedTeamIds } }
        }).catch(() => {});

        await prisma.teamOpponentRequest.deleteMany({
          where: { OR: [{ fromId: { in: ownedTeamIds } }, { toId: { in: ownedTeamIds } }] }
        }).catch(() => {});

        await prisma.team.deleteMany({ where: { ownerId: user.id } }).catch(() => {});
        await prisma.userRelationship.deleteMany({
          where: { OR: [{ userId: user.id }, { targetId: user.id }] }
        }).catch(() => {});
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.wallet.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.userProfile.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      }
      await prisma.oTP.deleteMany({ where: { email } }).catch(() => {});
    }

    // Seed OTPs
    await seedOtp(emailA, phoneA);
    await seedOtp(emailB, phoneB);

    // Register User A
    const otpRes_regResA = await request(app).post('/api/user/auth/verify-otp').send({ email: emailA, phone: phoneA, otp: "123456" });
    const regResA = await request(app)
      .post("/api/user/auth/register")
      .send({
        name: "Team Owner A",
        email: emailA,
        username: usernameA,
        phone: phoneA,
        gender: "Male",
        location: "Mumbai",
        password: "Player@Pass123",
        confirmPassword: "Player@Pass123",
        otp: "123456",
        phoneOtp: "123456", registrationToken: otpRes_regResA.body.registrationToken});

    if (regResA.statusCode === 201) {
      tokenA = regResA.body.token;
      userIdA = regResA.body.user?.id || "";
    } else {
      logger.info("[team setup register A error]", regResA.body);
    }

    // Register User B
    const otpRes_regResB = await request(app).post('/api/user/auth/verify-otp').send({ email: emailB, phone: phoneB, otp: "123456" });
    const regResB = await request(app)
      .post("/api/user/auth/register")
      .send({
        name: "Team Owner B",
        email: emailB,
        username: usernameB,
        phone: phoneB,
        gender: "Male",
        location: "Mumbai",
        password: "Player@Pass123",
        confirmPassword: "Player@Pass123",
        otp: "123456",
        phoneOtp: "123456", registrationToken: otpRes_regResB.body.registrationToken});

    if (regResB.statusCode === 201) {
      tokenB = regResB.body.token;
      userIdB = regResB.body.user?.id || "";
    } else {
      logger.info("[team setup register B error]", regResB.body);
    }

    // Ensure we have IDs if tokens exist
    if (!userIdA && tokenA) {
      userIdA = jwt.decode(tokenA).id;
    }
    if (!userIdB && tokenB) {
      userIdB = jwt.decode(tokenB).id;
    }
  }, 30000);

  afterAll(async () => {
    // Clean up
    for (const email of [emailA, emailB]) {
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        const ownedTeams = await prisma.team.findMany({ where: { ownerId: user.id } });
        const ownedTeamIds = ownedTeams.map(t => t.id);

        await prisma.teamMember.deleteMany({
          where: { OR: [{ userId: user.id }, { teamId: { in: ownedTeamIds } }] }
        }).catch(() => {});

        await prisma.teamCustomMember.deleteMany({
          where: { teamId: { in: ownedTeamIds } }
        }).catch(() => {});

        await prisma.teamOpponentRequest.deleteMany({
          where: { OR: [{ fromId: { in: ownedTeamIds } }, { toId: { in: ownedTeamIds } }] }
        }).catch(() => {});

        await prisma.team.deleteMany({ where: { ownerId: user.id } }).catch(() => {});
        await prisma.userRelationship.deleteMany({
          where: { OR: [{ userId: user.id }, { targetId: user.id }] }
        }).catch(() => {});
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.wallet.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.userProfile.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      }
      await prisma.oTP.deleteMany({ where: { email } }).catch(() => {});
    }
    await prisma.$disconnect();
  }, 30000);

  describe("POST /api/team - Create Team", () => {
    it("should allow User A to create Team A", async () => {
      if (!tokenA) return logger.warn("Skipped: no tokenA");

      const res = await request(app)
        .post("/api/team")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: `Alpha Warriors ${ts}`,
          description: "Top-tier local cricket warriors",
          sportType: "CRICKET",
          captainName: "Jack Sparrow",
          captainPhone: phoneA,
          city: "Mumbai",
          latitude: 19.0760,
          longitude: 72.8777
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.team).toHaveProperty("id");
      expect(res.body.team).toHaveProperty("teamCode");
      teamIdA = res.body.team.id;
      teamCodeA = res.body.team.teamCode;
    }, 30000);

    it("should allow User B to create Team B", async () => {
      if (!tokenB) return logger.warn("Skipped: no tokenB");

      const res = await request(app)
        .post("/api/team")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({
          name: `Beta Challengers ${ts}`,
          description: "Relentless local cricket challengers",
          sportType: "CRICKET",
          captainName: "Tony Stark",
          captainPhone: phoneB,
          city: "Mumbai",
          latitude: 19.0760,
          longitude: 72.8777
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.team).toHaveProperty("id");
      expect(res.body.team).toHaveProperty("teamCode");
      teamIdB = res.body.team.id;
      teamCodeB = res.body.team.teamCode;
    }, 30000);
  });

  describe("GET /api/team/all - List Public Teams", () => {
    it("should list all public teams", async () => {
      const res = await request(app).get("/api/team/all");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.teams)).toBe(true);
      const teamIds = res.body.teams.map(t => t.id);
      expect(teamIds).toContain(teamIdA);
      expect(teamIds).toContain(teamIdB);
    });
  });

  describe("GET /api/team/find-by-code/:code - Find Team by Code", () => {
    it("should retrieve Team A by its teamCode", async () => {
      if (!teamCodeA) return logger.warn("Skipped: no teamCodeA");

      const res = await request(app).get(`/api/team/find-by-code/${teamCodeA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.team).toHaveProperty("id", teamIdA);
      expect(res.body.team.teamCode).toBe(teamCodeA);
    });
  });

  describe("GET /api/team/:id - Get Team Details by ID", () => {
    it("should retrieve Team A by its database ID", async () => {
      if (!teamIdA) return logger.warn("Skipped: no teamIdA");

      const res = await request(app).get(`/api/team/${teamIdA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.team).toHaveProperty("id", teamIdA);
      expect(res.body.team.name).toContain("Alpha Warriors");
    });
  });

  describe("PUT /api/team/:id - Update Team", () => {
    it("should update Team A details", async () => {
      if (!tokenA || !teamIdA) return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .put(`/api/team/${teamIdA}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          name: `Alpha Warriors Elite ${ts}`,
          description: "Upgraded description for elite squad",
          sportType: "CRICKET",
          city: "Navi Mumbai"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.team.name).toBe(`Alpha Warriors Elite ${ts}`);
      expect(res.body.team.description).toBe("Upgraded description for elite squad");
    });
  });

  describe("POST /api/team/:id/invite - Invite Members", () => {
    it("should generate a custom member invitation token for non-registered player", async () => {
      if (!tokenA || !teamIdA) return logger.warn("Skipped: missing dependencies");

      const customEmail = `custom_invite_${ts}@kridaz.test`;
      const res = await request(app)
        .post(`/api/team/${teamIdA}/invite`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          invitees: [
            {
              name: "Custom Player",
              email: customEmail,
              phone: `93333${String(ts).slice(-5)}`
            }
          ]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results[0].status).toBe("invited_custom");
      expect(res.body.results[0]).toHaveProperty("token");

      const inviteToken = res.body.results[0].token;

      // Join via this invite token
      const joinRes = await request(app)
        .post(`/api/team/join/${inviteToken}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(joinRes.statusCode).toBe(200);
      expect(joinRes.body.success).toBe(true);
      expect(joinRes.body.message).toBe("Successfully joined the team");
    });
  });

  describe("POST /api/team/join-request/:id - Join Request", () => {
    it("should allow User A to request to join Team B", async () => {
      if (!tokenA || !teamIdB) return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/team/join-request/${teamIdB}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Join request sent successfully");
    });
  });

  describe("Match Challenges (Opponent Matching)", () => {
    let requestId = "";

    it("should send opponent challenge from Team A to Team B", async () => {
      if (!tokenA || !teamIdA || !teamIdB) return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/team/${teamIdA}/request-opponent`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          targetTeamId: teamIdB
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Opponent request sent");

      // Verify that request is pending in DB and get the ID
      const reqRecord = await prisma.teamOpponentRequest.findFirst({
        where: { fromId: teamIdA, toId: teamIdB, status: "PENDING" }
      });
      expect(reqRecord).not.toBeNull();
      requestId = reqRecord.id;
    });

    it("should accept opponent request, linking Team A and Team B as rivals", async () => {
      if (!tokenB || !teamIdB || !requestId) return logger.warn("Skipped: missing dependencies");

      const res = await request(app)
        .post(`/api/team/${teamIdB}/handle-opponent-request`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({
          requestId: requestId,
          action: "ACCEPTED"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Opponent request accepted");

      // Verify that request status is ACCEPTED
      const updatedReq = await prisma.teamOpponentRequest.findUnique({
        where: { id: requestId }
      });
      expect(updatedReq.status).toBe("ACCEPTED");
    });

    it("should retrieve Team A and Team B in the opponents list", async () => {
      if (!tokenA) return logger.warn("Skipped: no tokenA");

      const res = await request(app)
        .get("/api/team/opponents")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.teams)).toBe(true);
      const teamIds = res.body.teams.map(t => t.id);
      expect(teamIds).toContain(teamIdB);
    });
  });

  describe("DELETE /api/team/:id - Delete Team", () => {
    it("should delete Team A and Team B", async () => {
      if (tokenA && teamIdA) {
        const resA = await request(app)
          .delete(`/api/team/${teamIdA}`)
          .set("Authorization", `Bearer ${tokenA}`);
        expect(resA.statusCode).toBe(200);
        expect(resA.body.success).toBe(true);
      }

      if (tokenB && teamIdB) {
        const resB = await request(app)
          .delete(`/api/team/${teamIdB}`)
          .set("Authorization", `Bearer ${tokenB}`);
        expect(resB.statusCode).toBe(200);
        expect(resB.body.success).toBe(true);
      }
    });
  });
});
