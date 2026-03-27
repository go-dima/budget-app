# Payment Method Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a per-account description→payment-method mapping that auto-assigns payment methods to new transactions during import and is manageable via a Settings tab — mirrors the CATEGORY_MAPPING feature.

**Architecture:** Add `description_payment_method_map` table with same `preferred/suggested` shape as `description_category_map`. `PaymentMappingService` mirrors `CategoryMappingService`. Auto-assignment happens inside `ImportService.executeImport` after category mapping. A new Settings tab (`/settings/payment-mapping`) renders `PaymentMappingPage`.

**Tech Stack:** Drizzle ORM (SQLite), Express, React, Ant Design 6, Vitest + `createTestDb()`, Storybook. All shared types in `src/shared/types.ts`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/db/schema.ts` | Add `descriptionPaymentMethodMap` table |
| Generate | `src/db/migrations/0004_*.sql` | Drizzle-generated migration |
| Modify | `src/shared/types.ts` | Add `PaymentMapping` interface |
| Modify | `src/server/services/TransactionService.ts` | Add `bulkSetPaymentMethod` |
| Modify | `src/server/services/TransactionService.test.ts` | Test `bulkSetPaymentMethod` |
| Create | `src/server/services/PaymentMappingService.ts` | All business logic |
| Create | `src/server/services/PaymentMappingService.test.ts` | In-memory SQLite tests |
| Create | `src/server/routes/paymentMapping.ts` | Thin REST endpoints |
| Modify | `src/server/routes/index.ts` | Register `/api/payment-mapping` |
| Modify | `src/server/services/ImportService.ts` | Apply payment mappings during execute |
| Modify | `src/client/httpClient/client.ts` | Add `paymentMappingApi` |
| Create | `src/client/hooks/usePaymentMapping.ts` | Fetch + mutate hook for the page |
| Create | `src/client/pages/PaymentMappingPage.tsx` | Settings tab page |
| Create | `src/client/pages/PaymentMappingPage.stories.tsx` | Storybook stories |
| Modify | `src/client/pages/SettingsPage.tsx` | Add Payment Mapping tab |

---

## Data Model

Table `description_payment_method_map` — same shape as `description_category_map` but payment methods are free text (no FK):

```
id                       TEXT PK  (uuid)
account                  TEXT NOT NULL
description              TEXT NOT NULL
preferred_payment_method TEXT          (NULL = tie/unresolved)
suggested_payment_methods TEXT NOT NULL DEFAULT '[]'  (JSON string[])
UNIQUE (account, description)
```

**Tie state**: `preferred_payment_method IS NULL` and `suggestedPaymentMethods.length > 1` — user must resolve before this entry is used for auto-assignment.
**No-op rule**: If preferred and suggested are identical to existing row, skip.

---

## Task 1: Schema — add `description_payment_method_map`

**Files:**
- Modify: `src/db/schema.ts`
- Generate: `src/db/migrations/` (via drizzle-kit)

- [ ] **Step 1: Add table to schema**

In `src/db/schema.ts`, add after `descriptionCategoryMap`:

```typescript
export const descriptionPaymentMethodMap = sqliteTable(
  'description_payment_method_map',
  {
    id: text('id').primaryKey(),
    account: text('account').notNull(),
    description: text('description').notNull(),
    preferredPaymentMethod: text('preferred_payment_method'),
    suggestedPaymentMethods: text('suggested_payment_methods').notNull().default('[]'),
  },
  (t) => ({
    uniq: unique().on(t.account, t.description),
  })
);
```

- [ ] **Step 2: Generate migration**

```bash
cd /Users/go.dima/github/budget-app && npx drizzle-kit generate
```

Expected: new file `src/db/migrations/0004_*.sql` created. Verify it contains `CREATE TABLE \`description_payment_method_map\``.

- [ ] **Step 3: Verify existing tests still pass**

