# Umpire Performance Analytics

The **Umpire Performance Analytics Dashboard** is a premium, data-rich monitoring panel built to give certified officials a futuristic overview of their performance metrics, accuracy rates, and tournament history.

Designed with a high-end sports-tech aesthetic, the interface utilizes a dark theme backdrop with vibrant neon cyan, lime green, and soft blue glows to highlight critical data points.

![Umpire Analytics Mockup](/img/platform/umpire_analytics_mockup.png)

---

## Dashboard Components

The screen organizes complex sports statistics into separate glassmorphic cards to maintain high focus hierarchy:

### 1. Top Header & Control Bar

- **Umpire Identity Header**: Displays the official's name ("Jonathan Reed - Senior Umpire"), ranking profile, and certification badge.
- **Controls & Filters**:
  - **Role Selector**: Dropdown to switch perspective (e.g., _Head Umpire_, _TV Umpire_, _Leg Umpire_).
  - **Date Range Selector**: Dropdown to filter performance by season or month (e.g., _Jan-Aug 2023_).
  - **Export Report Button**: Trigger to generate and download comprehensive PDF/CSV analytics sheets.

### 2. KPI Statistic Cards

A row of compact, glowing statistics cards displaying key performance metrics:

- **Total Matches Officiated**: Cumulative match count (e.g., `114 Matches`) accompanied by a mini trend graph.
- **Decision Accuracy %**: The umpire's core efficiency score (e.g., `96.8%`) highlighted in glowing neon cyan.
- **Total Tournaments**: Number of unique multi-team events officiated.
- **Correct Decisions**: Raw success counts (e.g., `4,870` correct calls).
- **Completion Rate**: Match officiating attendance and protocol compliance percentage.
- **Sports Covered**: Badges showing active sports categories (e.g., _Cricket, Football, Tennis_).

### 3. Matches Trend Chart

- An interactive line chart tracking month-over-month match officiating activity.
- Uses neon cyan data points and smooth curves over a dark grid, with hover tooltip effects displaying match counts for each month.

### 4. Decision Accuracy Donut Chart

- A circular radial representation of decision outcomes.
- Segregates calls into:
  - **Accurate Decisions** (`98.8%` in neon cyan).
  - **Incorrect / Overturned Decisions** (`1.2%` in warning red).
- Center of the donut features the cumulative accuracy percentage in large typography.

### 5. Results Contribution Chart

- High-contrast circular progress visualization showing the outcomes of matches where this umpire officiated:
  - **Match Wins** (`45%` in blue).
  - **Match Draws** (`35%` in cyan).
  - **Correct Decisions** (`92%` in lime green).

### 6. Performance by Sport

- Vertical progress bars tracking accuracy index broken down by match formats:
  - **LBW Decisions** (`97%` accuracy).
  - **Stumping** (`98%` accuracy).
  - **No Ball Calls** (`95%` accuracy).
  - **DLS Application** (`96%` accuracy).

### 7. Match History Ledger

A clean, professional data table displaying recent matches officiated:

- **Date**: The calendar day of the match.
- **Match Name**: Teams involved (e.g., _India vs England_).
- **Sport**: General category (_Cricket_, _Rugby_).
- **Venue**: Stadium name (_Lord's_, _MCG_).
- **Role**: Active role during play (_TV Umpire_, _Head Umpire_).
- **Accuracy**: Session-specific calculation.
- **Rating**: Star-rating out of five, using glowing yellow stars.

### 8. Milestone Achievements

Glowing milestone cards representing achievements unlocked by the official:

- 🏅 **100+ Matches**: Awarded for long-term consistency.
- ⭐ **Top Rated Umpire**: Awarded for maintaining an average rating > 4.8.
- 🎯 **High Accuracy**: Unlocked by keeping decision accuracy above 96%.
- 🏆 **Tournament Expert**: Awarded for officiating in 5+ tournament grand finals.

---

## Technical Recommendations

### Frontend implementation

For developers looking to integrate this dashboard in the `client` user panel, the following library configuration is recommended:

```javascript
// Example configurations using Recharts (React)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const MatchesTrend = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <XAxis dataKey="month" stroke="#555" />
      <YAxis stroke="#555" />
      <Tooltip
        contentStyle={{ backgroundColor: "#121212", borderColor: "#2A2A2A" }}
      />
      <Line
        type="monotone"
        dataKey="matches"
        stroke="#55DEE8"
        strokeWidth={3}
        dot={{ fill: "#55DEE8", r: 4 }}
        activeDot={{ r: 6, fill: "#BFF367" }}
      />
    </LineChart>
  </ResponsiveContainer>
);
```

### Styling Tokens

Maintain dashboard aesthetics using these design parameters:

- **Backgrounds**: Deep blacks and midnight navy (`#000000` / `#0D0F12`).
- **Glow Accents**: Box shadows using rgba values of theme colors: `box-shadow: 0 0 20px rgba(85, 222, 232, 0.15)`.
- **Card Borders**: Semi-transparent border rules (`border: 1px solid rgba(255, 255, 255, 0.08)`) with `backdrop-filter: blur(20px)` for the premium glassmorphism effect.
