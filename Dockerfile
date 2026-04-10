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
# Runs the full test suite. Used by CI on native amd64 before the ARM build.
FROM base AS test

COPY . .
RUN npm test

# ── Stage 3: app ──────────────────────────────────────────────────────────────
# Builds the production bundle. Derives from base (not test) so the ARM build
# can skip the test stage — tests are gated by the separate CI test job.
FROM base AS app

# Split frontend and server builds to reduce peak memory usage on low-RAM hosts
ARG BUILD_MEMORY_MB

COPY . .
RUN if [ -n "$BUILD_MEMORY_MB" ]; then export NODE_OPTIONS="--max-old-space-size=$BUILD_MEMORY_MB"; fi \
    && npx vite build
RUN npx tsc -p tsconfig.server.json && cp -r src/db/migrations dist/db/migrations

# ── Stage 4: runtime ──────────────────────────────────────────────────────────
# Lean production image — no devDependencies, no build toolchain.
# better-sqlite3 requires native bindings, so we still need build tools at
# install time but they are confined to this stage.
FROM node:20-alpine AS runtime

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=app /app/dist ./dist

RUN mkdir -p /app/data

EXPOSE 3001

ENV PORT=3001
ENV DATA_DIR=/app/data

CMD ["node", "dist/server/index.js"]
