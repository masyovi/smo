# Task 3 — SMO Full-Stack App Implementation

Agent: full-stack-developer
Task: Build the full SMO web app — global styles, layout, API routes, components, views, and root page wiring.

## What was built

### Foundation
- `src/app/globals.css` — emerald/teal OKLCH palette (light + refined dark), custom `.scrollbar-thin` styling.
- `src/app/layout.tsx` — metadata, `ThemeProvider` (next-themes), `QueryProvider` (TanStack), kept `<Toaster>` and added `<SonnerToaster position="top-center" richColors />`.
- `src/components/providers/theme-provider.tsx` — next-themes React provider.
- `src/components/providers/query-provider.tsx` — TanStack Query client (staleTime 30s).

### API routes (`src/app/api/*`)
- `auth/login`, `auth/logout`, `auth/me`
- `reports` (GET list / POST create) — role-scoped (USER sees own OR assigned).
- `reports/[id]` (GET / PATCH / DELETE) — PATCH creates ReportHistory entries: STATUS_CHANGED, PRIORITY_CHANGED, ASSIGNED, RESOLVED (when going to RESOLVED), REOPENED (when going back to PENDING/IN_PROGRESS).
- `reports/[id]/comments` (POST) — creates COMMENTED history.
- `locations` + `locations/[id]` (CRUD, admin-only writes, 409 guard).
- `categories` + `categories/[id]` (CRUD, admin-only writes, 409 guard).
- `users` + `users/[id]` (CRUD, admin-only, prevent self-delete 400, 409 if has reports).
- `profile` (GET / PATCH) — name/phone/department + change-password (verifies currentPassword).
- `upload` (POST multipart) — saves to `public/uploads/<uuid>.<ext>`, validates image MIME, max 5MB.
- `stats` (GET) — totalReports, byStatus, byPriority, urgentOpen, pendingUnassigned, recent 5.

### Components (`src/components/app/*`)
- `brand.tsx` — SMO wordmark + ShieldCheck emerald mark.
- `status-badge.tsx`, `priority-badge.tsx`, `role-badge.tsx` — colored outline badges.
- `stat-card.tsx` — icon+value+label card with 6 tone variants.
- `empty-state.tsx` — dashed empty state with icon/title/description/CTA.
- `category-icon.tsx` — Lucide icon lookup by string name.
- `login-screen.tsx` — split-panel: gradient brand panel + form card with demo accounts.
- `app-shell.tsx`, `sidebar.tsx`, `topbar.tsx`, `mobile-nav.tsx` — desktop sidebar + sticky topbar; mobile bottom nav with raised FAB + Sheet drawer.

### Views (`src/components/app/views/*`)
- `dashboard-view.tsx` — 4 stat cards, donut chart, bar chart, recent reports list, admin "needs assignment" banner.
- `reports-view.tsx` — search + filters, desktop Table + mobile cards, pagination, floating FAB.
- `report-detail-view.tsx` — hero, description, image, resolution card, ActionPanel (TECH/ADMIN), OwnerEditPanel (owner of PENDING), comment composer, history timeline, delete dialog.
- `report-form-view.tsx` — react-hook-form + zod, location/category/priority selects, optional image upload with preview.
- `locations-view.tsx`, `categories-view.tsx`, `users-view.tsx` — admin CRUD with Dialogs + AlertDialogs.
- `profile-view.tsx` — account info form + change-password form.

### Root page
- `src/app/page.tsx` — fetches `/api/auth/me` on mount; renders `<LoginScreen/>` when logged out, `<AppShell/>` when logged in, branded loading screen while loading.

## Lint status
`bun run lint` — 0 errors, 1 pre-existing warning in `prisma/seed.ts` (unused eslint-disable from Task 1).

## Dev log status
Dev log is clean. After fixes (see "Key bugs fixed" below), the reviewer successfully logged in and exercised all endpoints. Last lines of `dev.log` show 200/201 responses only.

## Key bugs fixed during this task
1. **Prisma `groupBy` aggregation shape**: `_count: { _all: true }` returns objects with `_count._all`, not `_all`. Fixed in `src/app/api/stats/route.ts` so the dashboard charts receive populated `byStatus` / `byPriority`.
2. **`CardTitle` not imported** in `login-screen.tsx` — added to the import line.
3. **`require('crypto')` inline** in `src/lib/auth.ts` (lint error) — replaced with top-level `import { createHmac } from 'crypto'`.
4. **Unused eslint-disable** comment in `src/app/page.tsx` — removed.
5. **Session cookie not surviving across requests in the preview sandbox** (was `SameSite=Lax; Secure=prod-only`). Root cause: the preview iframe context is cross-site, so Lax cookies were not attached. Fix: in `setSessionCookie`, read the `X-Forwarded-Proto` header via `next/headers` `headers()` and emit `Secure; SameSite=None` when the request was proxied through HTTPS, falling back to `SameSite=Lax; Secure=false` for plain HTTP. Verified working via curl with the `X-Forwarded-Proto: https` header and confirmed in `dev.log` (GET /api/auth/me, /api/stats, /api/reports, etc. all return 200 after login).

## Notes for next agents
- The dev server is already running on port 3000; do NOT restart it.
- All session cookie logic lives in `src/lib/auth.ts` — `setSessionCookie` now accepts no args and reads `headers()` internally.
- Demo accounts remain: `admin@smo.com / admin123`, `teknisi@smo.com / teknisi123`, `user@smo.com / user123`.
- Brand color is emerald/teal — do NOT switch to indigo/blue primary.
- All copy is Indonesian; keep that convention for any new strings.
