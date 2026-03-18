FROM node:20-alpine

# Build deps for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build frontend (Vite) then backend (tsc)
RUN npm run build

RUN mkdir -p /app/data

EXPOSE 3001

ENV PORT=3001
ENV DATABASE_PATH=/app/data/budget.db

CMD ["node", "dist/server/index.js"]
