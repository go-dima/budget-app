# Config Page — Spec

**Purpose**: Application settings. Currently used to configure which categories are hidden from the default view across all pages.

---

## Route

`/settings/categories`

---

## Layout

The Config page lives inside the Settings shell (`SettingsPage`). The filter sidebar is hidden on all Settings routes; the Settings page uses its own left-panel menu for sub-navigation.

---

## Sections

### Default Hidden Categories

A list of all categories in the database, each with a toggle switch.

- **Label**: "Default Hidden Categories"
- **Description**: "Categories toggled on below are hidden from all views by default. Uncheck them in the filter sidebar to temporarily reveal them."
- Each row shows:
  - Category name (Hebrew, RTL)
  - Category type badge (`income` / `expense`)
  - Toggle switch — **ON (Show)** means visible by default, **OFF (Hide)** means hidden by default

**Toggle semantics** (matches UX): the switch is ON when the category is visible (not excluded). Toggling OFF marks it as `excludedByDefault = true` in the DB.

**Sort order** (top to bottom):
1. Expense categories first, income second
2. Within each type: hidden categories (excludedByDefault = true) first, visible last
3. Within each group: alphabetical by name

**Behavior**:
- Changes are saved immediately on toggle (no save button needed).
- After toggling, `refreshCategoriesData()` is called from `FilterContext` so the sidebar filter updates immediately.
- On app load, excluded categories are automatically applied to all filter queries via `FilterContext`.

---

## Data

- **Source**: `GET /api/categories` — returns all categories with `excludedByDefault: boolean`
- **Update**: `PATCH /api/categories/:id/exclude` with body `{ excluded: boolean }`
  - `excluded: true` → category is hidden by default (`excludedByDefault = true`)
  - `excluded: false` → category is visible by default (`excludedByDefault = false`)
- **Effect**: After toggling, call `refreshCategoriesData()` from `FilterContext` so the sidebar filter updates immediately.

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
