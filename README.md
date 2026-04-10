# Budget Viewer

A personal finance tracker for importing Israeli bank transaction data from Excel files and analyzing spending patterns. Single-user, runs locally or on a Raspberry Pi.

## Stack

- **Frontend**: React 19 + TypeScript + Ant Design 6 (Vite)
- **Backend**: Express + TypeScript
- **Database**: SQLite via Drizzle ORM (single `data/budget.db`)
- **Testing**: Vitest
- **Components**: Storybook 10

---

## Quick Start (Docker Compose)

```bash
git clone https://github.com/go-dima/budget-app.git
cd budget-app
docker compose up -d --build
```

Open **http://localhost:3000**. The database is stored in `./data/budget.db` on the host and persists across rebuilds and restarts.

---

## Docker

The Dockerfile uses a three-stage build:

| Stage  | What it does |
|--------|--------------|
| `base` | Installs all npm dependencies (includes native build tools for `better-sqlite3`) |
| `test` | Copies source and runs `npm test` — a failing test aborts the build |
| `app`  | Runs `npm run build` and sets the production entrypoint |

The `app` stage inherits from `test`, so the production image is only built if all tests pass.

### Build the image

```bash
docker build -t budget-app .
```

### Run tests only (without producing a full image)

```bash
docker build --target test -t budget-app:test .
```

### Run a one-off container (no Compose)

```bash
mkdir -p data
docker run -d \
  --name budget-app \
  -p 3000:3001 \
  -v "$(pwd)/data:/app/data" \
  -e DATA_DIR=/app/data \
  --restart unless-stopped \
  budget-app
```

### Docker Compose (recommended for always-on / Raspberry Pi)

`docker-compose.yml` is included in the repo:

```yaml
services:
  budget-app:
    build: .
    ports:
      - "3000:3001"
    volumes:
      - ./data:/app/data
    environment:
      - DATA_DIR=/app/data
    restart: unless-stopped
```

```bash
# Start (rebuild if anything changed)
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down

# Stop and wipe the database (irreversible)
docker compose down -v
```

---

## Raspberry Pi Setup

```bash
# On the Pi (arm64 or armv7)
git clone https://github.com/go-dima/budget-app.git
cd budget-app
docker compose up -d --build
```

Access from any device on the same network: `http://<pi-ip>:3000`

For remote access, use [Tailscale](https://tailscale.com) or a [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) — never expose the port directly to the internet.

---

## Environment Variables

| Variable   | Default  | Description                                                     |
|------------|----------|-----------------------------------------------------------------|
| `PORT`     | `3001`   | Port the Express server listens on                              |
| `DATA_DIR` | `./data` | Directory where all `.db` files and `.active-db` pointer live  |

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+

```bash
npm install

# Start frontend (port 5173) + backend (port 3001) concurrently
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). API calls are proxied to `localhost:3001`.

### Tests

```bash
npm test             # Run all Vitest tests once
npm run test:watch   # Watch mode
```

### Storybook

```bash
npm run storybook    # Opens at http://localhost:6006
```

### Production build (without Docker)

```bash
npm run build   # Vite → dist/public, tsc → dist/server
npm start       # Serves API + static frontend on port 3001
```

---

## Database Migrations

Migrations live in `src/db/migrations/` and run automatically on server startup.

To generate a new migration after editing `src/db/schema.ts`:

```bash
npm run db:generate   # Creates a new SQL file in src/db/migrations/
npm run db:migrate    # Applies pending migrations (runs automatically on startup too)
```

---

## Project Structure

```
src/
├── shared/           # API types — imported by both client and server
│   ├── types.ts      # All request/response types, enums, constants
│   └── utils.ts      # Shared utilities (e.g. date comparators)
├── client/           # React frontend (Vite root)
│   ├── httpClient/   # Typed fetch wrappers (client.ts)
│   ├── components/   # Reusable UI components (each has a .stories.tsx)
│   ├── contexts/     # FilterContext — global filter state synced to URL
│   ├── hooks/        # Data hooks (useAccounts, useTransactions, useImportFlow, …)
│   └── pages/        # Full page compositions
├── server/           # Express backend
│   ├── routes/       # Thin route handlers (validate → delegate → respond)
│   ├── services/     # Business logic + DB access (each has a .test.ts)
│   └── utils/        # Excel parser
└── db/
    ├── schema.ts     # Drizzle table definitions (source of truth)
    ├── index.ts      # DB connection (WAL mode, FK on, auto-migrate)
    └── migrations/   # Generated SQL migrations
```

See `AGENTS.md` for the full architecture spec and coding conventions.

---

## Excel Import Format

Each sheet in the uploaded file becomes one account. Standard Hebrew column headers are recognized automatically:

| Hebrew       | Field          |
|--------------|----------------|
| תאריך        | Date           |
| תיאור        | Description    |
| אמצעי תשלום | Payment method |
| קטגוריה     | Category       |
| פירוט        | Details        |
| אסמכתא      | Reference      |
| חובה         | Expense amount |
| זכות         | Income amount  |
| יתרה         | Running balance|

Non-standard column names are handled via the **Column Mapping** step — mappings are saved per account and pre-filled on future imports.

Duplicate detection: transactions with the same `date + amount + description + reference` in the same account are skipped on re-import.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/summary` | Per-account summaries with optional filters |
| GET | `/api/transactions` | Paginated, filtered transaction list |
| POST | `/api/transactions/bulk-categorize` | Set category on multiple transactions |
| POST | `/api/transactions/bulk-payment-method` | Set payment method on multiple transactions |
| POST | `/api/transactions/bulk-delete` | Delete multiple transactions |
| GET | `/api/categories` | All categories |
| PATCH | `/api/categories/:id/exclude` | Toggle default exclusion for a category |
| GET | `/api/reports/monthly-trend` | Income vs expenses per month |
| GET | `/api/reports/top-categories` | Top expense categories |
| GET | `/api/reports/by-month` | Monthly report table |
| GET | `/api/reports/by-year` | Yearly report table |
| GET | `/api/reports/by-category` | Category breakdown table |
| GET | `/api/reports/month-detail` | Per-category breakdown for one month |
| GET | `/api/reports/year-detail` | Monthly breakdown for one year |
| GET | `/api/import/status` | Current DB state (account counts, latest dates) |
| POST | `/api/import/preview` | Parse Excel file, return preview (multipart `file`) |
| POST | `/api/import/execute` | Execute import |
| DELETE | `/api/import/reset` | Clear all data |
| GET | `/api/category-mapping` | All description→category mappings |
| POST | `/api/category-mapping/recalculate` | Apply mappings to all uncategorized transactions |
| GET | `/api/payment-mapping` | All description→payment method mappings |
| POST | `/api/payment-mapping/recalculate` | Apply mappings to transactions with no payment method |
| GET | `/api/column-mapping/:account` | Stored column mapping for an account |
| POST | `/api/column-mapping/:account` | Save column mapping for an account |
| GET | `/api/databases` | List all databases |
| POST | `/api/databases` | Create a new database |
| POST | `/api/databases/switch` | Switch to a different database |
| PATCH | `/api/databases/:filename` | Rename a database |
| DELETE | `/api/databases/:filename` | Delete a database |

Transaction list filters (`GET /api/transactions` and most report endpoints):
`accountIds`, `categoryIds`, `excludeCategories`, `startDate`, `endDate`, `type`, `search`, `paymentMethods`, `amountMin`, `amountMax`, `sortBy`, `sortOrder`, `page`, `pageSize`
