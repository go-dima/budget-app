# Budget App — Monolith Migration Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Consolidate `backend/` and `frontend/` into a single-package monolith with shared types, Drizzle ORM, single `budget.db`, and one Docker container.

**Architecture:** Single Express app serving React frontend + REST API. Shared types in `src/shared/types.ts`. Drizzle ORM with WAL-mode SQLite. Vite proxies `/api/*` in dev.

**Tech Stack:** React 19, Express, TypeScript, Drizzle ORM, better-sqlite3, Ant Design 6, Vitest, Storybook 10, Vite 7, nanoid, zod, xlsx, multer

---

## Key Migration Changes (vs existing code)

1. **DB**: Multiple per-account SQLite files → single `budget.db` with FK relationships
2. **Dates**: Unix timestamps → ISO 8601 strings (`YYYY-MM-DD`)
3. **Amounts**: Separate `income`/`expense` floats → single `amount` integer (agorot) + `type`
4. **Categories**: String field → FK to `categories` table
5. **API URL**: `VITE_API_URL=http://localhost:8000` → relative `/api/` (Vite proxy)
6. **Types**: Duplicated FE/BE types → single `src/shared/types.ts`
7. **Services**: Custom repositories → Drizzle ORM with constructor-injected DB
8. **Import duplicate detection**: Date-based append → `date+amount+description+reference`

---

## File Map

### New/Replace
- `package.json` — merged root, add drizzle-orm, drizzle-kit, nanoid, zod, concurrently
- `tsconfig.json` — merged root config
- `vite.config.ts` — proxy `/api/*` to port 3001 in dev
- `drizzle.config.ts` — points to `./data/budget.db`, migrations at `src/db/migrations/`
- `src/db/schema.ts` — Drizzle table defs for accounts, categories, transactions, settings, import_logs
- `src/db/index.ts` — DB connection (WAL + FK), runs migrations on startup
- `src/shared/types.ts` — All API contract types
- `src/server/index.ts` — Express server
- `src/server/routes/index.ts` — Mount all route groups
- `src/server/routes/transactions.ts`
- `src/server/routes/accounts.ts`
- `src/server/routes/categories.ts`
- `src/server/routes/reports.ts`
- `src/server/routes/import.ts`
- `src/server/services/TransactionService.ts` + `.test.ts`
- `src/server/services/AccountService.ts` + `.test.ts`
- `src/server/services/CategoryService.ts` + `.test.ts`
- `src/server/services/ReportService.ts` + `.test.ts`
- `src/server/services/ImportService.ts` + `.test.ts`
- `src/server/utils/excelParser.ts` — port from `backend/src/utils/excelParser.ts` (adapt dates to ISO)
- `src/client/main.tsx`
- `src/client/App.tsx`
- `src/client/api/client.ts`
- `src/client/contexts/FilterContext.tsx`
- `src/client/hooks/useFilters.ts`
- `src/client/hooks/useAccounts.ts`
- `src/client/hooks/useTransactions.ts`
- `src/client/hooks/useReports.ts`
- `src/client/hooks/useCategories.ts`
- `src/client/components/AmountDisplay/AmountDisplay.tsx` + `.stories.tsx`
- `src/client/components/NavBar/NavBar.tsx` + `.stories.tsx`
- `src/client/components/FilterSidebar/FilterSidebar.tsx` + `.stories.tsx`
- `src/client/components/AppLayout/AppLayout.tsx` + `.stories.tsx`
- `src/client/components/AccountCard/AccountCard.tsx` + `.stories.tsx`
- `src/client/components/MonthlyTrendChart/MonthlyTrendChart.tsx` + `.stories.tsx`
- `src/client/components/CategoryBreakdownChart/CategoryBreakdownChart.tsx` + `.stories.tsx`
- `src/client/components/TransactionTable/TransactionTable.tsx` + `.stories.tsx`
- `src/client/components/DbStatusTable/DbStatusTable.tsx` + `.stories.tsx`
- `src/client/components/ImportPreview/ImportPreview.tsx` + `.stories.tsx`
- `src/client/components/ImportSummary/ImportSummary.tsx` + `.stories.tsx`
- `src/client/pages/AccountsPage.tsx`
- `src/client/pages/TransactionsPage.tsx`
- `src/client/pages/ReportsPage.tsx`
- `src/client/pages/ImportPage.tsx`
- `.storybook/main.ts` + `.storybook/preview.ts`
- `Dockerfile` — single-stage, build FE then serve via Express
- `docker-compose.yml` — single service

