# ── Stage 1: base ────────────────────────────────────────────────────────────
# Installs all dependencies (including dev) and build tools needed for
# better-sqlite3's native module. Both the test and app stages derive from here.
FROM node:20-alpine AS base

# Native build tools required for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ── Stage 2: test ─────────────────────────────────────────────────────────────
# Runs the full test suite. The app stage depends on this stage, so a failing
# test prevents the production image from being built.
FROM base AS test

COPY . .
RUN npm test

# ── Stage 3: app ──────────────────────────────────────────────────────────────
# Builds the production bundle and produces the final runnable image.
# Inherits from `test` so tests must pass before this stage is reached.
FROM test AS app

RUN npm run build

RUN mkdir -p /app/data

EXPOSE 3001

ENV PORT=3001
ENV DATA_DIR=/app/data

CMD ["node", "dist/server/index.js"]
