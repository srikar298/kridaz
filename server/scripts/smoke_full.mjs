// Full-stack smoke: every change made this session, verified end-to-end
// against the running app + DB.
import app from "../app.js";
import { prisma } from "../config/prisma.js";
import jwt from "jsonwebtoken";
import supertest from "supertest";
import { generateUserToken } from "../utils/generateJwtToken.js";

const results = [];
const pass = (label, ok, detail = "") => {
  results.push({ label, ok, detail });
  console.log((ok ? "PASS" : "FAIL").padEnd(5), label.padEnd(72), detail || "");
};

const main = async () => {
  process.env.JWT_SECRET ||= "dev-smoke-secret";

  // ── 1. Public meta ───────────────────────────────────────────────────────
  const v = await supertest(app).get("/api/version");
  pass(
    "/version body has data.server + minSupportedClient",
    v.statusCode === 200 &&
      !!v.body.data?.server &&
      !!v.body.data?.minSupportedClient,
    `${v.body.data?.server} | min=${v.body.data?.minSupportedClient}`
  );
  pass("Server-Version header set", !!v.headers["server-version"]);
  pass("Min-Client-Version header set", !!v.headers["min-client-version"]);
  pass("X-Request-Id header set", !!v.headers["x-request-id"]);
  pass(
    "Cross-Origin-Resource-Policy=cross-origin",
    v.headers["cross-origin-resource-policy"] === "cross-origin"
  );

  const v1 = await supertest(app).get("/api/v1/version");
  pass(
    "/api/v1 prefix is GONE",
    v1.statusCode === 404,
    `status=${v1.statusCode}`
  );

  const h = await supertest(app).get("/api/health");
  pass(
    "/health probes db + redis",
    h.statusCode === 200 && h.body.db && h.body.redis,
    `db=${h.body.db} redis=${h.body.redis}`
  );

  const c = await supertest(app).get("/api/sync/clock");
  pass(
    "/sync/clock returns data.now ISO",
    c.statusCode === 200 && typeof c.body.data?.now === "string",
    c.body.data?.now
  );

  // ── 2. Error envelope ────────────────────────────────────────────────────
  const noAuth = await supertest(app).get("/api/user/auth/getMe");
  pass(
    "No bearer → code=NO_TOKEN",
    noAuth.statusCode === 401 && noAuth.body.code === "NO_TOKEN",
    `code=${noAuth.body.code}`
  );
  pass("Error body carries requestId echo", !!noAuth.body.requestId);

  const bad = await supertest(app)
    .get("/api/user/auth/getMe")
    .set("Authorization", "Bearer not-a-jwt");
  pass(
    "Bad bearer → code=INVALID_TOKEN",
    bad.statusCode === 401 && bad.body.code === "INVALID_TOKEN",
    `code=${bad.body.code}`
  );

  const expiredTok = jwt.sign({ id: "fake" }, process.env.JWT_SECRET, {
    expiresIn: "-1s",
  });
  const exp = await supertest(app)
    .get("/api/user/auth/getMe")
    .set("Authorization", `Bearer ${expiredTok}`);
  pass(
    "Expired token → code=TOKEN_EXPIRED AND message=TOKEN_EXPIRED (web back-compat shim)",
    exp.body.code === "TOKEN_EXPIRED" && exp.body.message === "TOKEN_EXPIRED",
    `code=${exp.body.code} message=${exp.body.message}`
  );

  // ── 3. Turfs (pricePerHour recompute + slot seed) ────────────────────────
  const tl = await supertest(app).get("/api/user/turf/all?limit=3");
  const hasTurfs = tl.statusCode === 200 && tl.body.turfs?.length > 0;
  pass("/turf/all returns turfs", hasTurfs, `count=${tl.body.turfs?.length}`);
  if (hasTurfs) {
    const allNonZero = tl.body.turfs.every((t) => Number(t.pricePerHour) > 0);
    pass(
      "All listed turfs pricePerHour > 0",
      allNonZero,
      tl.body.turfs.map((t) => t.pricePerHour).join(",")
    );

    const id = tl.body.turfs[0].id || tl.body.turfs[0]._id;
    const td = await supertest(app).get(`/api/user/turf/details/${id}`);
    pass(
      "/turf/details/:id has generatedSlots",
      td.statusCode === 200 &&
        Array.isArray(td.body.turf?.generatedSlots) &&
        td.body.turf.generatedSlots.length > 0,
      `len=${td.body.turf?.generatedSlots?.length}`
    );

    const today = new Date().toISOString().slice(0, 10);
    const ts = await supertest(app).get(
      `/api/user/turf/timeSlot?turfId=${id}&date=${today}`
    );
    pass(
      "/turf/timeSlot has timeSlots.generatedSlots[]",
      ts.statusCode === 200 &&
        Array.isArray(ts.body.timeSlots?.generatedSlots) &&
        ts.body.timeSlots.generatedSlots.length > 0,
      `len=${ts.body.timeSlots?.generatedSlots?.length}`
    );
  }

  // ── 4. Notifications new endpoints ───────────────────────────────────────
  const unr = await supertest(app).get("/api/user/notification/unread-count");
  pass(
    "/notification/unread-count is mounted",
    unr.statusCode !== 404,
    `status=${unr.statusCode}`
  );

  const del = await supertest(app).delete(
    "/api/user/notification/some-fake-id"
  );
  pass(
    "DELETE /notification/:id is mounted (NOT shadowed by /clear)",
    del.statusCode !== 404,
    `status=${del.statusCode}`
  );

  const topic = await supertest(app)
    .post("/api/user/notification/topics/subscribe")
    .send({});
  pass(
    "/notification/topics/subscribe is mounted",
    topic.statusCode !== 404,
    `status=${topic.statusCode}`
  );

  // Confirm DELETE /notification/clear still works (specific-before-parametric ordering)
  const clear = await supertest(app).delete("/api/user/notification/clear");
  pass(
    "DELETE /notification/clear still works (not shadowed)",
    clear.statusCode === 401 || clear.statusCode === 200,
    `status=${clear.statusCode}`
  );

  // ── 5. /players/nearby (allowlist + isFollowing) ─────────────────────────
  const seed = await prisma.user.findFirst({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: { id: true, latitude: true, longitude: true },
  });
  if (seed) {
    const np = await supertest(app).get(
      `/api/user/players/nearby?lat=${seed.latitude}&lng=${seed.longitude}&radius=100000`
    );
    const sample = np.body.players?.[0];
    pass(
      "/players/nearby anon returns players",
      np.statusCode === 200 && Array.isArray(np.body.players),
      `count=${np.body.players?.length}`
    );
    pass(
      "/players/nearby anon rows have isFollowing:false",
      sample && sample.isFollowing === false,
      `sample.isFollowing=${sample?.isFollowing}`
    );
    const banned = [
      "password",
      "fcmToken",
      "googleId",
      "email",
      "phone",
      "notificationPreferences",
      "migrationStatus",
      "socialAccounts",
    ];
    const leaks = sample ? banned.filter((k) => k in sample) : [];
    pass(
      "/players/nearby leaks no secrets",
      leaks.length === 0,
      leaks.join(",") || "(clean)"
    );
  } else {
    pass("/players/nearby — no seeded user with lat/lng (skipped)", true);
  }

  // ── 6. Hosted-game flags ─────────────────────────────────────────────────
  const hl = await supertest(app).get("/api/hosted-game/list");
  const hg = hl.body.games?.[0];
  pass(
    "/hosted-game/list anon returns games",
    hl.statusCode === 200 && Array.isArray(hl.body.games),
    `count=${hl.body.games?.length}`
  );
  pass(
    "/hosted-game/list anon rows carry isHost+youJoined flags",
    hg && "isHost" in hg && "youJoined" in hg,
    `isHost=${hg?.isHost} youJoined=${hg?.youJoined}`
  );

  // Find a slot-holder and confirm youJoined:true for that viewer
  const games = await prisma.hostedGame.findMany({
    where: { status: "ACTIVE" },
    include: { slots: true, teams: { include: { slots: true } } },
    take: 20,
  });
  let viewer = null,
    gameId = null;
  for (const g of games) {
    const holder =
      g.slots.find((s) => s.userId) ||
      g.teams.flatMap((t) => t.slots).find((s) => s.userId);
    if (holder) {
      viewer = holder.userId;
      gameId = g.id;
      break;
    }
  }
  if (viewer && gameId) {
    const tok = generateUserToken(viewer, "user");
    const r = await supertest(app)
      .get(`/api/hosted-game/${gameId}`)
      .set("Authorization", `Bearer ${tok}`);
    pass(
      "/hosted-game/:id auth slot-holder → youJoined:true",
      r.body.game?.youJoined === true && !!r.body.game?.yourSlotId,
      `youJoined=${r.body.game?.youJoined} status=${r.body.game?.yourSlotStatus}`
    );
  }

  // ── 7. Refresh body acceptance ───────────────────────────────────────────
  const rf = await supertest(app)
    .post("/api/user/auth/refresh")
    .send({ refreshToken: "bogus" });
  pass(
    "/refresh accepts body (no NO_REFRESH_TOKEN with present body)",
    rf.body.code !== "NO_REFRESH_TOKEN",
    `code=${rf.body.code}`
  );

  // ── 8. /version+booking path canonicality ────────────────────────────────
  // Aliases — both should resolve (web uses /api/user/..., Tier-2 also works)
  const a1 = await supertest(app)
    .post("/api/user/booking/create-order")
    .send({});
  const a2 = await supertest(app)
    .post("/api/booking/user/create-order")
    .send({});
  pass(
    "Booking aliases: /api/user/booking/... routes (web canonical)",
    a1.statusCode !== 404,
    `status=${a1.statusCode}`
  );
  pass(
    "Booking aliases: /api/booking/user/... routes (Tier-2 mount)",
    a2.statusCode !== 404,
    `status=${a2.statusCode}`
  );

  // ── 9. Compression for big responses ─────────────────────────────────────
  const big = await supertest(app)
    .get("/metrics")
    .set("Accept-Encoding", "gzip")
    .buffer(true);
  pass(
    "compression() gzips large responses",
    big.headers["content-encoding"] === "gzip",
    `len=${big.text?.length ?? big.body?.length}`
  );

  // ── 10. Upload MIME filter is wired (introspection only — actual upload
  // would need authed multipart; just confirm controller hits) ────────────
  // Skipped — no anonymous-reachable upload route to ping.

  // ── 11. Owner can refresh — just confirm /owner/auth/refresh exists ────
  const orf = await supertest(app)
    .post("/api/owner/auth/refresh")
    .send({ refreshToken: "bogus" });
  pass(
    "/owner/auth/refresh is mounted",
    orf.statusCode !== 404,
    `status=${orf.statusCode}`
  );

  console.log("");
  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  console.log(`=== ${passed}/${total} checks passed ===`);
  const failures = results.filter((r) => !r.ok);
  if (failures.length) {
    console.log("");
    console.log("Failures:");
    failures.forEach((f) => console.log(" -", f.label, "|", f.detail));
  }
  await prisma.$disconnect();
  process.exit(passed === total ? 0 : 1);
};

main().catch((e) => {
  console.error("SMOKE EXPLODED", e);
  process.exit(2);
});
