# Budget Viewer — Tech Debt (TECH_DEBT.md)

Items to consider for future improvement. None of these are blockers for V1.

---

## 1. Replace Express with Hono

**What**: Swap Express.js for [Hono](https://hono.dev) as the HTTP server.

**Why consider it**: Hono is a modern, lightweight web framework built with TypeScript from the ground up. It's significantly smaller than Express (~14KB vs ~200KB+ with types), starts faster (relevant for Raspberry Pi cold starts), and has built-in TypeScript support without needing `@types/express`. Its API is similar enough to Express that migration is mostly mechanical — route handlers, middleware, and request/response patterns map almost 1:1. Hono also has a built-in typed client (`hc`) that can generate fetch wrappers from route definitions, which would reduce the manual work in `api/client.ts`. For a resource-constrained Pi deployment, the smaller footprint and faster startup are a practical benefit, not just a theoretical one.

**Effort**: Medium. Route handlers translate directly. Main work is swapping middleware (CORS, static file serving, body parsing) to Hono equivalents, which all exist but have slightly different APIs.

**When**: After V1 is stable and working. This is a drop-in replacement, not an architecture change.

---

## 2. Replace REST + shared types with tRPC

**What**: Replace the REST API layer and `src/shared/types.ts` with [tRPC](https://trpc.io).

**Why consider it**: The current approach uses manually maintained type definitions in `shared/types.ts` that both client and server import. This works, but it introduces a sync risk — if a service return type changes and `shared/types.ts` isn't updated, the client gets stale types with no compile error. tRPC eliminates this entirely. You define your API as typed procedures on the server (with Zod validation for inputs), and the client infers all types automatically — no shared type file, no codegen, no manual sync. When you change a service, the client gets compile errors immediately if the contract breaks. For the hooks in `client/hooks/`, tRPC also bundles React Query integration, so `useTransactions` would get caching, loading states, and refetch logic for free instead of wiring it up manually. The tradeoff is a new abstraction layer and a learning curve — tRPC has its own patterns for routers, procedures, and context that are different from Express routes.

**Effort**: Medium-high. Requires rewriting all route handlers as tRPC procedures, replacing `api/client.ts` with a tRPC client, updating all hooks to use tRPC's React Query integration, and removing `shared/types.ts`. The services layer stays unchanged — tRPC routers would call the same services.

**When**: Consider after the `shared/types.ts` approach becomes a pain point — e.g., if you find yourself frequently forgetting to update shared types after schema changes, or if the number of endpoints grows significantly beyond the current ~6.

---

## 3. Other items

_Add future tech debt items here as they come up during development._
