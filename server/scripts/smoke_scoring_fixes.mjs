// Verifies the four P0 cricket-scoring fixes against the live local stack.
// Creates a throwaway match end-to-end, exercises each bug scenario, asserts,
// then deletes the test data.
import { prisma } from "../config/prisma.js";
import {
  processScoreUpdate,
  revertLastBall,
  addPenaltyRuns,
  updateActivePlayers,
  advanceToNextInnings,
  updateHouseRules,
} from "../modules/scoring/scoring.service.js";
import { computeScoreSnapshot } from "../modules/scoring/scoring.utils.js";

const results = [];
const pass = (label, ok, detail = "") => {
  results.push({ label, ok, detail });
  console.log((ok ? "PASS" : "FAIL").padEnd(5), label.padEnd(72), detail);
};

const main = async () => {
  // Reuse an existing HostedGame (creating one needs many required fields).
  // We'll attach a NEW CricketMatch to it. If the game already has a
  // CricketMatch, delete it first (it's only a smoke test, our local data).
  const game = await prisma.hostedGame.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  if (!game) throw new Error("need at least one ACTIVE HostedGame in DB");

  await prisma.cricketMatch.deleteMany({ where: { gameId: game.id } });

  const users = await prisma.user.findMany({ select: { id: true }, take: 5 });
  if (users.length < 4) throw new Error("need 4+ users in DB");
  const [striker, nonStriker, bowler, freshBatter] = users;

  const match = await prisma.cricketMatch.create({
    data: {
      gameId: game.id,
      status: "LIVE",
      timerState: "RUNNING",
      currentInningsIndex: 0,
      oversPerInnings: 20,
      strikerId: striker.id,
      nonStrikerId: nonStriker.id,
      bowlerId: bowler.id,
    },
  });

  await prisma.innings.create({
    data: {
      matchId: match.id,
      inningsIndex: 0,
      battingTeam: "teamA",
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
    },
  });

  try {
    // ── P0 #4 — bye-with-runs guard ───────────────────────────────────────
    // Send a bye with runs=4. Forward path should put all 4 into extraRuns
    // and 0 into the batter's battingRuns.
    await processScoreUpdate(match.id, {
      runs: 4,
      isExtra: true,
      extraType: "BYE",
      batsmanId: striker.id,
      bowlerId: bowler.id,
    });
    const afterBye = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    const strikerStatAfterBye = await prisma.matchPlayerStat.findFirst({
      where: { matchId: match.id, userId: striker.id },
    });
    pass(
      "bye(runs:4) totalRuns +4",
      afterBye.totalRuns === 4,
      `totalRuns=${afterBye.totalRuns}`
    );
    pass(
      "bye(runs:4) battingRuns stays 0 (no batter credit)",
      strikerStatAfterBye.battingRuns === 0,
      `battingRuns=${strikerStatAfterBye.battingRuns}`
    );
    pass(
      "bye(runs:4) batter battingBalls=1 (he faced it)",
      strikerStatAfterBye.battingBalls === 1,
      `battingBalls=${strikerStatAfterBye.battingBalls}`
    );
    pass(
      "bye(runs:4) totalBalls=1 (legal delivery)",
      afterBye.totalBalls === 1,
      `totalBalls=${afterBye.totalBalls}`
    );
    pass(
      "bye(runs:4) extras.byes=4",
      afterBye.extras.byes === 4,
      `byes=${afterBye.extras.byes}`
    );

    // ── Setup for P0 #1 ──────────────────────────────────────────────────
    // Score one legal run so ball count is at 2.
    await processScoreUpdate(match.id, {
      runs: 1,
      batsmanId: nonStriker.id, // strike rotated after bye? No — bye doesn't rotate based on runs anymore... actually it does since extraRuns is 4 (even)
      bowlerId: bowler.id,
    });
    const afterRun = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    pass(
      "1 legal run after bye: totalBalls=2",
      afterRun.totalBalls === 2,
      `totalBalls=${afterRun.totalBalls}`
    );
    pass(
      "1 legal run after bye: totalRuns=5",
      afterRun.totalRuns === 5,
      `totalRuns=${afterRun.totalRuns}`
    );

    // ── P0 #1 — penalty + undo ball-count corruption ─────────────────────
    // Award a penalty (does NOT increment totalBalls).
    await addPenaltyRuns(match.id, 5, "teamB");
    const afterPenalty = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    pass(
      "penalty(5): totalBalls UNCHANGED at 2",
      afterPenalty.totalBalls === 2,
      `totalBalls=${afterPenalty.totalBalls}`
    );
    pass(
      "penalty(5): totalRuns +5",
      afterPenalty.totalRuns === afterRun.totalRuns + 5,
      `totalRuns=${afterPenalty.totalRuns}`
    );

    // Undo the penalty. Pre-fix: this decremented totalBalls from 2 → 1.
    // Post-fix: totalBalls stays at 2.
    await revertLastBall(match.id);
    const afterUndo = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    pass(
      "undo(penalty): totalBalls STILL 2 (no corruption)",
      afterUndo.totalBalls === 2,
      `totalBalls=${afterUndo.totalBalls} (was 2 before undo)`
    );
    pass(
      "undo(penalty): totalRuns rolled back to 5",
      afterUndo.totalRuns === 5,
      `totalRuns=${afterUndo.totalRuns}`
    );

    // ── P0 #2 — penalty against fielding team lands on CURRENT innings ──
    const before2 = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    await addPenaltyRuns(match.id, 5, "teamB"); // teamB = fielding (innings.battingTeam is teamA)
    const after2 = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    pass(
      "penalty against fielding team: lands on current innings",
      after2.totalRuns === before2.totalRuns + 5,
      `before=${before2.totalRuns} after=${after2.totalRuns}`
    );

    // ── Confirm wide also doesn't increment totalBalls ───────────────────
    const before3 = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    await processScoreUpdate(match.id, {
      runs: 0,
      extraRuns: 1,
      isExtra: true,
      extraType: "WIDE",
      batsmanId: striker.id,
      bowlerId: bowler.id,
    });
    const after3 = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    pass(
      "wide: totalBalls UNCHANGED",
      after3.totalBalls === before3.totalBalls,
      `before=${before3.totalBalls} after=${after3.totalBalls}`
    );
    pass(
      "wide: extras.wides +1",
      after3.extras.wides === 1,
      `wides=${after3.extras.wides}`
    );

    // ── Validator (P0 #3) — runs > 6 must reject via zod ─────────────────
    const { updateScoreSchema } =
      await import("../modules/scoring/scoring.validator.js");
    const tooHigh = updateScoreSchema.safeParse({
      body: {
        scoringId: "x",
        ballData: { runs: 7, batsmanId: "x", bowlerId: "x" },
      },
    });
    pass(
      "validator rejects runs=7",
      !tooHigh.success,
      tooHigh.success
        ? "unexpectedly accepted"
        : tooHigh.error.issues[0]?.message
    );

    const ok6 = updateScoreSchema.safeParse({
      body: {
        scoringId: "x",
        ballData: { runs: 6, batsmanId: "x", bowlerId: "x" },
      },
    });
    pass("validator accepts runs=6", ok6.success);

    const okExtras = updateScoreSchema.safeParse({
      body: {
        scoringId: "x",
        ballData: {
          runs: 4,
          extraRuns: 4,
          isExtra: true,
          extraType: "NO_BALL",
          batsmanId: "x",
          bowlerId: "x",
        },
      },
    });
    pass("validator accepts 4+4 no-ball overthrow case", okExtras.success);

    // ── P1: Free Hit (Law 21.18) ───────────────────────────────────────
    // Score a no-ball. Then verify freeHitActive flips true.
    await processScoreUpdate(match.id, {
      runs: 0,
      extraRuns: 1,
      isExtra: true,
      extraType: "NO_BALL",
      batsmanId: striker.id,
      bowlerId: bowler.id,
    });
    const afterNoBall = await prisma.cricketMatch.findUnique({
      where: { id: match.id },
      select: { freeHitActive: true },
    });
    pass(
      "no-ball sets freeHitActive=true",
      afterNoBall.freeHitActive === true,
      `freeHit=${afterNoBall.freeHitActive}`
    );

    // Attempt a BOWLED on the free hit — should reject.
    let freeHitRejected = false;
    let freeHitErr = null;
    try {
      await processScoreUpdate(match.id, {
        runs: 0,
        isWicket: true,
        wicketType: "BOWLED",
        batsmanId: striker.id,
        bowlerId: bowler.id,
        playerOutId: striker.id,
      });
    } catch (e) {
      freeHitRejected = true;
      freeHitErr = e.meta?.code || e.message;
    }
    pass(
      "BOWLED on free hit is rejected",
      freeHitRejected,
      `code=${freeHitErr}`
    );

    // Wide on a free hit — should NOT clear the flag (free hit persists).
    await processScoreUpdate(match.id, {
      runs: 0,
      extraRuns: 1,
      isExtra: true,
      extraType: "WIDE",
      batsmanId: striker.id,
      bowlerId: bowler.id,
    });
    const afterWideOnFH = await prisma.cricketMatch.findUnique({
      where: { id: match.id },
      select: { freeHitActive: true },
    });
    pass(
      "wide during free hit keeps freeHitActive=true",
      afterWideOnFH.freeHitActive === true,
      `freeHit=${afterWideOnFH.freeHitActive}`
    );

    // RUN_OUT on a free hit — should be allowed. nextBatterId must be a
    // user who is NOT already at the crease, otherwise the
    // striker-equals-non-striker guard rejects unrelated to free-hit logic.
    let runOutAllowed = true;
    let runOutErr = null;
    try {
      await processScoreUpdate(match.id, {
        runs: 1,
        isWicket: true,
        wicketType: "RUN_OUT",
        batsmanId: striker.id,
        bowlerId: bowler.id,
        playerOutId: striker.id,
        nextBatterId: freshBatter.id,
      });
    } catch (e) {
      runOutAllowed = false;
      runOutErr = e.meta?.code || e.message;
    }
    pass("RUN_OUT on free hit is allowed", runOutAllowed, runOutErr || "");

    // After a fair delivery, free hit should clear.
    await processScoreUpdate(match.id, {
      runs: 1,
      batsmanId: striker.id,
      bowlerId: bowler.id,
    });
    const afterFairDelivery = await prisma.cricketMatch.findUnique({
      where: { id: match.id },
      select: { freeHitActive: true },
    });
    pass(
      "fair delivery clears free hit",
      afterFairDelivery.freeHitActive === false,
      `freeHit=${afterFairDelivery.freeHitActive}`
    );

    // ── P1: All-out check derived from maxMembers ─────────────────────
    const innings = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    // Pretend the game is 6-a-side; all-out should be at 5 wickets.
    const snapshot6 = computeScoreSnapshot(
      {
        ...{
          currentInningsIndex: 0,
          innings: [{ ...innings, totalWickets: 5, isCompleted: false }],
          playerStats: [],
          timeline: [],
          gameId: "fake",
        },
      },
      { ...game, maxMembers: 6 }
    );
    pass(
      "6-a-side: 5 wickets = all-out",
      snapshot6.isInningsComplete === true,
      `complete=${snapshot6.isInningsComplete}`
    );

    const snapshot6Not = computeScoreSnapshot(
      {
        ...{
          currentInningsIndex: 0,
          innings: [{ ...innings, totalWickets: 4, isCompleted: false }],
          playerStats: [],
          timeline: [],
          gameId: "fake",
        },
      },
      { ...game, maxMembers: 6 }
    );
    pass(
      "6-a-side: 4 wickets = NOT all-out",
      snapshot6Not.isInningsComplete === false
    );

    // 11-a-side stays at 10 wickets.
    const snapshot11Not = computeScoreSnapshot(
      {
        ...{
          currentInningsIndex: 0,
          innings: [{ ...innings, totalWickets: 9, isCompleted: false }],
          playerStats: [],
          timeline: [],
          gameId: "fake",
        },
      },
      { ...game, maxMembers: 11 }
    );
    pass(
      "11-a-side: 9 wickets = NOT all-out",
      snapshot11Not.isInningsComplete === false
    );

    const snapshot11All = computeScoreSnapshot(
      {
        ...{
          currentInningsIndex: 0,
          innings: [{ ...innings, totalWickets: 10, isCompleted: false }],
          playerStats: [],
          timeline: [],
          gameId: "fake",
        },
      },
      { ...game, maxMembers: 11 }
    );
    pass(
      "11-a-side: 10 wickets = all-out",
      snapshot11All.isInningsComplete === true
    );

    // ── P1: Same-bowler-consecutive-overs rejection ───────────────────
    let consecutiveBlocked = false;
    let consecutiveErr = null;
    try {
      await updateActivePlayers(match.id, { bowlerId: bowler.id });
    } catch (e) {
      consecutiveBlocked = true;
      consecutiveErr = e.meta?.code || e.message;
    }
    pass(
      "same-bowler consecutive over rejected",
      consecutiveBlocked,
      `code=${consecutiveErr}`
    );

    // ── P1: Retired-hurt comeback resets outStatus ────────────────────
    // First, mark the striker as retired-hurt directly in the DB.
    await prisma.matchPlayerStat.upsert({
      where: {
        matchId_userId_inningsIndex: {
          matchId: match.id,
          userId: striker.id,
          inningsIndex: 0,
        },
      },
      update: { outStatus: "RETIRED_HURT" },
      create: {
        matchId: match.id,
        userId: striker.id,
        inningsIndex: 0,
        battingRuns: 10,
        battingBalls: 8,
        outStatus: "RETIRED_HURT",
      },
    });

    // Pick a fresh bowler so the bowler-change check passes.
    const newBowler = await prisma.user.findFirst({
      where: { id: { notIn: [striker.id, nonStriker.id, bowler.id] } },
      select: { id: true },
    });
    if (newBowler) {
      // First clear bowler so updateActivePlayers can re-set it without
      // tripping the consecutive-over guard (we just want to test the
      // retired-hurt reset, not the bowler logic).
      await prisma.cricketMatch.update({
        where: { id: match.id },
        data: { bowlerId: null },
      });

      await updateActivePlayers(match.id, {
        strikerId: striker.id,
        bowlerId: newBowler.id,
      });
      const refreshedStat = await prisma.matchPlayerStat.findFirst({
        where: { matchId: match.id, userId: striker.id },
      });
      pass(
        "retired-hurt comeback resets outStatus → NOT_OUT",
        refreshedStat.outStatus === "NOT_OUT",
        `outStatus=${refreshedStat.outStatus}`
      );
    } else {
      pass("retired-hurt comeback (skipped: no 4th user)", true);
    }

    // ── P2: OBSTRUCTING legacy spelling removed from code ─────────────
    const { default: fs } = await import("fs");
    const src = fs.readFileSync(
      new URL("../modules/scoring/scoring.service.js", import.meta.url),
      "utf8"
    );
    const stillUsesLegacy = /"OBSTRUCTING"(?!_FIELD)/.test(src);
    pass(
      'legacy "OBSTRUCTING" enum removed from scoring.service.js',
      !stillUsesLegacy
    );

    // ── Match result: chase wins by W wickets ─────────────────────────
    // Synthesize an innings 0 with 100 runs, innings 1 with 101 runs and 3 wickets down
    // in 11-a-side game.
    const fakeFirstInnings = {
      ...innings,
      inningsIndex: 0,
      totalRuns: 100,
      totalWickets: 6,
      isCompleted: true,
    };
    const fakeSecondInningsChaseWin = {
      ...innings,
      inningsIndex: 1,
      totalRuns: 101,
      totalWickets: 3,
      isCompleted: false,
      totalBalls: 100,
      battingTeam: "teamB",
    };
    const winByWicketsSnap = computeScoreSnapshot(
      {
        currentInningsIndex: 1,
        innings: [fakeFirstInnings, fakeSecondInningsChaseWin],
        playerStats: [],
        timeline: [],
        gameId: game.id,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
      },
      {
        ...game,
        maxMembers: 11,
        teamA: { name: "Tigers" },
        teamB: { name: "Lions" },
      }
    );
    pass(
      "match result: chase wins by wickets",
      winByWicketsSnap.matchResult === "Lions won by 7 wickets",
      `matchResult="${winByWicketsSnap.matchResult}"`
    );

    // ── Match result: defending wins by runs ──────────────────────────
    const fakeSecondShortfall = {
      ...innings,
      inningsIndex: 1,
      totalRuns: 76,
      totalWickets: 10,
      isCompleted: true,
      totalBalls: 100,
      battingTeam: "teamB",
    };
    const winByRunsSnap = computeScoreSnapshot(
      {
        currentInningsIndex: 1,
        innings: [fakeFirstInnings, fakeSecondShortfall],
        playerStats: [],
        timeline: [],
        gameId: game.id,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
      },
      {
        ...game,
        maxMembers: 11,
        teamA: { name: "Tigers" },
        teamB: { name: "Lions" },
      }
    );
    pass(
      "match result: defending wins by runs",
      winByRunsSnap.matchResult === "Tigers won by 24 runs",
      `matchResult="${winByRunsSnap.matchResult}"`
    );

    // ── Match result: tied ────────────────────────────────────────────
    const fakeSecondTied = {
      ...innings,
      inningsIndex: 1,
      totalRuns: 100,
      totalWickets: 10,
      isCompleted: true,
      totalBalls: 100,
      battingTeam: "teamB",
    };
    const tiedSnap = computeScoreSnapshot(
      {
        currentInningsIndex: 1,
        innings: [fakeFirstInnings, fakeSecondTied],
        playerStats: [],
        timeline: [],
        gameId: game.id,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
      },
      {
        ...game,
        maxMembers: 11,
        teamA: { name: "Tigers" },
        teamB: { name: "Lions" },
      }
    );
    pass(
      "match result: tie detected",
      tiedSnap.matchResult === "Match Tied",
      `matchResult="${tiedSnap.matchResult}"`
    );

    // ── Match result: "won by 1 run" / "won by 1 wicket" singular ─────
    const fakeSecondCloseLoss = {
      ...innings,
      inningsIndex: 1,
      totalRuns: 99,
      totalWickets: 10,
      isCompleted: true,
      totalBalls: 100,
      battingTeam: "teamB",
    };
    const closeRunsSnap = computeScoreSnapshot(
      {
        currentInningsIndex: 1,
        innings: [fakeFirstInnings, fakeSecondCloseLoss],
        playerStats: [],
        timeline: [],
        gameId: game.id,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
      },
      {
        ...game,
        maxMembers: 11,
        teamA: { name: "Tigers" },
        teamB: { name: "Lions" },
      }
    );
    pass(
      'match result: singular "1 run"',
      closeRunsSnap.matchResult === "Tigers won by 1 run"
    );

    const fakeSecondCloseWin = {
      ...innings,
      inningsIndex: 1,
      totalRuns: 101,
      totalWickets: 9,
      isCompleted: true,
      totalBalls: 119,
      battingTeam: "teamB",
    };
    const closeWicketsSnap = computeScoreSnapshot(
      {
        currentInningsIndex: 1,
        innings: [fakeFirstInnings, fakeSecondCloseWin],
        playerStats: [],
        timeline: [],
        gameId: game.id,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
      },
      {
        ...game,
        maxMembers: 11,
        teamA: { name: "Tigers" },
        teamB: { name: "Lions" },
      }
    );
    pass(
      'match result: singular "1 wicket"',
      closeWicketsSnap.matchResult === "Lions won by 1 wicket"
    );

    // ══ HOUSE-RULE TOGGLES ════════════════════════════════════════════
    // For each toggle, set the value on the live match and observe behavior.

    // 1. enforceConsecutiveOverBlock: false → allow same bowler twice.
    await prisma.cricketMatch.update({
      where: { id: match.id },
      data: { houseRules: { enforceConsecutiveOverBlock: false } },
    });
    let casualBowlerOk = true;
    try {
      // First null out bowler so the equality compare can land on the same id.
      await prisma.cricketMatch.update({
        where: { id: match.id },
        data: { bowlerId: null },
      });
      await updateActivePlayers(match.id, { bowlerId: bowler.id });
      await updateActivePlayers(match.id, { bowlerId: bowler.id });
    } catch (e) {
      casualBowlerOk = false;
    }
    pass(
      "houseRules.enforceConsecutiveOverBlock=false allows back-to-back bowler",
      casualBowlerOk
    );

    // 2. enforceFreeHit: false → BOWLED on a no-ball-next-ball is fine.
    await prisma.cricketMatch.update({
      where: { id: match.id },
      data: {
        houseRules: { enforceFreeHit: false },
        freeHitActive: false,
        bowlerId: bowler.id,
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
      },
    });
    await processScoreUpdate(match.id, {
      runs: 0,
      extraRuns: 1,
      isExtra: true,
      extraType: "NO_BALL",
      batsmanId: striker.id,
      bowlerId: bowler.id,
    });
    const afterNoBallCasual = await prisma.cricketMatch.findUnique({
      where: { id: match.id },
      select: { freeHitActive: true },
    });
    pass(
      "houseRules.enforceFreeHit=false: no-ball does NOT set freeHit",
      afterNoBallCasual.freeHitActive === false,
      `freeHit=${afterNoBallCasual.freeHitActive}`
    );

    let casualBowledOk = true;
    try {
      await processScoreUpdate(match.id, {
        runs: 0,
        isWicket: true,
        wicketType: "BOWLED",
        batsmanId: striker.id,
        bowlerId: bowler.id,
        playerOutId: striker.id,
      });
    } catch (e) {
      casualBowledOk = false;
    }
    pass(
      "houseRules.enforceFreeHit=false: BOWLED on next ball is allowed",
      casualBowledOk
    );

    // 3. wideIsLegalBall: true → wide counts toward over.
    const beforeWideCount = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    await prisma.cricketMatch.update({
      where: { id: match.id },
      data: { houseRules: { wideIsLegalBall: true } },
    });
    await processScoreUpdate(match.id, {
      runs: 0,
      extraRuns: 1,
      isExtra: true,
      extraType: "WIDE",
      batsmanId: nonStriker.id,
      bowlerId: bowler.id,
    });
    const afterWideCount = await prisma.innings.findFirst({
      where: { matchId: match.id },
    });
    pass(
      "houseRules.wideIsLegalBall=true: totalBalls incremented on wide",
      afterWideCount.totalBalls === beforeWideCount.totalBalls + 1,
      `before=${beforeWideCount.totalBalls} after=${afterWideCount.totalBalls}`
    );

    // 4. ballsPerOver: 4 → snapshot shows .4 overs after 4 balls.
    const snap4Over = computeScoreSnapshot(
      {
        currentInningsIndex: 0,
        innings: [{ ...innings, totalBalls: 4, totalRuns: 8, totalWickets: 0 }],
        playerStats: [],
        timeline: [],
        gameId: game.id,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
        houseRules: { ballsPerOver: 4 },
      },
      { ...game, maxMembers: 6, teamA: { name: "A" }, teamB: { name: "B" } }
    );
    pass(
      "houseRules.ballsPerOver=4: 4 balls = 1.0 over",
      snap4Over.overString === "1.0",
      `overString=${snap4Over.overString}`
    );

    // 5. lastManStands: true → all-out never triggers even at high wickets.
    const snapLastMan = computeScoreSnapshot(
      {
        currentInningsIndex: 0,
        innings: [
          { ...innings, totalBalls: 60, totalRuns: 80, totalWickets: 10 },
        ],
        playerStats: [],
        timeline: [],
        gameId: game.id,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
        houseRules: { lastManStands: true },
      },
      { ...game, maxMembers: 11, teamA: { name: "A" }, teamB: { name: "B" } }
    );
    pass(
      "houseRules.lastManStands=true: 10 wickets does NOT end innings",
      snapLastMan.isInningsComplete === false,
      `complete=${snapLastMan.isInningsComplete}`
    );

    // 6. penaltyEnabled: false → addPenaltyRuns rejects.
    await prisma.cricketMatch.update({
      where: { id: match.id },
      data: { houseRules: { penaltyEnabled: false } },
    });
    let penaltyBlocked = false,
      penaltyErr = null;
    try {
      await addPenaltyRuns(match.id, 5, "teamB");
    } catch (e) {
      penaltyBlocked = true;
      penaltyErr = e.meta?.code || e.message;
    }
    pass(
      "houseRules.penaltyEnabled=false: addPenaltyRuns rejected",
      penaltyBlocked && penaltyErr === "PENALTY_DISABLED",
      `code=${penaltyErr}`
    );

    // Restore default behavior for the remaining checks.
    await prisma.cricketMatch.update({
      where: { id: match.id },
      data: { houseRules: null },
    });

    // ══ HOUSE-RULES PATCH ENDPOINT AUTHZ ══════════════════════════════
    // The service is the same code paths the route uses. We invoke directly.

    // 0. Stranger (no umpire/scorer/scorer-token role) — REJECTED.
    let strangerBlocked = false,
      strangerCode = null;
    try {
      await updateHouseRules(
        match.id,
        { id: "random-user", role: "user" },
        { lastManStands: true }
      );
    } catch (e) {
      strangerBlocked = true;
      strangerCode = e.meta?.code || e.message;
    }
    pass(
      "PATCH houseRules: stranger user rejected",
      strangerBlocked && strangerCode === "FORBIDDEN_HOUSE_RULES",
      `code=${strangerCode}`
    );

    // 1. Scoring-password token (role === 'scorer') — ALLOWED even without an id matching.
    const passwordToken = { id: null, role: "scorer" };
    const res1 = await updateHouseRules(match.id, passwordToken, {
      ballsPerOver: 4,
    });
    pass(
      "PATCH houseRules: scoring-password role accepted",
      res1.houseRules?.ballsPerOver === 4,
      `houseRules=${JSON.stringify(res1.houseRules)}`
    );

    // 2. Assigned umpire — ALLOWED. Assign one then call.
    await prisma.hostedGame.update({
      where: { id: game.id },
      data: { umpireId: striker.id },
    });
    const res2 = await updateHouseRules(
      match.id,
      { id: striker.id, role: "umpire" },
      { lastManStands: true }
    );
    pass(
      "PATCH houseRules: assigned umpire accepted",
      res2.houseRules?.lastManStands === true
    );
    await prisma.hostedGame.update({
      where: { id: game.id },
      data: { umpireId: null },
    });

    // 3. Assigned scorer — ALLOWED.
    await prisma.hostedGame.update({
      where: { id: game.id },
      data: { scorerId: bowler.id },
    });
    const res3 = await updateHouseRules(
      match.id,
      { id: bowler.id, role: "user" },
      { penaltyEnabled: false }
    );
    pass(
      "PATCH houseRules: assigned scorer accepted",
      res3.houseRules?.penaltyEnabled === false
    );
    await prisma.hostedGame.update({
      where: { id: game.id },
      data: { scorerId: null },
    });

    // 4. null value clears the override.
    const res4 = await updateHouseRules(match.id, passwordToken, {
      ballsPerOver: null,
    });
    pass(
      "PATCH houseRules: null value removes the override",
      !("ballsPerOver" in (res4.houseRules || {})),
      `houseRules=${JSON.stringify(res4.houseRules)}`
    );

    // 5. Validation: ballsPerOver out of range — REJECTED.
    let boundsRejected = false,
      boundsCode = null;
    try {
      await updateHouseRules(match.id, passwordToken, { ballsPerOver: 0 });
    } catch (e) {
      boundsRejected = true;
      boundsCode = e.meta?.code || e.message;
    }
    pass(
      "PATCH houseRules: ballsPerOver=0 rejected",
      boundsRejected && boundsCode === "INVALID_BALLS_PER_OVER",
      `code=${boundsCode}`
    );

    // 6. Completed match — REJECTED.
    await prisma.cricketMatch.update({
      where: { id: match.id },
      data: { status: "COMPLETED" },
    });
    let completedBlocked = false,
      completedCode = null;
    try {
      await updateHouseRules(match.id, passwordToken, { lastManStands: false });
    } catch (e) {
      completedBlocked = true;
      completedCode = e.meta?.code || e.message;
    }
    pass(
      "PATCH houseRules: completed match rejected",
      completedBlocked && completedCode === "MATCH_ALREADY_COMPLETE",
      `code=${completedCode}`
    );
    // Unfreeze for any later checks.
    await prisma.cricketMatch.update({
      where: { id: match.id },
      data: { status: "LIVE" },
    });

    // Restore clean state.
    await prisma.cricketMatch.update({
      where: { id: match.id },
      data: { houseRules: null },
    });

    // ── advanceToNextInnings preconditions ────────────────────────────
    let preEarly = false,
      preEarlyCode = null;
    try {
      // Our test match is still in innings 0 with very few balls — should reject.
      await advanceToNextInnings(match.id, "teamB");
    } catch (e) {
      preEarly = true;
      preEarlyCode = e.meta?.code || e.message;
    }
    pass(
      "advanceToNextInnings rejects when innings 0 not complete",
      preEarly && preEarlyCode === "INNINGS_NOT_COMPLETE",
      `code=${preEarlyCode}`
    );
  } finally {
    // Cleanup only the CricketMatch we attached. Leave the borrowed HostedGame.
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
  console.error("SMOKE EXPLODED", e.stack || e.message);
  try {
    await prisma.$disconnect();
  } catch {}
  process.exit(2);
});
