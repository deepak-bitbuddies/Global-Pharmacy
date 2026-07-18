<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Development & Architecture Guidelines

This is a production-grade Quick Commerce Admin Panel built with Next.js (App
Router), TypeScript, Tailwind CSS, Shadcn UI, Zustand, TanStack Query, React
Hook Form, Zod, Axios, and a Node.js + Fastify backend. The project is
expected to scale to 100+ modules and multiple developers — every change must
preserve consistency, maintainability, reusability, scalability, and clean
architecture.

**Status:** target architecture for new work. The current tree (`app/`,
`components/`, `services/`, `lib/`, `store/`) predates this and has not been
migrated — do not assume `modules/` exists until it's actually created.

## Target folder structure

```text
src/
│
├── app/                                # Next.js App Router ONLY
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/                            # Next proxy routes
│   ├── layout.tsx
│   ├── globals.css
│   └── favicon.ico
│
├── modules/                            # Feature-first architecture
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── schema/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── enums/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── dashboard/
│   ├── products/
│   ├── categories/
│   ├── brands/
│   ├── orders/
│   ├── customers/
│   ├── sellers/
│   ├── stores/
│   ├── inventory/
│   ├── delivery/
│   ├── coupons/
│   ├── promotions/
│   ├── banners/
│   ├── notifications/
│   ├── analytics/
│   ├── reports/
│   ├── settings/
│   ├── users/
│   ├── roles/
│   └── permissions/
│
├── components/                         # Shared reusable components ONLY
│   ├── ui/
│   ├── forms/
│   ├── layout/
│   ├── tables/
│   ├── charts/
│   ├── navigation/
│   ├── feedback/
│   └── common/
│
├── providers/
├── hooks/                              # Global reusable hooks ONLY
├── lib/                                # Framework utilities
├── config/
├── constants/
├── utils/
├── store/                              # Global Zustand stores ONLY
├── types/
├── styles/
├── assets/
└── i18n/
```

## Development rules

1. **Feature-first architecture.** Every business feature lives inside its
   own module under `modules/{feature}/` (api, components, hooks, services,
   schema, types, constants, enums, utils, pages). Never mix feature-specific
   files into global folders.
2. **Shared components** in `components/` are only for truly reusable UI
   (Button, Input, Select, Modal, Dialog, Drawer, Card, DataTable,
   Pagination, EmptyState, Skeleton, Header, Sidebar). Feature-specific UI
   stays inside its module.
3. **Keep App Router thin.** Page files only compose a feature page, e.g.
   `app/(dashboard)/products/page.tsx` just renders `<ProductListPage />` —
   no business logic in `app/`.
4. **API layer.** Never call Axios/fetch directly from components. API
   methods live in `modules/{feature}/api/` (e.g. `getProducts()`,
   `createProduct()`, `updateProduct()`, `deleteProduct()`).
5. **Business logic** belongs in hooks, services, or utilities — never
   inside UI components. Components only render UI.
6. **Shared hooks** in `hooks/` are only for generic hooks (`useDebounce`,
   `useMediaQuery`, `useLocalStorage`). Feature hooks live in their module.
7. **No hardcoded values** — strings, statuses, labels, permissions, routes,
   limits, regex, storage keys, query keys, cookie names. Use enums or
   constants.
8. **Enums** for every static value. Feature enums in `modules/{feature}/
   enums`; shared enums in `constants/`.
9. **Constants.** Every module maintains its own constants; shared constants
   go in `constants/`.
10. **Theme colors.** Never hardcode colors (`text-red-500`, `bg-blue-500`,
    `#ff0000`). Always use design tokens — add a CSS variable + Tailwind
    token first if one doesn't exist.
11. **Typography** must always use predefined design-system tokens, never ad
    hoc sizes.
12. **Spacing** must follow the spacing system consistently — no arbitrary
    values.
13. **Forms** always use React Hook Form + Zod. Never hand-roll validation.
14. **API types.** Every request/response has a dedicated TypeScript type.
    Never `any`.
15. **React Query** for all server state. Never hand-manage loading/error/
    cache logic.
16. **Zustand** only for global UI state (auth, sidebar, theme, preferences)
    — never server data.
17. **Route constants.** Never hardcode routes.
18. **Query keys** are centralized, never hardcoded inline.
19. **Environment variables** for all URLs, secrets, tokens, API endpoints —
    never hardcoded.
20. **Error handling.** Every async operation covers loading, success,
    error, and empty states. Never a blank screen.
21. **Loading UX.** Every table/form/dashboard/list has a proper skeleton
    loader.
22. **Responsive design** across desktop, laptop, tablet, mobile — no
    exceptions.
23. **Accessibility.** Keyboard navigation, focus states, ARIA labels,
    semantic HTML, always.
