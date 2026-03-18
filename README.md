# Budget Viewer

A personal finance tracker for importing Israeli bank transaction data from Excel files and analyzing spending patterns. Single-user, runs locally or on a Raspberry Pi.

## Stack

- **Frontend**: React 19 + TypeScript + Ant Design 6 (Vite)
- **Backend**: Express + TypeScript
- **Database**: SQLite via Drizzle ORM (single `data/budget.db`)
- **Testing**: Vitest
- **Components**: Storybook 10

---

## Prerequisites

- Node.js 20+
- npm 10+

---

## Local Development

```bash
# Install dependencies
npm install

# Generate DB migration (first time only)
npm run db:generate

# Start frontend (port 5173) + backend (port 3001) concurrently
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). API calls are proxied to `localhost:3001`.

---

## Tests

```bash
# Run all service tests (Vitest, no browser needed)
npm test

# Watch mode
npm run test:watch
```

---

## Storybook

```bash
npm run storybook
# Opens at http://localhost:6006
```

---

## Production Build

```bash
# Build frontend (Vite → dist/public) + backend (tsc → dist/server)
npm run build

# Run the production server (serves API + static frontend on port 3001)
npm start
```

Open [http://localhost:3001](http://localhost:3001).

---

## Docker

### Build and run the image directly

```bash
# Build
docker build -t budget-app .

# Run (mounts ./data for DB persistence)
docker run -p 3000:3001 -v "$(pwd)/data:/app/data" budget-app
```

Open [http://localhost:3000](http://localhost:3000).

### Docker Compose (recommended for Raspberry Pi / always-on)

```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

The `./data` folder is volume-mounted — `budget.db` persists across container rebuilds and restarts.

Access via `http://<host-ip>:3000` from any device on the same network.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `DATABASE_PATH` | `./data/budget.db` | Path to SQLite file |

---

## Database Migrations

Migrations live in `src/db/migrations/` and run automatically on server startup.

To generate a new migration after changing `src/db/schema.ts`:

```bash
npm run db:generate
```

---

## Project Structure

```
src/
├── shared/           # API types — imported by both client and server
│   └── types.ts
├── client/           # React frontend (Vite root)
│   ├── api/          # Typed fetch wrappers
│   ├── components/   # Reusable UI components (each has a .stories.tsx)
│   ├── contexts/     # FilterContext — global filter state synced to URL
│   ├── hooks/        # Data hooks (useAccounts, useTransactions, etc.)
│   └── pages/        # Full page compositions
├── server/           # Express backend
│   ├── routes/       # Thin route handlers
│   ├── services/     # Business logic + DB access (each has a .test.ts)
│   └── utils/        # Excel parser
└── db/
    ├── schema.ts     # Drizzle table definitions (source of truth)
    ├── index.ts      # DB connection (WAL mode, FK on, auto-migrate)
    └── migrations/   # Generated SQL migrations
```

---

## Excel Import Format

Each sheet in the uploaded file becomes one account. Hebrew column headers expected:

| Hebrew | Field |
|--------|-------|
| תאריך | Date |
| תיאור | Description |
| אמצעי תשלום | Payment method |
| קטגוריה | Category |
| פירוט | Details |
| אסמכתא | Reference |
| חובה | Expense amount |
| זכות | Income amount |
| יתרה | Running balance |

Duplicate detection: transactions with the same `date + amount + description + reference` in the same account are skipped on re-import.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/summary` | Per-account summaries (balance, income, expenses) |
| GET | `/api/transactions` | Paginated, filtered transaction list |
| GET | `/api/categories` | All categories |
| GET | `/api/reports/monthly-trend` | Income vs expenses per month |
| GET | `/api/reports/top-categories` | Top expense categories |
| GET | `/api/reports/by-month` | Monthly report table |
| GET | `/api/reports/by-year` | Yearly report table |
| GET | `/api/reports/by-category` | Category report table |
| GET | `/api/reports/month-detail` | Per-category breakdown for a month |
| GET | `/api/reports/year-detail` | Monthly breakdown for a year |
| GET | `/api/import/status` | Current DB state (account counts, latest dates) |
| POST | `/api/import/preview` | Parse Excel file, return preview (multipart `file`) |
| POST | `/api/import/execute` | Execute import (`{ fileId, filename }`) |
| DELETE | `/api/import/reset` | Clear all data |

All data endpoints accept filter query params: `accountIds`, `categoryIds`, `startDate`, `endDate`, `type`, `excludeCategories`.
