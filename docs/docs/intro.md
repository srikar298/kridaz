---
id: intro
slug: /
---

# Kridaz Developer Portal

Welcome to the **Kridaz Developer Portal** — the single source of truth for engineers building on and contributing to the Kridaz sports platform.

## What Is Kridaz?

Kridaz is a high-performance sports platform connecting **players**, **venue owners**, and **sports professionals**. Core capabilities include:

- 🏟️ **Turf Booking** — Real-time slot reservation with Razorpay payments
- ⚽ **Team Management** — Create teams, invite players, find opponents
- 🎮 **Hosted Games** — Organize and join community games
- 🎬 **Reels & Stories** — Short-form sports content feed
- 💬 **Live Chat** — Real-time P2P and group messaging
- 🏏 **Match Scoring** — Ball-by-ball cricket scoring engine
- 👔 **Professional Profiles** — Coaches, umpires, and trainers

---

## Repository Structure

```
kridaz/
├── client/
│   └── user/                   # Player-facing web app (Vite + React + Redux Toolkit)
├── server/                     # Express.js API (Node.js + Prisma + PostgreSQL)
│   ├── modules/                # ← Domain modules (Vertical Slice architecture)
│   ├── routes/                 # Actor hub routers (user / owner / admin)
│   ├── middleware/             # Shared middleware (auth, rate limiters, validators)
│   ├── config/                 # Server configuration (Prisma, Swagger, Redis, etc.)
│   └── utils/                  # Shared utilities (logger, metrics, QR, invoice)
├── packages/
│   ├── common/                 # Shared Zod schemas & type definitions
│   └── shared-constants/       # Unified roles, booking states, platform constants
└── docs/                       # This documentation site (Docusaurus)
```

---

## Quick Navigation

| I want to…                          | Go to                                                |
| :---------------------------------- | :--------------------------------------------------- |
| Understand the backend architecture | [Backend Architecture](/docs/backend/architecture)   |
| Onboard as a new backend developer  | [Backend Onboarding](/docs/backend/onboarding)       |
| Create or work on a module          | [Module Guide](/docs/backend/module-guide)           |
| Understand auth and rate limiting   | [Security Model](/docs/backend/security)             |
| Browse the full API reference       | [API Reference](/docs/api/kridaz-api)                |
| Understand the frontend codebase    | [Frontend Architecture](/docs/frontend/architecture) |

---

## Running Locally

```bash
# From the repo root
pnpm install
pnpm dev
```

| Service        | URL                              |
| :------------- | :------------------------------- |
| API Server     | http://localhost:6001            |
| Swagger UI     | http://localhost:6001/api/docs   |
| Health Check   | http://localhost:6001/api/health |
| This Docs Site | http://localhost:3000            |

---

## Technology Stack

| Layer                 | Technology                                   |
| :-------------------- | :------------------------------------------- |
| API Server            | Node.js 20 + Express.js                      |
| Database              | PostgreSQL via Prisma ORM                    |
| Cache / Rate Limiting | Redis (ioredis)                              |
| Payments              | Razorpay                                     |
| Real-time             | Socket.io                                    |
| Auth                  | JWT (access + refresh tokens) + Google OAuth |
| Media                 | AWS S3 + CloudFront + ffmpeg (HLS)           |
| Monitoring            | Prometheus + Winston                         |
| Error Tracking        | Sentry                                       |
| API Docs              | Swagger UI (OpenAPI 3.0)                     |
| Developer Docs        | Docusaurus (this site)                       |
