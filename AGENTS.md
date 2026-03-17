# Budget Viewer — Technical Spec (AGENTS.md)

## Overview

A personal budget/finance viewer for Israeli bank transaction data. Single-user app running on a Raspberry Pi or dedicated machine via Docker, accessed from multiple devices via web browser. Data lives in a local SQLite file.

**Source repo**: `https://github.com/go-dima/budget-app`
**App spec**: See `APP_SPEC.md` for overview, then `specs/` for per-page specs:
- `specs/APP_LAYOUT.md` — Navigation bar, filter sidebar, responsive shell
- `specs/IMPORT_PAGE.md` — Import & bootstrap workflow
- `specs/ACCOUNTS_PAGE.md` — Dashboard / home page
- `specs/TRANSACTIONS_PAGE.md` — Transaction list
- `specs/REPORTS_PAGE.md` — Aggregated reports
**Tech debt**: See `TECH_DEBT.md` for future improvements under consideration.

---

## Agent Roles

### Implementor Agent

You are building the Budget Viewer app. Follow these rules strictly:

1. **Read the relevant page spec first** (`specs/*.md`) before writing any feature code. Your implementation must match the described workflows, components, API endpoints, and behaviors exactly.
2. **Follow the layered architecture** defined in this file. Every file must live in its designated layer folder.
3. **Shared types are the contract**: All API request/response types live in `src/shared/types.ts`. Both client and server import from there. Never duplicate types.
4. **Components are dumb**: They receive data via props and emit callbacks. No API calls or data fetching inside `components/`.
5. **Services own all logic**: Routes validate input and delegate to services. If you're writing an `if` statement in a route handler, it belongs in a service.
6. **Every service gets a test file**. Write the test alongside the implementation — not after.
7. **Every reusable component gets a Storybook story**. No exceptions.
8. **Money is always agorot (integers)**. Convert to display format only via `AmountDisplay`.
9. **Use Ant Design components**. Don't build custom UI for things Ant already provides (tables, cards, selects, date pickers, etc.).
10. **When in doubt, keep it simple**. This is a personal app. Prefer fewer abstractions over clever patterns.

### Supervisor Agent

You are reviewing code for the Budget Viewer app. Your job is to validate that implementations match both specs. For every piece of code, check:

**Architecture compliance**:
- [ ] File is in the correct layer folder per the project structure below.
- [ ] Dependencies flow downward only: pages → hooks → api | components → (props only). Services → db. Routes → services.
- [ ] No cross-layer violations (e.g., component importing from `server/`, route importing from `client/`).
- [ ] No API calls or data fetching inside `components/` — only in `hooks/` or `pages/`.

**Type safety**:
- [ ] All API request/response types come from `src/shared/types.ts`. No duplicates in client or server.
- [ ] Route handlers validate input before passing to services.
- [ ] Shared types match the Drizzle schema — if schema changes, shared types are updated.

**Spec conformance** (check against `APP_SPEC.md` and relevant `specs/*.md`):
- [ ] Feature behavior matches the described workflow (import flow, filtering, sorting, etc.).
- [ ] Pages match the defined routes and content.
- [ ] Cross-app filters are respected on all applicable pages.
- [ ] Currency is stored as agorot, displayed via `AmountDisplay`.
- [ ] Duplicate detection on import uses: date + amount + description + reference.

**Code quality**:
- [ ] Services have corresponding `.test.ts` files with meaningful test cases.
- [ ] Reusable components in `components/` have `.stories.tsx` files.
- [ ] Route handlers are thin — validate input, call service, return result. No business logic.
- [ ] No `localStorage` / `sessionStorage` usage.
- [ ] No floating-point money arithmetic anywhere.

**Report format**: For each violation, state the file, the rule broken, and the fix. Be specific — quote the offending line or pattern.

---

## Architecture

### Stack

