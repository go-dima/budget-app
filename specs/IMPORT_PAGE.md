# Import Page — Spec

**Route**: `/settings/import`
**Purpose**: Upload Excel files to bootstrap the database or add incremental data.

---

## Active Database Badge

At the top of the page, shows the currently active database as a blue tag badge:

```
🗄 My Budget 2026
```

This is fetched on mount via `GET /api/databases` — the entry with `isActive: true`.

---

## Current DB Status (always visible)

When the page loads, it immediately shows the **current state of the active database**. This helps the user decide whether they need to import at all.

**If the database has data**:

Display a summary table:

| Account Name         | Transactions | Latest Date |
|----------------------|--------------|-------------|
| Bank Leumi Checking  | 1,247        | 2026-02-28  |
| Visa Cal             | 834          | 2026-03-01  |
| **Total**            | **2,081**    |             |

- One row per account showing: account name, transaction count, latest transaction date.
- A total row at the bottom with the sum of all transactions.
- A warning banner: "Importing will add new transactions. Confirmed duplicates (same date, amount, description, reference) are skipped automatically. Probable duplicates (same date, amount, reference) appear in the review step for your decision."
- An "Override" option: a button labeled **"Clear all data and re-import"** that wipes the DB before importing. Requires confirmation dialog ("This will delete all 2,081 transactions. Are you sure?").

**If the database is empty**:

Display a message: "No data yet. Upload an Excel file to get started."

---

## Upload Flow

### Step 1: File Selection

- Drag-and-drop zone or file picker button.
- Accepts `.xlsx` and `.xls` files.
- Multiple files can be selected at once.

### Step 1b: Header Row Selection (non-standard files)

If any sheet has rows before the header (detected via `detectedHeaderRow > 0`), a header-selection step is shown **before** Column Mapping or Preview.

Each sheet is shown with a scrollable raw-data grid. The user clicks a row to mark it as the header.

- **"Skip this sheet"** checkbox per sheet: when checked, the sheet's data table collapses and the sheet is excluded from all subsequent steps (column mapping, preview, and import). The checkbox is always enabled — skipping all sheets is valid (results in an empty import).
- Only non-skipped sheets are passed to the column mapping or preview steps.

### Step 2: Preview (standard files)

After file(s) are selected, the app parses them. If all columns are recognized, a preview is shown **before** any data is written.

For each sheet card, the header shows an **`AccountSelector`** instead of a plain rename field:
- A dropdown listing all existing accounts + "New account" option.
- Selecting an existing account merges the sheet's data into that account.
- Selecting "New account" reveals a text input (defaults to the sheet name) for the new account name.
- The sheet name is matched to existing accounts on load — pre-selects a match when found.

Additional sheet details:
- Number of rows detected
- Date range (earliest → latest)
- Sample rows (first 5 transactions): date, description, category, amount
- If the selected account already exists in the DB: "⚡ Account exists — X new rows will be added, Y confirmed duplicates skipped, Z probable duplicates for review"

A **"Confirm Import"** button at the bottom. Disabled until at least one sheet is selected.

### Step 2b: Column Mapping (non-standard files)

If any sheet contains columns not recognized by the built-in Hebrew mapping, the Column Mapping step is shown **instead of** the normal preview.

Each sheet section shows:
- An **`AccountSelector`** (same as in the preview step) to choose existing vs new account.
- If the sheet has unrecognized columns: a `MappingTable` for mapping source columns to target fields.
  - Known columns (matching built-in Hebrew headers) are pre-filled automatically.
  - Stored mappings from a previous import of the same account are pre-filled.
- If all columns are recognized: "All columns recognised — no mapping needed." message.

A **"Confirm & Import"** button is disabled until every unrecognized column in every sheet has a target field assigned or ignored.

**Ignore button**: each row in the mapping table has a dedicated "Ignore" button. Clicking it marks the column as `ignore` (it will be skipped during import). This is separate from the target-field dropdown — `ignore` is not an option in the dropdown.

**Account names carry forward**: the account name selected in the `AccountSelector` during column mapping is pre-filled in the preview step's `AccountSelector`. The user can still change it before confirming import.

On confirm:
- Column mapping step stores the account overrides and column mapping in memory.
- The **preview step** is shown next (not skipped) — the user can review the parsed data and deselect sheets before importing.
- Account overrides from the column mapping step are pre-filled in the preview's `AccountSelector` widgets.
- On preview confirm, account overrides, column mappings, and selected sheets are sent to `executeImport`.
- Column mappings are persisted to `account_column_mapping` (keyed by effective account name).
- DB status panel is **hidden** during this step.

### Step 3: Category Review

After import, ALL imported transactions are shown for review, **grouped by account** using Ant `Tabs` (one tab per account). Transactions within each tab are sorted newest-to-oldest.

Each row shows:
- Editable category selector (`SearchableDropdown`).
- Editable payment method field (`SearchableDropdown` with `allowCreate` — user can type a free-form value).
- A skip checkbox to exclude the transaction from the import entirely.

