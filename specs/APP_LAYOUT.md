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
│            │    ReportsPage, or ImportPage)       │
│            │                                     │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

---

## Navigation Bar (top)

A horizontal bar fixed to the top of the viewport.

**Contents** (left to right):
- **App name/logo**: "Budget Viewer" — clicking navigates to `/`.
- **Page links**: Accounts (`/`), Transactions (`/transactions`), Reports (`/reports`), Import (`/import`).
- Active page link is visually highlighted.

**Behavior**:
- Always visible on all pages.
- On mobile: collapses to a hamburger menu (Ant `Menu` with `mode="horizontal"` handles this).
- No right-side content (no user avatar, no settings) — single user, no auth.

**Component**: Use Ant Design `Layout.Header` + `Menu` with `mode="horizontal"`.

---

## Filter Sidebar (left)

A vertical panel on the left side containing all cross-app filter controls.

**Contents** (top to bottom):
1. **Account filter**: Ant `Select` with `mode="multiple"`. Label: "Accounts". Placeholder: "All accounts".
2. **Category filter**: Ant `Select` with `mode="multiple"`. Label: "Categories". Placeholder: "All categories".
3. **Date range**: Ant `DatePicker.RangePicker`. Label: "Date Range". Default: last 12 months.
4. **Type filter**: Ant `Radio.Group` or `Segmented`. Options: All / Income / Expense. Default: All.
5. **Excluded categories toggle**: Ant `Switch`. Label: "Show excluded categories". Default: off.
6. **Reset button**: "Reset Filters" — clears all filters to defaults.

**Behavior**:
- Visible on all pages **except** `/import`. On the Import page, the sidebar is hidden and the page content takes the full width.
- Changing any filter immediately updates the active page's data.
- Filter state lives in `FilterContext` and is synced to URL query params.
- Account and category dropdowns are populated from the database on app load. If the DB is empty, they show no options.

**Responsive (mobile)**:
- On screens below 768px, the sidebar collapses into a **drawer** triggered by a filter icon button in the nav bar.
- The drawer slides in from the left, contains the same filter controls, and has a "Close" / "Apply" button.
- Filter icon shows a badge/dot when any non-default filter is active.

**Component**: Use Ant Design `Layout.Sider` (collapsible) on desktop, Ant `Drawer` on mobile.

---

## Page Content Area

The main area to the right of the sidebar (or full-width on Import page).

- Renders the active route component.
- Scrolls independently from the sidebar and nav bar.
- Has consistent padding (16px on mobile, 24px on desktop).

---

## Layout Component Tree

```
<App>
  <FilterProvider>              ← FilterContext wraps everything
    <Layout>
      <Layout.Header>
        <NavBar />              ← Top navigation
      </Layout.Header>
      <Layout>
        <Layout.Sider>          ← Hidden on /import and mobile
          <FilterSidebar />
        </Layout.Sider>
        <Layout.Content>
          <Routes>
            <Route path="/" element={<AccountsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/import" element={<ImportPage />} />
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
| `NavBar`         | `components/NavBar/`            | Top navigation bar               |
| `FilterSidebar`  | `components/FilterSidebar/`     | Left-side filter panel           |
| `AppLayout`      | `client/App.tsx` or `components/AppLayout/` | Assembles nav + sidebar + content |

All three get Storybook stories.

---

## Filter Bar → Filter Sidebar Rename

The previous specs reference `FilterBar` as a component. This is now `FilterSidebar` — a left-side panel, not a top bar. All page specs should be read with this understanding:
- "Filter Bar visible" → the sidebar is shown.
- "Filter Bar not shown" (Import page) → the sidebar is hidden, content is full-width.