| Layer       | Technology                  | Notes                                        |
|-------------|-----------------------------|----------------------------------------------|
| Frontend    | React 19 + TypeScript (Vite)| Existing — keep                              |
| UI Library  | Ant Design 6                | Existing — keep                              |
| Backend     | Express + TypeScript        | Existing — keep                              |
| API Layer   | REST                        | Existing — keep. Shared types via `src/shared/` |
| Database    | better-sqlite3              | Existing — keep                              |
| ORM         | Drizzle ORM                 | Type-safe queries, lightweight migrations    |
| Testing     | Vitest                      | Existing — keep, expand to services          |
| Components  | Storybook                   | Existing — keep                              |

### Migration from current state

The existing repo has `backend/` and `frontend/` as separate folders with Docker. We are consolidating into a **single-package monolith** with shared types. Key changes:

1. **Keep Docker** — deploy via `docker-compose` for easy management on the Pi.
2. **Drop `backend-python/`** — legacy, no longer needed.
3. **Keep Express + REST** — no framework changes. Add shared type definitions in `src/shared/` so client and server use the same types.
4. **Single SQLite file** (`budget.db`) with multiple tables. No migration from old multi-file DBs — data can be re-imported fresh via Excel.
5. **Merge FE and BE into one project** — shared `tsconfig`, single `package.json`, one deploy unit.

---

## Project Structure (Layered)

```
budget-app/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── vite.config.ts
├── Dockerfile
├── docker-compose.yml
├── .storybook/               # Storybook config
│
├── src/
│   ├── shared/               # ── SHARED TYPES (FE + BE) ────────────
│   │   └── types.ts          # API request/response types, enums, constants
│   │
│   ├── client/               # ── FRONTEND ──────────────────────────
│   │   ├── main.tsx          # App entry point
│   │   ├── App.tsx           # Root component, routing, filter provider
│   │   │
│   │   ├── components/       # LAYER: Reusable UI components
│   │   │   ├── AppLayout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   └── AppLayout.stories.tsx
│   │   │   ├── NavBar/
│   │   │   │   ├── NavBar.tsx
│   │   │   │   └── NavBar.stories.tsx
│   │   │   ├── FilterSidebar/
│   │   │   │   ├── FilterSidebar.tsx
│   │   │   │   └── FilterSidebar.stories.tsx
│   │   │   ├── TransactionTable/
│   │   │   │   ├── TransactionTable.tsx
│   │   │   │   ├── TransactionTable.stories.tsx
│   │   │   │   └── TransactionTable.test.tsx
│   │   │   ├── AccountCard/
│   │   │   │   ├── AccountCard.tsx
│   │   │   │   └── AccountCard.stories.tsx
│   │   │   ├── AmountDisplay/
│   │   │   ├── ImportPreview/
│   │   │   ├── ImportSummary/
│   │   │   ├── MonthlyTrendChart/
│   │   │   └── CategoryBreakdownChart/
│   │   │
│   │   ├── hooks/            # LAYER: Custom React hooks
│   │   │   ├── useTransactions.ts
│   │   │   ├── useAccounts.ts
│   │   │   ├── useReports.ts
│   │   │   ├── useCategories.ts
│   │   │   └── useFilters.ts # Reads/writes global filter context
│   │   │
│   │   ├── pages/            # LAYER: Full page compositions
│   │   │   ├── AccountsPage.tsx
│   │   │   ├── TransactionsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── ImportPage.tsx
│   │   │
│   │   ├── api/              # LAYER: API client
│   │   │   └── client.ts     # Typed fetch wrappers for each REST endpoint
│   │   │
│   │   └── contexts/         # Cross-app state
│   │       └── FilterContext.tsx  # Global filter state
│   │
│   ├── server/               # ── BACKEND ───────────────────────────
│   │   ├── index.ts          # Express entry point, serves API + static files
│   │   │
│   │   ├── routes/           # Express route handlers (thin — validate, delegate, respond)
│   │   │   ├── index.ts      # Mounts all route groups
│   │   │   ├── transactions.ts
│   │   │   ├── accounts.ts
│   │   │   ├── reports.ts
│   │   │   ├── categories.ts
│   │   │   └── import.ts
│   │   │
│   │   └── services/         # LAYER: Core business logic + DB access
│   │       ├── TransactionService.ts
│   │       ├── TransactionService.test.ts
│   │       ├── AccountService.ts
│   │       ├── AccountService.test.ts
│   │       ├── ReportService.ts
│   │       ├── ReportService.test.ts
│   │       ├── ImportService.ts
│   │       ├── ImportService.test.ts
│   │       └── CategoryService.ts
│   │
│   └── db/                   # ── SHARED DB LAYER ───────────────────
│       ├── index.ts          # DB connection (better-sqlite3 instance)
│       ├── schema.ts         # Drizzle table definitions (source of truth for DB types)
│       └── migrations/       # Generated by drizzle-kit
│
├── data/
│   └── budget.db             # SQLite file (gitignored, volume-mounted in Docker)
│
└── scripts/
    └── seed.ts               # Optional dev seed data
```

