---
sidebar_position: 8
title: Scoring Migration Plan
---

# Migration Plan: Scoring Module Service Layer Extraction

## Gold Standard Refactoring

To align the **Scoring Module** with our enterprise-grade layered architecture (just as we did for Bookings), we will extract all database interactions, transaction logic, business validations, and caching operations out of `scoring.controller.js` and place them into `scoring.service.js`.

---

## 1. Architectural Strategy

```
[scoring.routes.js]  <-- Direct Express Route mappings
        │
        ▼
[scoring.controller.js]  <-- Slim HTTP Presentation Layer
        │  (Extract req parameters, headers, user roles, payload framing)
        ▼
[scoring.service.js]     <-- Rich Business & Transactional Layer
        │  (Execute Prisma database operations, transactions, and Redis cache logic)
        ▼
[Postgres DB & Redis Cache]
```

---

## 2. Target Mapping & Extraction Plan

We will extract the following core transactional flows from `scoring.controller.js` into `scoring.service.js`:

| Route / Action                              | Controller Responsibility (Thin Layer)                                | Service Layer Responsibility (Rich Layer)                                                                                      |
| :------------------------------------------ | :-------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Go Live** (`goLive`)                      | Extract `matchId`, verify token secret, return JSON urls.             | Verify hosted game exists, sign `overlayToken`, update DB status, init Redis state.                                            |
| **End Live** (`endLive`)                    | Extract `matchId`, send JSON confirmation.                            | Update DB status (isLive: false), clear Redis overlay stream cache.                                                            |
| **Stream Config** (`updateStreamConfig`)    | Extract `matchId` & body params, return confirmation.                 | Query match, upsert `streamConfig`, update status in DB, set live Redis state.                                                 |
| **Complete Match** (`completeMatch`)        | Extract `scoringId`, return final status + `earnedBadges`.            | Retrieve cricketMatch, execute transaction to mark Match and HostedGame complete, aggregate player stats.                      |
| **Search Match** (`searchMatch`)            | Extract `shortId`, return match details.                              | Query hostedGame with host/turf relations and map Turf details.                                                                |
| **Start Scoring** (`startScoring`)          | Extract params, verify role permissions, return session data.         | Query/Create cricketMatch session, update hostedGame status.                                                                   |
| **Start Next Innings** (`startNextInnings`) | Extract body params, return updated session data.                     | Mark current innings complete, create next innings in transaction, compute scoreboard snapshot, update Redis/Socket states.    |
| **Set Toss** (`setToss`)                    | Extract params, return toss result.                                   | Update toss details in DB.                                                                                                     |
| **Set Players** (`setPlayers`)              | Extract params, check consecutive bowler guard, return updated state. | Update striker/non-striker/bowler in cricketMatch.                                                                             |
| **Undo Last Ball** (`undoLastBall`)         | Extract `scoringId`, return updated session data.                     | Delete ball from timeline, decrement runs/balls/wickets/extras in transaction.                                                 |
| **Update Score** (`updateScore`)            | Extract body params, return live scoreboard data.                     | Record ball record, update innings totals, upsert batter/bowler match stats, execute rotation, save snapshot to Redis/Sockets. |
| **Get Status** (`getMatchStatus`)           | Extract `matchId`, return snapshot JSON.                              | Query match status with player details, fall back to hosted game lookup.                                                       |
| **Get Analytics** (`getMatchAnalytics`)     | Extract `matchId`, return calculated MVP/analytics.                   | Fetch match data with user relations, perform calculation for MVP points & boundaries.                                         |
| **Get Live Score** (`getLiveScore`)         | Extract `matchId`, return live scoreboard snapshot.                   | Check Redis live score cache, fall back to DB lookup, build snapshot, update Redis cache.                                      |

---

## 3. Detailed Execution Phases

### Phase 1: Setup & Initialization

- Review current imports in `scoring.service.js`. Add dependencies (`prisma`, `jwt`, `logger`, `liveStateService`, `getIO`, constants).
- Keep existing `aggregatePlayerStats` and `checkAndAwardBadges` fully untouched.

### Phase 2: Implement Service Layer Actions

Write the high-performance transaction functions inside `scoring.service.js`. Wrap database exceptions inside logical errors with `statusCode` attachments to preserve precise routing feedback.

### Phase 3: Slim Down Controller

Re-route all controller functions to call their respective service functions. Clean up extensive try-catch blocks into structured, elegant async middleware catchers.

### Phase 4: Verification & Validation

Run `pnpm test tests/scoring.test.js` to ensure all 10 integration and unit tests pass with zero regression.
