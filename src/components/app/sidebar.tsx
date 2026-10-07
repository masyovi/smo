'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/lib/store'
import { Brand } from '@/components/app/brand'
import { NAV_TONES, TONE_CLASSES } from '@/components/app/nav-tones'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CalendarClock,
  ClipboardList,
  History,
  LayoutDashboard,
  MapPin,
  Plus,
  Eye,
  StickyNote,
  Tag,
  User as UserIcon,
  Users,
  type LucideIcon,
} from 'lucide-react'

type Role = 'ADMIN' | 'TECHNICIAN' | 'USER' | 'GUEST'

type NavDef = {
  view: AppView
  label: string
  labelGuest?: string // optional relabel for guests (e.g. "Riwayat" for reports)
  icon: LucideIcon
  iconGuest?: LucideIcon // optional icon swap for guests
  // When `roles` is undefined, the item is visible to every authenticated user
  // (including guests). When `roles` is set, only those roles see it.
  roles?: Role[]
}

// Main navigation — visible to everyone. Guests see relabeled "Riwayat"
// instead of "Laporan" but navigate to the same 'reports' view. Includes
// the maintenance schedule view ("Jadwal") for all roles (read-only for
// guests).
const MAIN_NAV: NavDef[] = [
  { view: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  {
    view: 'reports',
    label: 'Laporan',
    labelGuest: 'Riwayat',
    icon: ClipboardList,
    iconGuest: History,
  },
  { view: 'notes', label: 'Catatan', icon: StickyNote },
  { view: 'schedules', label: 'Jadwal', icon: CalendarClock },
]

// Management section — Teknisi + ADMIN only. Lives under a "Manajemen"
// group header on the desktop sidebar (mobile reaches these via the
// topbar user dropdown menu instead).
const MANAGEMENT_NAV: NavDef[] = [
  { view: 'locations', label: 'Lokasi', icon: MapPin, roles: ['ADMIN', 'TECHNICIAN'] },
  { view: 'categories', label: 'Kategori', icon: Tag, roles: ['ADMIN', 'TECHNICIAN'] },
  { view: 'users', label: 'Pengguna', icon: Users, roles: ['ADMIN', 'TECHNICIAN'] },
]

// Profile — hidden for guests (they get the read-only card via topbar).
const PROFILE_NAV: NavDef = {
  view: 'profile',
  label: 'Profil',
  icon: UserIcon,
  roles: ['ADMIN', 'TECHNICIAN', 'USER'],
}

function isVisible(item: NavDef, role: string) {
  return !item.roles || (item.roles as string[]).includes(role)
}

function NavButton({ item, role }: { item: NavDef; role: string }) {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)

  const isGuest = role === 'GUEST'
  const Icon = (isGuest && item.iconGuest) ? item.iconGuest! : item.icon
  const label = isGuest && item.labelGuest ? item.labelGuest : item.label
  const active = view === item.view

  // Active state also lights up when we're inside a sub-view that belongs
  // to the same nav item (e.g. report-detail belongs to the "Laporan" item).
  const subActive =
    !active &&
    ((item.view === 'reports' &&
      (view === 'report-detail' || view === 'report-new')) ||
      (item.view === 'dashboard' && view === 'report-new'))

  const toneKey = NAV_TONES[item.view] ?? 'slate'
  const tone = TONE_CLASSES[toneKey]
  const isActive = active || subActive

  return (
    <button
      type="button"
      onClick={() => setView(item.view)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors',
        'hover:bg-sidebar-accent',
        isActive && 'bg-sidebar-accent'
      )}
    >
      {/* Left accent bar — only on active */}
      {isActive && (
        <span
          className={cn(
            'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full',
            tone.dot
          )}
          aria-hidden
        />
      )}

      {/* Icon container */}
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          isActive ? tone.gradient : cn('bg-transparent', tone.tintHover)
        )}
        aria-hidden
      >
        <Icon
          className={cn(
            'size-4 shrink-0 transition-colors',
            isActive
              ? tone.iconActive
              : tone.iconIdle
          )}
        />
      </span>

      <span
        className={cn(
          'flex-1 truncate text-left transition-colors',
          isActive ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground'
        )}
      >
        {label}
      </span>
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-1">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
        {children}
      </p>
    </div>
  )
}

export function Sidebar() {
  const user = useAppStore((s) => s.user)
  const openNewReport = useAppStore((s) => s.openNewReport)

  if (!user) return null

  const isGuest = user.role === 'GUEST'
  const canManageAll = user.role === 'ADMIN' || user.role === 'TECHNICIAN'

  const mainItems = MAIN_NAV.filter((n) => isVisible(n, user.role))
  const managementItems = MANAGEMENT_NAV.filter((n) => isVisible(n, user.role))
  const profileVisible = isVisible(PROFILE_NAV, user.role)

  return (
    <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/" className="block">
          <Brand size="md" />
        </Link>
      </div>

      <div className="px-3 py-3">
        {isGuest ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-teal-500/5 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-teal-500/10">
            <span className="flex size-6 items-center justify-center rounded-md bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300">
              <Eye className="size-3.5 shrink-0" />
            </span>
            <span className="leading-tight">Mode tamu — hanya melihat</span>
          </div>
        ) : (
          <Button
            className="w-full justify-start gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/30 transition-transform hover:from-emerald-600 hover:to-teal-700 hover:shadow-md hover:shadow-emerald-500/40"
            onClick={openNewReport}
          >
            <Plus className="size-4" />
            Buat Laporan
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1 pb-4 pt-1">
          {mainItems.map((item) => (
            <NavButton key={item.view} item={item} role={user.role} />
          ))}

          {canManageAll && managementItems.length > 0 && (
            <>
              <SectionLabel>Manajemen</SectionLabel>
              {managementItems.map((item) => (
                <NavButton key={item.view} item={item} role={user.role} />
              ))}
            </>
          )}

          {profileVisible && (
            <>
              <SectionLabel>Akun</SectionLabel>
              <NavButton item={PROFILE_NAV} role={user.role} />
            </>
          )}
        </nav>
      </ScrollArea>

      {isGuest && (
        <div className="border-t p-3">
          <Badge
            variant="outline"
            className="bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900 w-full justify-center"
          >
            <Eye className="size-3" />
            Akun Tamu
          </Badge>
        </div>
      )}
    </aside>
  )
}
