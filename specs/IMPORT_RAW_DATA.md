# Import Raw Data (Column Mapping) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow importing Excel files whose column names don't match the app's known Hebrew bank format. When unknown columns are detected during preview, prompt the user to map each source column to a destination field. Persist that mapping per account so it pre-fills on future imports.

**Architecture:** Add a `Column Mapping` step between `preview` and `importing` in the import flow. A new `account_column_mapping` table (keyed by account name + source column) stores the mapping. `excelParser.ts` gains a `detectColumns()` export and an optional `customMap` parameter in `parseSheet`/`getSheetMeta`. `ImportService.previewFile` reports unknown columns; `executeImport` accepts and persists a `ColumnMappingMap`.
The mapping will be available to view in the settings panel, the user will be able to modify it if needed

**Tech Stack:** Drizzle ORM (SQLite), Express, React, Ant Design 6, `createTestDb()` for service tests, Storybook for component stories. All shared types in `src/shared/types.ts`.

> **Migration sequencing:** If PAYMENT_MAPPING is implemented in the same branch, its `0004_*` migration already exists — `npx drizzle-kit generate` will automatically assign `0005_*` to this feature's migration. No manual renumbering needed.

---

## Background: Current Column Detection

`excelParser.ts` exports a static `COLUMN_MAPPING` (Hebrew column header → internal field name). `parseSheet()` scans each row until it finds cells matching that map; the first matching row becomes the header. If no matching row is found, `parseSheet` returns `[]` and the sheet appears as empty (0 rows) in the preview.

The new feature hooks into this: when `parseSheet` returns empty due to an unrecognized header, the server detects those unknown column names and returns them to the client to trigger the mapping UI.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/db/schema.ts` | Add `accountColumnMapping` table |
| Generate | `src/db/migrations/0004_*.sql` | Drizzle-generated migration |
| Modify | `src/shared/types.ts` | Add `ColumnMappingTarget`, `ColumnMappingEntry`, `ColumnMappingMap`; extend `ImportPreviewSheet`, `ImportExecuteRequest` |
| Create | `src/server/services/ColumnMappingService.ts` | CRUD for stored column mappings |
| Create | `src/server/services/ColumnMappingService.test.ts` | In-memory SQLite tests |
| Modify | `src/server/utils/excelParser.ts` | Add `detectColumns()`; add `customMap?` param to `parseSheet` + `getSheetMeta` |
| Modify | `src/server/services/ImportService.ts` | Use `ColumnMappingService` in preview and execute |
| Modify | `src/server/routes/import.ts` | Pass `columnMapping` from body to `executeImport` |
| Create | `src/server/routes/columnMapping.ts` | CRUD endpoints |
| Modify | `src/server/routes/index.ts` | Register `/api/column-mapping` |
| Create | `src/client/components/ColumnMappingStep/ColumnMappingStep.tsx` | Per-sheet column mapper UI |
| Create | `src/client/components/ColumnMappingStep/ColumnMappingStep.stories.tsx` | Storybook stories |
| Modify | `src/client/httpClient/client.ts` | Update `importApi.execute` signature |
| Modify | `src/client/hooks/useImportFlow.ts` | Add `columnMapping` step between `preview` and `importing` |
| Modify | `src/client/pages/ImportPage.tsx` | Render `ColumnMappingStep` |

---

## Target Fields

The destination values a user can assign to a source column:

```
date | description | expense | income | balance | payment_method | category | details | reference | ignore
```

These mirror the field names in `excelParser.COLUMN_MAPPING` plus `ignore` for columns to discard.

---

## Task 1: Schema — `account_column_mapping` table

**Files:**
- Modify: `src/db/schema.ts`
- Generate: `src/db/migrations/` (via drizzle-kit)

- [ ] **Step 1: Add table to schema**

In `src/db/schema.ts`, add a composite-PK table (import `primaryKey` from `drizzle-orm/sqlite-core`):

```typescript
import { sqliteTable, text, integer, unique, primaryKey } from 'drizzle-orm/sqlite-core';