```bash
npx vitest run src/server
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat(db): add description_payment_method_map table"
```

---

## Task 2: Shared Types

**Files:**
- Modify: `src/shared/types.ts`

- [ ] **Step 1: Add `PaymentMapping` interface**

In `src/shared/types.ts`, add after the `CategoryMapping` block:

```typescript
export interface PaymentMapping {
  account: string;
  description: string;
  preferredPaymentMethod: string | null;
  suggestedPaymentMethods: string[];
}
```

`RecalculateResult` already exists — reuse it for payment mapping (same shape: `{ updated, conflicts, noops }`). Do NOT add a duplicate type.

- [ ] **Step 2: Commit**

```bash
git add src/shared/types.ts
git commit -m "feat(types): add PaymentMapping interface"
```

---

## Task 3: `TransactionService.bulkSetPaymentMethod`

**Files:**
- Modify: `src/server/services/TransactionService.ts`
- Modify: `src/server/services/TransactionService.test.ts`

- [ ] **Step 1: Write the failing test**

In `TransactionService.test.ts`, add to the existing describe block:

```typescript
it('bulkSetPaymentMethod() updates payment_method on given rows', () => {
  const [id] = service.insert([{
    accountId,
    categoryId: null,
    amount: -10000,
    type: 'expense' as const,
    description: 'Netflix',
    paymentMethod: null,
    details: null,
    reference: null,
    balance: null,
    date: '2025-01-15',
  }]);
  service.bulkSetPaymentMethod([{ id: id!, paymentMethod: 'כרטיס אשראי' }]);
  const txn = service.list({}).transactions.find(t => t.id === id);
  expect(txn?.paymentMethod).toBe('כרטיס אשראי');
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run src/server/services/TransactionService.test.ts
```

Expected: FAIL with `bulkSetPaymentMethod is not a function`.

- [ ] **Step 3: Implement `bulkSetPaymentMethod`**

In `TransactionService.ts`, add next to `bulkSetCategory`:

```typescript
bulkSetPaymentMethod(updates: { id: string; paymentMethod: string }[]): void {
  for (const u of updates) {
    this.db.update(transactions).set({ paymentMethod: u.paymentMethod }).where(eq(transactions.id, u.id)).run();
  }
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx vitest run src/server/services/TransactionService.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/TransactionService.ts src/server/services/TransactionService.test.ts
git commit -m "feat(service): add bulkSetPaymentMethod to TransactionService"
```

---

## Task 4: `PaymentMappingService` + tests

