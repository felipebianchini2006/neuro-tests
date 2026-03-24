# Codebase Structure

**Analysis Date:** 2026-03-24

## Directory Layout

```text
neuro-tests/
├── src/
│   ├── app/                # App Router pages, layouts, and route handlers
│   ├── components/         # Client UI split by feature area
│   └── lib/
│       ├── client/         # Browser fetch/realtime helpers
│       ├── content/        # Test catalogs and generated manifests
│       ├── domain/         # Pure test logic
│       └── server/         # Auth, repository, and server-side session shaping
├── public/assets/          # Static images used by tests
├── scripts/                # Asset and manifest generation scripts
├── supabase/               # SQL schema and migrations for optional persistence
├── docs/plans/             # Human-authored planning notes
├── package.json            # Scripts and dependencies
└── tsconfig.json           # TS compiler options and `@/*` alias
```

## Directory Purposes

**`src/app`:**
- Purpose: Define the navigable application and API surface using Next.js App Router conventions.
- Contains: `layout.tsx`, `page.tsx`, `not-found.tsx`, dynamic pages such as `src/app/p/[token]/page.tsx`, and route handlers such as `src/app/api/sessions/[token]/answer/route.ts`.
- Key files: `src/app/layout.tsx`, `src/app/admin/page.tsx`, `src/app/p/[token]/page.tsx`, `src/app/o/[token]/page.tsx`

**`src/components/admin`:**
- Purpose: Hold admin-only interactive UI.
- Contains: Session management dashboard and login form.
- Key files: `src/components/admin/admin-dashboard.tsx`, `src/components/admin/admin-login-form.tsx`

**`src/components/participant`:**
- Purpose: Hold participant-facing interactive test modules.
- Contains: Orchestrator plus one component per test interaction model.
- Key files: `src/components/participant/session-player.tsx`, `src/components/participant/sequence-session.tsx`, `src/components/participant/cubes-session.tsx`, `src/components/participant/puzzle-session.tsx`

**`src/components/observer`:**
- Purpose: Hold observer-facing live session monitoring UI.
- Contains: A single session observer screen.
- Key files: `src/components/observer/session-observer.tsx`

**`src/components/shared`:**
- Purpose: Shared UI primitives used by feature modules.
- Contains: Reusable visual helpers rather than full layouts.
- Key files: `src/components/shared/cube-face.tsx`

**`src/lib/client`:**
- Purpose: Centralize browser-side transport helpers.
- Contains: JSON response parsing, REST fetch helpers, and Supabase channel wiring.
- Key files: `src/lib/client/api.ts`, `src/lib/client/read-json-response.ts`, `src/lib/client/session-channel.ts`

**`src/lib/server`:**
- Purpose: Centralize server-only concerns and the main state boundary.
- Contains: Cookie auth, repository implementations, and participant state shaping.
- Key files: `src/lib/server/admin-auth.ts`, `src/lib/server/session-repository.ts`, `src/lib/server/participant-session-state.ts`

**`src/lib/content`:**
- Purpose: Store test definitions, generated asset manifests, and catalog lookup helpers.
- Contains: Static challenge definitions plus generated manifest outputs.
- Key files: `src/lib/content/catalog.ts`, `src/lib/content/puzzle-catalog.ts`, `src/lib/content/sequence-manifest.generated.ts`, `src/lib/content/puzzle-manifest.generated.ts`

**`src/lib/domain`:**
- Purpose: Keep pure business logic independent from Next.js and persistence.
- Contains: Sequence, cubes, and puzzle algorithms and types.
- Key files: `src/lib/domain/sequence.ts`, `src/lib/domain/cubes.ts`, `src/lib/domain/puzzle.ts`, `src/lib/domain/puzzle-layout.ts`

**`public/assets`:**
- Purpose: Store static images used during tests.
- Contains: `sequence`, `cubes`, `cubes-teen`, and `puzzles` asset trees.
- Key files: `public/assets/sequence`, `public/assets/cubes`, `public/assets/cubes-teen`, `public/assets/puzzles/generated`

**`scripts`:**
- Purpose: Generate and synchronize static test assets/manifests.
- Contains: Sync scripts for sequence, cube, and puzzle assets.
- Key files: `scripts/sync-sequence-assets.mjs`, `scripts/sync-cube-assets.mjs`, `scripts/sync-puzzle-assets.mjs`

**`supabase`:**
- Purpose: Define the optional persistence backend.
- Contains: Base schema and incremental migrations.
- Key files: `supabase/schema.sql`, `supabase/migrations/002_add_test_types.sql`, `supabase/migrations/003_add_adult_battery_test_type.sql`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Global shell, metadata, and font setup.
- `src/app/page.tsx`: Public landing page.
- `src/app/admin/page.tsx`: Admin SSR entry point.
- `src/app/p/[token]/page.tsx`: Participant SSR entry point.
- `src/app/o/[token]/page.tsx`: Observer SSR entry point.

**Configuration:**
- `package.json`: Run scripts and dependency list.
- `tsconfig.json`: Strict TS config plus `@/*` path alias.
- `next.config.ts`: Next.js config placeholder.
- `eslint.config.mjs`: Lint configuration.
- `vitest.config.ts`: Test runner config.

**Core Logic:**
- `src/lib/server/session-repository.ts`: Session storage contract and implementations.
- `src/lib/server/participant-session-state.ts`: Snapshot-to-current-item mapping.
- `src/lib/content/catalog.ts`: Main test catalog and validation surface.
- `src/lib/content/puzzle-catalog.ts`: Puzzle challenge assembly and validation.
- `src/components/participant/session-player.tsx`: Participant orchestration boundary.

**API Surface:**
- `src/app/api/admin/login/route.ts`: Admin login.
- `src/app/api/admin/logout/route.ts`: Admin logout.
- `src/app/api/admin/sessions/route.ts`: Session creation.
- `src/app/api/admin/sessions/[token]/complete/route.ts`: Manual completion.
- `src/app/api/admin/sessions/completed/route.ts`: Clear completed history.
- `src/app/api/sessions/[token]/route.ts`: Snapshot fetch for observer polling.
- `src/app/api/sessions/[token]/start/route.ts`: Item start mutation.
- `src/app/api/sessions/[token]/answer/route.ts`: Answer validation and persistence.
- `src/app/api/sessions/[token]/advance/route.ts`: Advance after a correct answer.

**Testing:**
- `src/app/api/admin/sessions/route.test.ts`: API route coverage.
- `src/components/admin/admin-dashboard.test.tsx`: Admin UI behavior tests.
- `src/components/participant/*.test.tsx`: Participant module tests.
- `src/lib/domain/*.test.ts`: Pure logic tests.
- `src/lib/server/*.test.ts`: Repository and state-mapper tests.

## Naming Conventions

**Files:**
- Use Next.js convention files in `src/app`: `page.tsx`, `layout.tsx`, `not-found.tsx`, `route.ts`.
- Use kebab-case feature filenames everywhere else, such as `admin-dashboard.tsx`, `participant-session-state.ts`, and `puzzle-layout.ts`.
- Keep test files adjacent to the module they exercise with `.test.ts` or `.test.tsx`, for example `src/lib/domain/sequence.test.ts` and `src/components/participant/cubes-session.test.tsx`.

**Directories:**
- Use route-segment naming in `src/app`, including dynamic segments like `src/app/p/[token]` and `src/app/api/sessions/[token]`.
- Group feature UI by audience under `src/components/admin`, `src/components/participant`, and `src/components/observer`.
- Group non-UI code by runtime concern under `src/lib/client`, `src/lib/server`, `src/lib/content`, and `src/lib/domain`.

## App Router Organization

**Page routes:**
- `/` maps to `src/app/page.tsx`.
- `/admin` maps to `src/app/admin/page.tsx`.
- `/p/[token]` maps to `src/app/p/[token]/page.tsx`.
- `/o/[token]` maps to `src/app/o/[token]/page.tsx`.

**API routes:**
- `/api/admin/login` maps to `src/app/api/admin/login/route.ts`.
- `/api/admin/logout` maps to `src/app/api/admin/logout/route.ts`.
- `/api/admin/sessions` maps to `src/app/api/admin/sessions/route.ts`.
- `/api/admin/sessions/[token]/complete` maps to `src/app/api/admin/sessions/[token]/complete/route.ts`.
- `/api/admin/sessions/completed` maps to `src/app/api/admin/sessions/completed/route.ts`.
- `/api/sessions/[token]` maps to `src/app/api/sessions/[token]/route.ts`.
- `/api/sessions/[token]/start` maps to `src/app/api/sessions/[token]/start/route.ts`.
- `/api/sessions/[token]/answer` maps to `src/app/api/sessions/[token]/answer/route.ts`.
- `/api/sessions/[token]/advance` maps to `src/app/api/sessions/[token]/advance/route.ts`.

## Where to Add New Code

**New page route:**
- Add the route entry in `src/app/<segment>/page.tsx`.
- Keep the page thin and delegate data loading to `src/lib/server/*` and interaction to a client component in `src/components/*`.

**New API mutation or query:**
- Add a `route.ts` under `src/app/api/...`.
- Reuse `getSessionRepository()` from `src/lib/server/session-repository.ts` rather than talking to Supabase directly from route handlers.
- Put request-shape checks in the route and business validation in `src/lib/content/*` or `src/lib/domain/*`.

**New participant test type:**
- Extend `TestType` and item helpers in `src/lib/content/catalog.ts`.
- Add any pure mechanics to `src/lib/domain/<feature>.ts`.
- Add the interactive renderer to `src/components/participant/<feature>-session.tsx`.
- Update `src/lib/server/participant-session-state.ts` and `src/components/participant/session-player.tsx` to map and dispatch the new item type.
- Add answer validation to `src/app/api/sessions/[token]/answer/route.ts`.

**New shared UI element:**
- Put small reusable display helpers in `src/components/shared`.
- Keep feature-specific containers inside their audience folder instead of promoting them too early.

**New server helper:**
- Put auth, repository, or session-shaping logic in `src/lib/server`.
- Keep browser-only code out of this folder.

**New browser transport helper:**
- Put fetch wrappers and realtime channel utilities in `src/lib/client`.
- Import shared types from `src/lib/server/session-repository.ts` instead of redefining DTOs.

**New static content or manifest:**
- Put hand-maintained definitions in `src/lib/content`.
- Put generated outputs in `src/lib/content/*generated.ts` and keep the generating script in `scripts/`.

## File-Organization Patterns

**Server/client boundary pattern:**
- Server entry pages such as `src/app/admin/page.tsx` fetch initial data and pass serializable props into `"use client"` modules such as `src/components/admin/admin-dashboard.tsx`.
- Client helpers in `src/lib/client` may import shared types from `src/lib/server/session-repository.ts`, but server modules do not import from `src/lib/client`.

**Feature dispatch pattern:**
- `src/components/participant/session-player.tsx` is the only participant-level dispatcher.
- Specialized feature modules under `src/components/participant` should stay focused on one interaction model each.

**Catalog-plus-domain pattern:**
- `src/lib/content/catalog.ts` and `src/lib/content/puzzle-catalog.ts` own lookup tables and validation entry points.
- `src/lib/domain/*.ts` own the reusable algorithms and types that those catalogs call.

**Co-located testing pattern:**
- Keep tests beside the source file they cover, as in `src/lib/server/session-repository.test.ts` and `src/components/admin/admin-dashboard.test.tsx`.

## Special Directories

**`src/lib/content/*.generated.ts`:**
- Purpose: Generated manifests consumed at runtime by content catalogs.
- Generated: Yes
- Committed: Yes

**`public/assets/puzzles/generated`:**
- Purpose: Generated puzzle piece images referenced by `src/lib/content/puzzle-catalog.ts`.
- Generated: Yes
- Committed: Yes

**`supabase/migrations`:**
- Purpose: Ordered SQL migrations for the optional database-backed repository.
- Generated: No
- Committed: Yes

**`.planning/codebase`:**
- Purpose: Codebase mapping output for GSD planning/execution workflows.
- Generated: Yes
- Committed: Yes

---

*Structure analysis: 2026-03-24*