export const accountColumnMapping = sqliteTable(
  'account_column_mapping',
  {
    account: text('account').notNull(),
    sourceColumn: text('source_column').notNull(),
    targetField: text('target_field').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.account, t.sourceColumn] }),
  })
);
```

- [ ] **Step 2: Generate migration**

```bash
cd /Users/go.dima/github/budget-app && npx drizzle-kit generate
```

Expected: new `src/db/migrations/0004_*.sql` containing `CREATE TABLE \`account_column_mapping\``.

- [ ] **Step 3: Verify existing tests still pass**

```bash
npx vitest run src/server
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat(db): add account_column_mapping table"
```

---

## Task 2: Shared Types

**Files:**
- Modify: `src/shared/types.ts`

- [ ] **Step 1: Add column mapping types**

```typescript
export type ColumnMappingTarget =
  | 'date' | 'description' | 'expense' | 'income' | 'balance'
  | 'payment_method' | 'category' | 'details' | 'reference' | 'ignore';

export interface ColumnMappingEntry {
  sourceColumn: string;
  targetField: ColumnMappingTarget;
}

// key = sheet name (= account name); value = user's column assignments for that sheet
export type ColumnMappingMap = Record<string, ColumnMappingEntry[]>;
```

- [ ] **Step 2: Extend `ImportPreviewSheet`**

Add two optional fields to `ImportPreviewSheet`:

```typescript
// Non-null when the sheet has columns not in the built-in COLUMN_MAPPING.
unknownColumns: string[] | null;
// Pre-filled from stored mapping if one exists for this account; null otherwise.
storedColumnMapping: ColumnMappingEntry[] | null;
```

- [ ] **Step 3: Extend `ImportExecuteRequest`**

Add:

```typescript
// Required when any previewed sheet had unknownColumns.
columnMapping?: ColumnMappingMap;
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/types.ts
git commit -m "feat(types): add ColumnMapping types; extend ImportPreviewSheet and ImportExecuteRequest"
```

---

## Task 3: `ColumnMappingService`

**Files:**
- Create: `src/server/services/ColumnMappingService.ts`
- Create: `src/server/services/ColumnMappingService.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/server/services/ColumnMappingService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from '../../db/index.js';
import { ColumnMappingService } from './ColumnMappingService.js';
import type { DB } from '../../db/index.js';

describe('ColumnMappingService', () => {
  let db: DB;
  let svc: ColumnMappingService;

  beforeEach(() => {
    db = createTestDb();
    svc = new ColumnMappingService(db);
  });

  it('returns null for unknown account', () => {
    expect(svc.getForAccount('unknown')).toBeNull();
  });

  it('stores and retrieves a mapping', () => {
    svc.save('MyBank', [
      { sourceColumn: 'Date', targetField: 'date' },
      { sourceColumn: 'Desc', targetField: 'description' },
    ]);
    const result = svc.getForAccount('MyBank');
    expect(result).toHaveLength(2);
    expect(result![0]).toMatchObject({ sourceColumn: 'Date', targetField: 'date' });
  });

  it('overwrites existing mapping on re-save', () => {
    svc.save('MyBank', [{ sourceColumn: 'Date', targetField: 'date' }]);
    svc.save('MyBank', [{ sourceColumn: 'Date', targetField: 'ignore' }]);
    const result = svc.getForAccount('MyBank');
    expect(result).toHaveLength(1);
    expect(result![0]!.targetField).toBe('ignore');
  });

  it('save with empty array removes all entries for account', () => {
    svc.save('MyBank', [{ sourceColumn: 'Date', targetField: 'date' }]);
    svc.save('MyBank', []);
    expect(svc.getForAccount('MyBank')).toBeNull();
  });

  it('deleteForAccount removes all entries', () => {
    svc.save('MyBank', [{ sourceColumn: 'Date', targetField: 'date' }]);
    svc.deleteForAccount('MyBank');
    expect(svc.getForAccount('MyBank')).toBeNull();
  });

  it('mappings for different accounts are independent', () => {
    svc.save('BankA', [{ sourceColumn: 'Col1', targetField: 'date' }]);
    svc.save('BankB', [{ sourceColumn: 'Col1', targetField: 'description' }]);
    expect(svc.getForAccount('BankA')![0]!.targetField).toBe('date');
    expect(svc.getForAccount('BankB')![0]!.targetField).toBe('description');
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/server/services/ColumnMappingService.test.ts
```