**Files:**
- Create: `src/server/services/PaymentMappingService.ts`
- Create: `src/server/services/PaymentMappingService.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/server/services/PaymentMappingService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { PaymentMappingService } from './PaymentMappingService.js';
import { AccountService } from './AccountService.js';
import { TransactionService } from './TransactionService.js';
import type { DB } from '../../db/index.js';

describe('PaymentMappingService', () => {
  let db: DB;
  let service: PaymentMappingService;
  let accountService: AccountService;
  let transactionService: TransactionService;
  let accountId: string;

  beforeEach(() => {
    db = createTestDb();
    service = new PaymentMappingService(db);
    accountService = new AccountService(db);
    transactionService = new TransactionService(db);
    accountId = accountService.create('Test Bank').id;
  });

  const txn = (description: string, paymentMethod: string | null, overrides: Record<string, unknown> = {}) => ({
    accountId,
    categoryId: null,
    amount: -50000,
    type: 'expense' as const,
    description,
    paymentMethod,
    details: null,
    reference: null,
    balance: null,
    date: '2025-01-15',
    ...overrides,
  });

  it('getAll() returns empty initially', () => {
    expect(service.getAll()).toHaveLength(0);
  });

  it('recalculate() with no transactions returns all zeros', () => {
    expect(service.recalculate()).toEqual({ updated: 0, conflicts: 0, noops: 0 });
  });

  it('recalculate() single payment method → preferred = that method, suggested = []', () => {
    transactionService.insert([
      txn('Netflix', 'כרטיס אשראי'),
      txn('Netflix', 'כרטיס אשראי', { date: '2025-01-16' }),
    ]);
    const result = service.recalculate();
    expect(result).toEqual({ updated: 1, conflicts: 0, noops: 0 });
    const all = service.getAll();
    expect(all[0]!.preferredPaymentMethod).toBe('כרטיס אשראי');
    expect(all[0]!.suggestedPaymentMethods).toEqual([]);
  });

  it('recalculate() 3 credit + 1 cash → preferred = credit (most frequent), suggested = [cash]', () => {
    transactionService.insert([
      txn('Superpharm', 'כרטיס אשראי', { date: '2025-01-13' }),
      txn('Superpharm', 'כרטיס אשראי', { date: '2025-01-14' }),
      txn('Superpharm', 'כרטיס אשראי', { date: '2025-01-15' }),
      txn('Superpharm', 'מזומן', { date: '2025-01-16' }),
    ]);
    const result = service.recalculate();
    expect(result).toEqual({ updated: 1, conflicts: 0, noops: 0 });
    const all = service.getAll();
    expect(all[0]!.preferredPaymentMethod).toBe('כרטיס אשראי');
    expect(all[0]!.suggestedPaymentMethods).toEqual(['מזומן']);
  });

  it('recalculate() tied methods → preferred = null, suggested = both', () => {
    transactionService.insert([
      txn('Superpharm', 'כרטיס אשראי'),
      txn('Superpharm', 'מזומן', { date: '2025-01-16' }),
    ]);
    const result = service.recalculate();
    expect(result).toEqual({ updated: 0, conflicts: 1, noops: 0 });
    const all = service.getAll();
    expect(all[0]!.preferredPaymentMethod).toBeNull();
    expect(all[0]!.suggestedPaymentMethods).toHaveLength(2);
  });

  it('recalculate() called twice with no changes → noops on second call', () => {
    transactionService.insert([txn('Netflix', 'כרטיס אשראי')]);
    service.recalculate();
    const second = service.recalculate();
    expect(second.noops).toBe(1);
    expect(second.updated).toBe(0);
  });

  it('setPreferred() creates a clean mapping', () => {
    const m = service.setPreferred('Test Bank', 'Netflix', 'כרטיס אשראי');
    expect(m.preferredPaymentMethod).toBe('כרטיס אשראי');
    expect(m.suggestedPaymentMethods).toEqual([]);
  });

  it('setPreferred() resolves a tie — old preferred moves to suggested', () => {
    transactionService.insert([
      txn('Superpharm', 'כרטיס אשראי'),
      txn('Superpharm', 'מזומן', { date: '2025-01-16' }),
    ]);
    service.recalculate(); // tie
    const m = service.setPreferred('Test Bank', 'Superpharm', 'כרטיס אשראי');
    expect(m.preferredPaymentMethod).toBe('כרטיס אשראי');
    expect(m.suggestedPaymentMethods).toContain('מזומן');
  });

  it('getMappingFor() returns null for unknown (account, description)', () => {
    expect(service.getMappingFor('Test Bank', 'Unknown')).toBeNull();
  });

  it('getMappingFor() returns preferred for clean row', () => {
    service.setPreferred('Test Bank', 'Netflix', 'כרטיס אשראי');
    const m = service.getMappingFor('Test Bank', 'Netflix');
    expect(m!.preferred).toBe('כרטיס אשראי');
  });

  it('getMappingFor() returns null preferred for tie row', () => {
    transactionService.insert([
      txn('Superpharm', 'כרטיס אשראי'),
      txn('Superpharm', 'מזומן', { date: '2025-01-16' }),
    ]);
    service.recalculate();
    expect(service.getMappingFor('Test Bank', 'Superpharm')!.preferred).toBeNull();
  });

  it('deleteMapping() removes the entry', () => {
    service.setPreferred('Test Bank', 'Netflix', 'כרטיס אשראי');
    service.deleteMapping('Test Bank', 'Netflix');
    expect(service.getAll()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/server/services/PaymentMappingService.test.ts
```

