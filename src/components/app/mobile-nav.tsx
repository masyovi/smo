'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/lib/store'
import { NAV_TONES, TONE_CLASSES, type NavTone } from '@/components/app/nav-tones'
import {
  CalendarClock,
  ClipboardList,
  History,
  LayoutDashboard,
  Plus,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'

type BottomItemProps = {
  icon: LucideIcon
  label: string
  active: boolean
  tone: NavTone
  onClick: () => void
}

function BottomItem({ icon: Icon, label, active, tone: toneKey, onClick }: BottomItemProps) {
  const tone = TONE_CLASSES[toneKey]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'group flex min-h-[48px] flex-1 items-center justify-center rounded-lg transition-colors',
        active ? tone.text : 'text-muted-foreground hover:text-foreground'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-xl transition-all',
          active
            ? tone.gradient
            : cn('bg-transparent group-hover:scale-105', tone.tintHover)
        )}
        aria-hidden
      >
        <Icon
          className={cn(
            'size-[20px] transition-colors',
            active ? tone.iconActive : tone.iconIdle
          )}
        />
      </span>
    </button>
  )
}

// Raised center FAB used by technicians on mobile.
function FabItem({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <button
        type="button"
        aria-label="Buat Laporan"
        onClick={onClick}
        className={cn(
          '-mt-6 flex size-14 items-center justify-center rounded-full text-white',
          'bg-gradient-to-br from-emerald-500 to-teal-600',
          'shadow-lg shadow-emerald-500/40',
          'ring-4 ring-background transition-transform active:scale-95 hover:scale-105'
        )}
      >
        <Plus className="size-6" strokeWidth={2.4} />
      </button>
    </div>
  )
}

export function MobileNavWithDrawer() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const openNewReport = useAppStore((s) => s.openNewReport)

  if (!user) return null

  const isGuest = user.role === 'GUEST'

  // Active state helper for cells that map to the same view (e.g. Riwayat
  // for guests shares the 'reports' view).
  const reportsActive =
    view === 'reports' || view === 'report-detail' || view === 'report-new'

  return (
    <nav
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden',
        'pb-[env(safe-area-inset-bottom)]'
      )}
      aria-label="Navigasi bawah"
    >
      <div
        className={cn(
          'mx-auto grid max-w-md items-center gap-1 px-2 pt-2',
          isGuest ? 'grid-cols-3' : 'grid-cols-5'
        )}
      >
        {/* Beranda */}
        <BottomItem
          icon={LayoutDashboard}
          label="Beranda"
          active={view === 'dashboard'}
          tone={NAV_TONES['dashboard' as AppView]}
          onClick={() => setView('dashboard')}
        />

        {/* Laporan / Riwayat (guest relabel) */}
        <BottomItem
          icon={isGuest ? History : ClipboardList}
          label={isGuest ? 'Riwayat' : 'Laporan'}
          active={reportsActive}
          tone={NAV_TONES['reports' as AppView]}
          onClick={() => setView('reports')}
        />

        {isGuest ? (
          // Guests: 3 cells only, no FAB. Catatan goes in the third cell.
          <BottomItem
            icon={StickyNote}
            label="Catatan"
            active={view === 'notes'}
            tone={NAV_TONES['notes' as AppView]}
            onClick={() => setView('notes')}
          />
        ) : (
          <>
            {/* Center FAB — new report (teknisi only) */}
            <FabItem onClick={openNewReport} />

            {/* Jadwal */}
            <BottomItem
              icon={CalendarClock}
              label="Jadwal"
              active={view === 'schedules'}
              tone={NAV_TONES['schedules' as AppView]}
              onClick={() => setView('schedules')}
            />

            {/* Catatan */}
            <BottomItem
              icon={StickyNote}
              label="Catatan"
              active={view === 'notes'}
              tone={NAV_TONES['notes' as AppView]}
              onClick={() => setView('notes')}
            />
          </>
        )}
      </div>
    </nav>
  )
}