---

## Layer Responsibilities

### 1. `components/` — Reusable UI elements

- Self-contained, presentational. Receive data via props, emit callbacks.
- Each component gets its own folder: `ComponentName.tsx`, `ComponentName.stories.tsx`, optional `.test.tsx`.
- **Storybook story mandatory** for every component.
- **No data fetching**. No API calls. No hook calls that fetch data. Props in, callbacks out.
- Use Ant Design as the base. Wrap or compose Ant components — don't rebuild what Ant provides.

### 2. `hooks/` — Custom React hooks

- Encapsulate data fetching (via `api/client.ts`) and client-side logic.
- Each hook wraps one or more API calls and exposes a clean interface.
- Example: `useTransactions(filters)` → `{ transactions, isLoading, error }`.
- Hooks read from `FilterContext` to apply global filters automatically.
- Single-use hooks can live in the page file — extract to `hooks/` only when reused.

### 3. `pages/` — Full page compositions

- Compose `components/` and `hooks/` into complete views.
- Own layout, routing params, page-level state.
- Call hooks, pass data down to components as props.
- One file per page. Extract sub-sections to components if a page grows too large.

### 4. `api/` — REST client

- Typed fetch wrappers for each REST endpoint.
- Types imported from `src/shared/types.ts`.
- Example: `getTransactions(filters: TransactionFilters): Promise<Transaction[]>`.
- Single file for V1. Split per domain if it grows.

### 5. `services/` — Core logic + DB access (server-side)

- **All business logic lives here.** Route handlers are thin wrappers.
- Plain TypeScript classes or modules. No HTTP concepts — no `req`/`res`, no status codes.
- Receive DB instance via constructor injection (testable with in-memory SQLite).
- **Every service has a `.test.ts` file.** Tests use in-memory SQLite with the same schema.
- Use Drizzle ORM for queries. Raw SQL acceptable for complex aggregations.
- Existing services to port: `AccountService`, `ReportService`, `ImportService`.

### 6. `routes/` — Express route handlers

- Define REST endpoints per domain.
- Validate input (use a lightweight validator or manual checks), call service, send response.
- **Must stay thin.** If there's logic beyond validation + delegation, move it to a service.
- Never import from `client/`.

---

## Shared Types (`src/shared/types.ts`)

This is the **single file** both client and server import for API contract types. It contains:

- **Entity types**: `Account`, `Transaction`, `Category` (derived from Drizzle schema, but plain TS interfaces for API transport).
- **Request types**: `TransactionFilters`, `ImportPreviewRequest`, etc.
- **Response types**: `AccountSummary`, `ReportResult`, `ImportResult`, etc.
- **Enums/constants**: `TransactionType`, `ReportGrouping`, etc.

**Rule**: When the Drizzle schema changes, update `shared/types.ts` to match. The supervisor agent checks for drift between schema and shared types.

---

## Data Model

Single `budget.db` file, multiple tables.

### `accounts`
| Column     | Type    | Notes                              |
|------------|---------|------------------------------------|
| id         | text PK | nanoid                             |
| name       | text    | e.g. "Bank Leumi Checking"        |
| type       | text    | checking / savings / credit / cash |
| currency   | text    | Default "ILS"                      |
| created_at | integer | Unix timestamp                     |

