# Kridaz 🏟️

Kridaz is a high-performance, sports platform connecting **players**, **venue owners**, and **sports professionals**. Core capabilities include turf booking, ball-by-ball cricket scoring, team management, real-time messaging, and short-form reels/stories.

The codebase is organized as a unified monorepo managed by **pnpm** and **Turborepo**, ensuring efficient dependency sharing, fast caching, and absolute codebase synchronicity.

---

## 🚀 Key Features

### 👤 Player Portal

- **Unified Discovery**: Advanced search and geographical filtering of turfs by location, sport, rating, and real-time slot pricing.
- **Turf Bookings**: Real-time interactive slot selection with instant payment processing via Razorpay.
- **Community Games**: Host, discover, and join local pickup games with auto-calculating slots.
- **Short-Form Media**: Dynamic Reels & Stories feed supporting interactive likes, user tagging, and high-performance video streaming.
- **Instant Messaging**: Real-time peer-to-peer and group chat for team coordination.

### 👔 Sports Professionals Hub (Coaches, Umpires, Scorers)

- **On-Demand Matchmaking**: Users can place real-time match requests to automatically recruit coaches, umpires, scorers, commentators, or streamers.
- **Professional Profiles**: High-fidelity portfolios showing ratings, certifications, pricing structures, and past match histories.
- **Scoring Engine**: Ball-by-ball interactive scoring application (specifically optimized for Cricket matches) with real-time public analytical scoreboards.

### 🏢 Venue Management Portal

- **Owner Dashboard**: Advanced analytics, revenue bookkeeping, dynamic slot pricing, and booking calendar views.
- **Slot Management**: Automated daily slot generation engine with dynamic unbooked slot counters.

### 🛡️ Platform Administration

- **Approval Queue**: Complete onboarding oversight for venue owners and registered coaches/umpires.
- **Marketing Systems**: Control active promotional landing page banners, advertisements, and video placements.

---

## 🛠 Modern Architecture & Stack

| Layer                    | Technologies                                                                   |
| :----------------------- | :----------------------------------------------------------------------------- |
| **Monorepo Manager**     | `pnpm` + `Turborepo` (Turbo)                                                   |
| **Frontend Client**      | React 18 (Vite) + Redux Toolkit + RTK Query + Tailwind CSS                     |
| **HTTP API Server**      | Node.js (Express.js) + Stateless JWT Auth (Access/Refresh Tokens)              |
| **Database**             | PostgreSQL via **Prisma ORM**                                                  |
| **Cache & Limiters**     | Redis (ioredis)                                                                |
| **Mobile Target**        | Capacitor 8 (Android) + Capgo OTA (On-Air Update Pipeline)                     |
| **Real-time Engine**     | Socket.io                                                                      |
| **Third-Party Services** | Razorpay (Escrow & Payments), Cloudflare R2 (Media Storage), Winston (Logging) |

---

## 🚦 Getting Started

Follow these step-by-step instructions to get your local development environment running.

### 1. Prerequisites

Ensure you have the following installed on your system:

- **Node.js**: v20 or later
- **pnpm**: v10.28.0 (Package Manager)
- **PostgreSQL**: Local instance or remote database URL
- **Redis**: Running local server instance

### 2. Installation & Workspace Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Prince364133/kridaz.git
   cd kridaz
   ```

2. **Install Workspace Dependencies**
   Run the installation from the root directory:
   ```bash
   pnpm install
   ```

### 3. Environment Configuration

Create a `.env` file in the `server/` directory and configure the environment variables:

```env
PORT=6001
DATABASE_URL="postgresql://user:password@localhost:5432/kridaz?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"
# Add other credentials (Razorpay, Cloudflare R2, Firebase Service Account, etc.)
```

### 4. Database Setup & Seeding

1. **Push Prisma Schema to PostgreSQL**

   ```bash
   cd server
   npx prisma db push
   ```

2. **Seed Platform Roles & Permissions**
   Apply standard tables and initial user data:
   ```bash
   pnpm --filter server run seed   # or execute specific seeds in server/scripts/
   ```

### 5. Running the Application

To boot up all client and server workspaces concurrently in development mode, run the following command from the **root directory**:

```bash
pnpm dev
```

| Service                                 | Access Link                                                                |
| :-------------------------------------- | :------------------------------------------------------------------------- |
| **Frontend Web Client**                 | [http://localhost:5174](http://localhost:5174)                             |
| **API Server**                          | [http://localhost:6001](http://localhost:6001)                             |
| **Swagger API Docs**                    | [http://localhost:6001/api/docs](http://localhost:6001/api/docs)           |
| **Local Developer Portal (Docusaurus)** | [http://localhost:3000](http://localhost:3000) (via `cd docs && pnpm dev`) |

---

## 🔒 Developer Accounts Reference

For local testing, standard accounts are pre-seeded with the universal password `36413333`.

| Persona / Role     | Common Username / Legacy ID | Password   |
| :----------------- | :-------------------------- | :--------- |
| **Player (User)**  | `user`                      | `36413333` |
| **Venue Owner**    | `saavik` / `venue owner`    | `36413333` |
| **Platform Admin** | `admin`                     | `36413333` |
| **Coach**          | `coach`                     | `36413333` |
| **Umpire**         | `umpire`                    | `36413333` |
| **Scorer**         | `scorer`                    | `36413333` |
| **Commentator**    | `commentator`               | `36413333` |
| **Streamer**       | `streamer`                  | `36413333` |

---

## 📁 Repository Structure

```
kridaz/
├── client/
│   └── user/               # React User/Partner Frontend (Vite + RTK Query)
├── server/                 # Express.js Core Backend
│   ├── config/             # Database, Redis, Helmet, Socket, and Swagger configs
│   ├── middleware/         # Shared middlewares (JWT Authentication, Zod validation)
│   ├── modules/            # Vertical slices (Auth, Booking, Scoring, Reels, etc.)
│   ├── prisma/             # Prisma schema and PostgreSQL migrations
│   └── tests/              # Jest automated integration test suites
├── packages/
│   ├── common/             # Shared typescript schemas, helpers, and types
│   └── shared-constants/   # Shared enums and platform constants
├── docs/                   # Developer documentation site (Docusaurus)
│   └── archive/            # Staged architecture and recovery guides
└── scripts/                # Development utility scripts
```
