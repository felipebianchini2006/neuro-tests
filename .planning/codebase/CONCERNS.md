# Codebase Concerns

**Analysis Date:** 2026-03-24

## Tech Debt

**Monolithic session management layer:**
- Issue: `src/lib/server/session-repository.ts` combines environment detection, in-memory fallback, Supabase persistence, token generation, list ordering, and all session state transitions in one 671-line file.
- Files: `src/lib/server/session-repository.ts`
- Impact: Every change to session lifecycle logic touches a central, high-blast-radius module. Divergence between the memory and Supabase branches is easy to introduce because the same behavior is implemented twice.
- Fix approach: Split `src/lib/server/session-repository.ts` into a repository selector plus isolated `memory` and `supabase` implementations, then test both implementations against a shared contract.

**Monolithic admin surface:**
- Issue: `src/components/admin/admin-dashboard.tsx` is an 829-line client component that owns creation, completion, deletion, search, tab state, URL generation, clipboard actions, and the main detail panel.
- Files: `src/components/admin/admin-dashboard.tsx`
- Impact: UI regressions and state bugs are harder to isolate because the dashboard has multiple responsibilities and a large local state surface.
- Fix approach: Extract the creation form, session list, detail panel, and link cards into focused child components with narrower props and targeted tests.

## Known Bugs

**Participant startup sends duplicate `start` requests for the first item:**
- Symptoms: Opening a participant session while it is still `pending` triggers `/api/sessions/[token]/start`, then triggers it again after the response flips the status to `in_progress`.
- Files: `src/components/participant/session-player.tsx`, `src/app/api/sessions/[token]/start/route.ts`, `src/lib/server/session-repository.ts`
- Trigger: `src/components/participant/session-player.tsx` runs the start effect on `[currentIndex, snapshot.session.status, snapshot.session.token]`; the first successful response changes `snapshot.session.status`, which causes the effect to run again and post the same start call.
- Workaround: None in the current code. The repository tolerates the duplicate call, but it still creates redundant writes and broadcasts.

**Out-of-range item indexes are persisted instead of rejected:**
- Symptoms: A caller with a valid session token can post any numeric `itemIndex`, including negative or oversized values, and the repository records it.
- Files: `src/app/api/sessions/[token]/start/route.ts`, `src/app/api/sessions/[token]/answer/route.ts`, `src/lib/server/session-repository.ts`
- Trigger: The start and answer routes validate only `typeof itemIndex === "number"`. Neither route checks bounds against `totalItems`, and both repository implementations accept the value as-is.
- Workaround: Use only the first-party client. There is no server-side guardrail.

## Security Considerations

**Admin auth is password-only, replayable, and unthrottled:**
- Risk: Admin access is protected by a single environment password, with no rate limiting, lockout, CSRF token, or server-side session record. The cookie value is the SHA-256 hash of the admin password itself, so anyone who gets the cookie can replay it until the password changes.
- Files: `src/lib/server/admin-auth.ts`, `src/app/api/admin/login/route.ts`, `src/components/admin/admin-login-form.tsx`
- Current mitigation: The cookie is `httpOnly`, `sameSite: "lax"`, and `secure` in production.
- Recommendations: Replace the deterministic cookie with a signed session token, add rate limiting and login attempt telemetry, and reject weak/default passwords during startup.

**Participant and observer access are bearer-by-URL with no expiry or second factor:**
- Risk: Anyone holding `/p/<token>`, `/o/<token>`, or `/api/sessions/<token>` can read live session state. The observer view exposes participant code, progress, attempts, correctness, and timestamps without any additional auth step.
- Files: `README.md`, `src/app/p/[token]/page.tsx`, `src/app/o/[token]/page.tsx`, `src/app/api/sessions/[token]/route.ts`, `src/lib/client/api.ts`, `src/components/admin/admin-dashboard.tsx`
- Current mitigation: Tokens are high-entropy random hex strings generated with `randomBytes(20)`.
- Recommendations: Add expiring or revocable session links, separate participant and observer scopes, and consider a second secret or signed URL for observer access.

