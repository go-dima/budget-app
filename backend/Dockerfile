FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (will compile native modules for Linux)
RUN npm ci

# Copy source (excluding node_modules via .dockerignore)
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["node", "dist/index.js"]
