// Smokes the four view endpoints:
//   GET /api/scoring/live
//   GET /api/scoring/:matchId/scorecard
//   GET /api/scoring/:matchId/squads
//   GET /api/scoring/:matchId/overs(?innings=N)
//
// Builds a tiny match (4 legal balls including a wicket and a wide) using the
// real service layer, then hits each endpoint over supertest with NO auth.
// Asserts the shape Flutter needs to render each tab.

import app from "../app.js";
import { prisma } from "../config/prisma.js";
import {
  processScoreUpdate,
  updateActivePlayers,
} from "../modules/scoring/scoring.service.js";
import supertest from "supertest";

const results = [];
const pass = (label, ok, detail = "") => {
  results.push({ label, ok, detail });
  console.log((ok ? "PASS" : "FAIL").padEnd(5), label.padEnd(72), detail);
};

const main = async () => {
  process.env.JWT_SECRET ||= "dev-smoke-secret";
  const request = supertest(app);

  // Borrow an existing ACTIVE HostedGame with at least two team slots.
  const game = await prisma.hostedGame.findFirst({
    where: { status: "ACTIVE", teams: { some: { slots: { some: {} } } } },
    orderBy: { createdAt: "asc" },
    include: { teams: { include: { slots: true } } },
  });
  if (!game) throw new Error("need an ACTIVE HostedGame with team slots");

  // Wipe any existing scoring on it.
  await prisma.matchBall.deleteMany({ where: { match: { gameId: game.id } } });
  await prisma.matchPlayerStat.deleteMany({
    where: { match: { gameId: game.id } },
  });
  await prisma.innings.deleteMany({ where: { match: { gameId: game.id } } });
  await prisma.cricketMatch.deleteMany({ where: { gameId: game.id } });

  const users = await prisma.user.findMany({ select: { id: true }, take: 6 });
  if (users.length < 4) throw new Error("need 4+ users");
  const [striker, nonStriker, bowler1, bowler2] = users;

  const match = await prisma.cricketMatch.create({
    data: {
      gameId: game.id,
      status: "LIVE",
      timerState: "RUNNING",
      currentInningsIndex: 0,
      oversPerInnings: 20,
      strikerId: striker.id,
      nonStrikerId: nonStriker.id,
      bowlerId: bowler1.id,
    },
  });
  await prisma.innings.create({
    data: {
      matchId: match.id,
      inningsIndex: 0,
      battingTeam: "teamA",
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
    },
  });
  await prisma.hostedGame.update({
    where: { id: game.id },
    data: { scoringStatus: "LIVE" },
  });

  try {
    // Score sequence: 4 (boundary) → 1 (rotate) → Wide → 2 → Wicket (caught)
    await processScoreUpdate(match.id, {
      runs: 4,
      isBoundary: true,
      isFour: true,
      batsmanId: striker.id,
      bowlerId: bowler1.id,
    });
    await processScoreUpdate(match.id, {
      runs: 1,
      batsmanId: striker.id,
      bowlerId: bowler1.id,
    });
    await processScoreUpdate(match.id, {
      runs: 0,
      extraRuns: 1,
      isExtra: true,
      extraType: "WIDE",
      batsmanId: nonStriker.id,
      bowlerId: bowler1.id,
    });
    await processScoreUpdate(match.id, {
      runs: 2,
      batsmanId: nonStriker.id,
      bowlerId: bowler1.id,
    });
    await processScoreUpdate(match.id, {
      runs: 0,
      isWicket: true,
      wicketType: "CAUGHT",
      batsmanId: nonStriker.id,
      bowlerId: bowler1.id,
      playerOutId: nonStriker.id,
      wicketTakerId: bowler1.id,
      fielderId: bowler2.id,
      nextBatterId: bowler2.id,
    });

    // ── LIVE list ────────────────────────────────────────────────────
    const r1 = await request.get("/api/scoring/live");
    pass("GET /scoring/live → 200", r1.statusCode === 200);
    const card = r1.body?.data?.items?.find((c) => c.gameId === game.id);
    pass(
      "GET /scoring/live includes our match",
      !!card && !!card.inningsA,
      `inningsA=${JSON.stringify(card?.inningsA)}`
    );
    // Total runs = 4 + 1 + 1(wide) + 2 + 0(wicket ball) = 8.
    pass(
      "GET /scoring/live card has teams + score",
      card?.teamA?.name &&
        card?.inningsA?.runs === 8 &&
        card?.inningsA?.wickets === 1,
      `runs=${card?.inningsA?.runs} wkts=${card?.inningsA?.wickets}`
    );

    // ── SCORECARD ─────────────────────────────────────────────────────
    const r2 = await request.get(`/api/scoring/${match.id}/scorecard`);
    pass("GET /scorecard → 200", r2.statusCode === 200);
    const sc = r2.body?.data;
    pass(
      "scorecard.innings[0] has totals",
      sc?.innings?.[0]?.totalRuns === 8 && sc?.innings?.[0]?.totalWickets === 1,
      `runs=${sc?.innings?.[0]?.totalRuns} wkts=${sc?.innings?.[0]?.totalWickets}`
    );
    pass(
      "scorecard.batters includes striker",
      sc?.innings?.[0]?.batters?.some((b) => b.id === striker.id),
      `count=${sc?.innings?.[0]?.batters?.length}`
    );
    const outBatter = sc?.innings?.[0]?.batters?.find(
      (b) => b.id === nonStriker.id
    );
    pass(
      'scorecard.batters dismissed batter shows "c X b Y"',
      outBatter?.dismissal?.startsWith("c "),
      `dismissal="${outBatter?.dismissal}"`
    );
    pass(
      "scorecard.bowlers[0] has O/M/R/W",
      sc?.innings?.[0]?.bowlers?.[0]?.overs != null &&
        sc?.innings?.[0]?.bowlers?.[0]?.wickets === 1,
      `bowler=${JSON.stringify(sc?.innings?.[0]?.bowlers?.[0])}`
    );
    pass(
      "scorecard.fallOfWickets has one entry",
      sc?.innings?.[0]?.fallOfWickets?.length === 1,
      `fow=${JSON.stringify(sc?.innings?.[0]?.fallOfWickets)}`
    );
    pass(
      "scorecard.extras totals wide=1",
      sc?.innings?.[0]?.extras?.wides === 1 &&
        sc?.innings?.[0]?.extras?.total === 1,
      `extras=${JSON.stringify(sc?.innings?.[0]?.extras)}`
    );
    pass(
      "scorecard.partnerships[0] has two players",
      sc?.innings?.[0]?.partnerships?.[0]?.playerA?.id &&
        sc?.innings?.[0]?.partnerships?.[0]?.playerB?.id,
      `p=${JSON.stringify(sc?.innings?.[0]?.partnerships?.[0])}`
    );

    // ── SQUADS ────────────────────────────────────────────────────────
    const r3 = await request.get(`/api/scoring/${match.id}/squads`);
    pass("GET /squads → 200", r3.statusCode === 200);
    const sq = r3.body?.data;
    // Some test games have empty team rosters; just assert shape, not content.
    pass(
      "squads.teamA.playingXi is an array",
      Array.isArray(sq?.teamA?.playingXi) && Array.isArray(sq?.teamA?.bench),
      `xi=${sq?.teamA?.playingXi?.length} bench=${sq?.teamA?.bench?.length}`
    );
    pass("squads.teamA has name", !!sq?.teamA?.name);
    pass("squads.teamB has name", !!sq?.teamB?.name);

    // ── OVERS ─────────────────────────────────────────────────────────
    const r4 = await request.get(`/api/scoring/${match.id}/overs?innings=0`);
    pass("GET /overs?innings=0 → 200", r4.statusCode === 200);
    const ov = r4.body?.data?.innings?.[0];
    pass(
      "overs has one over (the first one)",
      ov?.overs?.length === 1,
      `count=${ov?.overs?.length}`
    );
    const over1 = ov?.overs?.[0];
    pass(
      'overs[0] header is "Bowler to Striker"',
      over1?.header?.includes(" to "),
      `header="${over1?.header}"`
    );
    pass(
      'overs[0].balls includes a "4" tile',
      over1?.balls?.some((b) => b.label === "4"),
      `labels=${over1?.balls?.map((b) => b.label).join(",")}`
    );
    pass(
      'overs[0].balls includes a "wd" tile',
      over1?.balls?.some((b) => b.label?.endsWith("wd")),
      `labels=${over1?.balls?.map((b) => b.label).join(",")}`
    );
    pass(
      'overs[0].balls includes a "W" tile',
      over1?.balls?.some((b) => b.label?.startsWith("W")),
      `labels=${over1?.balls?.map((b) => b.label).join(",")}`
    );
    pass(
      'overs[0].scoreAtEnd = "8-1"',
      over1?.scoreAtEnd === "8-1",
      `scoreAtEnd=${over1?.scoreAtEnd}`
    );

    // ══ ETag polling ══════════════════════════════════════════════════
    // First call should return an ETag header.
    const e1 = await request.get(`/api/scoring/${match.id}/scorecard`);
    const tag1 = e1.headers.etag;
    pass(
      "scorecard sets ETag header",
      typeof tag1 === "string" && tag1.startsWith('W/"m-'),
      `etag=${tag1}`
    );
    pass(
      "scorecard sets Cache-Control: must-revalidate",
      (e1.headers["cache-control"] || "").includes("must-revalidate"),
      `cc=${e1.headers["cache-control"]}`
    );

    // Same ETag echoed → 304.
    const e2 = await request
      .get(`/api/scoring/${match.id}/scorecard`)
      .set("If-None-Match", tag1);
    pass(
      "scorecard with matching If-None-Match → 304",
      e2.statusCode === 304,
      `status=${e2.statusCode}`
    );
    pass(
      "scorecard 304 body is empty",
      !e2.body || Object.keys(e2.body).length === 0
    );

    // Score one more ball → ETag must rotate.
    await processScoreUpdate(match.id, {
      runs: 1,
      batsmanId: striker.id,
      bowlerId: bowler1.id,
    });
    const e3 = await request
      .get(`/api/scoring/${match.id}/scorecard`)
      .set("If-None-Match", tag1);
    pass(
      "scorecard after score change ignores stale If-None-Match",
      e3.statusCode === 200,
      `status=${e3.statusCode}`
    );
    pass(
      "scorecard rotates ETag after a score",
      e3.headers.etag && e3.headers.etag !== tag1,
      `new=${e3.headers.etag}`
    );

    // Squads ETag — independent of ball events.
    const sq1 = await request.get(`/api/scoring/${match.id}/squads`);
    const sqTag = sq1.headers.etag;
    pass(
      "squads sets ETag header",
      typeof sqTag === "string" && sqTag.startsWith('W/"sq-')
    );
    const sq2 = await request
      .get(`/api/scoring/${match.id}/squads`)
      .set("If-None-Match", sqTag);
    pass("squads with matching If-None-Match → 304", sq2.statusCode === 304);

    // Live list ETag.
    const ll1 = await request.get("/api/scoring/live");
    const llTag = ll1.headers.etag;
    pass(
      "live list sets ETag header",
      typeof llTag === "string" && llTag.startsWith('W/"ll-')
    );
    const ll2 = await request
      .get("/api/scoring/live")
      .set("If-None-Match", llTag);
    pass("live list with matching If-None-Match → 304", ll2.statusCode === 304);

    // ══ /overs cursor ══════════════════════════════════════════════════
    // Get the full overs payload — capture nextCursor (the latest ball id).
    const oFull = await request.get(`/api/scoring/${match.id}/overs?innings=0`);
    const cursorId = oFull.body?.data?.nextCursor;
    pass(
      "overs includes nextCursor",
      typeof cursorId === "string" && cursorId.length > 0,
      `cursor=${cursorId}`
    );

    // Polling with the cursor and no new balls — innings list should have
    // no overs (we're already caught up). ETag still 200s because the cursor
    // doesn't gate the etag (it gates the body).
    // To exercise the cursor in isolation, we bypass the ETag by NOT sending
    // If-None-Match. Without new activity, every over is filtered out.
    const oCursor1 = await request.get(
      `/api/scoring/${match.id}/overs?innings=0&afterBallId=${cursorId}`
    );
    const inning0After = oCursor1.body?.data?.innings?.[0];
    pass(
      "overs with cursor at latest ball → empty overs",
      inning0After?.overs?.length === 0,
      `overs=${inning0After?.overs?.length}`
    );

    // Score one more ball, then cursor should yield 1 over with 1 new ball.
    await processScoreUpdate(match.id, {
      runs: 2,
      batsmanId: nonStriker.id,
      bowlerId: bowler1.id,
    });
    const oCursor2 = await request.get(
      `/api/scoring/${match.id}/overs?innings=0&afterBallId=${cursorId}`
    );
    const inning0New = oCursor2.body?.data?.innings?.[0];
    pass(
      "overs cursor after new ball returns 1 over",
      inning0New?.overs?.length === 1,
      `overs=${inning0New?.overs?.length}`
    );
    pass(
      "overs cursor rotates nextCursor",
      oCursor2.body?.data?.nextCursor &&
        oCursor2.body.data.nextCursor !== cursorId,
      `new=${oCursor2.body?.data?.nextCursor}`
    );
  } finally {
    await prisma.matchBall.deleteMany({ where: { matchId: match.id } });
    await prisma.matchPlayerStat.deleteMany({ where: { matchId: match.id } });
    await prisma.innings.deleteMany({ where: { matchId: match.id } });
    await prisma.cricketMatch.delete({ where: { id: match.id } });
  }

  console.log("");
  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
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
