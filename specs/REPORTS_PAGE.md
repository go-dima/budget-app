# Reports Page — Spec

**Route**: `/reports`
**Purpose**: Aggregated financial reports grouped by month, year, or category.

---

## Layout

Top to bottom:
1. **Filter Sidebar** (global, left side — see `specs/APP_LAYOUT.md`)
2. **Grouping Selector** — toggle between report types
3. **Report Table** — aggregated data
4. **Report Chart** — visual representation of the same data

---

## Grouping Selector

A segmented control (Ant `Segmented` or radio buttons) at the top of the page:

| Option        | Groups data by   |
|---------------|------------------|
| **Monthly**   | Calendar month   |
| **Yearly**    | Calendar year    |
| **Category**  | Category name    |

Default: **Monthly**. Selection persists during the session but resets on page reload.

---

## Monthly Report

**Table columns**:

| Column       | Description                         |
|--------------|-------------------------------------|
| Month        | "Jan 2026", "Feb 2026", etc.       |
| Income       | Total income for the month (green)  |
| Expenses     | Total expenses for the month (red)  |
| Net          | Income − Expenses                   |
| Top Category | Highest expense category that month |

**Sort**: Newest month first.

**Chart**: Grouped bar chart — same as the Monthly Trend on the Accounts page, but for the full filtered range (not capped to 12 months).

**Drill-down**: Clicking a row expands it (or navigates) to show a **per-category breakdown** for that month:

| Category   | Amount   | % of Expenses |
|------------|----------|---------------|
| מזון       | ₪1,200   | 24%           |
| שכירות     | ₪3,500   | 70%           |
| ...        | ...      | ...           |

---

## Yearly Report

**Table columns**:

| Column       | Description                         |
|--------------|-------------------------------------|
| Year         | "2024", "2025", "2026"             |
| Income       | Total income for the year (green)   |
| Expenses     | Total expenses for the year (red)   |
| Net          | Income − Expenses                   |
| Avg Monthly  | Expenses ÷ number of months with data |

**Sort**: Newest year first.

**Chart**: Bar chart — one group per year showing income vs. expenses.

**Drill-down**: Clicking a row expands to show the monthly breakdown for that year (same structure as the monthly report, scoped to that year).

---

## Category Report

**Table columns**:

| Column          | Description                                |
|-----------------|--------------------------------------------|
| Category        | Category name (Hebrew)                     |
| Total Amount    | Sum of expenses in this category           |
| % of Total      | Percentage of total expenses               |
| Transaction Count | Number of transactions in this category  |
| Avg Transaction | Total ÷ count                              |

**Sort**: Highest total amount first.

**Chart**: Horizontal bar chart or pie chart showing category distribution.

**Drill-down**: Clicking a category row navigates to `/transactions?category={id}` pre-filtered. Transactions with no assigned category appear as a special **"Uncategorized"** row; clicking it has no drill-down navigation.

---

## Behavior

- All reports respect the global cross-app filters.
- Changing the grouping selector re-renders the table and chart immediately (client-side switch if data is already loaded, or re-fetch if needed).
- All amounts use `AmountDisplay`.
- Excluded categories are hidden unless the filter toggle includes them.
- If no data matches filters: "No data for the selected filters."

---

## Components Used

| Component                | Purpose                              |
|--------------------------|--------------------------------------|
| `FilterBar`              | Global cross-app filters             |
| `AmountDisplay`          | Formatted currency with color coding |
| `MonthlyTrendChart`      | Reused from Accounts page for monthly/yearly charts |
| `CategoryBreakdownChart` | Reused from Accounts page for category chart |

Note: The charts on this page may need to handle larger datasets than on the Accounts page (full date range instead of 12 months). Ensure they degrade gracefully with many data points.

---

## API Endpoints

| Method | Endpoint                     | Description                              |
|--------|------------------------------|------------------------------------------|
| GET    | `/api/reports/by-month`      | Returns monthly aggregations (income, expenses, net, top category) |
| GET    | `/api/reports/by-year`       | Returns yearly aggregations              |
| GET    | `/api/reports/by-category`   | Returns per-category aggregations        |
| GET    | `/api/reports/month-detail`  | Returns per-category breakdown for a specific month |
| GET    | `/api/reports/year-detail`   | Returns monthly breakdown for a specific year |

All endpoints accept the standard filter query params: `accountIds`, `categoryIds`, `startDate`, `endDate`, `type`, `excludeCategories`.

---

## Filter Sidebar

**Visible**. All filter changes immediately re-fetch the current report.
