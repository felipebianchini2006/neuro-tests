# External Integrations

**Analysis Date:** 2026-03-24

## APIs & External Services

**Persistence and realtime backend:**
- Supabase - Optional database persistence and realtime broadcast for session state.
  - SDK/Client: `@supabase/supabase-js` used in `src/lib/server/session-repository.ts` and `src/lib/client/session-channel.ts`
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Build-time asset service:**
- Google Fonts - `next/font/google` downloads `Public Sans` and `IBM Plex Mono` for the app shell in `src/app/layout.tsx`.
  - SDK/Client: built into Next.js via `next/font/google`
  - Auth: none

## Data Storage

**Databases:**
- Supabase Postgres
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`
  - Client: `@supabase/supabase-js` in `src/lib/server/session-repository.ts`
  - Schema: `public.sessions` and `public.session_items` are defined in `supabase/schema.sql`
  - Schema drift guard: `src/app/api/admin/sessions/route.ts` translates `sessions_test_type_check` failures into a migration hint, and the matching constraint updates live in `supabase/migrations/002_add_test_types.sql` and `supabase/migrations/003_add_adult_battery_test_type.sql`

**File Storage:**
- Local filesystem only
  - Runtime assets are served from `public/assets/cubes`, `public/assets/cubes-teen`, `public/assets/sequence`, and `public/assets/puzzles/generated`
  - Generated asset manifests are committed in `src/lib/content/sequence-manifest.generated.ts` and `src/lib/content/puzzle-manifest.generated.ts`

**Caching:**
- None
  - `getSessionSnapshot()` in `src/lib/client/api.ts` calls `fetch(..., { cache: "no-store" })`
  - `src/components/observer/session-observer.tsx` falls back to a 4-second poll loop even when realtime is configured

## Realtime & Broadcast

**Realtime provider:**
- Supabase Realtime broadcast
  - Channel creation: `src/lib/client/session-channel.ts` opens `session:${token}` with `broadcast: { self: true }`
  - Publishers: `src/components/participant/session-player.tsx` broadcasts after `start`, `answer`, and `advance`; `src/components/admin/admin-dashboard.tsx` broadcasts after forced completion
  - Subscriber: `src/components/observer/session-observer.tsx` listens for `session-updated` events and updates local state immediately
  - Fallback behavior: if the browser client cannot be created from env vars, the observer still refreshes through `/api/sessions/[token]` in `src/lib/client/api.ts`

## Authentication & Identity

**Auth Provider:**
- Custom password-based admin access
  - Implementation: `src/lib/server/admin-auth.ts` hashes `ADMIN_PASSWORD` with SHA-256, compares it with `timingSafeEqual`, and treats the hash as the admin session cookie value
  - Login endpoint: `src/app/api/admin/login/route.ts` sets the `neuro_admin` HTTP-only cookie
  - Logout endpoint: `src/app/api/admin/logout/route.ts` expires the same cookie
  - Gatekeeping: `src/app/admin/page.tsx` blocks the dashboard when `ADMIN_PASSWORD` is unset or the cookie is missing

**Participant identity:**
- Link token only
  - Implementation: participant and observer pages under `src/app/p/[token]/page.tsx` and `src/app/o/[token]/page.tsx` read a session token from the URL and load the session snapshot directly from `getSessionRepository()`

## Monitoring & Observability

**Error Tracking:**
- None
  - No Sentry, Datadog, LogRocket, or similar SDK is imported anywhere under `src/`

**Logs:**
- Local console/stdout only
  - Asset scripts in `scripts/sync-*.mjs` print completion summaries with `console.log`
  - The participant runner logs failed item-start attempts with `console.error` in `src/components/participant/session-player.tsx`

## CI/CD & Deployment

**Hosting:**
- Not detected
  - No Vercel, Docker, GitHub Actions, or platform-specific deployment config is present in the repository root

**CI Pipeline:**
- None
  - Validation is documented manually in `README.md` as `npm test`, `npm run lint`, and `npm run build`

## Environment Configuration

**Required env vars:**
- `ADMIN_PASSWORD` - Required for `/admin`, checked in `src/app/admin/page.tsx` and `src/lib/server/admin-auth.ts`
- `NEXT_PUBLIC_SUPABASE_URL` - Shared base URL for both server persistence and browser realtime in `src/lib/server/session-repository.ts` and `src/lib/client/session-channel.ts`
- `SUPABASE_SERVICE_ROLE_KEY` - Required for server-side CRUD against `sessions` and `session_items` in `src/lib/server/session-repository.ts`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Preferred browser key for realtime in `src/lib/client/session-channel.ts`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Browser realtime fallback when a publishable key is not provided in `src/lib/client/session-channel.ts`

**Secrets location:**
- Root-level `.env.local` is the expected local secrets file per `README.md`
- Root-level `.env.example` exists as the checked-in template file

## Webhooks & Callbacks

**Incoming:**
- None
  - Route handlers under `src/app/api/**` serve the app’s own frontend, not third-party webhook providers

**Outgoing:**
- None
  - The app does not POST to third-party callbacks; cross-client updates travel through Supabase Realtime broadcast from `src/lib/client/session-channel.ts`

---

*Integration audit: 2026-03-24*