Expected: FAIL with `Cannot find module './ColumnMappingService.js'`.

- [ ] **Step 3: Implement `ColumnMappingService`**

```typescript
// src/server/services/ColumnMappingService.ts
import { eq } from 'drizzle-orm';
import { accountColumnMapping } from '../../db/schema.js';
import type { DB } from '../../db/index.js';
import type { ColumnMappingEntry } from '../../shared/types.js';

export class ColumnMappingService {
  constructor(private db: DB) {}

  getForAccount(account: string): ColumnMappingEntry[] | null {
    const rows = this.db
      .select()
      .from(accountColumnMapping)
      .where(eq(accountColumnMapping.account, account))
      .all();
    if (rows.length === 0) return null;
    return rows.map(r => ({
      sourceColumn: r.sourceColumn,
      targetField: r.targetField as ColumnMappingEntry['targetField'],
    }));
  }

  save(account: string, entries: ColumnMappingEntry[]): void {
    this.db.delete(accountColumnMapping)
      .where(eq(accountColumnMapping.account, account))
      .run();
    if (entries.length === 0) return;
    this.db.insert(accountColumnMapping)
      .values(entries.map(e => ({ account, sourceColumn: e.sourceColumn, targetField: e.targetField })))
      .run();
  }

  deleteForAccount(account: string): void {
    this.db.delete(accountColumnMapping)
      .where(eq(accountColumnMapping.account, account))
      .run();
  }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/server/services/ColumnMappingService.test.ts
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/ColumnMappingService.ts src/server/services/ColumnMappingService.test.ts
git commit -m "feat(service): add ColumnMappingService with CRUD and tests"
```

---

## Task 4: Extend `excelParser.ts`

**Files:**
- Modify: `src/server/utils/excelParser.ts`

- [ ] **Step 1: Add `detectColumns` export**

`detectColumns` is only ever called **after** `parseSheet` already returned `[]` (i.e., the sheet has no recognized headers). This makes it a safe fallback — no false positives on sheets the existing parser handles correctly.

Add after the `COLUMN_MAPPING` declaration:

```typescript
/**
 * Called only when parseSheet() returned []. Scans the first 20 rows for
 * a candidate header row (first row with 2+ non-numeric text cells) and
 * partitions its cells into known (in COLUMN_MAPPING) and unknown.
 */
export function detectColumns(
  sheet: XLSX.WorkSheet
): { known: string[]; unknown: string[] } {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as unknown[][];
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] ?? [];
    const cells = row
      .filter(c => c != null)
      .map(c => String(c).trim())
      .filter(s => s.length > 0 && isNaN(Number(s)));
    if (cells.length >= 2) {
      return {
        known: cells.filter(c => c in COLUMN_MAPPING),
        unknown: cells.filter(c => !(c in COLUMN_MAPPING)),
      };
    }
  }
  return { known: [], unknown: [] };
}
```

- [ ] **Step 2: Add optional `customMap` param to `parseSheet`**

Change the signature:

```typescript
export function parseSheet(
  sheet: XLSX.WorkSheet,
  customMap?: Record<string, string>  // source column header → field name
): ParsedTransaction[]
```

Inside `parseSheet`, replace `if (cellStr in COLUMN_MAPPING)` with:

```typescript
const effectiveMap = customMap ?? COLUMN_MAPPING;
// ... (use effectiveMap everywhere COLUMN_MAPPING was referenced)
```

- [ ] **Step 3: Add optional `customMap` param to `getSheetMeta`**

```typescript
export function getSheetMeta(
  buffer: Buffer,
  sheetName: string,
  customMap?: Record<string, string>
): SheetMeta
```

Pass `customMap` through: `const txns = parseSheet(sheet, customMap)`.

