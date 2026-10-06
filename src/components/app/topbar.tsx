'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  User as UserIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { apiFetch, ApiError } from '@/lib/api'
import { RoleBadge } from '@/components/app/role-badge'
import { cn } from '@/lib/utils'

const TITLES: Record<string, string> = {
  dashboard: 'Beranda',
  reports: 'Laporan',
  'report-detail': 'Detail Laporan',
  'report-new': 'Buat Laporan',
  locations: 'Lokasi',
  categories: 'Kategori',
  users: 'Pengguna',
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

export function Topbar() {
  const user = useAppStore((s) => s.user)
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const logout = useAppStore((s) => s.logout)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!user) return null
  const title = TITLES[view] ?? 'SMO'

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', skipJson: true })
    } catch (e) {
      // ignore network errors
    } finally {
      logout()
      toast.success('Berhasil keluar', { description: 'Sampai jumpa!' })
    }
  }

  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifikasi"
          className="relative"
          onClick={() => toast.info('Tidak ada notifikasi baru')}
        >
          <Bell className="size-4" />
          <span className="sr-only">Notifikasi</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Ganti tema"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && theme === 'dark' ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
          <span className="sr-only">Ganti tema</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menu pengguna"
            >
              <Avatar className="size-8 ring-1 ring-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
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
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
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
            <DropdownMenuItem onClick={() => setView('profile')}>
              <UserIcon className="size-4" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
              className={cn('text-destructive')}
            >
              <LogOut className="size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
