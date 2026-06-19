# Backend Onboarding

Welcome to the Kridaz Backend team! This guide will help you get your local environment running and understand our development workflow.

## Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: Our preferred package manager
- **PostgreSQL**: Local or remote instance
- **Redis**: Required for rate limiting and caching

## Getting Started

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/kridaz/kridaz.git
   cd kridaz
   ```
2. **Install Dependencies**:
   ```bash
   pnpm install
   ```
3. **Environment Setup**:
   Copy `.env.example` to `.env` in the `server` directory and fill in your credentials.
4. **Initialize Database**:
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```
5. **Run in Development**:
   ```bash
   # From root
   pnpm dev
   ```

## Essential Commands

- `pnpm dev`: Start all apps (client + server).
- `pnpm run server:dev`: Start only the backend with nodemon.
- `pnpm run prisma:studio`: Open the GUI for the database.

## Your First Week

- **Day 1**: Set up your environment and run a health check (`GET /api/health`).
- **Day 2**: Explore the `server/modules/` directory. Understand how the [Vertical Slice architecture](./architecture) works.
- **Day 3**: Try adding a dummy endpoint to the `booking` module.
- **Day 4**: Review our [Security & Rate Limiting](./security) standards.
- **Day 5**: Check the [API Reference](/docs/api/kridaz-api) and run a smoke test.

## Getting Help

- Check the `README.md` in each module.
- Use our internal Slack channel `#kridaz-backend`.
- Refer to the "Project Bible" (this site) before asking.