**Environment configuration can run in insecure or misleading partial states:**
- Risk: `.env.example` seeds `ADMIN_PASSWORD=change-me`, and the application has no startup validation to reject that default or incomplete Supabase configuration. The admin page labels the store as `Supabase ativo` when server-side URL and service-role key exist, but the browser realtime path separately depends on `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Files: `.env.example`, `README.md`, `src/app/admin/page.tsx`, `src/lib/server/admin-auth.ts`, `src/lib/client/session-channel.ts`
- Current mitigation: Missing values usually cause the app to fall back to memory or disable realtime quietly.
- Recommendations: Add startup validation for required env vars, reject the default password, and surface separate health indicators for persistence and browser realtime.

## Performance Bottlenecks

**Observer mode polls the server even when realtime is connected:**
- Problem: Every observer subscribes to broadcast updates and still fetches `/api/sessions/[token]` every 4 seconds.
- Files: `src/components/observer/session-observer.tsx`, `src/lib/client/api.ts`, `src/app/api/sessions/[token]/route.ts`, `src/lib/server/session-repository.ts`
- Cause: `SessionObserver` installs a fixed `setInterval` refresh loop regardless of channel health, and `getSessionByToken` performs at least one lookup plus a second query for session items in the Supabase branch.
- Improvement path: Poll only as a degraded fallback after channel failure or stale-heartbeat detection, and collapse the Supabase fetch into a single RPC/view when possible.

**Realtime sending creates fresh channels with no delivery check:**
- Problem: Broadcast senders frequently create a brand-new channel and call `send()` immediately.
- Files: `src/lib/client/session-channel.ts`, `src/components/participant/session-player.tsx`, `src/components/admin/admin-dashboard.tsx`
- Cause: `createSessionChannel()` allocates a new channel object each call, `broadcastSessionSnapshot()` does not subscribe or inspect delivery state, and callers often pass a one-off channel instead of a subscribed shared instance.
- Improvement path: Reuse one subscribed channel per token, await subscription readiness before sending, and handle `send()` failures explicitly.

## Fragile Areas

**Memory fallback is instance-local and silent:**
- Files: `README.md`, `src/lib/server/session-repository.ts`, `src/app/admin/page.tsx`
- Why fragile: When Supabase URL or service-role key is missing, `getSessionRepository()` silently switches to the global in-memory store. That store disappears on restart and does not synchronize across processes or instances.
- Safe modification: Treat memory mode as a development-only path, emit explicit warnings when it is active, and block production startup when persistence is required.
- Test coverage: `src/lib/server/session-repository.test.ts` only exercises the memory branch; there is no equivalent coverage for the Supabase path.

**Asset sync scripts can destroy generated assets before failing:**
- Files: `scripts/sync-cube-assets.mjs`, `scripts/sync-puzzle-assets.mjs`, `scripts/sync-sequence-assets.mjs`, `scripts/derive-sequence-order.py`, `scripts/extract-puzzle-pieces.py`
- Why fragile: `scripts/sync-cube-assets.mjs` deletes `public/assets/cubes` before verifying `../Cubos` exists. `scripts/sync-puzzle-assets.mjs` deletes `public/assets/puzzles/generated` before running the Python extraction helper. The sequence and puzzle pipelines also depend on Python plus `numpy` and Pillow, but those dependencies are not declared in `package.json` or setup instructions.
- Safe modification: Validate source directories and Python dependencies before deleting outputs, stage regenerated assets in a temp directory, and document/install Python requirements explicitly.
- Test coverage: No tests cover any script under `scripts/`.

**Realtime state coherence depends on multiple weak fallbacks:**
- Files: `src/lib/client/session-channel.ts`, `src/components/participant/session-player.tsx`, `src/components/observer/session-observer.tsx`, `src/components/admin/admin-dashboard.tsx`
- Why fragile: The participant, observer, and admin views each use realtime differently. The observer subscribes and polls, the participant subscribes but does not listen for messages, and admin only sends broadcasts. This makes consistency dependent on polling and timing rather than a single reliable sync contract.
- Safe modification: Centralize session-channel lifecycle management and define one update strategy for all three surfaces.
- Test coverage: There are no tests covering Supabase channel behavior, subscription lifecycle, or observer resync behavior.

## Scaling Limits

**Memory mode does not scale past one process:**
- Current capacity: One Node.js process with a single `globalThis.__neuroTestsMemoryStore`.
- Limit: A restart, redeploy, or second instance loses or fragments active sessions because the state is not shared.
- Scaling path: Require durable persistence for any shared or production deployment and reserve memory mode for local development only.

**Observer traffic scales linearly with open sessions and viewers:**
- Current capacity: Each observer issues a full snapshot request every 4 seconds and each participant/admin action may also broadcast.
- Limit: Load grows with active observers because polling continues even when realtime works; Supabase mode also performs multiple queries per snapshot.
- Scaling path: Move to event-driven refresh with heartbeat-based fallback polling and reduce snapshot read amplification on the server.

## Dependencies at Risk

**Undeclared Python runtime dependencies for asset generation:**
- Risk: `numpy` and Pillow are required by `scripts/derive-sequence-order.py` and `scripts/extract-puzzle-pieces.py`, but there is no Python dependency manifest in the repository and `package.json` only describes Node scripts.
- Impact: Fresh environments can run `npm install` successfully and still fail on asset regeneration.
- Migration plan: Add a Python requirements file or convert the image-processing steps into a managed Node pipeline.

## Missing Critical Features

**No runtime health check or explicit mode banner for degraded operation:**
- Problem: Persistence, realtime, and admin auth can all degrade independently, but the app does not fail fast or expose a health endpoint that reports the active mode.
- Blocks: Operators cannot distinguish “fully persistent + realtime” from “memory only” or “persistent without browser realtime” from the UI or CI.

**No server-side audit trail for privileged actions:**
- Problem: Admin login, session creation, manual completion, and bulk deletion do not produce any audit record.
- Blocks: There is no forensics path for “who closed this session” or “when was history purged”.

## Test Coverage Gaps

**Supabase repository branch is effectively untested:**
- What's not tested: `createSession`, `listSessions`, `getSessionByToken`, `startItem`, `recordAnswer`, `advanceSession`, `completeSession`, and `deleteCompletedSessions` against the Supabase implementation.
- Files: `src/lib/server/session-repository.ts`, `src/lib/server/session-repository.test.ts`, `supabase/schema.sql`
- Risk: The production persistence path can drift from the in-memory behavior without the test suite detecting it.
- Priority: High

**Public session API routes lack direct coverage:**
- What's not tested: `/api/sessions/[token]`, `/api/sessions/[token]/start`, `/api/sessions/[token]/answer`, and `/api/sessions/[token]/advance`, including invalid item indexes and unauthorized token access patterns.
- Files: `src/app/api/sessions/[token]/route.ts`, `src/app/api/sessions/[token]/start/route.ts`, `src/app/api/sessions/[token]/answer/route.ts`, `src/app/api/sessions/[token]/advance/route.ts`
- Risk: Input-validation bugs and session-flow regressions can ship unnoticed.
- Priority: High

**Admin auth endpoints and flows have only partial test coverage:**
- What's not tested: `/api/admin/login`, `/api/admin/logout`, `/api/admin/sessions/completed`, `/api/admin/sessions/[token]/complete`, brute-force behavior, and cookie/session handling.
- Files: `src/app/api/admin/login/route.ts`, `src/app/api/admin/logout/route.ts`, `src/app/api/admin/sessions/completed/route.ts`, `src/app/api/admin/sessions/[token]/complete/route.ts`, `src/app/api/admin/sessions/route.test.ts`
- Risk: The most security-sensitive flows have almost no regression coverage.
- Priority: High

**Realtime and observer synchronization have no automated tests:**
- What's not tested: Broadcast send/receive semantics, channel lifecycle cleanup, observer polling fallback, and state propagation after participant/admin actions.
- Files: `src/lib/client/session-channel.ts`, `src/components/participant/session-player.tsx`, `src/components/observer/session-observer.tsx`, `src/components/admin/admin-dashboard.tsx`
- Risk: Realtime regressions will only show up in manual testing or production.
- Priority: High

**Asset tooling and operational scripts are untested:**
- What's not tested: Source-directory validation, destructive delete behavior, manifest regeneration correctness, and Python dependency availability.
- Files: `scripts/sync-sequence-assets.mjs`, `scripts/sync-cube-assets.mjs`, `scripts/sync-puzzle-assets.mjs`, `scripts/derive-sequence-order.py`, `scripts/extract-puzzle-pieces.py`
- Risk: Regenerating bundled assets can silently fail or leave the repository in a partially deleted state.
- Priority: Medium

---

*Concerns audit: 2026-03-24*
