'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/lib/store'
import { Brand } from '@/components/app/brand'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Tag,
  Users,
  User as UserIcon,
  Plus,
  Eye,
  type LucideIcon,
} from 'lucide-react'

type NavDef = {
  view: AppView
  label: string
  icon: LucideIcon
  // When `roles` is undefined, the item is visible to every authenticated user
  // (including guests). When `roles` is set, only those roles see it.
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
  // Profile is hidden for guests in the sidebar — they use the topbar dropdown
  // to logout instead. The profile view itself still renders a read-only guest card.
  { view: 'profile', label: 'Profil', icon: UserIcon, roles: ['ADMIN', 'TECHNICIAN', 'USER'] },
]

export function Sidebar() {
  const user = useAppStore((s) => s.user)
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const openNewReport = useAppStore((s) => s.openNewReport)

  if (!user) return null

  const isGuest = user.role === 'GUEST'
  const filtered = NAV.filter((n) => !n.roles || n.roles.includes(user.role))

  return (
    <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/" className="block">
          <Brand size="md" />
        </Link>
      </div>

      <div className="px-3 py-3">
        {isGuest ? (
          // Guest read-only badge instead of the "Buat Laporan" CTA
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Eye className="size-3.5 shrink-0" />
            <span className="leading-tight">
              Mode tamu — hanya melihat
            </span>
          </div>
        ) : (
          <Button
            className="w-full justify-start gap-2"
            onClick={openNewReport}
          >
            <Plus className="size-4" />
            Buat Laporan
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1 pb-4 pt-1">
          {filtered.map((item) => {
            const Icon = item.icon
            const active = view === item.view
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => setView(item.view)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  active &&
                    'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
                  )}
                />
                <span>{item.label}</span>
              </button>
            )
          })}
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
