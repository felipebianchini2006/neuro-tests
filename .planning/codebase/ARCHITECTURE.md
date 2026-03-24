# Architecture

**Analysis Date:** 2026-03-24

## Pattern Overview

**Overall:** Next.js App Router application with server-rendered route entry points, client feature islands, a repository-backed session state layer, and domain/content modules that evaluate test answers.

**Key Characteristics:**
- Route entry points in `src/app` stay thin and delegate quickly to components or server helpers such as `getSessionRepository()` from `src/lib/server/session-repository.ts`.
- Session lifecycle is centralized behind the `SessionRepository` interface in `src/lib/server/session-repository.ts`, with runtime selection between in-memory storage and Supabase-backed persistence.
- Test-specific behavior is split across content catalogs in `src/lib/content/*.ts`, pure domain logic in `src/lib/domain/*.ts`, and specialized participant UIs in `src/components/participant/*.tsx`.

## Layers

**App Router pages and route handlers:**
- Purpose: Expose URLs, load initial data on the server, and return either page UI or JSON responses.
- Location: `src/app`
- Contains: `page.tsx`, `layout.tsx`, `not-found.tsx`, dynamic route pages such as `src/app/p/[token]/page.tsx`, and API handlers such as `src/app/api/sessions/[token]/answer/route.ts`.
- Depends on: `src/components/*`, `src/lib/server/*`, `src/lib/content/*`
- Used by: Browser navigation and client `fetch` calls.

**Client feature components:**
- Purpose: Render interactive admin, participant, and observer interfaces after initial server data hydration.
- Location: `src/components/admin`, `src/components/participant`, `src/components/observer`, `src/components/shared`
- Contains: `"use client"` components such as `src/components/admin/admin-dashboard.tsx`, `src/components/participant/session-player.tsx`, and `src/components/observer/session-observer.tsx`.
- Depends on: `src/lib/client/*`, shared server-side types from `src/lib/server/session-repository.ts`, and content/domain modules.
- Used by: Server pages in `src/app/admin/page.tsx`, `src/app/p/[token]/page.tsx`, and `src/app/o/[token]/page.tsx`.

**Client transport helpers:**
- Purpose: Wrap browser-side HTTP and realtime communication.
- Location: `src/lib/client`
- Contains: `src/lib/client/api.ts`, `src/lib/client/read-json-response.ts`, `src/lib/client/session-channel.ts`
- Depends on: `fetch`, `@supabase/supabase-js`, and shared repository types.
- Used by: `src/components/admin/admin-dashboard.tsx`, `src/components/participant/session-player.tsx`, `src/components/observer/session-observer.tsx`, and `src/components/admin/admin-login-form.tsx`.

**Server session services:**
- Purpose: Own authentication, session persistence, and participant-facing session shaping.
- Location: `src/lib/server`
- Contains: `src/lib/server/admin-auth.ts`, `src/lib/server/session-repository.ts`, `src/lib/server/participant-session-state.ts`
- Depends on: `next/headers`, `@supabase/supabase-js`, `src/lib/content/*`, `src/lib/domain/*`
- Used by: App pages and API route handlers.

**Content catalogs:**
- Purpose: Define the available tests, item counts, titles, generated asset manifests, and answer-validation entry points.
- Location: `src/lib/content`
- Contains: `src/lib/content/catalog.ts`, `src/lib/content/puzzle-catalog.ts`, `src/lib/content/sequence-manifest.generated.ts`, `src/lib/content/puzzle-manifest.generated.ts`
- Depends on: `src/lib/domain/*`
- Used by: `src/lib/server/participant-session-state.ts`, `src/app/api/sessions/[token]/answer/route.ts`, and participant/observer UI.

**Pure domain modules:**
- Purpose: Implement test mechanics without transport or framework concerns.
- Location: `src/lib/domain`
- Contains: `src/lib/domain/sequence.ts`, `src/lib/domain/cubes.ts`, `src/lib/domain/puzzle.ts`, `src/lib/domain/puzzle-layout.ts`
- Depends on: TypeScript only.
- Used by: Content catalogs and interactive participant components.

**Persistence schema and asset generation support:**
- Purpose: Define the optional database schema and generate static manifests/assets used by the app.
- Location: `supabase`, `scripts`, `public/assets`
- Contains: `supabase/schema.sql`, `supabase/migrations/*.sql`, asset sync scripts such as `scripts/sync-sequence-assets.mjs`
- Depends on: External Supabase runtime and local asset folders.
- Used by: `src/lib/server/session-repository.ts` and content manifest files.

