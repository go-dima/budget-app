# Transactions Page — Spec

**Route**: `/transactions`
**Purpose**: Filterable, sortable list of all transactions.

---

## Layout

Top to bottom:
1. **Filter Sidebar** (global, left side — see `specs/APP_LAYOUT.md`)
2. **Quick Stats** — summary row for the current filtered view
3. **Search Bar** — free-text search on description
4. **Transaction Table** — the main content

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

## Search Bar

- Free-text input above the table.
- Searches on `description` field (substring match, case-insensitive).
- Debounced (300ms) — no submit button needed.
- Combined with global filters (AND logic — search applies within the filtered set).
- Clear button to reset search.

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

---

## URL-Based Pre-Filtering

The page accepts query params to pre-set filters, enabling deep linking from other pages:
- `/transactions?account={id}` — from clicking an account card on the Accounts page.
- `/transactions?category={id}` — from clicking a category on the Accounts page.
- These merge with the global filter context (query params override the context for the specific field).

---

## Empty State

If no transactions match the current filters + search:
- Show the table header with no rows.
- Message below: "No transactions match your filters."
- If the entire DB is empty: "No data yet. Import transactions to get started." with a link to `/import`.

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
- `categoryIds` — comma-separated category IDs
- `startDate`, `endDate` — ISO date strings
- `type` — `income` / `expense` / `all`
- `excludeCategories` — comma-separated category IDs to exclude
- `search` — free-text search string
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