Expected: FAIL with `Cannot find module './PaymentMappingService.js'`.

- [ ] **Step 3: Implement `PaymentMappingService`**

```typescript
// src/server/services/PaymentMappingService.ts
import { and, eq, isNotNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { accounts, descriptionPaymentMethodMap, transactions } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type { PaymentMapping, RecalculateResult } from '../../shared/types.js';

function toMapping(row: typeof descriptionPaymentMethodMap.$inferSelect): PaymentMapping {
  return {
    account: row.account,
    description: row.description,
    preferredPaymentMethod: row.preferredPaymentMethod ?? null,
    suggestedPaymentMethods: JSON.parse(row.suggestedPaymentMethods) as string[],
  };
}

export class PaymentMappingService {
  constructor(private db: DB) {}

  private getRow(account: string, description: string) {
    return this.db
      .select()
      .from(descriptionPaymentMethodMap)
      .where(and(
        eq(descriptionPaymentMethodMap.account, account),
        eq(descriptionPaymentMethodMap.description, description),
      ))
      .get();
  }

  getAll(): PaymentMapping[] {
    return this.db.select().from(descriptionPaymentMethodMap).all().map(toMapping);
  }

  recalculate(): RecalculateResult {
    const rows = this.db
      .select({
        accountName: accounts.name,
        description: transactions.description,
        paymentMethod: transactions.paymentMethod,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(isNotNull(transactions.paymentMethod))
      .all();

    // Group by (accountName, description) → frequency map of payment methods
    const grouped = new Map<string, Map<string, number>>();
    for (const row of rows) {
      if (!row.accountName || !row.paymentMethod) continue;
      const key = `${row.accountName}\0${row.description}`;
      if (!grouped.has(key)) grouped.set(key, new Map());
      const counts = grouped.get(key)!;
      counts.set(row.paymentMethod, (counts.get(row.paymentMethod) ?? 0) + 1);
    }

    let updated = 0;
    let conflicts = 0;
    let noops = 0;

    this.db.transaction((tx) => {
      for (const [key, counts] of grouped) {
        const sep = key.indexOf('\0');
        const account = key.slice(0, sep);
        const description = key.slice(sep + 1);

        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        const topCount = sorted[0]![1];
        const winners = sorted.filter(([, c]) => c === topCount);
        const hasStrictWinner = winners.length === 1;

        let preferredPaymentMethod: string | null;
        let suggestedPaymentMethods: string[];

        if (hasStrictWinner) {
          preferredPaymentMethod = winners[0]![0];
          suggestedPaymentMethods = sorted.slice(1).map(([m]) => m);
        } else {
          preferredPaymentMethod = null;
          suggestedPaymentMethods = sorted.map(([m]) => m);
        }

        const existing = tx
          .select()
          .from(descriptionPaymentMethodMap)
          .where(and(
            eq(descriptionPaymentMethodMap.account, account),
            eq(descriptionPaymentMethodMap.description, description),
          ))
          .get();

        const existingSuggested = existing
          ? (JSON.parse(existing.suggestedPaymentMethods) as string[])
          : null;

        const isSame =
          existing &&
          (existing.preferredPaymentMethod ?? null) === preferredPaymentMethod &&
          existingSuggested !== null &&
          JSON.stringify([...existingSuggested].sort()) === JSON.stringify([...suggestedPaymentMethods].sort());

        if (isSame) { noops++; continue; }

        const suggestedJson = JSON.stringify(suggestedPaymentMethods);
        tx.insert(descriptionPaymentMethodMap)
          .values({ id: nanoid(), account, description, preferredPaymentMethod, suggestedPaymentMethods: suggestedJson })
          .onConflictDoUpdate({
            target: [descriptionPaymentMethodMap.account, descriptionPaymentMethodMap.description],
            set: { preferredPaymentMethod, suggestedPaymentMethods: suggestedJson },
          })
          .run();

        if (preferredPaymentMethod === null) { conflicts++; } else { updated++; }
      }
    });

    return { updated, conflicts, noops };
  }

  setPreferred(account: string, description: string, paymentMethod: string): PaymentMapping {
    const existing = this.getRow(account, description);

    let suggestedPaymentMethods: string[];

    if (!existing) {
      suggestedPaymentMethods = [];
    } else {
      const currentPreferred = existing.preferredPaymentMethod ?? null;
      const currentSuggested = JSON.parse(existing.suggestedPaymentMethods) as string[];

      if (currentPreferred === paymentMethod) {
        return toMapping(existing);
      }

      if (currentSuggested.includes(paymentMethod)) {
        suggestedPaymentMethods = [...currentSuggested];
        if (currentPreferred !== null && !suggestedPaymentMethods.includes(currentPreferred)) {
          suggestedPaymentMethods = [currentPreferred, ...suggestedPaymentMethods];
        }
      } else {
        suggestedPaymentMethods = currentPreferred !== null
          ? [currentPreferred, ...currentSuggested]
          : [...currentSuggested];
      }
    }

    const suggestedJson = JSON.stringify(suggestedPaymentMethods);
    this.db.insert(descriptionPaymentMethodMap)
      .values({ id: nanoid(), account, description, preferredPaymentMethod: paymentMethod, suggestedPaymentMethods: suggestedJson })
      .onConflictDoUpdate({
        target: [descriptionPaymentMethodMap.account, descriptionPaymentMethodMap.description],
        set: { preferredPaymentMethod: paymentMethod, suggestedPaymentMethods: suggestedJson },
      })
      .run();

    return toMapping(this.getRow(account, description)!);
  }

  deleteMapping(account: string, description: string): void {
    this.db.delete(descriptionPaymentMethodMap)
      .where(and(
        eq(descriptionPaymentMethodMap.account, account),
        eq(descriptionPaymentMethodMap.description, description),
      ))
      .run();
  }

  getMappingFor(account: string, description: string): { preferred: string | null; suggested: string[] } | null {
    const row = this.getRow(account, description);
    if (!row) return null;
    return {
      preferred: row.preferredPaymentMethod ?? null,
      suggested: JSON.parse(row.suggestedPaymentMethods) as string[],
    };
  }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/server/services/PaymentMappingService.test.ts
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/PaymentMappingService.ts src/server/services/PaymentMappingService.test.ts
git commit -m "feat(service): add PaymentMappingService with full test coverage"
```