## Data Flow

**Admin session creation and management:**

1. `src/app/admin/page.tsx` runs on the server, checks `isAdminAuthenticated()` from `src/lib/server/admin-auth.ts`, and loads initial sessions with `getSessionRepository().listSessions()`.
2. `src/components/admin/admin-dashboard.tsx` runs on the client, posts to `src/app/api/admin/sessions/route.ts`, `src/app/api/admin/sessions/[token]/complete/route.ts`, and `src/app/api/admin/sessions/completed/route.ts`.
3. Those route handlers validate admin auth through `src/lib/server/admin-auth.ts`, delegate persistence to `src/lib/server/session-repository.ts`, and return `SessionSnapshot` or counts.
4. The dashboard updates its local `sessions` state and can broadcast completed-session snapshots through `src/lib/client/session-channel.ts`.

**Participant execution flow:**

1. `src/app/p/[token]/page.tsx` loads a `SessionSnapshot` from `getSessionRepository().getSessionByToken(token)`.
2. `src/lib/server/participant-session-state.ts` maps that snapshot into `ParticipantSessionState`, selecting the correct current item from `src/lib/content/catalog.ts` or `src/lib/content/puzzle-catalog.ts`.
3. `src/components/participant/session-player.tsx` renders a specialized client component: `SequenceSession`, `CubesSession`, or `PuzzleSession`.
4. On mount and on item changes, `SessionPlayer` posts to `src/app/api/sessions/[token]/start/route.ts`; on submit it posts to `src/app/api/sessions/[token]/answer/route.ts`; on success advance it posts to `src/app/api/sessions/[token]/advance/route.ts`.
5. `src/app/api/sessions/[token]/answer/route.ts` validates answers by branching on `snapshot.session.testType` and calling `validateSequenceAnswer`, `validateCubeAnswer`, `validateCubeTeenAnswer`, or `validatePuzzleAnswer` from the content layer.
6. Updated snapshots come back through the repository and are rebroadcast through `src/lib/client/session-channel.ts` when realtime is configured.

**Observer flow:**

1. `src/app/o/[token]/page.tsx` server-renders the observer with an initial `SessionSnapshot`.
2. `src/components/observer/session-observer.tsx` stores that snapshot in local state.
3. The observer subscribes to `session:${token}` broadcast events through `createSessionChannel()` in `src/lib/client/session-channel.ts`.
4. It also polls `src/app/api/sessions/[token]/route.ts` every 4 seconds through `getSessionSnapshot()` from `src/lib/client/api.ts`, so the UI still refreshes when Supabase realtime is disabled.

**Persistence mode selection:**

