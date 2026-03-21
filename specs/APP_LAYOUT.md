# App Layout — Spec

**Purpose**: The persistent shell that wraps all pages. Contains the top navigation bar and the left-side filter sidebar.

---

## Structure

```
┌──────────────────────────────────────────────────┐
│  Navigation Bar (top)                            │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Filter    │         Page Content                │
│  Sidebar   │                                     │
│  (left)    │   (renders active route:            │
│            │    AccountsPage, TransactionsPage,   │
│            │    ReportsPage, or SettingsPage)     │
│            │                                     │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

---

## Navigation Bar (top)

A horizontal bar fixed to the top of the viewport.

**Contents** (left to right):
- **App name/logo**: "Budget Viewer" — clicking navigates to `/`.
- **Page links**: Accounts (`/`), Transactions (`/transactions`), Reports (`/reports`).
- **Settings button**: at the right edge of the header (outside the Menu). Navigates to `/settings`. Shown as `type="primary"` when on any `/settings/*` route, otherwise as a text button in white.
- Active page link is visually highlighted.

**Behavior**:
- Always visible on all pages.
- On mobile: collapses to a hamburger menu (Ant `Menu` with `mode="horizontal"` handles this).
- Import and Config are no longer top-level nav items — they live under Settings.

**Component**: Use Ant Design `Layout.Header` + `Menu` with `mode="horizontal"`. Settings button uses Ant `Button` with `SettingOutlined` icon, placed with `margin-left: auto` via flex.

---

## Filter Sidebar (left)

A vertical panel on the left side containing all cross-app filter controls.

**Contents** (top to bottom):
1. **Account filter**: Ant `Select` with `mode="multiple"`. Label: "Accounts". Placeholder: "All accounts".
2. **Type filter**: Ant `Radio.Group` or `Segmented`. Options: All / Income / Expense. Default: All.
3. **Date range**: Ant `DatePicker.RangePicker`. Label: "Date Range". Default: last 12 months.
   - **Apply** button lives inside the picker popup's `renderExtraFooter` — commits pending dates to the global filter.
   - **Full time** and **Last year** quick-filter buttons appear below the picker in the sidebar (outside the popup).
4. **Categories**: Ant `Select` with `mode="multiple"`. Label: "Excluded Categories". Placeholder: "None excluded".
   - Three quick-filter tags above the list: **All** (show everything), **None** (hide everything), **Preset** (restore DB defaults).
   - Categories sorted: expense types first, then income; alphabetically within each group.
5. **Reset button**: "Reset Filters" — clears all filters to defaults.

**Behavior**:
- Visible on all pages **except** `/settings/*`. On all Settings sub-pages, the sidebar is hidden and the page content takes the full width.
- Changing any filter immediately updates the active page's data.
- Filter state lives in `FilterContext` and is synced to URL query params (except date range which is local state).
- Account and category dropdowns are populated from the database on app load. If the DB is empty, they show no options.
- `defaultExcludedIds` (from FilterContext) is passed to the sidebar to power the **Preset** quick-filter button.

**Responsive (mobile)**:
- On screens below 768px, the sidebar collapses into a **drawer** triggered by a filter icon button in the nav bar.
- The drawer slides in from the left, contains the same filter controls.
- Filter icon shows a badge/dot when any non-default filter is active.

**Component**: Use Ant Design `Layout.Sider` (collapsible) on desktop, Ant `Drawer` on mobile.

---

## Page Content Area

The main area to the right of the sidebar (or full-width on Settings pages).

- Renders the active route component.
- Scrolls independently from the sidebar and nav bar.
- Has consistent padding (16px on mobile, 24px on desktop).

---

## Routes

```
/                       → AccountsPage
/transactions           → TransactionsPage
/reports                → ReportsPage
/settings               → redirect to /settings/categories
/settings/categories    → ConfigPage (hidden categories toggles)
/settings/databases     → DatabasesPage (list, create, switch, rename, delete DBs)
/settings/import        → ImportPage (active DB badge + upload flow)
```

---

## Layout Component Tree

```
<App>
  <FilterProvider>              ← FilterContext wraps everything
    <Layout>
      <Layout.Header>
        <NavBar />              ← Top navigation + Settings button
      </Layout.Header>
      <Layout>
        <Layout.Sider>          ← Hidden on /settings/* and mobile
          <FilterSidebar />
        </Layout.Sider>
        <Layout.Content>
          <Routes>
            <Route path="/" element={<AccountsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />}>
              <Route index element={<Navigate to="categories" />} />
              <Route path="categories" element={<ConfigPage />} />
              <Route path="databases" element={<DatabasesPage />} />
              <Route path="import" element={<ImportPage />} />
            </Route>
          </Routes>
        </Layout.Content>
      </Layout>
    </Layout>
  </FilterProvider>
</App>
```

---

## Components

| Component        | Location                        | Purpose                          |
|------------------|---------------------------------|----------------------------------|
| `NavBar`         | `components/NavBar/`            | Top navigation bar + Settings button |
| `FilterSidebar`  | `components/FilterSidebar/`     | Left-side filter panel           |
| `AppLayout`      | `components/AppLayout/`         | Assembles nav + sidebar + content |
| `SettingsPage`   | `pages/SettingsPage.tsx`        | Settings shell with left-panel menu and Outlet |

---

## Filter Bar → Filter Sidebar Rename

The previous specs reference `FilterBar` as a component. This is now `FilterSidebar` — a left-side panel, not a top bar. All page specs should be read with this understanding:
- "Filter Bar visible" → the sidebar is shown.
- "Filter Bar not shown" (Settings pages) → the sidebar is hidden, content is full-width.