### Delete
- `backend/` (after migration complete)
- `frontend/` (after migration complete)
- `backend-python/`

---

## Task 1: Root Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `drizzle.config.ts`
- Create: `.gitignore` (update)

- [ ] Create `package.json`:

```json
{
  "name": "budget-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"vite\" \"tsx watch src/server/index.ts --port 3001\"",
    "build": "vite build && tsc -p tsconfig.server.json",
    "start": "node dist/server/index.js",
    "test": "vitest",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "@ant-design/icons": "^6.1.0",
    "antd": "^6.1.2",
    "better-sqlite3": "^11.7.0",
    "cors": "^2.8.5",
    "dayjs": "^1.11.19",
    "drizzle-orm": "^0.40.0",
    "express": "^4.21.2",
    "multer": "^1.4.5-lts.1",
    "nanoid": "^5.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.11.0",
    "xlsx": "^0.18.5",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@storybook/react-vite": "^10.1.10",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.1",
    "@types/better-sqlite3": "^7.6.12",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.1",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.14.0",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "concurrently": "^9.0.0",
    "drizzle-kit": "^0.30.0",
    "eslint": "^9.20.0",
    "globals": "^16.5.0",
    "jsdom": "^27.4.0",
    "storybook": "^10.1.10",
    "tsx": "^4.19.2",
    "typescript": "~5.9.3",
    "vite": "^7.2.4",
    "vitest": "^4.0.0"
  }
}
```

- [ ] Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "paths": {
      "@shared/*": ["./src/shared/*"],
      "@client/*": ["./src/client/*"],
      "@server/*": ["./src/server/*"],
      "@db/*": ["./src/db/*"]
    }
  },
  "include": ["src/client", "src/shared"]
}
```

- [ ] Create `tsconfig.server.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/server", "src/db", "src/shared"]
}
```

- [ ] Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  build: {
    outDir: '../../dist/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] Create `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './data/budget.db',
  },
});
```

- [ ] Run: `npm install`
- Expected: node_modules populated, no errors

- [ ] Commit:
```bash
git add package.json tsconfig.json tsconfig.server.json vite.config.ts drizzle.config.ts
git commit -m "chore: scaffold root monolith project"
```

---

## Task 2: DB Schema + Connection

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `src/db/migrations/` (generated by drizzle-kit)

- [ ] Create `src/db/schema.ts`:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('checking'), // checking/savings/credit/cash
  currency: text('currency').notNull().default('ILS'),
  createdAt: integer('created_at').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  type: text('type').notNull().default('expense'), // income/expense
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  categoryId: text('category_id').references(() => categories.id),
  amount: integer('amount').notNull(), // agorot (×100), negative = expense
  type: text('type').notNull(), // income/expense/transfer
  description: text('description').notNull(),
  paymentMethod: text('payment_method'),
  details: text('details'),
  reference: text('reference'),
  balance: integer('balance'), // running balance in agorot
  date: text('date').notNull(), // ISO 8601 YYYY-MM-DD
  createdAt: integer('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const importLogs = sqliteTable('import_logs', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  rowCount: integer('row_count').notNull(),
  importedAt: integer('imported_at').notNull(),
});
```

- [ ] Create `src/db/index.ts`:

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import * as schema from './schema.js';

const DB_PATH = process.env.DATABASE_PATH || './data/budget.db';

function createDb() {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  // Run migrations on startup
  migrate(db, { migrationsFolder: './src/db/migrations' });

  return db;
}

