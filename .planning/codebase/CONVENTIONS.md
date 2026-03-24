# Coding Conventions

**Analysis Date:** 2026-03-24

## Naming Patterns

**Files:**
- Use lower-kebab-case for source files and folders, grouped by runtime concern or feature: `src/components/admin/admin-dashboard.tsx`, `src/lib/server/session-repository.ts`, `src/app/api/admin/sessions/route.ts`.
- Name tests after the production module with a `.test.ts` or `.test.tsx` suffix in the same directory: `src/components/participant/cubes-session.test.tsx`, `src/lib/domain/sequence.test.ts`.
- Reserve Next.js file conventions for App Router entrypoints: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/not-found.tsx`, `src/app/p/[token]/page.tsx`, `src/app/api/.../route.ts`.

**Functions:**
- Use camelCase for helpers and exported utilities: `getCreateSessionErrorMessage` in `src/app/api/admin/sessions/route.ts`, `buildParticipantSessionState` in `src/lib/server/participant-session-state.ts`, `readJsonResponse` in `src/lib/client/read-json-response.ts`.
- Use PascalCase for React components and component-local helper components: `AdminDashboard` in `src/components/admin/admin-dashboard.tsx`, `SessionObserver` in `src/components/observer/session-observer.tsx`, `SortableFrameCard` in `src/components/participant/sequence-session.tsx`.
- Use predicate prefixes for booleans and nullable selectors: `isAdminAuthenticated`, `isPasswordValid`, `isCorrect`, `showAdvance`, `hasAdminPassword`, `selectedPieceId`.

**Variables:**
- Keep local state and temporary values in camelCase: `participantCode`, `createPending`, `deferredSearchTerm`, `currentRecord`, `promptOrder`.
- Use descriptive status names instead of numeric enums: `SessionStatus`, `SessionTab`, `ParticipantCurrentItem`.
- Use `timestamp`, `token`, `itemIndex`, and `localIndex` consistently for temporal and lookup fields across `src/lib/server/session-repository.ts` and `src/lib/content/catalog.ts`.

**Types:**
- Use PascalCase type aliases for records and props: `SessionRecord`, `SessionSnapshot`, `CubeChallenge`, `AdminDashboardProps`, `PuzzleSessionProps`.
- Use string-literal unions for finite domain states instead of enums: `TestType` in `src/lib/content/catalog.ts`, `SessionStatus` in `src/lib/server/session-repository.ts`, `ParticipantCurrentItem` in `src/lib/server/participant-session-state.ts`.
- Suffix prop contracts with `Props`; keep input DTOs explicit: `CreateSessionInput`, `SessionPlayerProps`, `CubeFaceProps`.

## Code Style

**Formatting:**
- Follow the ESLint + Next.js defaults in `eslint.config.mjs`; no Prettier or Biome config is present.
- Match the existing TypeScript style from `tsconfig.json`: `strict: true`, `jsx: "react-jsx"`, `moduleResolution: "bundler"`.
- Keep semicolons, double quotes, and trailing commas. This is consistent across `src/components/admin/admin-dashboard.tsx`, `src/lib/server/session-repository.ts`, and `src/app/api/admin/login/route.ts`.
- Prefer early returns and top-level helper functions over deeply nested JSX logic. `src/components/admin/admin-dashboard.tsx` and `src/components/participant/cubes-session.tsx` both define helper functions before the exported component.

**Linting:**
- Use the flat ESLint config from `eslint.config.mjs` with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- Rely on inline disables only for narrow framework exceptions. Example: `src/components/participant/cubes-session.test.tsx` and `src/components/participant/sequence-session.test.tsx` disable `@next/next/no-img-element` only inside the `next/image` mock.
- Keep `.next/**`, `out/**`, `build/**`, and `next-env.d.ts` ignored as defined in `eslint.config.mjs`.

## Import Organization

**Order:**
1. React, Next.js, or Node built-ins first: `react`, `next/server`, `node:crypto`.
2. Third-party packages second: `lucide-react`, `@dnd-kit/*`, `@supabase/supabase-js`, `@testing-library/react`.
3. App-internal alias imports from `@/` third.
4. Same-folder relative imports last: `./read-json-response`, `./puzzle-session`, `./route`.

**Path Aliases:**
- Use `@/*` from `tsconfig.json` for cross-folder imports, for example `@/lib/server/session-repository` and `@/components/shared/cube-face`.
- Use relative imports only for siblings in the same feature folder, for example `./admin-dashboard` in `src/components/admin/admin-dashboard.test.tsx` and `./session-repository` in `src/lib/server/session-repository.test.ts`.

**Observed Pattern:**
- The import grouping is consistent in most files but not mechanically sorted. `src/lib/content/catalog.ts` mixes alias and same-folder imports based on conceptual grouping. Preserve readability over auto-sorting.

## Module Boundaries

**Server-only modules:**
- Keep environment, cookies, and persistence code in `src/lib/server/*` and route handlers in `src/app/api/**/route.ts`.
- `src/lib/server/admin-auth.ts` owns cookie hashing and auth checks.
- `src/lib/server/session-repository.ts` owns persistence selection and storage logic.

**Client-only modules:**
- Mark interactive browser modules with `"use client"` at the top of the file: `src/components/admin/admin-dashboard.tsx`, `src/components/admin/admin-login-form.tsx`, `src/components/observer/session-observer.tsx`, `src/components/participant/*.tsx`, `src/lib/client/session-channel.ts`.
- Keep fetch wrappers and realtime helpers in `src/lib/client/*`. `src/lib/client/api.ts` and `src/lib/client/session-channel.ts` are not imported by server routes.

**Shared domain/content modules:**
- Keep pure data and validation logic in `src/lib/domain/*` and `src/lib/content/*`.
- These modules stay framework-light and are reused by routes, server state builders, and tests. Examples: `src/lib/domain/sequence.ts`, `src/lib/domain/cubes.ts`, `src/lib/content/catalog.ts`, `src/lib/content/puzzle-catalog.ts`.

**Component boundaries:**
- Keep top-level pages thin. `src/app/admin/page.tsx`, `src/app/p/[token]/page.tsx`, and `src/app/o/[token]/page.tsx` fetch server data and hand it to client components as props.
- Keep rendering logic inside feature components instead of pages: `AdminDashboard`, `SessionPlayer`, `SessionObserver`.

## Server/Client Patterns

**App Router pages:**
- Use `export default async function` for App Router pages and resolve `params` from a promised object, as in `src/app/p/[token]/page.tsx` and `src/app/o/[token]/page.tsx`.
- Call `notFound()` for missing server data instead of returning fallback JSX.

**Client orchestration:**
- Drive interactive state with `useState`, `useEffect`, and targeted modern React APIs where helpful.
- `src/components/admin/admin-dashboard.tsx` uses `startTransition` and `useDeferredValue` for tab/search updates.
- `src/components/observer/session-observer.tsx` uses `useEffectEvent` to keep polling logic fresh without rebuilding the interval callback.

**API access:**
- Centralize browser POST/GET helpers in `src/lib/client/api.ts` when the same error-handling pattern is reused.
- Broadcast snapshot updates after mutations instead of duplicating refresh logic. `src/components/participant/session-player.tsx` and `src/components/admin/admin-dashboard.tsx` both call `broadcastSessionSnapshot(...)`.

**Representative pattern:**
```typescript
// `src/app/p/[token]/page.tsx`
export default async function ParticipantPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await getSessionRepository().getSessionByToken(token);

  if (!snapshot) {
    notFound();
  }

  return <SessionPlayer initialState={buildParticipantSessionState(snapshot)} />;
}
```

## Validation

**Route validation:**
- Validate request shape inline with explicit guards instead of schema libraries. No `zod` or `safeParse` usage is present under `src/`.
- Return `400` JSON errors for malformed inputs, for example `src/app/api/admin/sessions/route.ts`, `src/app/api/sessions/[token]/start/route.ts`, and `src/app/api/sessions/[token]/answer/route.ts`.

**Domain validation:**
- Keep answer correctness in pure functions, then call them from routes. Examples:
  - `validateSequenceAnswer` and `validateCubeAnswer` in `src/lib/content/catalog.ts`
  - `validatePuzzleAnswer` in `src/lib/content/puzzle-catalog.ts`
  - `isPuzzleComplete` in `src/lib/domain/puzzle.ts`

**Nullability pattern:**
- Return `null` or `false` for missing catalog lookups instead of throwing: `getCubeChallengeAt`, `getCubeChallengeTeenAt`, `getPuzzleChallengeAt`, `getSessionByToken`.
- Throw only for true invariants or asset wiring failures. `src/lib/content/puzzle-catalog.ts` throws when generated puzzle sources are missing or malformed.

## Error Handling

**Patterns:**
- Use guard clauses first, then `try/catch` around repository or fetch work.
- Convert repository and route failures into user-facing JSON messages with `NextResponse.json(...)`.
- Convert client-side failures into component-local `error` state and render inline feedback.
- Normalize empty response bodies through `readJsonResponse` in `src/lib/client/read-json-response.ts`; it returns `null` on `SyntaxError` instead of surfacing raw JSON parse failures.

**Representative route pattern:**
```typescript
// `src/app/api/admin/sessions/route.ts`
if (!(await isAdminAuthenticated())) {
  return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
}

if (!body.participantCode?.trim() || !body.testType) {
  return NextResponse.json(
    { error: "Preencha o identificador e o teste." },
    { status: 400 },
  );
}
```

**Representative client pattern:**
```typescript
// `src/components/admin/admin-login-form.tsx`
try {
  const response = await fetch("/api/admin/login", { ... });
  const data = await readJsonResponse<{ error?: string }>(response);
  if (!response.ok) {
    throw new Error(data?.error ?? "Falha no login.");
  }
  window.location.reload();
} catch (loginError) {
  setError(loginError instanceof Error ? loginError.message : "Falha no login.");
}
```

## Logging

**Framework:** `console`

**Patterns:**
- Logging is intentionally sparse. The only routine log found in app code is `console.error("Failed to start item:", err)` in `src/components/participant/session-player.tsx`.
- Prefer surfacing a translated UI error or JSON error payload over leaving raw logs in place.
- Do not introduce ambient debug logging into domain/content helpers. `src/lib/domain/*` and `src/lib/content/*` are currently log-free.

## Comments

**When to Comment:**
- Use comments sparingly for domain exceptions, not for obvious control flow.
- `src/lib/content/catalog.ts` includes comments explaining clinically valid alternative orderings for CHASE and HUNT.
- Component files use short structural comments only when the JSX block would otherwise be harder to scan, for example `/* Canvas */` and `/* Controls */` in `src/components/participant/puzzle-session.tsx`.

**JSDoc/TSDoc:**
- Not used. No JSDoc or TSDoc blocks were detected in the sampled production files.

## Function Design

**Size:** Keep reusable pure helpers above the exported symbol and keep them narrowly scoped. Examples: `buildSessionUrl`, `getTestTypeLabel`, `formatTimestamp`, `createEmptyBoard`, `removePieceFromBoard`.

**Parameters:** Type parameters explicitly, usually inline or through a local props type. Examples: `postSessionAction<T>(path: string, body?: unknown)`, `CubeFacePreview({ face, className, testId }: CubeFaceProps)`.

**Return Values:**
- Prefer plain objects and unions over classes.
- Use `Promise<...>` return signatures on async interfaces in `src/lib/server/session-repository.ts`.
- Use discriminated unions for view state selection in `src/lib/server/participant-session-state.ts`.

## Module Design

**Exports:**
- Use named exports for reusable components, helpers, and types: `AdminDashboard`, `PuzzleSession`, `buildSequenceStory`, `getSessionRepository`.
- Use default exports only for Next.js special files and pages: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/admin/page.tsx`, `src/app/not-found.tsx`, `src/app/p/[token]/page.tsx`, `src/app/o/[token]/page.tsx`.

**Barrel Files:**
- Not detected. Import directly from the defining module instead of routing through `index.ts` barrels.

**Notable Idioms:**
- Compute className strings with array joins when variants are local to a component, as in `src/components/participant/sequence-session.tsx`, `src/components/participant/cubes-session.tsx`, and `src/components/shared/cube-face.tsx`.
- Prefer deterministic generators for seeded UI/domain behavior. `createSequenceSeedShuffle` in `src/lib/domain/sequence.ts` and `buildCubeTray` usage via `getCubeTrayForSession` in `src/lib/content/catalog.ts` follow this pattern.
- Use environment-gated adapters rather than separate codepaths at the call site. `getSessionRepository()` in `src/lib/server/session-repository.ts` selects Supabase or memory storage centrally.

---

*Convention analysis: 2026-03-24*