- [ ] **Step 4: Verify existing tests still pass**

```bash
npx vitest run src/server
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/server/utils/excelParser.ts
git commit -m "feat(parser): add detectColumns; add optional customMap param to parseSheet/getSheetMeta"
```

---

## Task 5: Update `ImportService`

**Files:**
- Modify: `src/server/services/ImportService.ts`

- [ ] **Step 1: Update `previewFile` to detect unknown columns**

Add `ColumnMappingService` import. Inside the sheet loop, after `getSheetMeta`, add:

```typescript
const colSvc = new ColumnMappingService(this.db);
// ...inside sheet loop, for each sheet after the sheetName is known:
// Only call detectColumns as fallback when parseSheet found no rows (unknown columns)
const ws = workbook.Sheets[sheetName];
const parsedCheck = ws ? parseSheet(ws) : [];
const { unknown } = (parsedCheck.length === 0 && ws) ? detectColumns(ws) : { unknown: [] };
// Note: stored mapping is looked up by raw sheet name (= account name when no override).
// Pre-fill only works when the sheet name matches the stored account name exactly.
// Sheets imported with a name override previously will not get pre-fill. Accepted v1 limitation.
const storedColumnMapping = unknown.length > 0 ? colSvc.getForAccount(sheetName) : null;
```

Add `unknownColumns` and `storedColumnMapping` fields to the object pushed into `sheets[]`:

```typescript
sheets.push({
  // ...existing fields...
  unknownColumns: unknown.length > 0 ? unknown : null,
  storedColumnMapping,
});
```

Import `detectColumns` from `'../utils/excelParser.js'`.

- [ ] **Step 2: Update `executeImport` signature to accept `columnMapping`**

```typescript
executeImport(
  fileId: string,
  filename: string,
  sheetNameOverrides: Record<string, string> = {},
  selectedSheets?: string[],
  columnMapping?: ColumnMappingMap
): ImportExecuteResponse
```

Inside the sheet loop, before `parseSheet`, resolve the effective column map:

```typescript
const colSvc = new ColumnMappingService(this.db);
// ...inside sheet loop:
const accountName = sheetNameOverrides[sheetName] || sheetName;
const suppliedEntries = columnMapping?.[sheetName];
if (suppliedEntries && suppliedEntries.length > 0) {
  colSvc.save(accountName, suppliedEntries); // persist for next import
}
const effectiveEntries = suppliedEntries ?? colSvc.getForAccount(accountName) ?? [];
const customMap: Record<string, string> | undefined =
  effectiveEntries.length > 0
    ? Object.fromEntries(
        effectiveEntries
          .filter(e => e.targetField !== 'ignore')
          .map(e => [e.sourceColumn, e.targetField])
      )
    : undefined;

const parsed = parseSheet(sheet, customMap);
```

Import `ColumnMappingService` and `ColumnMappingMap` at the top.

- [ ] **Step 3: Run all service tests**

```bash
npx vitest run src/server
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/server/services/ImportService.ts
git commit -m "feat(import): integrate ColumnMappingService into preview and execute"
```

---

## Task 6: Update import route + API client

**Files:**
- Modify: `src/server/routes/import.ts`
- Create: `src/server/routes/columnMapping.ts`
- Modify: `src/server/routes/index.ts`
- Modify: `src/client/httpClient/client.ts`

- [ ] **Step 1: Update `src/server/routes/import.ts` — pass `columnMapping` to `executeImport`**

In the `/execute` handler, extract `columnMapping` from `req.body` and pass it as the 5th argument:

```typescript
const { fileId, filename, sheetNameOverrides, selectedSheets, columnMapping } = req.body as {
  fileId: string;
  filename: string;
  sheetNameOverrides?: Record<string, string>;
  selectedSheets?: string[];
  columnMapping?: ColumnMappingMap;
};
const service = new ImportService(dbManager.getDb());
res.json(service.executeImport(fileId, filename, sheetNameOverrides ?? {}, selectedSheets, columnMapping));
```

Import `ColumnMappingMap` from `../../shared/types.js`.