A "Save & Continue" button at the top applies all overrides (bulk-categorize, bulk-set-payment-method, bulk-delete skipped) and navigates to Summary.

### Step 4: Import Execution

On confirm (Step 2 or Step 2b):
1. Create accounts that don't exist yet.
2. Create categories that don't exist yet (from "קטגוריה" column, or mapped `category` field).
3. Insert transactions, skipping duplicates.
4. Auto-categorize via `description_category_map`.
5. Log the import in `import_logs`.

Show a progress indicator during import (can be simple — "Importing sheet 1/3...").

### Step 4b: Background Mapping Recalculation

Immediately after the review step is saved (or after import if there are no transactions to review), both category and payment-method mappings are recalculated in the background:

- `POST /api/category-mapping/recalculate`
- `POST /api/payment-mapping/recalculate`

These run in parallel (`Promise.all`) and do **not** block navigation to the Summary step. On completion, an Ant `notification` appears at the top of the screen:
- **Success**: "Mappings applied — X category and Y payment assignments applied." (or "No new mappings to apply." if none)
- **Error**: "Mapping recalculation failed — ..." with a hint to retry from the mapping pages.

### Step 5: Import Summary

After import completes, show:

| Account              | New Transactions | Duplicates Skipped |
|----------------------|------------------|--------------------|
| Bank Leumi Checking  | 312              | 5                  |
| Visa Cal             | 198              | 0                  |
| **Total**            | **510**          | **5**              |

- A "Go to Overview" button that navigates to `/`.
- A "Import More" button that resets the form for another upload.

---

## Excel Format

Hebrew column headers expected:

| Column (Hebrew) | Description              |
|-----------------|--------------------------|
| תאריך            | Transaction date         |
| תיאור            | Description              |
| אמצעי תשלום      | Payment method           |
| קטגוריה          | Category                 |
| פירוט            | Additional details       |
| אסמכתא           | Reference number         |
| חובה             | Expense amount           |
| זכות             | Income amount            |
| יתרה             | Running balance          |

Each sheet in the file = one account. The sheet name becomes the account name.

---

## Duplicate Detection

Detection runs in two tiers:

**Confirmed duplicates** — all four fields match an existing transaction in the same account:
`date`, `amount` (agorot), `description`, `reference`. Skipped silently; counted in the summary.

**Probable duplicates** — `date`, `amount`, and `reference` match, but `description` differs.
Only applies when `reference` is non-null and non-empty (e.g. bidi-mangled descriptions that
produce a different string for the same bank transaction). These rows are included in the
Category Review step, pre-marked as "skip", with a yellow "Probable duplicate" warning tag
showing the existing description in a tooltip. The user can un-skip them to import anyway.

---

## Components Used

| Component             | Purpose                                                      |
|-----------------------|--------------------------------------------------------------|
| `DbStatusTable`       | Shows current DB state (account, count, date)                |
| `ImportPreview`       | Per-file/sheet preview with sample rows                      |
| `AccountSelector`     | Dropdown of existing accounts + "New account" + name input  |
| `ColumnMappingStep`   | Per-sheet account selector + column mapper (all valid sheets)|
| `CategoryReview`      | Post-import transaction review with category selectors       |
| `ImportSummary`       | Post-import results table                                    |
| `AmountDisplay`       | Format amounts in preview sample rows                        |
| `MappingTable`        | Shared Source Column → Maps To table used inside `ColumnMappingStep` |

Note: `DbPicker` is **not** on this page. Database management (create, switch, rename, delete) lives on the Databases page (`/settings/databases`).

---

## API Endpoints

| Method | Endpoint                        | Description                              |
|--------|---------------------------------|------------------------------------------|
| GET    | `/api/import/status`            | Returns per-account transaction count and latest date. Optional `?filename=` param to query a specific DB without switching. |
| POST   | `/api/import/preview`           | Parses uploaded file(s), returns preview data. Response includes `unknownColumns` and `storedColumnMapping` per sheet when non-standard columns are detected. |
| POST   | `/api/import/execute`           | Executes import. Accepts optional `columnMapping` in body. Returns summary + `transactionsForReview`. |
| DELETE | `/api/import/reset`             | Clears all data (for override flow)      |
| GET    | `/api/column-mapping/:account`  | Returns stored column mapping for an account |
| POST   | `/api/column-mapping/:account`  | Saves column mapping entries for an account |
| DELETE | `/api/column-mapping/:account`  | Removes all column mappings for an account |

---

## Edge Cases

- **Empty sheets**: Skip silently, note in preview ("Sheet 'X' has no data rows — skipping").
- **Missing columns**: If required columns (תאריך, תיאור, חובה/זכות) are missing, show an error for that sheet. Other sheets can still be imported.
- **Invalid dates or amounts**: Skip the row, count as "skipped" in summary with a reason.
- **Very large files**: Import in batches (500 rows per DB transaction) to avoid locking.
- **File with only duplicate data**: Import summary shows 0 new, all skipped. This is not an error.

---

## Filter Sidebar

**Hidden** on this page (it's a Settings sub-route). Import is a standalone workflow — page content takes the full width.
