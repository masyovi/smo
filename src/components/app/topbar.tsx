'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  LogOut,
  MapPin,
  StickyNote,
  Tag,
  UserRound,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api'
import { RoleBadge } from '@/components/app/role-badge'
import { Brand } from '@/components/app/brand'
import { formatDate } from '@/lib/types'
import { startOfDay, daysBetween } from '@/lib/schedule-utils'
import { useDeviceNotifications } from '@/lib/use-push-notifications'
import { cn } from '@/lib/utils'

type ScheduleLocation = {
  id: string
  name: string
  building: string
  floor: string | null
} | null

type Schedule = {
  id: string
  title: string
  nextDueDate: string
  location: ScheduleLocation
}

type NotificationsResponse = {
  due: Schedule[]
  upcoming: Schedule[]
  later: Schedule[]
  totalDue: number
  totalUpcoming: number
}

const TITLES: Record<string, string> = {
  dashboard: 'Beranda',
  reports: 'Laporan',
  'report-detail': 'Detail Laporan',
  'report-new': 'Buat Laporan',
  locations: 'Lokasi',
  categories: 'Kategori',
  users: 'Pengguna',
  notes: 'Catatan',
  schedules: 'Jadwal Maintenance',
  profile: 'Profil Saya',
}

function initials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function dueBadge(dueDate: string): { label: string; tone: 'red' | 'amber' } {
  const due = startOfDay(new Date(dueDate))
  const today = startOfDay(new Date())
  const diff = daysBetween(today, due)
  if (diff === 0) return { label: 'hari ini', tone: 'red' }
  if (diff < 0) return { label: `terlambat ${Math.abs(diff)} hari`, tone: 'red' }
  if (diff === 1) return { label: 'dalam 1 hari', tone: 'amber' }
  return { label: `dalam ${diff} hari`, tone: 'amber' }
}

export function Topbar() {
  const user = useAppStore((s) => s.user)
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const logout = useAppStore((s) => s.logout)
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)

  const {
    data: notifications,
    isLoading: notificationsLoading,
  } = useNotifications()

  if (!user) return null
  const title = TITLES[view] ?? 'SMO'
  const isGuest = user.role === 'GUEST'
  const isManager = user.role === 'TECHNICIAN' || user.role === 'ADMIN'

  async function handleLogout() {
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
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Mobile: show the SMO brand (logo + name) instead of the page title,
            since the bottom nav is icon-only now. */}
        <div className="sm:hidden">
          <Brand size="sm" />
        </div>
        {/* Desktop: keep the page title for context. */}
        <h1 className="hidden truncate text-lg font-semibold tracking-tight sm:block sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell
          due={notifications?.due ?? []}
          upcoming={notifications?.upcoming ?? []}
          totalDue={notifications?.totalDue ?? 0}
          totalUpcoming={notifications?.totalUpcoming ?? 0}
          loading={notificationsLoading}
          onGoToSchedules={() => setView('schedules')}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menu pengguna"
            >
              <Avatar className="size-8 ring-2 ring-emerald-400/40">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold ring-1 ring-emerald-400/30">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-sm font-medium leading-none">
                  {user.name}
                </div>
                <div className="text-muted-foreground mt-0.5 text-[11px]">
                  {user.email}
                </div>
              </div>
              <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Avatar className="size-9 ring-2 ring-emerald-400/40">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold ring-1 ring-emerald-400/30">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {user.email}
                </div>
                <div className="mt-1">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Managers: Lokasi/Kategori/Pengguna direct links (mobile access) */}
            {isManager && (
              <>
                <DropdownMenuItem onSelect={() => setView('locations')}>
                  <MapPin className="size-4" />
                  Lokasi
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setView('categories')}>
                  <Tag className="size-4" />
                  Kategori
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setView('users')}>
                  <Users className="size-4" />
                  Pengguna
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* All non-guests: Jadwal Maintenance + Catatan */}
            {!isGuest && (
              <>
                <DropdownMenuItem onSelect={() => setView('schedules')}>
                  <CalendarClock className="size-4" />
                  Jadwal Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setView('notes')}>
                  <StickyNote className="size-4" />
                  Catatan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Guest: read-only schedule + notes access */}
            {isGuest && (
              <>
                <DropdownMenuItem onSelect={() => setView('schedules')}>
                  <CalendarClock className="size-4" />
                  Jadwal Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setView('notes')}>
                  <StickyNote className="size-4" />
                  Catatan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Eye className="size-4" />
                  Mode tamu — hanya melihat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Profile (non-guest) */}
            {!isGuest && (
              <>
                <DropdownMenuItem onSelect={() => setView('profile')}>
                  <UserRound className="size-4" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault()
                setShowLogoutConfirm(true)
              }}
              className={cn('text-destructive')}
            >
              <LogOut className="size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout confirmation dialog */}
      <AlertDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari SMO?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari akun ini dan kembali ke halaman login.
              Pastikan perubahan Anda sudah tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <LogOut className="size-4" />
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}

