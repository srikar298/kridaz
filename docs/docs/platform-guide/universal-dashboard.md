# Universal Professional Dashboard

The **Universal Professional Dashboard** is a unified, role-aware dashboard folder designed to consolidate all partner-facing management tools. Coaches, Umpires, Commentators, and Scorers share the same underlying dashboard structure, customized dynamically based on their authenticated user role and permissions.

---

## 1. Architectural Consolidation

Historically, each professional category maintained a standalone dashboard layout, leading to code duplication and visual inconsistency. Kridaz consolidates these into a single **Universal Dashboard** framework.

- **Shared Layout Structure**: A common layout handles routing, headers, sidebar options, and sub-pages.
- **Role-Based Text & Accessibility**: Content adjusts conditionally (e.g., swapping labels like _"Officiating History"_ for Umpires with _"Session History"_ for Coaches).
- **Consolidated Component Directory**: All sub-pages utilize the same base UI primitives, styling tokens (pure black background, `#55DEE8` to `#BFF367` brand gradients), and responsive grid patterns.

---

## 2. Overview Page (Universal Analytics)

The **Overview Page** serves as the partner's command center. It aggregates complex telemetry and database records into clean, interactive visualizations:

### Key Metrics & Mappings

1. **Earnings Comparison**
   - **Visualization**: Dual-line or comparative bar graph.
   - **Data Source**: Fetched from the revenue ledger.
   - **Metrics**: Compares earnings from the _Previous Month_ vs. the _Current Month_, indicating percentage growth or decline.
2. **Ticket Booking Size**
   - **Visualization**: Single-value KPI card with trend indicator.
   - **Data Source**: `/api/professional/analytics/ticket-size`
   - **Metrics**: Displays the average value (in coins or cash) generated per slot transaction, helping professionals analyze pricing efficiency.
3. **Peak Booking Hours**
   - **Visualization**: Horizontal bar chart or density heatmap.
   - **Data Source**: `/api/professional/analytics/peak-hours`
   - **Metrics**: Charts customer booking density across hourly time slots, allowing partners to optimize their calendar availability for high-demand windows.

---

## 3. Bookings & Slot Management

The **Bookings Page** functions as the primary scheduling grid, translating digital time slots into active partner calendars.

- **Slot Generation Calendar**: Automatically populates available intervals based on the professional's operational hours and duration settings.
- **Visual Booking States**:
  - `AVAILABLE`: Outlined in a neutral card border; open for user selection.
  - `BOOKED`: Highlighted in a vibrant cyan-to-lime gradient.
  - `PAST`: Grayed out and disabled.
- **Interactive Customer Details Drawer**:
  - Clicking on a `BOOKED` slot pulls out a slide-over drawer or modal.
  - **Data Displayed**:
    - **Customer profile**: Name, username, profile photo, contact details (phone/email).
    - **Session details**: Scheduled date, sport type, start time, and duration.
    - **Financials**: Booking ID, payment method, advance paid, and pending balance.

---

## 4. Universal Sub-Pages Breakdown

Beyond scheduling and main analytics, the dashboard includes four standard partner sub-pages:

### 1. Customers List

- A directory of all athletes who have booked services from this professional.
- Shows booking frequency, total amount spent, and quick action buttons to initiate a chat or send invites.

### 2. Revenue & Payouts

- Financial control room tracking coin balances, pending platform settlements, and historical bank payout requests.
- Leverages secure transaction ledgers to display payout statuses (`PENDING`, `SUCCESS`, `FAILED`).

### 3. Feedback & Reviews

- Feedback grid showcasing review cards left by players.
- Displays overall rating averages and feedback text to help professionals monitor service quality.

### 4. Profile Management

- Direct interface to update operational parameters:
  - Service biography and certifications.
  - Sports covered (Multi-select: _Cricket, Football, Tennis_, etc.).
  - Standard hourly pricing rates.
  - Geographic location coordinates for map discovery.
