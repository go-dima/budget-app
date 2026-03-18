# Config Page — Spec

**Purpose**: Application settings. Currently used to configure which categories are hidden from the default view across all pages.

---

## Route

`/config`

---

## Layout

The Config page is full-width (no filter sidebar). It uses the standard NavBar.

---

## Sections

### Default Excluded Categories

A list of all categories in the database, each with a toggle switch.

- **Label**: "Default Hidden Categories"
- **Description**: "Categories toggled off are hidden from all views by default. Use the 'Show excluded categories' switch in the sidebar to temporarily reveal them."
- Each row shows:
  - Category name (Hebrew, RTL)
  - Category type badge (`income` / `expense`)
  - Toggle switch — ON means hidden by default, OFF means visible

**Behavior**:
- Changes are saved immediately on toggle (no save button needed).
- The filter sidebar's "Show excluded categories" switch only appears when at least one category is marked as excluded here.
- On app load, excluded categories are automatically applied to all filter queries via `FilterContext`.

---

## Data

- **Source**: `GET /api/categories` — returns all categories with `excludedByDefault: boolean`
- **Update**: `PATCH /api/categories/:id/exclude` with body `{ excluded: boolean }`
- **Effect**: After toggling, call `refreshExcludedCategories()` from `FilterContext` so the sidebar filter updates immediately.

---

## DB

The `categories` table has an `excluded_by_default` integer column (0 = visible, 1 = hidden).
This is a global setting — the same exclusions apply regardless of which accounts are selected.

---

## Component

| Component    | Location                       |
|--------------|-------------------------------|
| `ConfigPage` | `src/client/pages/ConfigPage.tsx` |

No reusable sub-components needed. No Storybook story required (page-level component).