24. **Reusability first.** Before creating a component/hook/utility/service,
    check whether one already exists.
25. **Naming convention.** Components: PascalCase. Hooks: camelCase. Enums:
    PascalCase. Constants: UPPER_CASE. Files: kebab-case where applicable.
26. **File responsibility.** One file, one responsibility. No God
    Components.
27. **Composition.** Prefer several small reusable components over one
    massive component.
28. **Comments** explain WHY, not WHAT — code should already say what it
    does.
29. **Performance.** Memoize expensive calculations, virtualize huge tables,
    paginate large datasets, lazy-load heavy pages, avoid unnecessary
    re-renders.
30. **Security.** Never expose backend URLs or secrets to the client. Never
    trust frontend validation — the backend must validate everything.
31. **Logging.** No `console.log` left in production code.
32. **Imports.** Use absolute imports (`@/modules/products`), never deep
    relative chains (`../../../../products`).
33. **Barrel exports.** Every folder exposes an `index.ts`; prefer that over
    reaching into deep internal files.
34. **Module isolation.** A module never depends on another module's
    internals — only its public exports.
35. **Shared utilities** used across multiple modules go in `utils/`;
    feature-specific utilities stay inside the module.
36. **Shared types.** Feature types stay inside the module; only truly
    global types belong in `types/`.
37. **UI consistency.** Every page shares the same spacing, typography,
    cards, buttons, inputs, dialogs, badges, tables, empty states, skeletons,
    and page headers.
38. **Maintain existing patterns.** Search for a similar implementation
    first and reuse it — never introduce a second way to solve the same
    problem.
39. **Backward compatibility.** Never break existing components, hooks,
    APIs, or utilities used elsewhere. Extend/version behavior instead,
    unless deliberately doing a project-wide refactor.
40. **Mandatory checklist before writing code:** search existing
    implementation → reuse existing component/hook/API layer/pattern if
    available → follow folder structure and naming conventions → keep files
    small and components reusable → keep business logic out of UI → never
    duplicate code or introduce inconsistent architecture → ensure the
    result is production-ready, scalable, type-safe, responsive, accessible,
    and maintainable.

## Backend response contract

The Fastify backend (see `Backend/AGENTS.md`) wraps every response in a
global envelope:

```jsonc
// success
{ "success": true, "message": "Login successful", "data": { /* T */ }, "meta"?: { /* pagination etc. */ } }
// error
{ "success": false, "message": "Invalid email or password", "errors": [] }
```

Never parse this envelope by hand in feature code. Two helpers already do it:

- **Server-side calls from Route Handlers / Server Components** (anything
  needing the caller's JWT): use `backendFetch<T>(path, init)` from
  `@/lib/backend`. It auto-unwraps `.data` on success and throws
  `BackendRequestError` (with the envelope's top-level `message`) on
  failure — callers just get back `T`, never the envelope itself.
- **The one place that talks to the backend before a session/JWT exists**
  (`app/api/auth/login/route.ts`) parses the envelope manually since it
  can't use `backendFetch` (no token yet) — import the shared
  `BackendEnvelope<T>` type from `@/lib/backend` rather than declaring a new
  inline shape, per rule 24 (reuse before duplicating).

---

## Standardized CRUD Infrastructure

Every business CRUD listing module must inherit these capabilities to guarantee uniform UX and behavior:

1. **Server-Side Pagination**:
   - Must use the shared `<Pagination />` component.
   - Display page size options (10, 20, 50, 100), record count summary, and routing synchronization.
   - Default page size: `DEFAULT_PAGE_SIZE = 10` (Centralized).

2. **Unified Entity Lifecycle**:
   - Master modules must implement `ACTIVE`, `INACTIVE`, and `ARCHIVED` statuses.
   - Record deletions must be non-destructive Soft Deletes. Require deletion reason logs.
   - Archived records cannot be assigned to new documents, but remain available for historical reference. They can be restored to active.

3. **Managed Filters**:
   - Must use the shared `<FilterBar />` component.
   - Standard filters: Search string (debounced), Status dropdown (Active, Inactive, Archived), and Created/Updated Date ranges.
   - Reset the page number to 1 on filter or search parameter change.

4. **Bulk Actions Toolbar**:
   - Must use the shared `<BulkActionsToolbar />` component.
   - Support checkboxes, row selections, selection counts, clear selection, and confirmation overlays.
   - Actions: Activate, Deactivate, Archive, Restore, Delete (Soft).

5. **Shared CRUD Components**:
   - `<DataTable />`
   - `<Pagination />`
   - `<FilterBar />`
   - `<BulkActionsToolbar />`
   - `<DeleteConfirmationDialog />`
   - `<ArchiveConfirmationDialog />`
   - `<ConfirmationDialog />`

