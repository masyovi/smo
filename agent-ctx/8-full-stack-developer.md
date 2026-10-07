# Task 8 — Schedules View + Functional Notifications Bell

## Task

Replace the old "Pengaturan" hub view (Task 7) with a Maintenance Schedule manager and a functional notifications bell. The "Pengaturan" nav item is relabeled to "Jadwal" and now opens the schedules view.

## Files Created / Modified

### Created
- `src/components/app/views/schedules-view.tsx` — The new Schedules view. Lists schedules grouped into Jatuh Tempo (red), Segera (amber), Jadwal Lainnya (muted). Teknisi-only actions: Tandai Selesai, Edit, Hapus. Create/Edit dialog with judul, deskripsi, lokasi (Select from `/api/locations`), frequency RadioGroup (Bulanan / Per N bulan), dayOfMonth (Select 1-31), intervalMonths (number input), startDate (date input). Empty state uses CalendarClock icon.

### Modified
- `src/components/app/topbar.tsx` — REWRITTEN. Added `useNotifications()` hook that polls `/api/notifications` every 60s and shows a one-time-per-session Sonner toast when `totalDue > 0` (with "Lihat" action). Added `NotificationBell` component (Popover) with red badge showing due count, due section (red-tinted), upcoming section (amber-tinted), empty state (CheckCircle2), and "Lihat semua jadwal" footer. Restructured the user dropdown: Teknisi gets Lokasi/Kategori/Pengguna + Jadwal Maintenance + Catatan + Profil Saya + Keluar; USER gets Jadwal/Catatan/Profil/Keluar; GUEST gets Jadwal/Catatan + Mode tamu + Keluar. Added `schedules: 'Jadwal Maintenance'` to TITLES map, removed `settings` entry.
- `src/components/app/mobile-nav.tsx` — Replaced the "Pengaturan" cell (was `view: 'settings'`) with "Jadwal" (`view: 'schedules'`, icon `CalendarClock`). Kept the 5-cell tek layout (Beranda, Laporan, +, Jadwal, Catatan) and 3-cell guest layout.
- `src/components/app/sidebar.tsx` — Added `CalendarClock` icon. Added `{ view: 'schedules', label: 'Jadwal', icon: CalendarClock }` to `MAIN_NAV` (visible to all roles including guests). Relabeled the management section header from "Pengaturan" to "Manajemen". Updated comment to reflect mobile reaches management via topbar dropdown.
- `src/components/app/app-shell.tsx` — Replaced `import { SettingsView }` with `import { SchedulesView }`. Replaced `case 'settings': return <SettingsView />` with `case 'schedules': return <SchedulesView />`.
- `src/components/app/views/dashboard-view.tsx` — Added a "Pengingat Maintenance" card (subtle, single Card) between stat cards and manager assignment banner. Uses `/api/notifications` data — shows red accent when `totalDue > 0`, amber when only upcoming. "Lihat Jadwal" button calls `setView('schedules')`. Card is hidden when both `totalDue` and `totalUpcoming` are 0.

### Deleted
- `src/components/app/views/settings-view.tsx` — No longer referenced (replaced by SchedulesView). Verified no other file imports it before deletion.

## Verification

- `bun run lint`: 0 errors, 1 pre-existing warning (`prisma/seed.ts`).
- `dev.log`: clean — only 200/201/403 responses after edits, no compile errors.
- API verified end-to-end against Turso:
  - Login teknisi → `POST /api/auth/login` 200.
  - `GET /api/notifications` → 200, `totalDue: 1, totalUpcoming: 2` (Maintenance Lift Utama due today; AC + CCTV upcoming within 7 days; APAR + Smoke Detector in "later").
  - Guest login → `POST /api/auth/guest` 200.
  - Guest `POST /api/schedules` → 403 "Akses tamu hanya untuk melihat…" ✓
  - Guest `GET /api/notifications` → 200 (read-only access works) ✓
  - Teknisi `POST /api/schedules` (test schedule, MONTHLY day=15 startDate=2026-10-15) → 201, server computed `nextDueDate: 2026-10-15` ✓
  - Teknisi `POST /api/schedules/[id]/complete` → 200, `nextDueDate` advanced from 2026-10-15 → 2026-11-15 (next month), `lastCompletedAt` set ✓
  - Teknisi `PATCH /api/schedules/[id]` (frequency MONTHLY→INTERVAL, intervalMonths=3) → 200, server recomputed nextDueDate ✓
  - Teknisi `DELETE /api/schedules/[id]` → 200 ✓
  - Test schedule cleaned up — counts back to original (1 due + 2 upcoming + 2 later).
- Homepage `/` returns 200, no SSR errors.

## Done Checklist

- [x] `bun run lint` passes (0 errors; 1 pre-existing warning in `prisma/seed.ts`).
- [x] `dev.log` shows no compile errors after edits.
- [x] The "Pengaturan" nav item is now labeled "Jadwal" (mobile + desktop) and opens the Schedules view.
- [x] Schedules view lists the 5 sample schedules grouped by Jatuh Tempo (1: Maintenance Lift) / Segera (2: AC + CCTV) / Lainnya (2: APAR + Smoke Detector).
- [x] Teknisi can create a new schedule (Dialog with frequency MONTHLY/INTERVAL, dayOfMonth/intervalMonths, location, startDate) — the server computes nextDueDate.
- [x] Teknisi can click "Tandai Selesai" on a due schedule → it advances to next month, toast confirms next due date.
- [x] Teknisi can edit/delete schedules.
- [x] Guest sees the schedules read-only (no Tambah/Tandai Selesai/Edit/Delete); guest POST → 403.
- [x] The topbar bell shows a red badge with the due count (1 initially). Clicking it opens a Popover listing due + upcoming schedules.
- [x] On first app load (as teknisi), a Sonner toast appears: "Pengingat Maintenance — N jadwal maintenance jatuh tempo hari ini." with a "Lihat" action. It does NOT re-toast on every 60s poll (guarded by `useRef`).
- [x] Mobile: the user dropdown (avatar menu) contains Lokasi/Kategori/Pengguna/Jadwal Maintenance/Catatan/Profil Saya/Keluar for technicians.
- [x] Desktop sidebar has a "Jadwal" item (CalendarClock icon) and the management section is labeled "Manajemen".
