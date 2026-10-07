'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ChevronRight,
  LogOut,
  MapPin,
  Moon,
  Sun,
  Tag,
  UserRound,
  Users,
} from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { apiFetch } from '@/lib/api'
import { useAppStore, type AppView } from '@/lib/store'
import { AccessDenied } from '@/components/app/access-denied'
import { cn } from '@/lib/utils'

type SettingCard = {
  view: AppView
  icon: typeof MapPin
  title: string
  description: string
  accent: string
}

export function SettingsView() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const logout = useAppStore((s) => s.logout)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!user) return null

  const isGuest = user.role === 'GUEST'

  // Safety net: guests cannot reach this view from their nav, but persisted
  // view state could route them here. Show the standard AccessDenied card.
  if (isGuest) {
    return <AccessDenied />
  }

  const canManageAll = user.role === 'TECHNICIAN' || user.role === 'ADMIN'

  const managementCards: SettingCard[] = canManageAll
    ? [
        {
          view: 'locations',
          icon: MapPin,
          title: 'Lokasi',
          description: 'Kelola daftar gedung dan ruangan.',
          accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
        },
        {
          view: 'categories',
          icon: Tag,
          title: 'Kategori',
          description: 'Kelola kategori laporan kerusakan.',
          accent: 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300',
        },
        {
          view: 'users',
          icon: Users,
          title: 'Pengguna',
          description: 'Kelola akun pengguna sistem.',
          accent: 'bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300',
        },
      ]
    : []

  const profileCard: SettingCard = {
    view: 'profile',
    icon: UserRound,
    title: 'Profil',
    description: 'Lihat dan edit informasi akun Anda.',
    accent: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-300',
  }

  const allCards = [...managementCards, profileCard]

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', skipJson: true })
    } catch {
      // ignore network errors
    } finally {
      logout()
      toast.success('Berhasil keluar', { description: 'Sampai jumpa!' })
      setLoggingOut(false)
    }
  }

  function handleToggleDarkMode(checked: boolean) {
    setTheme(checked ? 'dark' : 'light')
  }

  const isDark = mounted && theme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          Pengaturan
        </h2>
        <p className="text-muted-foreground text-sm">
          Kelola lokasi, kategori, pengguna, dan akun.
        </p>
      </div>

      {/* Management cards */}
      <section className="space-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          Manajemen
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allCards.map((card) => (
            <SettingCardItem key={card.view} card={card} onClick={() => setView(card.view)} />
          ))}
        </div>
      </section>

      {/* Appearance section */}
      <section className="space-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          Tampilan
        </h3>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full',
                  isDark
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
                )}
              >
                {mounted && isDark ? (
                  <Moon className="size-5" />
                ) : (
                  <Sun className="size-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="text-sm font-medium cursor-pointer">
                  Mode Gelap
                </Label>
                <p className="text-muted-foreground text-xs">
                  Ubah tampilan antarmuka antara mode terang dan gelap.
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={isDark}
              onCheckedChange={handleToggleDarkMode}
              disabled={!mounted}
              aria-label="Mode gelap"
            />
          </CardContent>
        </Card>
      </section>

      {/* Session section */}
      <section className="space-y-3">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          Sesi
        </h3>
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Akun Aktif</p>
              <p className="text-muted-foreground text-xs">
                Anda masuk sebagai {user.name} · {user.email}
              </p>
            </div>
            <Button
              variant="outline"
              className="justify-center border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="size-4" />
              Keluar
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Mobile-only bottom hint: settings replaces the old "Menu" drawer. */}
      <div className="lg:hidden">
        <Separator />
        <p className="text-muted-foreground/70 text-[11px] text-center pt-2">
          Item manajemen sebelumnya kini ada di sini.
        </p>
      </div>

      {canManageAll && (
        <div className="hidden lg:flex justify-end">
          <Badge variant="outline" className="text-muted-foreground">
            {user.role === 'TECHNICIAN' ? 'Teknisi' : 'Administrator'}
          </Badge>
        </div>
      )}
    </motion.div>
  )
}

function SettingCardItem({
  card,
  onClick,
}: {
  card: SettingCard
  onClick: () => void
}) {
  const Icon = card.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left"
    >
      <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 h-full">
        <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                card.accent
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium leading-tight">{card.title}</p>
              <p className="text-muted-foreground text-xs leading-snug line-clamp-2">
                {card.description}
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </button>
  )
}
