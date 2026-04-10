# Settings Page — Spec

**Route**: `/settings` (redirects to `/settings/categories`)
**Purpose**: Container for app configuration. Groups database management and category visibility settings.

---

## Layout

Two-column layout with a left-panel menu and a content area on the right:

```
┌─────────────┬──────────────────────────┐
│ ⚙ Settings  │  <sub-page content>      │
│             │                          │
│ Config      │                          │
│   Hidden    │                          │
│   Categories│                          │
│   Category  │                          │
│   Mapping   │                          │
│   Payment   │                          │
│   Mapping   │                          │
│   Column    │                          │
│   Mapping   │                          │
│             │                          │
│ Database    │                          │
│   Databases │                          │
│   Import    │                          │
└─────────────┴──────────────────────────┘
```

- Left panel: Ant `Menu` with grouped items. Selected item is highlighted.
- Right content: React Router `<Outlet>` renders the active sub-route.
- Filter sidebar is **hidden** on all Settings sub-routes.

---

## Sub-Routes

| Path                       | Component                    | Purpose                                    |
|----------------------------|------------------------------|--------------------------------------------|
| `/settings/categories`     | `ConfigPage`                 | Toggle which categories are hidden by default |
| `/settings/mapping`        | `CategoryMappingPage`        | View and edit per-account description→category mappings |
| `/settings/payment-mapping`| `PaymentMappingPage`         | View and edit per-account description→payment method mappings |
| `/settings/column-mapping` | `ColumnMappingSettingsPage`  | View and edit per-account source column→field mappings |
| `/settings/databases`      | `DatabasesPage`              | List, create, switch, rename, delete databases |
| `/settings/import`         | `ImportPage`                 | Upload Excel files into the active database |

Navigating to `/settings` redirects to `/settings/categories`.

---

## Navigation

The **Settings** button in the NavBar (right edge, `SettingOutlined` icon) navigates to `/settings`. It shows as `type="primary"` when on any `/settings/*` route.

---

## Databases Sub-Page (`/settings/databases`)

Shows the `DbPicker` component (list of databases) and the `DbStatusTable` for the selected/viewed database.

**Viewing a database without switching**:
- Clicking any row in the DB list shows that DB's state in `DbStatusTable` without switching the active DB.
- The viewed row is highlighted in blue.
- `DbStatusTable` is read-only (no Reset button) when viewing a non-active database.
- The active database shows a "Active" tag; others show a "Load" button.

---

## Components

| Component                   | Location                                         | Purpose                                  |
|-----------------------------|--------------------------------------------------|------------------------------------------|
| `SettingsPage`              | `src/client/pages/SettingsPage.tsx`              | Left-panel layout with Outlet            |
| `ConfigPage`                | `src/client/pages/ConfigPage.tsx`                | Hidden categories toggles                |
| `CategoryMappingPage`       | `src/client/pages/CategoryMappingPage.tsx`       | Description→category mapping table       |
| `PaymentMappingPage`        | `src/client/pages/PaymentMappingPage.tsx`        | Description→payment method mapping table |
| `ColumnMappingSettingsPage` | `src/client/pages/ColumnMappingSettingsPage.tsx` | Source column→field mapping table        |
| `DatabasesPage`             | `src/client/pages/DatabasesPage.tsx`             | DB list + state viewer                   |
| `ImportPage`                | `src/client/pages/ImportPage.tsx`                | Upload flow                              |
| `DbPicker`                  | `src/client/components/DbPicker/`                | DB list with CRUD actions                |
| `DbStatusTable`             | `src/client/components/DbStatusTable/`           | Per-account transaction counts           |
| `MappingPage`               | `src/client/components/MappingPage/`             | Generic mapping page shell (accounts tabs, toolbar, table, recalculate) |
| `MappingTable`              | `src/client/components/MappingTable/`            | Reusable source-column→target-field table with optional delete |
