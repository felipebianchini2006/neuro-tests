# Neuro-Tests Project Overview

## Purpose
A web application for administering cognitive tests (sequence ordering and cube solving) with real-time progress tracking. Tests can be participant-facing, observer-facing (live monitoring), or admin-managed.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19 + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL) - optional; falls back to in-memory
- **Testing**: Vitest + Testing Library
- **UI Interactions**: @dnd-kit (drag-and-drop, sortable)
- **Linting**: ESLint 9

## Code Structure
```
src/lib/
  domain/          Pure logic, zero dependencies (cubes.ts, sequence.ts)
  content/         Domain + assets (catalog.ts - test content definitions)
  server/          Server-only (session repository, auth, participant state)
  client/          Browser-only (API wrappers, Realtime channels)

src/components/
  admin/           Admin dashboard
  participant/     Test-taking UI
  observer/        Real-time progress watching
  shared/          Reusable (CubeFace SVG renderer)

src/app/
  api/sessions/[token]/    Session API (start, answer, advance, complete)
  api/admin/               Admin API (create, list, delete sessions)
```

## Key Concepts
- **Session State Machine**: pending → in_progress → completed
- **Dual Storage**: Supabase OR in-memory map (selected at runtime)
- **Shuffle Determinism**: Seeded hash per session token ensures reproducibility
- **Three URL Spaces**: /admin (password-protected), /p/[token] (participant), /o/[token] (observer)
