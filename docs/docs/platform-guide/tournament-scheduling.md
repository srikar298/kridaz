---
id: tournament-scheduling
title: Tournament Scheduling Engine
sidebar_position: 18
---

# Tournament Scheduling & Knockouts

The KRIDAZ platform includes a sophisticated, robust Tournament Scheduling Engine that powers the generation of group stage matches, standing calculations (including Net Run Rate), and knockout stage pairings.

## 1. Group Stage Auto-Scheduler

The engine uses a **Round-Robin algorithm** to generate a complete list of matches within each pool without overlaps.

### Daily Slots Distribution
Organizers define their available **time slots per day** (e.g., `09:00`, `14:00`, `18:00`). 
The algorithm calculates the total required matches ($N(N-1)/2$ per pool) and sequentially fills the available time slots starting from the defined Start Date. Once all daily slots are exhausted, it rolls over to the next day.

### Edge Case: Uneven Pools (Byes)
If a pool has an odd number of teams (e.g., 5 teams), the algorithm automatically injects a dummy "BYE" team. Any team paired with the BYE team gets a rest day, ensuring an even distribution of matches without breaking the round-robin loop.

---

## 2. Dynamic Standings & Net Run Rate (NRR)

Standings are strictly calculated from **completed** `CricketMatch` data linked to `HostedGame` tournament records. 

### Points System
- **Win:** 2 points
- **Tie/Draw/No Result:** 1 point
- **Loss:** 0 points

### Net Run Rate (NRR) Calculation
NRR is defined mathematically as:
> `(Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)`

*Note on Overs:* In cricket math, `19.3` overs is `19.5` (since 3 balls = 0.5 overs). The scoring app inherently handles this conversion before pushing stats to the scheduler.

### Edge Case: Tie-Breakers
If two teams finish the group stage with identical points, **NRR** acts as the primary tie-breaker. If NRR is also identical, teams are sorted alphabetically (or by head-to-head records in future iterations).

---

## 3. Knockout Match Generator

Once the group stages conclude, organizers can schedule Quarter Finals, Semi-Finals, and Finals.

### Manual Override (Drag-and-Drop)
The platform offers a manual override via a drag-and-drop UI:
1. Organizers view a ranked list of "Qualified Teams" from all pools.
2. They drag "Team A" and "Team B" into a Match Slot.
3. This creates a `HostedGame` with the `tournamentStage` explicitly set to `SEMI_FINAL` or `FINAL`.

### Number of Winners Configuration
During tournament creation (Step 2 of the Wizard), organizers specify the **Number of Winners** (e.g., Top 3). This helps the system determine if a "3rd Place Playoff" match is required after the semi-finals.

---

## Troubleshooting & API References

- **Auto-Schedule Endpoint:** `POST /api/tournament/:id/schedule/auto`
- **Standings Endpoint:** `GET /api/tournament/:id/standings`
- **Manual Schedule Endpoint:** `POST /api/tournament/:id/schedule/manual`

**Missing Scoring Data:**
If a match is washed out or abandoned without a ball being bowled, the match is scored manually by the admin as a `DRAW`, awarding 1 point to each team without affecting the NRR divisors.
