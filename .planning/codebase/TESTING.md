# Testing Patterns

**Analysis Date:** 2026-03-24

## Test Framework

**Runner:**
- Vitest `^4.0.18`
- Config: `vitest.config.ts`
- Environment: `jsdom`
- Globals: enabled via `test.globals: true`
- Setup file: `vitest.setup.ts`

**Assertion Library:**
- Vitest `expect`
- `@testing-library/jest-dom/vitest` for DOM matchers
- `@testing-library/react` for component rendering and DOM queries

**Run Commands:**
```bash
npm test              # Run all tests via `vitest run`
npm run test:watch    # Watch mode via `vitest`
# Coverage command not configured in `package.json` or `vitest.config.ts`
```

## Test File Organization

**Location:**
- Co-locate tests with the implementation under `src/`.
- Current examples:
  - `src/components/admin/admin-dashboard.test.tsx`
  - `src/components/participant/cubes-session.test.tsx`
  - `src/lib/domain/sequence.test.ts`
  - `src/lib/server/session-repository.test.ts`
  - `src/app/api/admin/sessions/route.test.ts`

**Naming:**
- Use `[module-name].test.ts` or `[module-name].test.tsx`.
- The active include pattern in `vitest.config.ts` is `src/**/*.test.ts` and `src/**/*.test.tsx`. Do not add `.spec.*` files unless the config is updated.

**Structure:**
```text
src/
  components/**/[component].tsx
  components/**/[component].test.tsx
  lib/**/[module].ts
  lib/**/[module].test.ts
  app/api/**/route.ts
  app/api/**/route.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
// `src/app/api/admin/sessions/route.test.ts`
describe("POST /api/admin/sessions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isAdminAuthenticated.mockResolvedValue(true);
  });

  it("creates an adult battery session through the admin API", async () => {
    createSession.mockResolvedValue({ session: { ... }, items: [] });

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/admin/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantCode: "Rangel", testType: "adult-battery" }),
    }));

    expect(response.status).toBe(200);
  });
});
```

**Patterns:**
- Group tests by module with one top-level `describe(...)`.
- Name tests by user-visible behavior or domain rule, not by internal method names. Example: `"keeps older links visible when a new session is created"` in `src/components/admin/admin-dashboard.test.tsx`.
- Use inline setup or a small local builder instead of shared fixtures. `buildSessionRecord(...)` in `src/components/admin/admin-dashboard.test.tsx` is the main local factory pattern.
- Prefer behavior assertions through DOM queries and returned JSON instead of implementation detail assertions.

## Mocking

**Framework:** `vi`

**Patterns:**
```typescript
// `src/components/participant/cubes-session.test.tsx`
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => {
    const imgProps = { ...props };
    delete imgProps.fill;
    delete imgProps.priority;
    return <img {...imgProps} alt={imgProps.alt ?? ""} />;
  },
}));

// `src/components/admin/admin-dashboard.test.tsx`
const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ... }) });
vi.stubGlobal("fetch", fetchMock);
```

**What to Mock:**
- Mock `next/image` in image-heavy component tests so assertions can query plain `<img>` nodes: `src/components/participant/cubes-session.test.tsx`, `src/components/participant/sequence-session.test.tsx`.
- Mock module boundaries for route tests instead of hitting real auth or persistence: `src/app/api/admin/sessions/route.test.ts` mocks `@/lib/server/admin-auth` and `@/lib/server/session-repository`.
- Stub global `fetch` in client component tests that submit forms or mutate sessions: `src/components/admin/admin-dashboard.test.tsx`.
- Use fake timers and mocked system time when repository behavior depends on timestamps: `src/lib/server/session-repository.test.ts`.

**What NOT to Mock:**
- Do not mock pure domain/content helpers when the goal is to lock real business rules. `src/lib/domain/*.test.ts` and `src/lib/content/catalog.test.ts` exercise actual implementations and generated manifests.
- Do not replace catalog data with synthetic copies unless the test is focused on a UI permutation. `src/components/participant/puzzle-session.test.tsx` uses the real `puzzleChallenges`.

## Fixtures and Factories

**Test Data:**
```typescript
// `src/components/admin/admin-dashboard.test.tsx`
function buildSessionRecord(participantCode: string, token: string) {
  const timestamp = "2026-03-09T12:00:00.000Z";

  return {
    id: `session-${token}`,
    token,
    participantCode,
    testType: "sequence" as const,
    status: "pending" as const,
    currentItemIndex: 0,
    totalItems: 3,
    startedAt: null,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
```

**Location:**
- Fixtures live inline in each spec file.
- Domain tests create literal arrays and objects close to the assertion site, for example `target: CubeFace[][]` in `src/lib/domain/cubes.test.ts`.
- Server state tests build full `SessionSnapshot` objects inline in `src/lib/server/participant-session-state.test.ts`.
- No shared fixture or factory directory is present.

## Coverage

