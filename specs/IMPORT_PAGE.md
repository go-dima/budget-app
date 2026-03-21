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
- A warning banner: "Importing will add new transactions. Duplicates (same date, amount, description, reference) are skipped automatically."
- An "Override" option: a button labeled **"Clear all data and re-import"** that wipes the DB before importing. Requires confirmation dialog ("This will delete all 2,081 transactions. Are you sure?").

**If the database is empty**:

Display a message: "No data yet. Upload an Excel file to get started."

---

## Upload Flow

### Step 1: File Selection

- Drag-and-drop zone or file picker button.
- Accepts `.xlsx` and `.xls` files.
- Multiple files can be selected at once.

### Step 2: Preview

After file(s) are selected, the app parses them and shows a preview **before** any data is written.

For each file, show:
- Filename
- Detected sheets (each becomes an account)

For each sheet, show:
- Sheet name (= account name)
- Number of rows detected
- Date range (earliest → latest)
- Sample rows (first 5 transactions): date, description, category, amount
- If the account already exists in the DB: "⚡ Account exists — X new rows will be added, Y duplicates will be skipped" (requires a quick duplicate check against existing data)

A **"Confirm Import"** button at the bottom. Disabled until at least one file is parsed.

### Step 3: Import Execution

On confirm:
1. Create accounts that don't exist yet.
2. Create categories that don't exist yet (from "קטגוריה" column).
3. Insert transactions, skipping duplicates.
4. Log the import in `import_logs`.

Show a progress indicator during import (can be simple — "Importing sheet 1/3...").

### Step 4: Import Summary

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

A transaction is considered a duplicate if **all four** match an existing transaction in the same account:
- `date`
- `amount` (in agorot)
- `description`
- `reference`

Duplicates are skipped silently — counted in the summary but not flagged as errors.

---

## Components Used

| Component        | Purpose                                          |
|------------------|--------------------------------------------------|
| `DbStatusTable`  | Shows current DB state (account, count, date)    |
| `ImportPreview`  | Per-file/sheet preview with sample rows           |
| `ImportSummary`  | Post-import results table                         |
| `AmountDisplay`  | Format amounts in preview sample rows             |

Note: `DbPicker` is **not** on this page. Database management (create, switch, rename, delete) lives on the Databases page (`/settings/databases`).

---

## API Endpoints

| Method | Endpoint                  | Description                              |
|--------|---------------------------|------------------------------------------|
| GET    | `/api/import/status`      | Returns per-account transaction count and latest date. Optional `?filename=` param to query a specific DB without switching. |
| POST   | `/api/import/preview`     | Parses uploaded file(s), returns preview data |
| POST   | `/api/import/execute`     | Executes import, returns summary         |
| DELETE | `/api/import/reset`       | Clears all data (for override flow)      |

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
