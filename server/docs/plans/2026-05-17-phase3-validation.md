# Phase 3 Validation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Author and execute comprehensive integration tests to validate the complete lifecycle and correctness of the Kridaz Chat & Real-Time Messaging, Cricket Match Scoring, and Support Dispute Resolution domains, correcting any found schema/relation mismatches.

**Architecture:** We use a test-driven approach powered by Jest, Supertest, and Prisma. We isolate each domain's behaviors via HTTP integrations, seeding clean databases state, verifying side effects (e.g. frozen balances, stats accumulation), and ensuring clean database/Redis connection teardown.

**Tech Stack:** Jest, Supertest, Prisma Client, Redis client, Express, BullMQ.

---

### Task 1: Fix Database Schema Incompatibility in Chat Pinning and Read Tracking

**Files:**

- Modify: `server/modules/chat/chat.controller.js`
- Modify: `server/modules/chat/message.controller.js`
- Test: `server/tests/chat.test.js`

**Step 1: Write the failing test**
We will write tests in `server/tests/chat.test.js` that invoke the pin chat (`PUT /api/chat/pin`) and mark messages read (`PUT /api/chat/message/:chatId/read`) endpoints. Since the fields and operations are incompatible with Prisma models, these will fail.

```javascript
// A snippet of the failing test
const res = await request(app)
  .put("/api/chat/pin")
  .set("Authorization", `Bearer ${authToken}`)
  .send({ chatId });
expect(res.statusCode).toBe(200);
```

**Step 2: Run test to verify it fails**
Run: `pnpm test tests/chat.test.js --forceExit`
Expected: FAIL with "PrismaClientValidationError" or database parsing error because `isPinned` does not exist on model `ChatParticipant`, and relation writes inside `updateMany` are unsupported.

**Step 3: Write minimal implementation**
We will replace the incompatible `togglePinChat` and `markMessagesRead` codes.

For `togglePinChat` in `server/modules/chat/chat.controller.js`:

```javascript
<<<<
    const updatedParticipant = await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { isPinned: !participant.isPinned },
====
    const updatedParticipant = await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { pinnedAt: participant.pinnedAt ? null : new Date() },
>>>>
```

For `markMessagesRead` in `server/modules/chat/message.controller.js`:
Instead of `updateMany` with relation writes, we loop or use an update query for each unread message to link the participant:

```javascript
<<<<
    await prisma.message.updateMany({
      where: {
        chatId,
        readBy: {
          none: { id: participant.id }
        }
      },
      data: {
        readBy: {
          connect: { id: participant.id }
        }
      }
    });
====
    const unreadMessages = await prisma.message.findMany({
      where: {
        chatId,
        readBy: {
          none: { id: participant.id }
        }
      }
    });

    for (const msg of unreadMessages) {
      await prisma.message.update({
        where: { id: msg.id },
        data: {
          readBy: { connect: { id: participant.id } }
        }
      });
    }
>>>>
```

**Step 4: Run test to verify it passes**
Run: `pnpm test tests/chat.test.js --forceExit`
Expected: PASS

**Step 5: Commit**

```bash
git add server/modules/chat/chat.controller.js server/modules/chat/message.controller.js
git commit -m "fix(chat): fix database model incompatibilities in togglePin and markMessagesRead"
```

---

### Task 2: Build Chat & Real-Time Messaging Integration Suite

**Files:**

- Create: `server/tests/chat.test.js`

**Step 1: Write the failing test**
Create a full integration test covering:

- Creating 1-on-1 chat between two test users.
- Creating a group chat with custom participants.
- Sending, clearing, and pinning messages.
- Fetching messages list and media contents.

**Step 2: Run test to verify it fails**
Run: `pnpm test tests/chat.test.js --forceExit`
Expected: FAIL if test file doesn't exist yet, or fails on un-implemented logic.

**Step 3: Write minimal implementation**
Construct a robust `server/tests/chat.test.js` file importing `supertest`, cleaning up entries before/after, resolving connections, and asserting every HTTP chat router behavior.

**Step 4: Run test to verify it passes**
Run: `pnpm test tests/chat.test.js --forceExit`
Expected: PASS with 100% assertions satisfied.

**Step 5: Commit**

```bash
git add server/tests/chat.test.js
git commit -m "test(chat): add full integration test suite for chat messaging"
```

---

### Task 3: Build Cricket Match Scoring Integration Suite

**Files:**

- Create: `server/tests/scoring.test.js`

**Step 1: Write the failing test**
Create an integration test in `server/tests/scoring.test.js` that covers:

- Seeding a CricketMatch and HostedGame with participants.
- Invoking `POST /api/scoring/start` to begin scoring.
- Recording toss results via `POST /api/scoring/toss`.
- Specifying active batsman/bowler via `POST /api/scoring/set-players`.
- Sending balls with runs, wickets, and boundaries via `PUT /api/scoring/update`.
- Finalizing the scoring session via `POST /api/scoring/complete`.
- Asserting that player statistics (aggregate runs, strike rates, wickets) are successfully accumulated in stats collections.

**Step 2: Run test to verify it fails**
Run: `pnpm test tests/scoring.test.js --forceExit`
Expected: FAIL (file missing or unimplemented).

**Step 3: Write minimal implementation**
Construct `server/tests/scoring.test.js`. Mock stats/badges triggers if needed, or connect with real database records to assert total metrics increment matches expectations.

**Step 4: Run test to verify it passes**
Run: `pnpm test tests/scoring.test.js --forceExit`
Expected: PASS

**Step 5: Commit**

```bash
git add server/tests/scoring.test.js
git commit -m "test(scoring): add comprehensive cricket match live scoring integration tests"
```

---

### Task 4: Build Support Dispute Resolution Integration Suite

**Files:**

- Create: `server/tests/dispute.test.js`

**Step 1: Write the failing test**
Create an integration test in `server/tests/dispute.test.js` covering:

- Creating a booking with state `IN_REVIEW_WINDOW`.
- Invoking `POST /api/dispute/raise` to log a dispute, verifying:
  - Booking transitions to `DISPUTED`.
  - Funds are frozen from the partner profile.
- Adding user and admin replies via `POST /api/dispute/:disputeId/reply`.
- Resolving disputes via `POST /api/dispute/admin/:disputeId/resolve` with various actions (`RELEASE_TO_OWNER`, `REFUND_TO_USER`, `PARTIAL_REFUND`), confirming:
  - Wallet balances update correctly.
  - Transactions log properly.
  - In-app notification logs are preserved.

**Step 2: Run test to verify it fails**
Run: `pnpm test tests/dispute.test.js --forceExit`
Expected: FAIL.

**Step 3: Write minimal implementation**
Construct `server/tests/dispute.test.js` with complete seed, lifecycle coverage, and cleanup assertions.

**Step 4: Run test to verify it passes**
Run: `pnpm test tests/dispute.test.js --forceExit`
Expected: PASS

**Step 5: Commit**

```bash
git add server/tests/dispute.test.js
git commit -m "test(dispute): add full integration test suite for disputes and transactions"
```