export const db = createDb();
export type DB = typeof db;
```

- [ ] Run: `npm run db:generate` to create initial migration
- [ ] Commit:
```bash
git add src/db/
git commit -m "feat: add Drizzle schema and DB connection"
```

---

## Task 3: Shared Types

**Files:**
- Create: `src/shared/types.ts`

- [ ] Create `src/shared/types.ts`:

```typescript
// ── Entity types (API transport) ─────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  categoryName: string | null;
  accountName: string;
  amount: number;       // agorot — positive=income, negative=expense
  type: TransactionType;
  description: string;
  paymentMethod: string | null;
  details: string | null;
  reference: string | null;
  balance: number | null;
  date: string;         // YYYY-MM-DD
  createdAt: number;
}

// ── Enums ─────────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer';
export type ReportGrouping = 'monthly' | 'yearly' | 'category';

// ── Filter types ──────────────────────────────────────────────────────────────

export interface TransactionFilters {
  accountIds?: string[];
  categoryIds?: string[];
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  type?: TransactionType | 'all';
  excludeCategories?: string[];
  search?: string;
  sortBy?: 'date' | 'amount' | 'category' | 'account';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface AccountSummary {
  id: string;
  name: string;
  balance: number | null;   // latest balance in agorot
  totalIncome: number;      // agorot
  totalExpenses: number;    // agorot
  transactionCount: number;
  latestDate: string | null;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  totalIncome: number;    // agorot
  totalExpenses: number;  // agorot
}

export interface MonthlyTrendItem {
  month: string;         // YYYY-MM
  income: number;        // agorot
  expenses: number;      // agorot
}

export interface TopCategoryItem {
  categoryId: string;
  categoryName: string;
  total: number;         // agorot
  percentage: number;
  count: number;
}

export interface MonthlyReportRow {
  month: string;         // YYYY-MM
  income: number;
  expenses: number;
  net: number;
  topCategory: string | null;
}

export interface YearlyReportRow {
  year: string;
  income: number;
  expenses: number;
  net: number;
  avgMonthly: number;
}

export interface CategoryReportRow {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
  count: number;
  avgTransaction: number;
}

export interface MonthDetailRow {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

// ── Import types ──────────────────────────────────────────────────────────────

export interface ImportStatusAccount {
  accountId: string;
  accountName: string;
  transactionCount: number;
  latestDate: string | null;
}

export interface ImportStatusResponse {
  accounts: ImportStatusAccount[];
  totalTransactions: number;
}

export interface ImportPreviewSheet {
  sheetName: string;       // = account name
  rowCount: number;
  dateRange: { from: string; to: string } | null;
  sampleRows: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;         // agorot
  }>;
  existingAccount: {
    accountId: string;
    newRows: number;
    duplicates: number;
  } | null;
  error: string | null;     // e.g. missing required columns
}

export interface ImportPreviewResponse {
  fileId: string;
  sheets: ImportPreviewSheet[];
}

export interface ImportExecuteRequest {
  fileId: string;
}

export interface ImportSheetResult {
  sheetName: string;
  accountName: string;
  newTransactions: number;
  duplicatesSkipped: number;
  error: string | null;
}

export interface ImportExecuteResponse {
  success: boolean;
  results: ImportSheetResult[];
  totalNew: number;
  totalSkipped: number;
}
```

- [ ] Commit:
```bash
git add src/shared/types.ts
git commit -m "feat: add shared API contract types"
```

---

## Task 4: CategoryService + Test

**Files:**
- Create: `src/server/services/CategoryService.ts`
- Create: `src/server/services/CategoryService.test.ts`

- [ ] Create `src/server/services/CategoryService.ts`:

```typescript
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { categories } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type { Category } from '../../shared/types.js';

export class CategoryService {
  constructor(private db: DB) {}

  getAll(): Category[] {
    return this.db.select().from(categories).all() as Category[];
  }

  findOrCreate(name: string, type: 'income' | 'expense' = 'expense'): Category {
    const existing = this.db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .get();
    if (existing) return existing as Category;

    const category = { id: nanoid(), name, type };
    this.db.insert(categories).values(category).run();
    return category;
  }