---

## Task 5: Route + registration

**Files:**
- Create: `src/server/routes/paymentMapping.ts`
- Modify: `src/server/routes/index.ts`

- [ ] **Step 1: Create route file**

Model exactly after `src/server/routes/categoryMapping.ts`:

```typescript
// src/server/routes/paymentMapping.ts
import { Router } from 'express';
import { dbManager } from '../../db/manager.js';
import { PaymentMappingService } from '../services/PaymentMappingService.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const service = new PaymentMappingService(dbManager.getDb());
    res.json(service.getAll());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/recalculate', (_req, res) => {
  try {
    const service = new PaymentMappingService(dbManager.getDb());
    res.json(service.recalculate());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch('/:account/:description/preferred', (req, res) => {
  try {
    const { account, description } = req.params;
    if (!account || !description) return res.status(400).json({ error: 'account and description must be non-empty' });
    const { paymentMethod } = req.body as { paymentMethod?: unknown };
    if (typeof paymentMethod !== 'string') return res.status(400).json({ error: 'paymentMethod must be a string' });
    const service = new PaymentMappingService(dbManager.getDb());
    res.json(service.setPreferred(account, description, paymentMethod));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:account/:description', (req, res) => {
  try {
    const { account, description } = req.params;
    if (!account || !description) return res.status(400).json({ error: 'account and description must be non-empty' });
    const service = new PaymentMappingService(dbManager.getDb());
    service.deleteMapping(account, description);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
```