// ---------- Notification Bell ----------

function useNotifications() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const toastShownRef = React.useRef(false)
  const deviceNotifiedKeyRef = React.useRef<string>('')

  const query = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<NotificationsResponse>('/api/notifications'),
    enabled: !!user,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  const { permission, requestPermission, notify } = useDeviceNotifications()

  // Toast on first load (only once per session) when totalDue > 0.
  React.useEffect(() => {
    if (!user) return
    if (toastShownRef.current) return
    if (query.data && query.data.totalDue > 0) {
      toastShownRef.current = true
      toast('Pengingat Maintenance', {
        description: `${query.data.totalDue} jadwal maintenance jatuh tempo hari ini.`,
        duration: 6000,
        action: {
          label: 'Lihat',
          onClick: () => setView('schedules'),
        },
      })
    }
  }, [query.data, user, setView])

  // Ask the user to enable device notifications (once per browser session)
  // when there are due schedules and permission is still "default".
  React.useEffect(() => {
    if (!user) return
    if (permission !== 'default') return
    if (!query.data || query.data.totalDue === 0) return
    let asked = false
    try {
      asked = sessionStorage.getItem('smo-asked-push') === '1'
    } catch {
      asked = false
    }
    if (asked) return
    try {
      sessionStorage.setItem('smo-asked-push', '1')
    } catch {
      // ignore
    }
    toast('Aktifkan notifikasi perangkat?', {
      description:
        'Dapatkan pengingat maintenance otomatis di layar Anda saat jadwal jatuh tempo.',
      duration: 10000,
      action: {
        label: 'Aktifkan',
        onClick: () => {
          requestPermission().then((p) => {
            if (p === 'granted') {
              toast.success('Notifikasi diaktifkan', {
                description: 'Pengingat maintenance akan muncul di perangkat Anda.',
              })
              // Fire one immediately so the user sees it working.
              const d = query.data
              if (d && d.totalDue > 0) {
                fireDeviceNotification(d)
              }
            } else if (p === 'denied') {
              toast.error('Notifikasi diblokir', {
                description: 'Anda bisa mengaktifkan kembali via pengaturan browser.',
              })
            }
          })
        },
      },
      cancel: { label: 'Nanti', onClick: () => {} },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission, query.data, user])

  // Build a de-dup key from the set of due schedule IDs so we only fire a
  // device notification when the due set actually changes (not every 60s poll).
  function fireDeviceNotification(d: NotificationsResponse) {
    const dueTitles = d.due.map((s) => s.title).join(', ')
    const upTitles = d.upcoming.map((s) => s.title).join(', ')
    const key = `due:${d.due.map((s) => s.id).join('|')}|up:${d.upcoming
      .map((s) => s.id)
      .join('|')}`
    if (key === deviceNotifiedKeyRef.current) return
    deviceNotifiedKeyRef.current = key

    const parts: string[] = []
    if (d.totalDue > 0) {
      parts.push(
        `${d.totalDue} jadwal jatuh tempo: ${dueTitles}`
      )
    }
    if (d.totalUpcoming > 0) {
      parts.push(`${d.totalUpcoming} segera (${upTitles})`)
    }
    const body = parts.join('. ') + '. Buka SMO untuk menindaklanjuti.'
    notify('SMO — Pengingat Maintenance', body, { tag: 'smo-maintenance-due' })
  }

  // Fire the OS notification when due schedules are detected (de-duped).
  React.useEffect(() => {
    if (!user) return
    if (permission !== 'granted') return
    if (!query.data) return
    if (query.data.totalDue === 0 && query.data.totalUpcoming === 0) return
    fireDeviceNotification(query.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission, query.data, user])

  return { ...query, permission, requestPermission }
}

function NotificationBell({
  due,
  upcoming,
  totalDue,
  totalUpcoming,
  loading,
  onGoToSchedules,
}: {
  due: Schedule[]
  upcoming: Schedule[]
  totalDue: number
  totalUpcoming: number
  loading: boolean
  onGoToSchedules: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const hasNotifications = totalDue > 0 || totalUpcoming > 0

  function goToSchedules() {
    setOpen(false)
    onGoToSchedules()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pengingat maintenance"
          className={cn(
            'relative size-9 rounded-lg transition-transform hover:scale-105',
            totalDue > 0 && 'p-0'
          )}
        >
          {totalDue > 0 ? (
            <span
              className={cn(
                'flex size-full items-center justify-center rounded-lg text-white',
                'bg-gradient-to-br from-red-500 to-rose-600 shadow-sm shadow-red-500/40',
                'animate-pulse'
              )}
            >
              <BellRing className="size-4" />
            </span>
          ) : (
            <span className="flex size-full items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
              <Bell className="size-4" />
            </span>
          )}
          {totalDue > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-background shadow-sm shadow-red-500/40"
              aria-label={`${totalDue} jadwal jatuh tempo`}
            >
              {totalDue > 9 ? '9+' : totalDue}
            </span>
          )}
          <span className="sr-only">Pengingat</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 sm:w-96"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex size-7 items-center justify-center rounded-full',
                totalDue > 0
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {totalDue > 0 ? (
                <BellRing className="size-3.5" />
              ) : (
                <Bell className="size-3.5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Pengingat Maintenance</p>
              <p className="text-muted-foreground text-[10px] leading-tight">
                {hasNotifications
                  ? `${totalDue} jatuh tempo · ${totalUpcoming} segera`
                  : 'Tidak ada pengingat aktif'}
              </p>
            </div>
          </div>
        </div>

        {loading && due.length === 0 && upcoming.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-muted-foreground text-xs">Memuat pengingat…</p>
          </div>
        ) : !hasNotifications ? (
          <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/30">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="text-sm font-medium">Tidak ada pengingat</p>
            <p className="text-muted-foreground text-xs">
              Semua jadwal maintenance terpantau.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="divide-y">
              {due.length > 0 && (
                <div className="bg-red-50/50 dark:bg-red-950/20">
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
                      Jatuh Tempo
                    </p>
                  </div>
                  <ul className="px-1.5 pb-1.5">
                    {due.map((s) => (
                      <NotificationItem key={s.id} schedule={s} onClick={goToSchedules} tone="red" />
                    ))}
                  </ul>
                </div>
              )}
              {upcoming.length > 0 && (
                <div className="bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Segera (7 hari ke depan)
                    </p>
                  </div>
                  <ul className="px-1.5 pb-1.5">
                    {upcoming.map((s) => (
                      <NotificationItem key={s.id} schedule={s} onClick={goToSchedules} tone="amber" />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={goToSchedules}
          >
            Lihat semua jadwal
            <ChevronDown className="-rotate-90 size-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  schedule,
  onClick,
  tone,
}: {
  schedule: Schedule
  onClick: () => void
  tone: 'red' | 'amber'
}) {
  const badge = dueBadge(schedule.nextDueDate)
  const toneClasses =
    tone === 'red'
      ? 'text-red-700 bg-red-100 dark:bg-red-950/60 dark:text-red-300'
      : 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-xs font-medium leading-snug">
            {schedule.title}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {schedule.location && (
              <>
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">
                  {schedule.location.name}
                  {schedule.location.building ? ` · ${schedule.location.building}` : ''}
                </span>
                <span aria-hidden>·</span>
              </>
            )}
            <Clock className="size-3 shrink-0" />
            <span className="shrink-0">{formatDate(schedule.nextDueDate)}</span>
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium',
            toneClasses
          )}
        >
          {badge.label}
        </span>
      </button>
    </li>
  )
}
