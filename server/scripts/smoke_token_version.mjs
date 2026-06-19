// Verifies the tokenVersion enforcement end-to-end:
//   - Newly-issued tokens embed `tv`
//   - JWT middleware accepts matching tokens (200)
//   - After bumpTokenVersion() (e.g. POST /logout-all), the old token is
//     rejected with 401 + code: TOKEN_REVOKED
//   - Legacy tokens with no `tv` field still pass (backwards compat)
//   - Newly-issued tokens with the new tv work after the bump

import app from "../app.js";
import { prisma } from "../config/prisma.js";
import { redisClient } from "../config/redis.js";
import jwt from "jsonwebtoken";
import supertest from "supertest";
import { generateUserToken } from "../utils/generateJwtToken.js";
import { bumpTokenVersion } from "../utils/tokenVersion.js";

const results = [];
const pass = (label, ok, detail = "") => {
  results.push({ label, ok, detail });
  console.log((ok ? "PASS" : "FAIL").padEnd(5), label.padEnd(74), detail);
};

const main = async () => {
  process.env.JWT_SECRET ||= "dev-smoke-secret";
  const request = supertest(app);

  const user = await prisma.user.findFirst({
    select: { id: true, tokenVersion: true },
  });
  if (!user) throw new Error("need at least one user");
  const userId = user.id;
  const baseTv = user.tokenVersion ?? 0;

  // Clear any cached tv so the smoke starts from a known state.
  try {
    await redisClient.del?.(`auth:tv:${userId}`);
  } catch {}

  // 1) Issued token carries tv
  const tokenA = await generateUserToken(userId, "user");
  const decoded = jwt.decode(tokenA);
  pass(
    "issued token embeds tv field",
    typeof decoded.tv === "number",
    `tv=${decoded.tv}`
  );
  pass(
    "issued token tv matches DB value",
    decoded.tv === baseTv,
    `embed=${decoded.tv} db=${baseTv}`
  );

  // 2) Token works against a protected route
  const r1 = await request
    .get("/api/user/auth/getMe")
    .set("Authorization", `Bearer ${tokenA}`);
  pass(
    "getMe with fresh token → 2xx",
    r1.statusCode >= 200 && r1.statusCode < 300,
    `status=${r1.statusCode}`
  );

  // 3) Bump tokenVersion (logout-all simulation)
  const newTv = await bumpTokenVersion(userId);
  pass("bumpTokenVersion increments DB", newTv === baseTv + 1, `tv=${newTv}`);

  // 4) Old token now rejected
  const r2 = await request
    .get("/api/user/auth/getMe")
    .set("Authorization", `Bearer ${tokenA}`);
  pass(
    "old token after bump → 401",
    r2.statusCode === 401,
    `status=${r2.statusCode}`
  );
  pass(
    "old token rejection carries code: TOKEN_REVOKED",
    r2.body?.code === "TOKEN_REVOKED",
    `body=${JSON.stringify(r2.body)}`
  );

  // 5) Brand-new token with new tv passes
  const tokenB = await generateUserToken(userId, "user");
  const decodedB = jwt.decode(tokenB);
  pass(
    "re-issued token carries the new tv",
    decodedB.tv === newTv,
    `tv=${decodedB.tv}`
  );
  const r3 = await request
    .get("/api/user/auth/getMe")
    .set("Authorization", `Bearer ${tokenB}`);
  pass(
    "re-issued token → 2xx",
    r3.statusCode >= 200 && r3.statusCode < 300,
    `status=${r3.statusCode}`
  );

  // 6) Legacy token (no tv) is still accepted — non-breaking rollout
  const legacy = jwt.sign(
    { id: userId, role: "user", ownerId: null },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const r4 = await request
    .get("/api/user/auth/getMe")
    .set("Authorization", `Bearer ${legacy}`);
  pass(
    "legacy token without tv still works",
    r4.statusCode >= 200 && r4.statusCode < 300,
    `status=${r4.statusCode}`
  );

  // 7) /logout-all endpoint hits the controller cleanly
  const r5 = await request
    .post("/api/user/auth/logout-all")
    .set("Authorization", `Bearer ${tokenB}`);
  pass(
    "POST /user/auth/logout-all → 200 with fresh token",
    r5.statusCode === 200 && r5.body?.success === true,
    `status=${r5.statusCode}`
  );

  // After /logout-all, tokenB itself should now be revoked.
  const r6 = await request
    .get("/api/user/auth/getMe")
    .set("Authorization", `Bearer ${tokenB}`);
  pass(
    "token used to call /logout-all is itself revoked next request",
    r6.statusCode === 401 && r6.body?.code === "TOKEN_REVOKED",
    `status=${r6.statusCode} code=${r6.body?.code}`
  );

  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  console.log("");
  console.log(`=== ${passed}/${total} checks passed ===`);
  await prisma.$disconnect();
  process.exit(passed === total ? 0 : 1);
};

main().catch(async (e) => {
  console.error("SMOKE EXPLODED", e?.stack || e?.message || e);
  try {
    await prisma.$disconnect();
  } catch {}
  process.exit(2);
});