### `categories`
| Column | Type    | Notes                    |
|--------|---------|--------------------------|
| id     | text PK | nanoid                   |
| name   | text    | e.g. "מזון", "שכירות"   |
| type   | text    | income / expense         |

### `transactions`
| Column         | Type    | Notes                               |
|----------------|---------|-------------------------------------|
| id             | text PK | nanoid                              |
| account_id     | text FK | → accounts.id                       |
| category_id    | text FK | → categories.id (nullable)          |
| amount         | integer | Stored in agorot (×100)             |
| type           | text    | income / expense / transfer         |
| description    | text    | Free text                           |
| payment_method | text    | Nullable — from Excel "אמצעי תשלום" |
| details        | text    | Nullable — from Excel "פירוט"       |
| reference      | text    | Nullable — from Excel "אסמכתא"     |
| balance        | integer | Nullable — running balance in agorot|
| date           | text    | ISO 8601 (YYYY-MM-DD)              |
| created_at     | integer | Unix timestamp                      |

### `settings`
| Column | Type    | Notes                         |
|--------|---------|-------------------------------|
| key    | text PK | Setting name                  |
| value  | text    | JSON-encoded value            |

### `import_logs`
| Column      | Type    | Notes                              |
|-------------|---------|------------------------------------|
| id          | text PK | nanoid                             |
| filename    | text    | Original uploaded filename         |
| account_id  | text FK | → accounts.id                      |
| row_count   | integer | Number of transactions imported    |
| imported_at | integer | Unix timestamp                     |

---

## Excel Import Column Mapping

| Excel Column (Hebrew) | Maps to                          |
|------------------------|----------------------------------|
| תאריך                  | `transactions.date`              |
| תיאור                  | `transactions.description`       |
| אמצעי תשלום            | `transactions.payment_method`    |
| קטגוריה                | `transactions.category_id` (lookup/create) |
| פירוט                  | `transactions.details`           |
| אסמכתא                 | `transactions.reference`         |
| חובה                   | `transactions.amount` (expense)  |
| זכות                   | `transactions.amount` (income)   |
| יתרה                   | `transactions.balance`           |

Each sheet = one account. Duplicate detection: date + amount + description + reference.

---

## Type Safety Flow

```
db/schema.ts (Drizzle table definitions)
    → src/shared/types.ts (API contract — manually kept in sync with schema)
        → server/services/ (use Drizzle types internally, return shared types)
            → server/routes/ (validate input, call service, send typed response)
            → client/api/client.ts (typed fetch wrappers using shared types)
                → client/hooks/ (typed hooks)
                    → client/pages/ + client/components/ (typed props)
```

**Rule**: `shared/types.ts` is the single source of truth for the API contract. Both client and server import from it. Never define request/response types elsewhere.

---

## Database Conventions

- **Single file**: `./data/budget.db` (configurable via `DATABASE_PATH` env var).
- **WAL mode**: `PRAGMA journal_mode=WAL` — set on connection.
- **Foreign keys**: `PRAGMA foreign_keys=ON` — set on every connection.
- **Migrations**: Drizzle Kit only. Never modify schema by hand.
  - `npx drizzle-kit generate` → creates migration SQL.
  - `npx drizzle-kit migrate` → applies pending migrations.
  - Migrations auto-run on server startup.

---

## Cross-App Filtering

Filtering is a core UX pattern that spans the entire app. See `specs/APP_LAYOUT.md` for full sidebar layout and responsive behavior.

- `FilterContext` holds global filter state: selected accounts, categories, date range, type, excluded-categories toggle.
- `useFilters()` hook reads and writes the context.
- `FilterSidebar` component renders the controls (Ant Select, DatePicker, etc.) in a left-side panel visible on all pages except Import.
- Hooks like `useTransactions(filters)` and `useReports(filters)` accept the filter state and pass it as query params to REST endpoints.
- Filter state is synced to URL query params so it persists across navigation and is bookmarkable.