**Requirements:** None enforced. No coverage thresholds, provider config, or dedicated coverage script were detected in `package.json` or `vitest.config.ts`.

**View Coverage:**
```bash
# Not configured in the repository today
# Add a coverage provider and script before treating coverage as a gate
```

## Test Types

**Unit Tests:**
- Pure domain logic in `src/lib/domain/*.test.ts` checks deterministic transforms and tolerance rules.
- Catalog/content tests in `src/lib/content/catalog.test.ts` and `src/lib/content/puzzle-manifest.generated.test.ts` lock asset ordering, counts, and clinically valid answer variants.
- Server state tests in `src/lib/server/participant-session-state.test.ts` cover item selection logic without rendering UI.

**Integration Tests:**
- Component tests use `@testing-library/react` to cover render output and local interactions in `src/components/**/*.test.tsx`.
- API route tests import the route module directly and exercise its handler with a real `Request`, while mocking auth or repository boundaries in `src/app/api/admin/sessions/route.test.ts`.
- Repository tests exercise the in-memory branch end-to-end through the public `SessionRepository` interface in `src/lib/server/session-repository.test.ts`.

**E2E Tests:**
- Not used. No Playwright, Cypress, or browser-level test suite is present under the project root.

## Common Patterns

**Async Testing:**
```typescript
// `src/components/admin/admin-dashboard.test.tsx`
fireEvent.click(screen.getByRole("button", { name: /Criar sess/i }));

await waitFor(() => {
  expect(screen.getByRole("tab", { name: /Sessoes em aberto 2/i })).toBeInTheDocument();
});
```

**Error Testing:**
```typescript
// `src/app/api/admin/sessions/route.test.ts`
createSession.mockRejectedValue(
  new Error('new row for relation "sessions" violates check constraint "sessions_test_type_check"'),
);

const response = await POST(new Request("http://localhost/api/admin/sessions", { ... }));

expect(response.status).toBe(500);
await expect(response.json()).resolves.toEqual({
  error: "Tipo de teste nao suportado pelo banco configurado. Aplique a migration mais recente de test types.",
});
```

**Timer and env control:**
```typescript
// `src/lib/server/session-repository.test.ts`
beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

vi.useFakeTimers();
vi.setSystemTime(new Date("2026-03-09T12:00:00.000Z"));
```

**DOM style and accessibility assertions:**
- Tests verify CSS classes and accessible names, not just existence.
- Examples:
  - `src/components/admin/admin-dashboard.test.tsx` checks `break-all`, `text-white`, and tab labels.
  - `src/components/participant/sequence-session.test.tsx` checks `aria-describedby`.
  - `src/components/participant/cubes-session.test.tsx` checks gradient styling on white cube faces.

## Important Coverage Gaps

**Admin auth flow is only partially covered:**
- Untested files: `src/lib/server/admin-auth.ts`, `src/app/api/admin/login/route.ts`, `src/app/api/admin/logout/route.ts`, `src/components/admin/admin-login-form.tsx`
- Risk: password hashing, cookie behavior, and login error rendering can regress without a failing spec.

**Participant runtime orchestration has no direct tests:**
- Untested files: `src/components/participant/session-player.tsx`, `src/components/observer/session-observer.tsx`, `src/lib/client/api.ts`, `src/lib/client/session-channel.ts`, `src/lib/format.ts`
- Risk: polling, realtime updates, start/advance flows, and user-visible error states are only indirectly covered today.

**Most route handlers are untested:**
- Untested files: `src/app/api/sessions/[token]/route.ts`, `src/app/api/sessions/[token]/start/route.ts`, `src/app/api/sessions/[token]/advance/route.ts`, `src/app/api/sessions/[token]/answer/route.ts`, `src/app/api/admin/sessions/[token]/complete/route.ts`, `src/app/api/admin/sessions/completed/route.ts`
- Risk: request validation and HTTP status mapping for the participant and completion APIs can drift from the UI assumptions in `src/components/admin/admin-dashboard.tsx` and `src/components/participant/session-player.tsx`.

**The Supabase repository branch is not exercised by tests:**
- Partially covered file: `src/lib/server/session-repository.ts`
- Evidence: `src/lib/server/session-repository.test.ts` deletes `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `beforeEach`, forcing the memory repository path.
- Risk: SQL row mapping, ordering, and mutation behavior can break even while the in-memory tests stay green.

**App Router pages are not directly tested:**
- Untested files: `src/app/admin/page.tsx`, `src/app/p/[token]/page.tsx`, `src/app/o/[token]/page.tsx`, `src/app/page.tsx`, `src/app/not-found.tsx`
- Risk: page-level server rendering, auth gating, and `notFound()` behavior are verified only by manual use.

**Some small shared utilities still rely on downstream tests:**
- Untested files: `src/components/shared/cube-face.tsx`, `src/lib/content/puzzle-catalog.ts`
- Risk: helper regressions may only show up as broader UI failures instead of localized unit test failures.

---

*Testing analysis: 2026-03-24*