- [ ] **Step 2: Register in `src/server/routes/index.ts`**

Add alongside the existing `categoryMappingRouter`:

```typescript
import paymentMappingRouter from './paymentMapping.js';
// ...
router.use('/payment-mapping', paymentMappingRouter);
```

- [ ] **Step 3: Commit**

```bash
git add src/server/routes/paymentMapping.ts src/server/routes/index.ts
git commit -m "feat(route): add /api/payment-mapping endpoints"
```

---

## Task 6: Update `ImportService` — auto-assign payment methods

**Files:**
- Modify: `src/server/services/ImportService.ts`

- [ ] **Step 1: Import `PaymentMappingService`**

Add to the imports at the top of `ImportService.ts`:

```typescript
import { PaymentMappingService } from './PaymentMappingService.js';
```

- [ ] **Step 2: Apply payment method mappings after category mappings**

Inside `executeImport`, after the category mapping loop (after `if (mappingUpdates.length > 0) { this.txnSvc.bulkSetCategory(mappingUpdates); }`), add:

```typescript
// Apply payment method mappings
const pmMappingSvc = new PaymentMappingService(this.db);
const paymentMethodUpdates: { id: string; paymentMethod: string }[] = [];
for (let i = 0; i < newRows.length; i++) {
  const row = newRows[i]!;
  const rowId = insertedIds[i]!;
  if (row.paymentMethod === null) {
    const pmMapping = pmMappingSvc.getMappingFor(accountName, row.description);
    if (pmMapping?.preferred) {
      paymentMethodUpdates.push({ id: rowId, paymentMethod: pmMapping.preferred });
    }
  }
}
if (paymentMethodUpdates.length > 0) {
  this.txnSvc.bulkSetPaymentMethod(paymentMethodUpdates);
}
```

- [ ] **Step 3: Run all service tests**

```bash
npx vitest run src/server
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/server/services/ImportService.ts
git commit -m "feat(import): auto-assign payment methods from mapping during execute"
```

---

## Task 7: API client + `PaymentMappingPage`

**Files:**
- Modify: `src/client/httpClient/client.ts`
- Create: `src/client/pages/PaymentMappingPage.tsx`
- Create: `src/client/pages/PaymentMappingPage.stories.tsx`
- Modify: `src/client/pages/SettingsPage.tsx`

- [ ] **Step 1: Add `paymentMappingApi` to the HTTP client**

In `src/client/httpClient/client.ts`, add alongside `categoryMappingApi`. Use `request<T>()` directly — there are no `get()`/`patch()`/`del()` helpers. The file already defines `const enc = encodeURIComponent`.

```typescript
export const paymentMappingApi = {
  getAll: () =>
    request<PaymentMapping[]>('/api/payment-mapping'),
  recalculate: () =>
    request<RecalculateResult>('/api/payment-mapping/recalculate', { method: 'POST' }),
  setPreferred: (account: string, description: string, paymentMethod: string) =>
    request<PaymentMapping>(
      `/api/payment-mapping/${enc(account)}/${enc(description)}/preferred`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentMethod }) }
    ),
  deleteMapping: (account: string, description: string) =>
    request<void>(
      `/api/payment-mapping/${enc(account)}/${enc(description)}`,
      { method: 'DELETE' }
    ),
};
```

Add `PaymentMapping` to the import list at the top of `client.ts` (alongside `RecalculateResult` which is already imported).

- [ ] **Step 2: Implement `usePaymentMapping` hook**