---

## Testing Strategy

### Services (required)
Every service in `server/services/` has a `.test.ts` file. Tests use an in-memory SQLite instance.

```typescript
const db = new Database(':memory:');
// apply migrations to in-memory DB
const service = new TransactionService(db);
```

### Components (via Storybook + optional Vitest)
Storybook stories are mandatory for all `components/` entries. Use Vitest for components with non-trivial logic.

### Pages (not required for V1)
Pages are composition layers — test via Storybook or manual QA for now.

---

## Build & Dev

### Dev Mode
```bash
npm run dev        # Vite (frontend) + Express (backend) concurrently
```
Vite proxies `/api/*` requests to Express in dev (configured in `vite.config.ts`).

### Storybook
```bash
npm run storybook  # Port 6006
```

### Production
```bash
npm run build      # Vite build + server TS compile
npm run start      # Express serves API + static frontend on single port
```

### Environment Variables
| Variable        | Default             | Description         |
|-----------------|---------------------|---------------------|
| `PORT`          | `3000`              | Server port         |
| `DATABASE_PATH` | `./data/budget.db`  | Path to SQLite file |

---

## Deployment (Raspberry Pi)

```bash
git clone <repo> && cd budget-app
docker-compose up -d --build
```

### docker-compose.yml

```yaml
services:
  budget-app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data    # Mount local data folder — DB persists across rebuilds
    environment:
      - DATABASE_PATH=/app/data/budget.db
    restart: unless-stopped
```

The app starts and connects to the SQLite file at the mounted path. If `budget.db` doesn't exist yet, it is created automatically on first startup (with migrations applied). If it already exists, the app uses it as-is — no data loss on rebuild or restart.

Access via `http://<pi-ip>:3000` from any device on the local network. For external access, use Tailscale or Cloudflare Tunnel — never expose the port directly.

---

## Migration Checklist (from current repo)

- [ ] Scaffold new project structure under `src/`
- [ ] Create `src/shared/types.ts` with API contract types
- [ ] Move `frontend/src/components/` → `src/client/components/`
- [ ] Move `frontend/src/hooks/` → `src/client/hooks/`
- [ ] Move `frontend/src/pages/` → `src/client/pages/`
- [ ] Move `frontend/src/contexts/` → `src/client/contexts/`
- [ ] Move `frontend/.storybook/` → `.storybook/`
- [ ] Create `src/client/api/client.ts` with typed fetch wrappers
- [ ] Port `backend/src/services/` → `src/server/services/` (adapt to Drizzle)
- [ ] Port `backend/src/routes/` → `src/server/routes/` (keep Express, use shared types)
- [ ] Replace `backend/src/db/SqliteManager.ts` with Drizzle schema + connection
- [ ] Port `backend/src/utils/` Excel parser → `src/server/services/ImportService.ts`
- [ ] Remove `backend-python/`
- [ ] Update `docker-compose.yml` and `Dockerfile` for single-container monolith
- [ ] Add Vitest tests for all services
- [ ] Update Storybook config paths
- [ ] Set up Vite proxy for `/api/*` in dev

---

## Constraints & Principles

1. **Layered architecture**: components → hooks → pages (frontend), routes → services → db (backend). Dependencies flow downward only.
2. **Shared types are the API contract**: `src/shared/types.ts` is imported by both client and server. No type duplication.
3. **Storybook for every reusable component**. No exceptions.
4. **Tests for every service**. Business logic must be testable without HTTP.
5. **Money as integers (agorot)**. Never floats. Convert for display only.
6. **Migrations are mandatory**. Every schema change goes through Drizzle Kit.
7. **Docker for deployment**. Single container via `docker-compose`, volume-mount for data.
8. **Keep it simple**. No microservices, no message queues, no over-abstraction. It's a personal app.
9. **Routes are thin**. If a route handler has more than input validation + service call + response, refactor.
10. **Components are dumb**. They receive data via props. Data fetching happens in hooks, consumed by pages.
