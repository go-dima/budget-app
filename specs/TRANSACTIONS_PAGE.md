# Transactions Page — Spec

**Route**: `/transactions`
**Purpose**: Filterable, sortable list of all transactions.

---

## Layout

Top to bottom:
1. **Filter Sidebar** (global, left side — see `specs/APP_LAYOUT.md`)
2. **Quick Stats** — summary row for the current filtered view
3. **Temp category chip** (optional) — shown when navigated from Reports/Accounts with a category filter
4. **Filter row** — in-page category multi-select + description search bar
5. **Transaction Table** — the main content

---

## Quick Stats

A compact summary strip showing stats for the **currently filtered and searched** transactions:

| Metric          | Description                    |
|-----------------|--------------------------------|
| Showing         | "1,247 transactions"           |
| Total Income    | Sum of income in current view  |
| Total Expenses  | Sum of expenses in current view|
| Net             | Income − Expenses              |

Updates immediately as filters or search change.

---

## Temp Category Filter (URL-based)

When navigating to `/transactions?categoryIds=<id>` (e.g., from clicking a category row in Reports or Accounts), the page pre-filters by that category:

- A dismissable blue `<Tag>` chip shows "Category: [name]" below the header, on the same row as the filter controls.
- Closing the chip navigates to `/transactions` (removes the filter).
- The URL param is cleared immediately on mount (the filter lives in component state, not the URL).
- This filter is **not** persisted — refreshing the page returns to unfiltered view.
- When active, `excludeCategories` is set to `[]` (overrides global exclusions) so the selected category is always visible.

---

## In-Page Filter Toolbar

Two rows of in-page controls above the transaction table. All filters are page-level state (temporal) — not persisted to `FilterContext` or the URL. Filter changes immediately re-fetch data.

### Row 1: Account · Date · Amount

| Control | Component | Behavior |
|---------|-----------|----------|
| **Account** multi-select | `MultiSelectFilter` (geekblue tags) | Filters to the selected accounts; clears sidebar date range when active |
| **Date range** picker | Ant `RangePicker` (month mode) | Overrides the global sidebar date range for this page |
| **Amount** range | Two `InputNumber` fields (Min ₪ / Max ₪) | Filters by absolute amount (agorot); debounced 500 ms before API call |

### Row 2: Category · Payment · Description

| Control | Component | Behavior |
|---------|-----------|----------|
| **Category** multi-select | `MultiSelectFilter` (blue tags, RTL) | Include-filter; overrides `excludeCategories` to `[]` when active |
| **Payment method** multi-select | `MultiSelectFilter` (purple tags) | Include-filter on `payment_method` column |
| **Description search** | `ToolbarSearch` (debounced, 400 ms) | On-type search — no button; fires API call after debounce; clearing resets |

Both rows use `display: flex; gap: 8px; flex-wrap: wrap; align-items: center`.

All multi-select controls support internal typing to filter options and a **Tab** shortcut to select the first unselected match.

---

## Transaction Table

An Ant Design `Table` component with the following columns:

| Column          | Field             | Sortable | Notes                                    |
|-----------------|-------------------|----------|------------------------------------------|
| Date            | `date`            | Yes      | Default sort: newest first               |
| Description     | `description`     | No       | Hebrew text, may be long — ellipsis with tooltip |
| Category        | `category.name`   | Yes      | Display category name. Hebrew text.      |
| Amount          | `amount`          | Yes      | `AmountDisplay` — red for expense, green for income |
| Account         | `account.name`    | Yes      | Account name                             |
| Payment Method  | `payment_method`  | No       | May be null — show "—" if empty          |

**Behavior**:
- Sortable columns toggle between ascending/descending on click.
- Default sort: date descending (newest first).
- Pagination: 50 rows per page (server-side pagination for performance).
- On mobile: table scrolls horizontally. Date and Amount columns are always visible; others scroll.
- **Alternating month row colors**: rows in even calendar months (`(year*12 + month) % 2 === 0`) receive a light blue tint (`#f0f5ff`). Rows in odd months remain white. This creates a visual band grouping by month without needing explicit group headers.

---

## URL-Based Pre-Filtering (Navigation)

Navigating from other pages passes a `?categoryIds=<id>` query param:
- `/transactions?categoryIds=<id>` — from clicking a category row in Reports or Accounts pages.
- The param is read once on mount into component state, then cleared from the URL.
- Shows as a dismissable chip (see Temp Category Filter above).

---

## Empty State

If no transactions match the current filters + search:
- Show the table header with no rows.
- Message below: "No transactions match your filters."
- If the entire DB is empty: "No data yet. Import transactions to get started." with a link to `/settings/import`.

---

## Components Used

| Component          | Purpose                                  |
|--------------------|------------------------------------------|
| `FilterSidebar`    | Global cross-app filters (in layout)     |
| `TransactionTable` | The main sortable, paginated table       |
| `AmountDisplay`    | Formatted currency with color coding     |

---

## API Endpoints

| Method | Endpoint              | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/api/transactions`   | Returns paginated transactions with filters |

**Query params**:
- `accountIds` — comma-separated account IDs
- `categoryIds` — comma-separated category IDs (include filter)
- `startDate`, `endDate` — ISO date strings
- `type` — `income` / `expense` / `all`
- `excludeCategories` — comma-separated category IDs to exclude
- `search` — free-text search string
- `paymentMethods` — comma-separated payment method strings (include filter)
- `amountMin`, `amountMax` — integer agorot; filter on `abs(amount)`
- `sortBy` — column name (`date`, `amount`, `category`, `account`)
- `sortOrder` — `asc` / `desc`
- `page` — page number (1-based)
- `pageSize` — rows per page (default 50)

**Response shape**:
```
{
  transactions: Transaction[],
  total: number,          // total matching rows (for pagination)
  totalIncome: number,    // sum of income in agorot (for quick stats)
  totalExpenses: number   // sum of expenses in agorot (for quick stats)
}
```

---

## Filter Sidebar

**Visible**. All filter changes reset to page 1 and re-fetch.

**"Last year" quick button** in the Date Range section: sets the date range to 12 months ending on the latest transaction date (not the current calendar date). This keeps the view centered on the actual data, not on today's date.

**Category search**: a text input above the category checkbox list allows typing to filter visible categories. Filtering is client-side only — it narrows the list without changing which categories are selected/excluded.