- [ ] **Step 2: Create `src/server/routes/columnMapping.ts`**

```typescript
// src/server/routes/columnMapping.ts
import { Router } from 'express';
import { dbManager } from '../../db/manager.js';
import { ColumnMappingService } from '../services/ColumnMappingService.js';
import type { ColumnMappingEntry } from '../../shared/types.js';

const router = Router();

router.get('/:account', (req, res) => {
  try {
    const svc = new ColumnMappingService(dbManager.getDb());
    res.json(svc.getForAccount(req.params.account!) ?? []);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/:account', (req, res) => {
  try {
    const { entries } = req.body as { entries?: unknown };
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' });
    const svc = new ColumnMappingService(dbManager.getDb());
    svc.save(req.params.account!, entries as ColumnMappingEntry[]);
    res.json({ saved: entries.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:account', (req, res) => {
  try {
    const svc = new ColumnMappingService(dbManager.getDb());
    svc.deleteForAccount(req.params.account!);
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
```

- [ ] **Step 3: Register in `src/server/routes/index.ts`**

```typescript
import columnMappingRouter from './columnMapping.js';
// ...
router.use('/column-mapping', columnMappingRouter);
```

- [ ] **Step 4: Update `importApi.execute` in `src/client/httpClient/client.ts`**

The file uses `request<T>()` directly (no `post()` helper). Update the existing `execute` entry:

```typescript
execute: (
  fileId: string,
  filename: string,
  sheetNameOverrides?: Record<string, string>,
  selectedSheets?: string[],
  columnMapping?: ColumnMappingMap
) =>
  request<ImportExecuteResponse>('/api/import/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, filename, sheetNameOverrides, selectedSheets, columnMapping }),
  }),
```

Add `ColumnMappingMap` to the import list at the top of `client.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/server/routes/import.ts src/server/routes/columnMapping.ts src/server/routes/index.ts src/client/httpClient/client.ts
git commit -m "feat(route): wire columnMapping through import execute route and API client"
```

---

## Task 7: `ColumnMappingStep` component

**Files:**
- Create: `src/client/components/ColumnMappingStep/ColumnMappingStep.tsx`
- Create: `src/client/components/ColumnMappingStep/ColumnMappingStep.stories.tsx`

- [ ] **Step 1: Implement the component**

Props interface:
```typescript
interface SheetToMap {
  sheetName: string;
  unknownColumns: string[];
  storedMapping: ColumnMappingEntry[] | null;
}

interface Props {
  sheets: SheetToMap[];
  onConfirm: (mapping: ColumnMappingMap) => void;
  isLoading: boolean;
}
```

Render one Ant Design `Table` per sheet. Each row is a source column; the second column is a `Select` with options for each `ColumnMappingTarget`:

| Label | Value |
|-------|-------|
| Date | `date` |
| Description | `description` |
| Expense | `expense` |
| Income | `income` |
| Balance | `balance` |
| Payment Method | `payment_method` |
| Category | `category` |
| Details | `details` |
| Reference | `reference` |
| Ignore | `ignore` |

Pre-fill each row from `storedMapping` if available. Local state tracks current selections per sheet. Disable the "Confirm Mapping" button until every column in every sheet has a selection. On confirm, call `onConfirm` with the built `ColumnMappingMap`. Show a note: *"This mapping will be saved and pre-filled on future imports for this account."*

- [ ] **Step 2: Write Storybook stories**

```typescript
// Stories:
// - NoStoredMapping: 3 unknown columns, no stored mapping
// - WithStoredMapping: 3 unknown columns, pre-filled from stored mapping
// - MultipleSheets: two sheets each with unknown columns
// - Loading: isLoading = true, button disabled
```

- [ ] **Step 3: Commit**

```bash
git add src/client/components/ColumnMappingStep/
git commit -m "feat(component): add ColumnMappingStep with stories"
```

---

## Task 8: Wire up `useImportFlow` + `ImportPage`

**Files:**
- Modify: `src/client/hooks/useImportFlow.ts`
- Modify: `src/client/pages/ImportPage.tsx`

