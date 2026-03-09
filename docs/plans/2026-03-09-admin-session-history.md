# Admin Session History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist and display the admin session history so multiple created session links remain visible after new creations and after page reloads.

**Architecture:** Extend the session repository with a read model for listing sessions in reverse chronological order, preload that history in the admin page, and update the client dashboard to append new sessions without overwriting older ones. Cover the regression with component tests that verify both preloaded history and in-session creation behavior.

**Tech Stack:** Next.js App Router, React 19 client/server components, Vitest, Testing Library, Supabase repository fallback to in-memory storage.

---

### Task 1: Lock the regression with tests

**Files:**
- Create: `src/components/admin/admin-dashboard.test.tsx`
- Modify: `src/components/admin/admin-dashboard.tsx`

**Step 1: Write the failing test**

Add tests that prove:
- preloaded admin sessions render as a list
- creating a new session keeps the older one visible instead of replacing it

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/admin/admin-dashboard.test.tsx`
Expected: FAIL because the dashboard only tracks one `createdSession` and has no support for server-provided history.

**Step 3: Write minimal implementation**

Update the dashboard state shape from a single session to an ordered list and accept preloaded entries from the server.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/admin/admin-dashboard.test.tsx`
Expected: PASS

### Task 2: Load history from the repository

**Files:**
- Modify: `src/lib/server/session-repository.ts`
- Modify: `src/app/admin/page.tsx`

**Step 1: Write/extend the failing test**

Use the component test plus a focused repository assertion if needed to prove sessions are returned in reverse chronological order.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/admin/admin-dashboard.test.tsx`

**Step 3: Write minimal implementation**

Add `listSessions()` to both repository implementations and preload the result in the admin page so refreshes restore the history.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/admin/admin-dashboard.test.tsx`

### Task 3: Verify the full regression and behavior

**Files:**
- Modify: `src/components/admin/admin-dashboard.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/lib/server/session-repository.ts`

**Step 1: Run targeted tests**

Run: `npm test -- src/components/admin/admin-dashboard.test.tsx`

**Step 2: Run a broader safety check**

Run: `npm test`

**Step 3: Summarize behavior**

Confirm from code references whether the participant session auto-completes only after the final successful advance action.
