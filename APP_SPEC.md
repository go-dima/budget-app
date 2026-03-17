# Budget Viewer — App Overview (APP_SPEC.md)

## What It Does

A personal budget viewer for importing Israeli bank transaction data (from Excel exports) and analyzing spending patterns. Read-heavy — import once, browse and analyze often.

---

## Users

Single user (the owner). No authentication. Accessed from multiple personal devices via local network.

---

## Pages

| Page           | Route              | Spec File                    | Purpose                                      |
|----------------|--------------------|------------------------------|----------------------------------------------|
| App Layout     | (all)              | `specs/APP_LAYOUT.md`        | Nav bar, filter sidebar, responsive shell    |
| Import         | `/import`          | `specs/IMPORT_PAGE.md`       | Upload Excel files, bootstrap or add data    |
| Accounts       | `/`                | `specs/ACCOUNTS_PAGE.md`     | Dashboard — balances, trends, top categories |
| Transactions   | `/transactions`    | `specs/TRANSACTIONS_PAGE.md` | Filterable transaction list                  |
| Reports        | `/reports`         | `specs/REPORTS_PAGE.md`      | Aggregated reports by month/category/year    |

---

## Cross-App Filtering

A **persistent filter sidebar** on the left side, visible on all pages except Import. Filters apply globally across Accounts, Transactions, and Reports. See `specs/APP_LAYOUT.md` for full layout details and responsive behavior.

**Controls**:
- **Account**: multi-select dropdown. Default: all.
- **Category**: multi-select dropdown. Default: all.
- **Date range**: start and end date pickers. Default: last 12 months.
- **Type**: income / expense / all. Default: all.
- **Excluded categories**: toggle to show/hide categories marked as excluded (e.g., internal transfers). Default: hidden.

**Behavior**:
- Filters persist across page navigation within a session (React context).
- Changing a filter immediately updates the current page's data.
- "Reset filters" button clears all to defaults.
- Filter state is reflected in URL query params (bookmarkable).

---

## UI Principles

- **Mobile-friendly**: Accessed from phone on the same network. Tables scroll horizontally on small screens. Key numbers readable at a glance.
- **Hebrew content, English UI**: Transaction data is Hebrew (RTL text). App labels and navigation are English. No full RTL layout — just ensure Hebrew text renders correctly in cells and labels.
- **Ant Design**: Use Ant components as the base. Don't reinvent what Ant provides.
- **Minimal clicks**: Filters always visible. Overview answers common questions without navigation.
- **Color convention**: Expenses red. Income green. Neutral/transfers grey. Consistent everywhere.

---

## Currency & Formatting

- Currency: **ILS (₪)**.
- Display format: `₪1,234.56` — symbol prefix, comma thousands, 2 decimal places.
- Storage: integers in **agorot** (×100). Formatting is frontend-only via `AmountDisplay`.

---

## Data Lifecycle

```
Excel file (bank export)
    → Import page (preview & confirm)
        → budget.db (transactions, accounts, categories)
            → Accounts / Transactions / Reports (read & display)
                ↑ filtered by cross-app filter bar
```

No manual transaction entry. All data comes from Excel imports.

---

## What's NOT In Scope (V1)

- Multi-user or authentication
- Budgets / spending targets
- Manual transaction entry or editing
- Category management UI (rename, merge, icons, colors)
- Cloud sync or backup
- Bank API connections
- Multi-currency
- CSV/PDF export
- Recurring transaction detection
- Notifications or alerts
