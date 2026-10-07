'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/lib/store'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brand } from '@/components/app/brand'
import { RoleBadge } from '@/components/app/role-badge'
import { Button } from '@/components/ui/button'
import { apiFetch, ApiError } from '@/lib/api'
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Tag,
  Users,
  User as UserIcon,
  Plus,
  Menu,
  LogOut,
  Eye,
  type LucideIcon,
} from 'lucide-react'

type NavDef = {
  view: AppView
  label: string
  icon: LucideIcon
  roles?: Array<'ADMIN' | 'TECHNICIAN' | 'USER' | 'GUEST'>
}

// Per SMO policy: only Teknisi (and ADMIN for backward-compat) can manage
// locations/categories/users. Guests only see Beranda + Laporan.
const NAV: NavDef[] = [
  { view: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { view: 'reports', label: 'Laporan', icon: ClipboardList },
  { view: 'locations', label: 'Lokasi', icon: MapPin, roles: ['ADMIN', 'TECHNICIAN'] },
  { view: 'categories', label: 'Kategori', icon: Tag, roles: ['ADMIN', 'TECHNICIAN'] },
  { view: 'users', label: 'Pengguna', icon: Users, roles: ['ADMIN', 'TECHNICIAN'] },
  { view: 'profile', label: 'Profil Saya', icon: UserIcon, roles: ['ADMIN', 'TECHNICIAN', 'USER'] },
]

function MobileDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const user = useAppStore((s) => s.user)
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const logout = useAppStore((s) => s.logout)

  if (!user) return null
  const isGuest = user.role === 'GUEST'
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role))

  const handleSelect = (v: AppView) => {
    setView(v)
    onOpenChange(false)
  }

  async function handleLogout() {
    onOpenChange(false)
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', skipJson: true })
    } catch {
      // ignore network errors
    } finally {
      logout()
      toast.success('Berhasil keluar', { description: 'Sampai jumpa!' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[280px] sm:max-w-xs">
        <SheetHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <SheetTitle asChild>
            <div>
              <Brand size="md" />
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pt-2">
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.name}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <RoleBadge role={user.role} />
                  {isGuest && (
                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                      <Eye className="size-3" />
                      Hanya melihat
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1 px-4">
          <nav className="flex flex-col gap-1 py-4">
            {items.map((item) => {
              const Icon = item.icon
              const active = view === item.view
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleSelect(item.view)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    'hover:bg-accent',
                    active && 'bg-accent text-foreground'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </ScrollArea>
        <div className="border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function MobileNavWithDrawer() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const openNewReport = useAppStore((s) => s.openNewReport)
  const logout = useAppStore((s) => s.logout)
  const [open, setOpen] = React.useState(false)

  if (!user) return null
  const isGuest = user.role === 'GUEST'

  async function handleQuickLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', skipJson: true })
    } catch {
      // ignore network errors
    } finally {
      logout()
      toast.success('Berhasil keluar', { description: 'Sampai jumpa!' })
    }
  }

  return (
    <>
      <nav
        className="bg-background/95 supports-[backdrop-filter]:bg-background/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden"
        aria-label="Navigasi bawah"
      >
        <div
          className={cn(
            'mx-auto grid max-w-md items-center gap-1 px-2 pb-[env(safe-area-inset-bottom)] pt-2',
            isGuest ? 'grid-cols-4' : 'grid-cols-5'
          )}
        >
          <BottomItem
            icon={LayoutDashboard}
            label="Beranda"
            active={view === 'dashboard'}
            onClick={() => setView('dashboard')}
          />
          <BottomItem
            icon={ClipboardList}
            label="Laporan"
            active={view === 'reports' || view === 'report-detail' || view === 'report-new'}
            onClick={() => setView('reports')}
          />

          {isGuest ? (
            // Guests get a quick logout cell instead of the FAB + Profil.
            <BottomItem
              icon={LogOut}
              label="Keluar"
              active={false}
              onClick={handleQuickLogout}
              danger
            />
          ) : (
            // Center FAB — new report (only for non-guests).
            <div className="flex items-center justify-center">
              <button
                type="button"
                aria-label="Buat Laporan"
                onClick={openNewReport}
                className="bg-primary text-primary-foreground -mt-6 flex size-14 items-center justify-center rounded-full shadow-lg ring-4 ring-background transition-transform active:scale-95"
              >
                <Plus className="size-6" />
              </button>
            </div>
          )}

          <BottomItem
            icon={Menu}
            label="Menu"
            active={false}
            onClick={() => setOpen(true)}
          />
          {!isGuest && (
            <BottomItem
              icon={UserIcon}
              label="Profil"
              active={view === 'profile'}
              onClick={() => setView('profile')}
            />
          )}
        </div>
      </nav>

      <MobileDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}

function BottomItem({
  icon: Icon,
  label,
  active,
  onClick,
  danger,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-md py-1.5 text-[10px] font-medium transition-colors',
        active
          ? 'text-primary'
          : danger
            ? 'text-destructive hover:text-destructive'
            : 'text-muted-foreground hover:text-foreground'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="size-5" />
      <span>{label}</span>
    </button>
  )
}