  getById(id: string): Category | null {
    return (this.db.select().from(categories).where(eq(categories.id, id)).get() as Category) ?? null;
  }
}
```

- [ ] Create `src/server/services/CategoryService.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../../db/schema.js';
import { CategoryService } from './CategoryService.js';

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './src/db/migrations' });
  return db;
}

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    service = new CategoryService(createTestDb());
  });

  it('returns empty list when no categories', () => {
    expect(service.getAll()).toEqual([]);
  });

  it('creates a new category on findOrCreate', () => {
    const cat = service.findOrCreate('מזון');
    expect(cat.name).toBe('מזון');
    expect(cat.type).toBe('expense');
    expect(service.getAll()).toHaveLength(1);
  });

  it('returns existing category on findOrCreate', () => {
    const a = service.findOrCreate('מזון');
    const b = service.findOrCreate('מזון');
    expect(a.id).toBe(b.id);
    expect(service.getAll()).toHaveLength(1);
  });
});
```

- [ ] Run: `npx vitest run src/server/services/CategoryService.test.ts`
- [ ] Commit:
```bash
git add src/server/services/CategoryService.ts src/server/services/CategoryService.test.ts
git commit -m "feat: add CategoryService with tests"
```

---

## Task 5: AccountService + Test

**Files:**
- Create: `src/server/services/AccountService.ts`
- Create: `src/server/services/AccountService.test.ts`

Key responsibility: CRUD for accounts, summary stats (latest balance, income, expenses).

AccountService.getAll() — list all accounts
AccountService.getById(id) — single account
AccountService.create(name, type) — create with nanoid
AccountService.getSummaries(filters) — per-account summary (calls TransactionService internals)

Note: AccountService.getSummaries() will query transactions table directly for aggregations.

- [ ] Commit after tests pass:
```bash
git commit -m "feat: add AccountService with tests"
```

---

## Task 6: TransactionService + Test

**Files:**
- Create: `src/server/services/TransactionService.ts`
- Create: `src/server/services/TransactionService.test.ts`

Key methods:
- `list(filters: TransactionFilters)` → `TransactionsResponse` (paginated, with totals)
- `insert(rows: InsertTransaction[])` → inserted count
- `checkDuplicates(accountId, rows)` → returns which rows are duplicates (date+amount+description+reference)

The `list` method must:
- Join transactions with accounts and categories
- Apply all filters (accountIds, categoryIds, startDate, endDate, type, excludeCategories, search)
- Sort and paginate server-side
- Return totalIncome and totalExpenses for the full filtered set (not just page)

Amount convention: store as agorot. expense rows: negative amount. income rows: positive amount.

- [ ] Commit after tests pass:
```bash
git commit -m "feat: add TransactionService with tests"
```

---

## Task 7: ReportService + Test

**Files:**
- Create: `src/server/services/ReportService.ts`
- Create: `src/server/services/ReportService.test.ts`

Key methods:
- `getMonthlyTrend(filters)` → MonthlyTrendItem[] — group by YYYY-MM
- `getTopCategories(filters, limit=10)` → TopCategoryItem[]
- `getByMonth(filters)` → MonthlyReportRow[]
- `getByYear(filters)` → YearlyReportRow[]
- `getByCategory(filters)` → CategoryReportRow[]
- `getMonthDetail(month: string, filters)` → MonthDetailRow[]
- `getYearDetail(year: string, filters)` → MonthlyReportRow[]

All filter on expense transactions only (for category breakdowns). Income/expense split for trend.

- [ ] Commit after tests pass:
```bash
git commit -m "feat: add ReportService with tests"
```

---

## Task 8: Excel Parser Port + ImportService + Test

**Files:**
- Create: `src/server/utils/excelParser.ts` — port from `backend/src/utils/excelParser.ts`
- Create: `src/server/services/ImportService.ts`
- Create: `src/server/services/ImportService.test.ts`

Key changes to excelParser:
- `parseDate` returns ISO string (`YYYY-MM-DD`) instead of unix timestamp
- `parseAmount` returns agorot (multiply float by 100, round to int)
- `ParsedTransaction` uses `date: string`, `amount: number` (signed agorot), `type: 'income'|'expense'`

ImportService:
- `getStatus()` → `ImportStatusResponse`
- `previewFile(buffer)` → `ImportPreviewResponse` — parses file, checks duplicates per sheet
- `executeImport(fileId)` → `ImportExecuteResponse` — writes to DB
- `reset()` — deletes all transactions, accounts, categories

Duplicate detection: `date + amount + description + reference` match within same account.

Temp file storage: write to OS temp dir (`os.tmpdir()`), key by fileId.

- [ ] Commit after tests pass:
```bash
git commit -m "feat: add ImportService with tests"
```

---

## Task 9: Express Server + Routes

**Files:**
- Create: `src/server/index.ts`
- Create: `src/server/routes/index.ts`
- Create: `src/server/routes/transactions.ts`
- Create: `src/server/routes/accounts.ts`
- Create: `src/server/routes/categories.ts`
- Create: `src/server/routes/reports.ts`
- Create: `src/server/routes/import.ts`

`src/server/index.ts`:
```typescript
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import apiRouter from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', apiRouter);