1. `src/lib/server/session-repository.ts` checks `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `getSupabaseClient()`.
2. `getSessionRepository()` returns `supabaseRepository` when both are present, otherwise `memoryRepository`.
3. Both implementations satisfy the same `SessionRepository` interface, so routes and pages do not branch on storage mode.

**State Management:**
- Server-owned session truth lives in `SessionSnapshot` and `SessionRecord` from `src/lib/server/session-repository.ts`.
- Browser interaction state stays local in components such as `src/components/admin/admin-dashboard.tsx`, `src/components/participant/session-player.tsx`, and `src/components/observer/session-observer.tsx`.
- Participant item derivation is not duplicated in the UI; it is computed centrally in `src/lib/server/participant-session-state.ts`.

## Key Abstractions

**SessionRepository:**
- Purpose: Stable storage contract for session lifecycle operations.
- Examples: `src/lib/server/session-repository.ts`
- Pattern: Interface plus two concrete implementations, `memoryRepository` and `supabaseRepository`, selected by `getSessionRepository()`.

**SessionSnapshot / SessionRecord / SessionItemRecord:**
- Purpose: Shared session model used across pages, APIs, client helpers, and tests.
- Examples: `src/lib/server/session-repository.ts`, `src/lib/client/api.ts`, `src/components/observer/session-observer.tsx`
- Pattern: Shared type definitions imported across server and client boundaries.

**ParticipantSessionState:**
- Purpose: Server-shaped view model that converts a generic snapshot into the current participant-facing item payload.
- Examples: `src/lib/server/participant-session-state.ts`, `src/app/p/[token]/page.tsx`
- Pattern: Adapter layer from repository state to UI-ready discriminated union.

**Content catalog:**
- Purpose: Canonical lookup and validation surface for all test types.
- Examples: `src/lib/content/catalog.ts`, `src/lib/content/puzzle-catalog.ts`
- Pattern: Static module-level collections plus helper functions such as `getTotalItems()`, `getItemTitle()`, `getPromptSequenceFrames()`, and `validatePuzzleAnswer()`.

**Specialized participant modules:**
- Purpose: Encapsulate per-test interaction models while keeping route and orchestration code generic.
- Examples: `src/components/participant/sequence-session.tsx`, `src/components/participant/cubes-session.tsx`, `src/components/participant/puzzle-session.tsx`
- Pattern: One dispatcher component in `src/components/participant/session-player.tsx` selects one specialized UI based on `currentItem.kind`.

## Entry Points

**Root layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render.
- Responsibilities: Load global fonts, metadata, and `src/app/globals.css`.

**Landing page:**
- Location: `src/app/page.tsx`
- Triggers: `GET /`
- Responsibilities: Public entry screen linking to `/admin`.

**Admin page:**
- Location: `src/app/admin/page.tsx`
- Triggers: `GET /admin`
- Responsibilities: Server-side auth gate, mode detection, and initial session list hydration before rendering `AdminDashboard` or `AdminLoginForm`.

**Participant page:**
- Location: `src/app/p/[token]/page.tsx`
- Triggers: `GET /p/:token`
- Responsibilities: Load snapshot, transform it with `buildParticipantSessionState()`, and mount the session player.

**Observer page:**
- Location: `src/app/o/[token]/page.tsx`
- Triggers: `GET /o/:token`
- Responsibilities: Load snapshot and mount observer UI.

**Admin auth API:**
- Location: `src/app/api/admin/login/route.ts`, `src/app/api/admin/logout/route.ts`
- Triggers: Client login/logout actions.
- Responsibilities: Validate password, set/delete the `neuro_admin` cookie, and return JSON status.

**Admin session management API:**
- Location: `src/app/api/admin/sessions/route.ts`, `src/app/api/admin/sessions/[token]/complete/route.ts`, `src/app/api/admin/sessions/completed/route.ts`
- Triggers: Admin dashboard create, complete, and clear-history actions.
- Responsibilities: Enforce admin auth and call repository mutations.

**Participant session API:**
- Location: `src/app/api/sessions/[token]/route.ts`, `src/app/api/sessions/[token]/start/route.ts`, `src/app/api/sessions/[token]/answer/route.ts`, `src/app/api/sessions/[token]/advance/route.ts`
- Triggers: Participant UI actions and observer polling.
- Responsibilities: Fetch snapshots, mark item starts, validate/store answers, and advance sessions.

## Error Handling

**Strategy:** Route handlers return explicit JSON errors with HTTP status codes, while page routes fall back to `notFound()` for invalid tokens and client components show local error banners.

**Patterns:**
- Missing session tokens become `notFound()` in `src/app/p/[token]/page.tsx` and `src/app/o/[token]/page.tsx`.
- API validation failures return `NextResponse.json({ error }, { status })` in handlers such as `src/app/api/admin/sessions/route.ts` and `src/app/api/sessions/[token]/answer/route.ts`.
- The participant and admin clients catch failed fetches and render inline messages in `src/components/participant/session-player.tsx`, `src/components/admin/admin-dashboard.tsx`, and `src/components/admin/admin-login-form.tsx`.
- Invalid content/build mismatches fail fast during module initialization in `src/lib/content/puzzle-catalog.ts`.

## Cross-Cutting Concerns

**Logging:** Minimal. Client-side mutation failures use `console.error` in `src/components/participant/session-player.tsx`. There is no centralized logging module.

**Validation:** Input shape checks live in route handlers, while answer correctness lives in `src/lib/content/catalog.ts`, `src/lib/content/puzzle-catalog.ts`, and the pure domain modules in `src/lib/domain`.

**Authentication:** Admin-only surfaces rely on the cookie hash helpers in `src/lib/server/admin-auth.ts`. Participant and observer links are bearer-by-URL-token and do not require separate auth.

**Realtime synchronization:** Optional Supabase broadcast channels are wrapped by `src/lib/client/session-channel.ts`. The observer still polls `src/app/api/sessions/[token]/route.ts` when realtime is unavailable.

**Server/client boundaries:** Files in `src/app` are server components by default unless they import a client component. Interactive modules explicitly opt in with `"use client"` at the top of files such as `src/components/admin/admin-dashboard.tsx`, `src/components/participant/session-player.tsx`, and `src/components/observer/session-observer.tsx`.

---

*Architecture analysis: 2026-03-24*
