# --- Stage 1: Base Image & Corepack ---
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# --- Stage 2: Dependencies Installer ---
FROM base AS deps
# Copy all package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/common/package.json ./packages/common/
COPY packages/shared-constants/package.json ./packages/shared-constants/
COPY server/package.json ./server/

# Install all dependencies (including devDependencies needed for building types)
RUN pnpm install --frozen-lockfile

# --- Stage 3: Builder ---
FROM deps AS builder
# Copy source files
COPY packages/common ./packages/common
COPY packages/shared-constants ./packages/shared-constants
COPY server ./server

# Build the typescript dependencies (like @kridaz/common)
RUN pnpm --filter @kridaz/common build

# Generate Prisma Client
WORKDIR /app/server
RUN pnpm prisma generate

# --- Stage 4: Runner ---
FROM base AS runner
ENV NODE_ENV=production

# Install ffmpeg for media processing
RUN apk add --no-cache ffmpeg

# Copy node_modules, compiled packages, and application source code
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/server ./server

WORKDIR /app/server
USER node
EXPOSE 4000
CMD ["sh", "-c", "pnpm prisma db push --accept-data-loss && pnpm run start"]