// Serve static frontend in production
const __dir = dirname(fileURLToPath(import.meta.url));
const staticPath = join(__dir, '../../dist/public');
if (existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get('*', (_, res) => res.sendFile(join(staticPath, 'index.html')));
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Routes are thin: validate query params with zod, call service, return JSON.

Standard filter params helper (used by transactions, accounts, reports):
```typescript
function parseFilters(query: Record<string, unknown>): TransactionFilters {
  return {
    accountIds: query.accountIds ? String(query.accountIds).split(',') : undefined,
    categoryIds: query.categoryIds ? String(query.categoryIds).split(',') : undefined,
    startDate: query.startDate as string | undefined,
    endDate: query.endDate as string | undefined,
    type: query.type as TransactionType | 'all' | undefined,
    excludeCategories: query.excludeCategories ? String(query.excludeCategories).split(',') : undefined,
    search: query.search as string | undefined,
    sortBy: query.sortBy as string | undefined,
    sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
  };
}
```

- [ ] Commit:
```bash
git commit -m "feat: add Express server and all route handlers"
```

---

## Task 10: Client API Client

**Files:**
- Create: `src/client/api/client.ts`

Use relative URLs (no `VITE_API_URL`). Reuse pattern from `frontend/src/api/client.ts` but simplified:

```typescript
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.json();
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, {
    method: 'POST',
    headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Typed wrappers
export const accountsApi = {
  getSummaries: (params: string) => apiClient.get<AccountSummary[]>(`/api/accounts/summary?${params}`),
};
export const transactionsApi = {
  list: (params: string) => apiClient.get<TransactionsResponse>(`/api/transactions?${params}`),
};
// ... etc for reports, categories, import
```

- [ ] Commit:
```bash
git commit -m "feat: add typed API client"
```

---

## Task 11: FilterContext + useFilters

**Files:**
- Create: `src/client/contexts/FilterContext.tsx`
- Create: `src/client/hooks/useFilters.ts`

Key changes from existing:
- Date range stored as ISO strings (`YYYY-MM-DD`), not unix timestamps
- Category filter uses category IDs, not names
- `excludeCategories` is a string[] of IDs
- Filter state synced to URL query params (use `useSearchParams` from react-router-dom)

Default date range: 12 months back from today as ISO string.

`useFilters()` exposes:
```typescript
{
  filters: TransactionFilters,
  setAccountIds: (ids: string[]) => void,
  setCategoryIds: (ids: string[]) => void,
  setDateRange: (start: string, end: string) => void,
  setType: (type: TransactionType | 'all') => void,
  setShowExcluded: (show: boolean) => void,
  resetFilters: () => void,
  filtersAsParams: () => string,  // URL-safe query string
}
```

- [ ] Commit:
```bash
git commit -m "feat: add FilterContext and useFilters hook"
```

---

## Task 12: Data Hooks

**Files:**
- Create: `src/client/hooks/useAccounts.ts`
- Create: `src/client/hooks/useTransactions.ts`
- Create: `src/client/hooks/useReports.ts`
- Create: `src/client/hooks/useCategories.ts`

Each hook:
1. Reads from `FilterContext` via `useFilters()`
2. Calls API client with `filtersAsParams()`
3. Returns `{ data, isLoading, error }`
4. Re-fetches when filters change

```typescript
// Example: useTransactions.ts
export function useTransactions() {
  const { filtersAsParams } = useFilters();
  const params = filtersAsParams();
  // fetch + useState + useEffect pattern
  return { data, isLoading, error };
}
```

- [ ] Commit:
```bash
git commit -m "feat: add data hooks (accounts, transactions, reports, categories)"
```

---

## Task 13: AmountDisplay Component

**Files:**
- Create: `src/client/components/AmountDisplay/AmountDisplay.tsx`
- Create: `src/client/components/AmountDisplay/AmountDisplay.stories.tsx`

```typescript
interface AmountDisplayProps {
  amount: number;      // agorot — positive=income, negative=expense
  showSign?: boolean;
  className?: string;
}
// Format: ₪1,234.56. Positive=green, negative=red, zero=grey
// Divide by 100 for display
```

- [ ] Commit:
```bash
git commit -m "feat: add AmountDisplay component with story"
```

---

## Task 14: NavBar Component

**Files:**
- Create: `src/client/components/NavBar/NavBar.tsx`
- Create: `src/client/components/NavBar/NavBar.stories.tsx`

Use `Layout.Header` + `Menu mode="horizontal"`. Links: Accounts (/), Transactions (/transactions), Reports (/reports), Import (/import). Active link highlighted. "Budget Viewer" title on left.

- [ ] Commit:
```bash
git commit -m "feat: add NavBar component with story"
```

---

## Task 15: FilterSidebar Component

**Files:**
- Create: `src/client/components/FilterSidebar/FilterSidebar.tsx`
- Create: `src/client/components/FilterSidebar/FilterSidebar.stories.tsx`

Props: `accounts: Account[]`, `categories: Category[]`, `filters`, all onChange callbacks, `onReset`.

Contains:
1. Account multi-select
2. Category multi-select
3. DatePicker.RangePicker (ISO dates)
4. Radio.Group for type (All/Income/Expense)
5. Switch for "Show excluded categories"
6. "Reset Filters" button

Desktop: `Layout.Sider`. Mobile (< 768px): Ant `Drawer`.

- [ ] Commit:
```bash
git commit -m "feat: add FilterSidebar component with story"
```

---

## Task 16: AppLayout + App.tsx

**Files:**
- Create: `src/client/components/AppLayout/AppLayout.tsx`
- Create: `src/client/components/AppLayout/AppLayout.stories.tsx`
- Create: `src/client/App.tsx`
- Create: `src/client/main.tsx`

AppLayout wires NavBar + FilterSidebar + content area. Hides sidebar on `/import`. Provides consistent padding.

App.tsx: wraps everything in `FilterProvider` + `BrowserRouter` + `Routes`.

main.tsx: `ReactDOM.createRoot(document.getElementById('root')!).render(<App />)`.

- [ ] Commit:
```bash
git commit -m "feat: add AppLayout, App.tsx, main.tsx"
```

---

## Task 17: AccountCard + Charts

**Files:**
- Create: `src/client/components/AccountCard/AccountCard.tsx` + `.stories.tsx`
- Create: `src/client/components/MonthlyTrendChart/MonthlyTrendChart.tsx` + `.stories.tsx`
- Create: `src/client/components/CategoryBreakdownChart/CategoryBreakdownChart.tsx` + `.stories.tsx`

AccountCard props: `AccountSummary`, `onClick`.
MonthlyTrendChart props: `data: MonthlyTrendItem[]`.
CategoryBreakdownChart props: `data: TopCategoryItem[]`, `onCategoryClick`.

Use Ant Design `Card`, recharts or just Ant's built-in chart wrappers. Keep it simple — if recharts isn't available, use a simple table representation.

Note: Ant Design doesn't ship charts. Use a simple approach:
- MonthlyTrendChart: render as a table or use `@ant-design/charts` if available. Fallback: simple grouped divs showing bar proportions via CSS widths.
- CategoryBreakdownChart: similar fallback.

- [ ] Commit:
```bash
git commit -m "feat: add AccountCard and chart components with stories"
```

---

## Task 18: TransactionTable Component

**Files:**
- Create: `src/client/components/TransactionTable/TransactionTable.tsx`
- Create: `src/client/components/TransactionTable/TransactionTable.stories.tsx`

Props: `transactions: Transaction[]`, `total: number`, `page: number`, `pageSize: number`, `isLoading: boolean`, `onPageChange`, `onSort`, `onSearch`.

Ant `Table` with columns: Date, Description, Category, Amount, Account, Payment Method. Sortable: Date (default desc), Amount, Category, Account. Pagination server-side.

- [ ] Commit:
```bash
git commit -m "feat: add TransactionTable component with story"
```

---

## Task 19: Import Components

**Files:**
- Create: `src/client/components/DbStatusTable/DbStatusTable.tsx` + `.stories.tsx`
- Create: `src/client/components/ImportPreview/ImportPreview.tsx` + `.stories.tsx`
- Create: `src/client/components/ImportSummary/ImportSummary.tsx` + `.stories.tsx`

DbStatusTable props: `status: ImportStatusResponse | null`, `onReset`.
ImportPreview props: `preview: ImportPreviewResponse | null`, `onConfirm`, `isLoading`.
ImportSummary props: `result: ImportExecuteResponse`, `onGoToOverview`, `onImportMore`.

- [ ] Commit:
```bash
git commit -m "feat: add import components with stories"
```

---

## Task 20: Pages

**Files:**
- Create: `src/client/pages/AccountsPage.tsx`
- Create: `src/client/pages/TransactionsPage.tsx`
- Create: `src/client/pages/ReportsPage.tsx`
- Create: `src/client/pages/ImportPage.tsx`

AccountsPage: uses `useAccounts`, renders total summary strip + AccountCard grid + MonthlyTrendChart + CategoryBreakdownChart. Empty state with "Import Data" button.

TransactionsPage: uses `useTransactions`, renders quick stats + search bar + TransactionTable. Reads `?account=` and `?category=` URL params to pre-set filters.

ReportsPage: uses `useReports`, renders Segmented selector + report table + chart. Monthly/Yearly/Category groupings.

ImportPage: upload flow — DbStatusTable → Upload → ImportPreview → confirm → ImportSummary.

- [ ] Commit:
```bash
git commit -m "feat: add all four pages"
```

---

## Task 21: Storybook Setup

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.ts`
- Create: `src/client/index.html`

Port from `frontend/.storybook/`. Update paths for new structure.

- [ ] Run: `npm run storybook` and verify no errors
- [ ] Commit:
```bash
git commit -m "chore: set up Storybook for new structure"
```

---

## Task 22: Docker — Single Container

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN mkdir -p /app/data
EXPOSE 3001
ENV PORT=3001
ENV DATABASE_PATH=/app/data/budget.db
CMD ["node", "dist/server/index.js"]
```

```yaml
services:
  budget-app:
    build: .
    ports:
      - "3000:3001"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_PATH=/app/data/budget.db
    restart: unless-stopped
```

- [ ] Commit:
```bash
git commit -m "chore: add single-container Dockerfile and docker-compose"
```

---

## Task 23: Cleanup

- [ ] Delete `backend-python/`
- [ ] Delete `backend/`
- [ ] Delete `frontend/`
- [ ] Commit:
```bash
git commit -m "chore: remove old backend/ frontend/ backend-python/ folders"
```

---

## Verification

1. `npm install` — no errors
2. `npm run db:generate` — creates migration SQL
3. `npm run test` — all service tests pass
4. `npm run dev` — server on :3001, vite on :5173, proxy works
5. `npm run storybook` — all stories render
6. Upload a sample Excel file via Import page — transactions appear in Accounts and Transactions pages
7. `npm run build && npm run start` — production build serves correctly
8. `docker-compose up --build` — container starts, DB persists across restart
