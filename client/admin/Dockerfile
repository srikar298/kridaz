# --- Stage 1: Base Image & Corepack ---
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# --- Stage 2: Dependencies Installer ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/common/package.json ./packages/common/
COPY packages/shared-constants/package.json ./packages/shared-constants/
COPY client/admin/package.json ./client/admin/
COPY client/user/package.json ./client/user/
RUN pnpm install --frozen-lockfile

# --- Stage 3: Builder ---
FROM deps AS builder
COPY packages/common ./packages/common
COPY packages/shared-constants ./packages/shared-constants
COPY client/admin ./client/admin
COPY client/user ./client/user

# Build internal dependencies
RUN pnpm --filter @kridaz/common build
RUN pnpm --filter @kridaz/shared-constants build

# Build Admin App
RUN pnpm --filter admin build

# --- Stage 4: Runner (Nginx) ---
FROM nginx:alpine AS runner
# Copy our custom Nginx config for SPAs
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf

# Copy the built artifacts
COPY --from=builder /app/client/admin/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
