# Global Leaderboard & Player Ranking

The **Global Leaderboard** is the competitive arena of Kridaz. It lists the highest-ranked athletes and teams across the platform. Ranking calculations are updated in real-time based on tournament performances, player matches, and specific metrics (like goals, runs, MVPs, and fair play indexes).

![Leaderboard Mockup](/img/platform/leaderboard_mockup.png)

## Functional Definition

1. **Multi-Category Leaderboard:** Toggleable tables to view rankings by individual players, teams, or specific sports categories.
2. **Weekly / All-Time Rankings:** Filter ranks dynamically to view short-term tournament charts or historical career performance.
3. **League Tiers:** Classifies users into competitive tiers based on accumulated performance points (XP):
   - **BEGINNER:** Entry-level tier for new players.
   - **PRO:** Active athletes with consistent matches.
   - **ELITE:** Top 10% of players demonstrating exceptional match results.
   - **LEGEND:** The absolute peak tier reserved for local champions and MVPs.
4. **Interactive Rows:** Clicking a row slide-opens a player's brief stats card, showing their recent match results and allowing users to challenge them.

---

## Key Components & Implementation

The leaderboard dashboard is implemented using the following files:

### 1. `Leaderboard.jsx`

- **Path:** [Leaderboard.jsx](file:///Users/prem/kridaz/client/user/src/features/leaderboard/pages/Leaderboard.jsx)
- **Functionality:** Handles sorting options, sports selection filters, paginated table lists, and triggers active tier tag allocations.
- **Key Code Snippet:**
  ```javascript
  // Fetch leaderboard standings with filter parameters
  const loadLeaderboardStandings = async () => {
    try {
      setLoading(true);
      const queryParams = `?sport=${selectedSport}&timeframe=${selectedTimeframe}&page=${currentPage}`;
      const response = await axiosInstance.get(
        `/api/leaderboard/standings${queryParams}`
      );
      setStandings(response.data.standings);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      toast.error("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };
  ```

### 2. `SidebarIcon.jsx`

- **Path:** [SidebarIcon.jsx](file:///Users/prem/kridaz/client/user/src/features/leaderboard/components/SidebarIcon.jsx)
- **Functionality:** Renders a glowing leaderboard badge in navigation menus when special league tournaments are active.

---

## Tier Calculation Logic

Tiers are calculated dynamically based on a user's total competitive XP:

| Tier         | XP Range Required | Accent Color | Hex Code  |
| :----------- | :---------------- | :----------- | :-------- |
| **BEGINNER** | `0 - 999 XP`      | Neutral Gray | `#9CA3AF` |
| **PRO**      | `1000 - 4999 XP`  | Royal Blue   | `#3B82F6` |
| **ELITE**    | `5000 - 9999 XP`  | Neon Cyan    | `#55DEE8` |
| **LEGEND**   | `10000+ XP`       | Lime Green   | `#BFF367` |

- **XP Accrual:** Players gain `+100 XP` for a win, `+20 XP` for a draw, and `+50 XP` for earning the MVP (Most Valuable Player) award.
- **Fair Play Modifier:** A fair play rating below 4.0 stars applies a `0.8x` multiplier to all weekly XP gains.

---

## Styling & Design Integration

- **Podium Cards:** The top three ranked players are displayed on visual podium cards at the head of the page with glowing borders:
  - **1st Place:** Lime Green (`#BFF367`) border glow.
  - **2nd Place:** Neon Cyan (`#55DEE8`) border glow.
  - **3rd Place:** Electric Blue (`#3B82F6`) border glow.
- **Table Rows:** Rows use glassmorphism containers (`rgba(22, 22, 22, 0.7)` with `backdrop-filter: blur(8px)`) with subtle hover highlight offsets.
- **Typography:** Clean tabular figures are styled with monospaced tracking to prevent number alignment shifts on sorting updates.