- [ ] **Step 1: Update step type in `useImportFlow.ts`**

The current step type is: `'status' | 'preview' | 'importing' | 'review' | 'summary'`

Add `'columnMapping'` between `'preview'` and `'importing'`:

```typescript
type Step = 'status' | 'preview' | 'columnMapping' | 'importing' | 'review' | 'summary';
```

- [ ] **Step 2: Update `handleConfirm`, add `handleColumnMappingConfirm`**

**Why not go to `'preview'` after mapping:** the preview data was fetched before the mapping was known — sheets with unknown columns have `rowCount: 0`. Showing that stale data confuses the user. For files with column mapping, execution happens immediately after the mapping is confirmed; the sheet selection step is skipped (all sheets are imported).

Update `handleConfirm` to accept an optional `columnMapping` parameter and pass it to `importApi.execute`:

```typescript
async function handleConfirm(
  sheetNameOverrides: Record<string, string> = {},
  selectedSheets: string[] = [],
  columnMapping?: ColumnMappingMap
) {
  if (!preview) return;
  setStep('importing');
  setIsLoading(true);
  try {
    const data = await importApi.execute(
      preview.fileId, currentFilename, sheetNameOverrides, selectedSheets, columnMapping
    );
    setResult(data);
    setReviewTransactions(data.transactionsForReview);
    setStep(data.results.some(r => r.error === null) ? 'review' : 'summary');
    loadStatus();
  } catch (e) {
    message.error(`Import failed: ${String(e)}`);
    setStep('preview');
  } finally {
    setIsLoading(false);
  }
}
```

Add `handleColumnMappingConfirm` — it calls `handleConfirm` directly, bypassing the preview step:

```typescript
function handleColumnMappingConfirm(mapping: ColumnMappingMap) {
  // Execute immediately — no separate preview for files with unknown columns
  handleConfirm({}, [], mapping);
}
```

After `setPreview(data)` in `handleFileSelect`, decide which step to show:

```typescript
const needsColumnMapping = data.sheets.some(s => (s.unknownColumns ?? []).length > 0);
setStep(needsColumnMapping ? 'columnMapping' : 'preview');
```

Return `handleColumnMappingConfirm` from the hook.

- [ ] **Step 3: Update `ImportPage.tsx`**

Add a `case 'columnMapping':` branch to the step renderer:

```tsx
case 'columnMapping': {
  const sheetsToMap = (preview?.sheets ?? [])
    .filter(s => (s.unknownColumns ?? []).length > 0)
    .map(s => ({
      sheetName: s.sheetName,
      unknownColumns: s.unknownColumns!,
      storedMapping: s.storedColumnMapping ?? null,
    }));
  return (
    <ColumnMappingStep
      sheets={sheetsToMap}
      onConfirm={handleColumnMappingConfirm}
      isLoading={isLoading}
    />
  );
}
```

- [ ] **Step 4: Manual smoke test**

1. Prepare an Excel file with non-Hebrew column names (e.g. "Date", "Description", "Amount")
2. Upload — preview should trigger the Column Mapping step (not the normal preview)
3. Map all columns and click "Confirm Mapping"
4. Proceed through normal preview → import → category review → summary
5. Re-upload the same file — column mapping should be pre-filled and skipped to normal preview

- [ ] **Step 5: Commit**

```bash
git add src/client/hooks/useImportFlow.ts src/client/pages/ImportPage.tsx
git commit -m "feat(import): add column mapping step to import flow"
```

---

## Behavior Rules
- The Column Mapping step only appears when `unknownColumns` is non-null and non-empty on at least one sheet
- Sheets with all-known columns are not affected; a mixed file processes each sheet independently
- The mapping is persisted by account name at execute time (not at confirm time) to avoid persisting abandoned flows
- `ignore`-targeted columns are excluded from the effective map passed to `parseSheet`
- If a stored mapping exists for an account, it is pre-filled in the `ColumnMappingStep` UI but always overrideable
- A file whose sheets all have recognized Hebrew columns never triggers the Column Mapping step