```typescript
// src/client/hooks/usePaymentMapping.ts
import { useState, useCallback } from 'react';
import { paymentMappingApi } from '../httpClient/client.js';
import { useFetch } from './useFetch.js';
import type { PaymentMapping } from '../../shared/types.js';

export function usePaymentMapping() {
  const { data, isLoading, error, refresh } = useFetch<PaymentMapping[]>(
    paymentMappingApi.getAll
  );
  const [isMutating, setIsMutating] = useState(false);

  const recalculate = useCallback(async () => {
    setIsMutating(true);
    try { await paymentMappingApi.recalculate(); refresh(); }
    finally { setIsMutating(false); }
  }, [refresh]);

  const setPreferred = useCallback(async (account: string, description: string, paymentMethod: string) => {
    await paymentMappingApi.setPreferred(account, description, paymentMethod);
    refresh();
  }, [refresh]);

  const deleteMapping = useCallback(async (account: string, description: string) => {
    await paymentMappingApi.deleteMapping(account, description);
    refresh();
  }, [refresh]);

  return { mappings: data ?? [], isLoading, isMutating, error, recalculate, setPreferred, deleteMapping };
}
```

Check `src/client/hooks/useFetch.ts` for the exact `useFetch` signature used in this project and match it.

- [ ] **Step 3: Implement `PaymentMappingPage`**

```typescript
// src/client/pages/PaymentMappingPage.tsx
// Props: none — page uses usePaymentMapping() hook.
// Layout mirrors CategoryMappingPage exactly.
```

The page has:
- Page title "Payment Mapping" + **Re-calculate** button (top right, calls `recalculate()`)
- **Conflicts section** (shown only when any `preferredPaymentMethod === null`, highlighted orange):
  - Each row: Account | Description | suggested method chips | Select to resolve → calls `setPreferred`
- **Mapping table**:
  - Columns: Account | Description | Payment Method (Input, saves on blur → calls `setPreferred`) | Delete icon → calls `deleteMapping`

Follow the exact structure of `CategoryMappingPage.tsx` — open that file first and mirror it.

- [ ] **Step 4: Write Storybook stories**

```typescript
// src/client/pages/PaymentMappingPage.stories.tsx
// Stories:
// - Empty: no mappings
// - WithMappings: several clean mappings
// - WithConflicts: one or more tie rows (preferredPaymentMethod null)
```

- [ ] **Step 5: Wire into `SettingsPage` + `App.tsx`**

SettingsPage uses a sidebar with `SETTINGS_MENU_ITEMS` (Layout + Sider + Outlet — **not tabs**). Two changes required:

**`src/client/pages/SettingsPage.tsx`** — add a menu entry to the `config-group` children:
```typescript
{ key: '/settings/payment-mapping', label: 'Payment Mapping' },
```

**`src/client/App.tsx`** — add a nested route inside `<Route path="/settings">`:
```tsx
import { PaymentMappingPage } from './pages/PaymentMappingPage.js';
// ...
<Route path="payment-mapping" element={<PaymentMappingPage />} />
```

The existing `CategoryMappingPage` is at `<Route path="mapping" ...>` — place the new route alongside it.

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run src/server
```

Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/client/httpClient/client.ts src/client/hooks/usePaymentMapping.ts src/client/pages/PaymentMappingPage.tsx src/client/pages/PaymentMappingPage.stories.tsx src/client/pages/SettingsPage.tsx src/client/App.tsx
git commit -m "feat(ui): add PaymentMappingPage, hook, and Settings sidebar entry"
```

---

## Behavior Rules
- Mapping is per-account (account name, not ID)
- Tie = same description, two or more payment methods with equal frequency within the same account
- Resolving a tie or editing a mapping via the Settings page DOES update the mapping table
- Auto-assignment during import: only applies when `row.paymentMethod === null` AND a clean (non-tie) mapping exists
- `recalculate()` only considers transactions that already have a non-null `paymentMethod`
- Payment methods are free-text strings — no canonical enum, no FK constraint
