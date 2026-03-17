# Accounts Page — Spec

**Route**: `/` (home page)
**Purpose**: Dashboard showing account balances, spending trends, and category breakdown.

---

## Layout

Top to bottom:
1. **Filter Sidebar** (global, left side — see `specs/APP_LAYOUT.md`)
2. **Total Summary** — single row of key numbers
3. **Account Cards** — one card per account
4. **Monthly Trend Chart** — income vs. expenses over time
5. **Top Categories** — spending breakdown for the selected period

---

## Total Summary

A highlight strip at the top showing aggregated numbers for the filtered period:

| Metric           | Description                              |
|------------------|------------------------------------------|
| Total Balance    | Sum of latest balance across all filtered accounts |
| Total Income     | Sum of all income transactions in period |
| Total Expenses   | Sum of all expense transactions in period|
| Net              | Income − Expenses for the period         |

All values use `AmountDisplay` with appropriate color coding.

---

## Account Cards

A grid of cards (responsive — 2-3 columns on desktop, 1 on mobile). One card per account included in the current filter.

Each card shows:
- **Account name**
- **Current balance** (latest balance value from transactions)
- **Income** total for the filtered period (green)
- **Expenses** total for the filtered period (red)
- **Transaction count** for the filtered period

**Interaction**: Clicking a card navigates to `/transactions?account={accountId}` — pre-filtered for that account.

---

## Monthly Trend Chart

A bar chart (or grouped bar chart) showing **income vs. expenses per month** for the filtered period.

- X-axis: months (e.g., "Jan 2026", "Feb 2026")
- Y-axis: amount in ₪
- Two bars per month: income (green), expenses (red)
- Default range: last 12 months (adjustable via filter bar date range)
- Hover/tap shows tooltip with exact amounts

If the filtered period is less than 2 months, show a message instead: "Select a longer date range to see trends."

---

## Top Categories

A horizontal bar chart or pie chart showing expense breakdown by category for the filtered period.

- Top 10 categories by total expense amount.
- Each bar/slice shows: category name, total amount, percentage of total expenses.
- Categories excluded via the filter toggle are hidden.
- Clicking a category navigates to `/transactions?category={categoryId}` — pre-filtered.

---

## Empty State

If the database has no transactions (fresh install, or all data was cleared):
- Show a friendly message: "No transaction data yet."
- Show a prominent button: **"Import Data"** → navigates to `/import`.
- Don't render charts or cards.

---

## Components Used

| Component                | Purpose                                      |
|--------------------------|----------------------------------------------|
| `FilterSidebar`            | Global cross-app filters (in layout)     |
| `AccountCard`            | Per-account summary card                     |
| `AmountDisplay`          | Formatted currency display                   |
| `MonthlyTrendChart`      | Income vs. expenses bar chart                |
| `CategoryBreakdownChart` | Top categories pie/bar chart                 |

---

## API Endpoints

| Method | Endpoint                      | Description                                  |
|--------|-------------------------------|----------------------------------------------|
| GET    | `/api/accounts/summary`       | Returns per-account summary (balance, income, expenses, count) for filtered period |
| GET    | `/api/reports/monthly-trend`  | Returns income/expenses per month for filtered period |
| GET    | `/api/reports/top-categories` | Returns top N categories by expense for filtered period |

All endpoints accept filter query params: `accountIds`, `categoryIds`, `startDate`, `endDate`, `type`, `excludeCategories`.

---

## Filter Sidebar

**Visible**. All filter changes immediately update the summary, cards, and charts.
