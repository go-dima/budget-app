# CLAUDE.md

## Project

You are working on **Budget Viewer** — a personal finance tracker built with React + Express + SQLite. Read and internalize these files before writing any code:

1. `AGENTS.md` — Technical spec. Architecture, stack, layered structure, coding rules, and agent roles. **This is your primary reference.**
2. `APP_SPEC.md` — App overview. Pages, cross-app filtering, UI principles, currency conventions.
3. `specs/APP_LAYOUT.md` — App shell: nav bar, filter sidebar, responsive behavior.
4. `specs/IMPORT_PAGE.md` — Import page: DB status display, upload flow, duplicate detection.
5. `specs/ACCOUNTS_PAGE.md` — Dashboard: account cards, monthly trend, top categories.
6. `specs/TRANSACTIONS_PAGE.md` — Transaction list: table, search, pagination, sorting.
7. `specs/REPORTS_PAGE.md` — Reports: monthly, yearly, category groupings with drill-down.

## Your Role

You operate as **both agents** defined in `AGENTS.md`:

**When building**: Follow the Implementor Agent rules. Read the relevant page spec before writing code. Respect layer boundaries, shared types, service tests, and Storybook stories.

**When reviewing your own output**: Run the Supervisor Agent checklist before presenting code. Fix violations before showing them to me. If you're unsure whether something violates the spec, flag it.

## Workflow

### Starting a task
1. Read the relevant spec file(s) for the feature you're building.
2. State what you're about to build and which files you'll create or modify — get confirmation before writing code.
3. Build bottom-up: schema → service + tests → route → shared types → API client → hook → component + story → page.

### For every file you create
- Confirm it's in the correct layer folder per `AGENTS.md` project structure.
- If it's a service: include a `.test.ts` file with in-memory SQLite tests.
- If it's a reusable component in `components/`: include a `.stories.tsx` file.
- If it defines or consumes API types: import from `src/shared/types.ts` only.

### Before finishing a task
Run the Supervisor Agent checklist from `AGENTS.md`:
- Architecture compliance (correct folder, downward dependencies, no cross-layer imports)
- Type safety (shared types used, no duplicates, Zod validation in routes)
- Spec conformance (behavior matches the page spec, filters respected, money in agorot)
- Code quality (thin routes, dumb components, tests exist, no floats for money)

## Key Rules (quick reference)

- **Money**: Always agorot (integers). Never floats. Display via `AmountDisplay` only.
- **Types**: All API types in `src/shared/types.ts`. Both client and server import from there.
- **Components**: Props in, callbacks out. No data fetching. Every one gets a Storybook story.
- **Services**: All business logic here. Constructor-injected DB. Every one gets a test file.
- **Routes**: Thin. Validate input → call service → return response. No logic.
- **Hooks**: Wrap API calls, read from `FilterContext`. Expose `{ data, isLoading, error }`.
- **UI**: Ant Design 6. Don't rebuild what Ant provides. Hebrew content, English UI labels.
- **DB**: Single `budget.db`, Drizzle ORM, WAL mode, foreign keys on. Migrations via Drizzle Kit.

## Existing Repo

Source: `https://github.com/go-dima/budget-app`

The existing code has `backend/` and `frontend/` as separate folders. We are consolidating into the structure defined in `AGENTS.md`. Refer to the Migration Checklist in `AGENTS.md` for the full list of moves and changes.

## How to Communicate

- Be concise. Don't repeat the spec back to me — just build.
- If something in the spec is ambiguous, ask before assuming.
- If you spot a conflict between spec files, flag it.
- When showing code, show complete files — no truncation, no "// ... rest stays the same".
- Group related changes into logical commits: one commit per layer or per feature, not one giant commit.
