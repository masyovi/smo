'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
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
  onClick: () => void
}

function BottomItem({ icon: Icon, label, active, onClick }: BottomItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-md py-1.5 text-[10px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="size-5" />
      <span>{label}</span>
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
          'bg-primary text-primary-foreground -mt-6 flex size-14 items-center justify-center rounded-full shadow-lg',
          'bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700',
          'ring-4 ring-background transition-transform active:scale-95 hover:scale-105'
        )}
      >
        <Plus className="size-6" />
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
          onClick={() => setView('dashboard')}
        />

        {/* Laporan / Riwayat (guest relabel) */}
        <BottomItem
          icon={isGuest ? History : ClipboardList}
          label={isGuest ? 'Riwayat' : 'Laporan'}
          active={reportsActive}
          onClick={() => setView('reports')}
        />

        {isGuest ? (
          // Guests: 3 cells only, no FAB. Catatan goes in the third cell.
          <BottomItem
            icon={StickyNote}
            label="Catatan"
            active={view === 'notes'}
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
              onClick={() => setView('schedules')}
            />

            {/* Catatan */}
            <BottomItem
              icon={StickyNote}
              label="Catatan"
              active={view === 'notes'}
              onClick={() => setView('notes')}
            />
          </>
        )}
      </div>
    </nav>
  )
}
