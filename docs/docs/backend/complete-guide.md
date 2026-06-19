# Kridaz Complete Guide

## Overview

Kridaz is a comprehensive platform for venue booking, live scoring, social interactions, and e‑commerce. This guide provides a deep dive into the **backend** architecture, APIs, data models, environment configuration, and deployment workflow.

---

### Architecture Diagram

```mermaid
flowchart TD
    subgraph API
        A[REST Endpoints] --> B[Auth Middleware]
        B --> C[Controllers]
        C --> D[Prisma ORM]
    end
    subgraph Services
        D --> E[PostgreSQL]
        D --> F[Redis (BullMQ)]
        D --> G[External Services]
        G --> H[Slack / Sentry]
        G --> I[Razorpay]
        G --> J[YouTube OAuth]
    end
    style API fill:#1e1e1e,color:#fff
    style Services fill:#2e2e2e,color:#fff
```

---

## Backend Modules

- **Onboarding** – Initial user flow, email verification, OTP handling.
- **Security** – JWT, refresh tokens, role‑based access control, rate limiting.
- **Recommendation Engines** – Ground‑engine, user‑engine, data pipelines.
- **Tournament Stage Builder** – Postgres schema, GraphQL‑like queries.
- **Voice Rooms** – WebRTC signalling server, media workers.
- **Ads Platform** – Dynamic ad insertion, targeting rules.

---

## API Reference (selected endpoints)

| Method | Path                  | Description                                       |
| ------ | --------------------- | ------------------------------------------------- |
| `GET`  | `/api/user/profile`   | Retrieve current user profile.                    |
| `POST` | `/api/auth/login`     | Authenticate with email/password.                 |
| `POST` | `/api/booking/create` | Create a new venue booking.                       |
| `GET`  | `/api/turf/:id`       | Get turf details, including location & amenities. |
| `POST` | `/api/wallet/topup`   | Initiate Razorpay top‑up flow.                    |
| `GET`  | `/api/reels/feed`     | Fetch personalized reels feed.                    |

Full API docs live under **/docs/api**.

---

## Environment Variables

| Variable               | Description                               |
| ---------------------- | ----------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string.             |
| `REDIS_URL`            | Redis connection for BullMQ queues.       |
| `JWT_SECRET`           | Secret for signing JWT access tokens.     |
| `REFRESH_SECRET`       | Secret for refresh tokens.                |
| `RAZORPAY_KEY_ID`      | Razorpay public key.                      |
| `RAZORPAY_KEY_SECRET`  | Razorpay secret.                          |
| `SENTRY_DSN`           | Sentry DSN for error tracking (optional). |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID.                   |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret.               |

Do **not** commit `.env` files. Use `.env.example` for reference.

---

## Deployment & Runbooks

1. **Local Development**

   ```bash
   cd /Users/prem/kridaz
   pnpm dev   # starts both client and server
   ```

   The server runs on `http://localhost:6001`, the client on `http://localhost:5174` (or next free port).

2. **Production Build**

   ```bash
   cd /Users/prem/kridaz
   pnpm run build   # builds all packages with Turbo
   ```

   Deploy the `server` package as a Node service (e.g., Docker) and serve the `client` build via a CDN or static host.

3. **CI/CD** – GitHub Actions workflow `ci.yml` runs `pnpm install`, `pnpm lint`, `pnpm test`, and `pnpm build`.

---

## Monitoring & Observability

- **Sentry** – Captures unhandled exceptions (enabled when `SENTRY_DSN` is set).
- **Redis BullMQ UI** – Access queue stats at `http://localhost:6001/queues`.
- **Prometheus Metrics** – Exported at `/metrics` (optional).

---

## Glossary

- **Turf** – Physical venue for sports/games.
- **Reel** – Short‑form video content similar to Instagram Reels.
- **BullMQ** – Queue library for background jobs.
- **Prisma** – Type‑safe ORM for PostgreSQL.

---

_This guide is automatically generated and kept in sync with the codebase. Contributions are welcome via pull‑request._
