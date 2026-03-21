# CATEGORY_MAPPING.md

## Purpose
Build a per-account description→category mapping that auto-categorizes new transactions during import and is manageable via a settings tab.

## Route
`/settings/mapping`

## Data Model

New table `description_category_map`:
| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | uuid |
| `account` | TEXT NOT NULL | account name |
| `description` | TEXT NOT NULL | transaction description |
| `category_id` | TEXT FK → categories | NULL when conflicted |
| `conflict_options` | TEXT | JSON string[] of category IDs when conflicted |
| UNIQUE | `(account, description)` | one mapping per account+description |

**Conflict state**: `category_id IS NULL AND conflict_options IS NOT NULL` → user must resolve before this entry is used for auto-categorization.
**No-op rule**: If an existing clean mapping already matches the observed category, skip it.

## Import Flow (Updated)

```
Upload → Preview → Execute → Category Review → Summary
```

**Execute step** (server-side):
1. Insert transactions (existing behavior)
2. For each newly inserted transaction with no category: check `description_category_map` for (account, description). If a clean mapping exists, auto-assign that category.
3. Return ALL imported transactions in `transactionsForReview` with `autoAssigned` flag.

**Category Review step** (new UI step between Execute and Summary):
- Shows ALL imported transactions grouped into two sections:
  - "Auto-categorized": transactions where `autoAssigned === true`
  - "Uncategorized": transactions with no category after mapping
- Each row: Date | Description | Amount | Category (searchable Select, type by name) | Clear button
- Modifying a category here does NOT update the mapping table
- "Save & Continue" → apply overrides → go to Summary

## Settings Tab: Category Mapping

New tab in SettingsPage (`/settings/mapping`), component `CategoryMappingPage`.

Layout:
- Page title "Category Mapping" + **Re-calculate** button (top right)
- **Conflicts section** (shown only when conflicts exist, highlighted orange):
  - Each row: Account | Description | conflicting category chips | Resolve dropdown → saves immediately
- **Mapping table**:
  - Columns: Account | Description | Category (editable searchable Select) | Delete icon
  - All saves are immediate (no explicit Save button)

**Re-calculate behavior** (server-side):
1. Scan all transactions with a non-null `category_id`
2. Group by `(account_name, description)` → collect distinct category IDs per group
3. If 1 distinct category: upsert clean mapping (no-op if already matches)
4. If >1 distinct categories: upsert conflict (category_id=NULL, conflict_options=JSON array)
5. Return `{ updated, conflicts, noops }`

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/category-mapping` | List all mappings |
| POST | `/api/category-mapping/recalculate` | Re-scan DB and update mapping table |
| PATCH | `/api/category-mapping/:account/:description` | Update category for a mapping |
| DELETE | `/api/category-mapping/:account/:description` | Remove a mapping entry |
| POST | `/api/transactions/bulk-categorize` | Apply category overrides after import review |

## Shared Types (additions to `src/shared/types.ts`)

```typescript
export interface CategoryMapping {
  account: string;
  description: string;
  categoryId: string | null;
  conflictOptions: string[] | null;
  category?: Category;
  conflictCategories?: Category[];
}

export interface RecalculateResult {
  updated: number;
  conflicts: number;
  noops: number;
}

export interface ImportedTransactionReview {
  id: string;
  accountName: string;
  date: string;
  description: string;
  amount: number; // agorot
  categoryId: string | null;
  categoryName: string | null;
  autoAssigned: boolean;
}
```

`ImportExecuteResponse` gains a new field: `transactionsForReview: ImportedTransactionReview[]`.

## Components

| Component | File | Notes |
|-----------|------|-------|
| `CategoryReview` | `src/client/components/CategoryReview/CategoryReview.tsx` | Import review step; props: transactions, categories, onSave, isLoading |
| `CategoryMappingPage` | `src/client/pages/CategoryMappingPage.tsx` | Settings tab page |

Both components require a `.stories.tsx` file.

## Behavior Rules
- Mapping is per-account (account name, not ID)
- Conflicts = same description, different categories within the same account
- Resolving a conflict or editing the mapping table DOES update the mapping
- Changing category in the import review does NOT update the mapping
- `recalculate()` only considers transactions that already have a category
