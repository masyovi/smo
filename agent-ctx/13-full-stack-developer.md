# Task 13 — full-stack-developer

## Task
Polish every icon across the SMO app to be more colorful, attractive, and scannable — replace flat monochrome outlines with per-view color tones, gradient active states, tinted hover states, soft glows, and gradient circle backings for empty-state / banner icons.

## Files Created
- `src/components/app/nav-tones.ts` — central tone system (NavTone type, NAV_TONES map per AppView, TONE_CLASSES record with full literal Tailwind class fragments).

## Files Modified
- `src/components/app/brand.tsx` — gradient emerald-to-teal ShieldCheck with glow ring + inner radial highlight. BrandMark gets the same treatment.
- `src/components/app/sidebar.tsx` — NavButton redesigned with per-item tone, gradient active icon container, tinted hover bg, tone-colored left accent bar. "Buat Laporan" CTA + guest "Mode tamu" badge both upgraded.
- `src/components/app/mobile-nav.tsx` — BottomItem takes a `tone` prop, matches the sidebar tone system. FAB rewritten as gradient emerald-to-teal circle with stronger colored shadow.
- `src/components/app/topbar.tsx` — Bell icon gets a gradient red container w/ pulse when due; count badge is gradient red. Theme toggle wrapped in size-9 container, sun in violet-tinted (NOT indigo), moon in amber-tinted. Avatar gets `ring-2 ring-emerald-400/40` + gradient emerald fallback bg.
- `src/components/app/stat-card.tsx` — `toneMap[*].iconBg` updated to gradient tinted bgs per tone (emerald, amber, blue, red, slate, purple variants).
- `src/components/app/empty-state.tsx` — Icon wrapped in `size-14 rounded-2xl` gradient emerald container with ring + soft glow behind.
- `src/components/app/views/report-detail-view.tsx` — InfoTile component takes `iconTone` prop; LOKASI=teal, KATEGORI=rose, PELAPOR=cyan, DITUGASKAN=emerald, each with a gradient tinted bg in a `size-6 rounded-lg` container.
- `src/components/app/views/dashboard-view.tsx` — Maintenance reminder, assignment banner, and guest mode notice icons all upgraded to gradient circles matching their semantic tone.

## Quality Bar
- All gradient class strings are full Tailwind v4 literals — no dynamic class concatenation.
- Dark mode variants preserved everywhere.
- Indonesian copy unchanged.
- No new icon packages installed (still lucide-react + shadcn/ui).
- No brand indigo/blue used (sky is OK as a per-item tone for "Laporan"; violet used for moon icon instead of indigo).
- `bun run lint` passes (0 errors, 1 pre-existing prisma/seed.ts warning).
- `dev.log` clean — only `✓ Compiled in Nms` entries and 200 responses.

## Done Checklist (verified)
- [x] `bun run lint` passes (0 errors; warnings OK).
- [x] `/home/z/my-project/dev.log` shows no compile errors after edits.
- [x] Brand logo is a gradient emerald-to-teal shield with a glow ring.
- [x] Sidebar nav: each item has its own tone; active item has a gradient icon container; inactive items show their tone color on hover.
- [x] Mobile bottom nav: matches the sidebar tones; FAB is a gradient emerald circle.
- [x] Topbar bell shows a gradient red bg when there are due notifications.
- [x] Stat card icons have gradient tinted backgrounds.
- [x] Empty state icons sit in a gradient circle with a soft glow.
- [x] Report detail tiles have per-tile gradient icon backgrounds.
- [x] Dashboard banners have gradient icon circles.
