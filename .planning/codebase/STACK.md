# Technology Stack

**Analysis Date:** 2026-03-24

## Languages

**Primary:**
- TypeScript 5.x - Application code, App Router pages, route handlers, and domain logic in `src/app/**/*.ts*`, `src/components/**/*.tsx`, and `src/lib/**/*.ts`.

**Secondary:**
- CSS - Global Tailwind-driven styling in `src/app/globals.css`.
- JavaScript (ES modules) - Asset sync tooling in `scripts/sync-sequence-assets.mjs`, `scripts/sync-cube-assets.mjs`, and `scripts/sync-puzzle-assets.mjs`.
- SQL - Supabase schema and migrations in `supabase/schema.sql` and `supabase/migrations/*.sql`.
- Python 3 - Asset-processing helpers in `scripts/derive-sequence-order.py` and `scripts/extract-puzzle-pieces.py`.

## Runtime

**Environment:**
- Node.js - Runs `next dev`, `next build`, `next start`, ESLint, Vitest, and the `.mjs` asset scripts declared in `package.json`.
- Browser runtime - Client components under `src/components/admin/*.tsx`, `src/components/participant/*.tsx`, and `src/components/observer/*.tsx` run on React 19.
- Python 3 - Required only when regenerating sequence order or puzzle-piece assets from `scripts/*.py`.

**Package Manager:**
- npm - Scripts are defined in `package.json`.
- Lockfile: present in `package-lock.json`.

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router application with server components and route handlers in `src/app/page.tsx`, `src/app/admin/page.tsx`, and `src/app/api/**/route.ts`.
- React 19.2.3 - UI layer for the admin dashboard, participant runner, and observer view in `src/components/**/*.tsx`.
- Tailwind CSS 4 - Styling is enabled by `@import "tailwindcss";` in `src/app/globals.css` and `@tailwindcss/postcss` in `postcss.config.mjs`.

**Testing:**
- Vitest 4.0.18 - Test runner configured in `vitest.config.ts` for `src/**/*.test.ts(x)`.
- Testing Library + jsdom - DOM assertions and browser-like test environment via `vitest.setup.ts`.

**Build/Dev:**
- ESLint 9 + `eslint-config-next` - Linting in `eslint.config.mjs`.
- PostCSS - Tailwind compilation through `postcss.config.mjs`.
- `next/font/google` - Build-time font integration for `Public Sans` and `IBM Plex Mono` in `src/app/layout.tsx`.

## Key Dependencies

**Critical:**
- `next` 16.1.6 - Primary framework and routing/runtime boundary for every page and API handler in `src/app/**`.
- `react` 19.2.3 and `react-dom` 19.2.3 - Rendering layer for `src/components/admin/admin-dashboard.tsx`, `src/components/participant/session-player.tsx`, and `src/components/observer/session-observer.tsx`.
- `@supabase/supabase-js` 2.98.0 - Optional persistence and realtime transport in `src/lib/server/session-repository.ts` and `src/lib/client/session-channel.ts`.
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` - Drag-and-drop ordering for the sequence test in `src/components/participant/sequence-session.tsx`.

**Infrastructure:**
- `lucide-react` - Shared icon set across `src/components/admin/admin-dashboard.tsx`, `src/components/admin/admin-login-form.tsx`, `src/components/participant/*.tsx`, and `src/components/observer/session-observer.tsx`.
- `typescript` - Strict compilation configured in `tsconfig.json` with the `@/*` alias mapped to `src/*`.
- `numpy` and `Pillow` - System Python packages imported by `scripts/derive-sequence-order.py` and `scripts/extract-puzzle-pieces.py` for image analysis; they are required outside npm.

## Configuration

**Environment:**
- Root-level `.env.local` is the expected local secrets file according to `README.md`; root-level `.env.example` is present as a template file.
- `ADMIN_PASSWORD` gates the admin panel and cookie auth in `src/lib/server/admin-auth.ts` and `src/app/admin/page.tsx`.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` enable the persistent server repository in `src/lib/server/session-repository.ts`.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` enables browser realtime channels in `src/lib/client/session-channel.ts`.
- `NODE_ENV` only affects cookie security flags in `src/app/api/admin/login/route.ts` and `src/app/api/admin/logout/route.ts`.

**Build:**
- `next.config.ts` exists but stays at the default empty config object.
- `tsconfig.json` enables strict TypeScript, bundler module resolution, and the `@/*` path alias.
- `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, and `vitest.setup.ts` define lint/test/build-time behavior.

## Platform Requirements

**Development:**
- Node.js with npm is required to run the Next.js app and project scripts from `package.json`.
- Python 3 with `numpy` and `Pillow` is required to run `scripts/derive-sequence-order.py` and `scripts/extract-puzzle-pieces.py`.
- Optional external asset source folders are expected by `scripts/sync-sequence-assets.mjs` (`../Figuras/Arranjo de Figuras`) and `scripts/sync-cube-assets.mjs` (`../Cubos`); if the sequence source is absent, `scripts/sync-sequence-assets.mjs` falls back to bundled assets already under `public/assets/sequence`.
- Optional Supabase setup requires applying `supabase/schema.sql` plus later migrations in `supabase/migrations/002_add_test_types.sql` and `supabase/migrations/003_add_adult_battery_test_type.sql`.

**Production:**
- A Node-compatible host that can run a Next.js 16 server is required; no deployment descriptor is present in the repository root.
- Supabase is optional in production: without the Supabase env vars, `getSessionRepository()` in `src/lib/server/session-repository.ts` falls back to in-memory storage.

---

*Stack analysis: 2026-03-24*
