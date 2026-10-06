'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAppStore, type AppView } from '@/lib/store'
import { Brand } from '@/components/app/brand'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Tag,
  Users,
  User as UserIcon,
  Plus,
  type LucideIcon,
} from 'lucide-react'

type NavDef = {
  view: AppView
  label: string
  icon: LucideIcon
  roles?: Array<'ADMIN' | 'TECHNICIAN' | 'USER'>
}

const NAV: NavDef[] = [
  { view: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { view: 'reports', label: 'Laporan', icon: ClipboardList },
  { view: 'locations', label: 'Lokasi', icon: MapPin, roles: ['ADMIN'] },
  { view: 'categories', label: 'Kategori', icon: Tag, roles: ['ADMIN'] },
  { view: 'users', label: 'Pengguna', icon: Users, roles: ['ADMIN'] },
  { view: 'profile', label: 'Profil', icon: UserIcon },
]

export function Sidebar() {
  const user = useAppStore((s) => s.user)
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const openNewReport = useAppStore((s) => s.openNewReport)

  if (!user) return null

  const filtered = NAV.filter((n) => !n.roles || n.roles.includes(user.role))

  return (
    <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/" className="block">
          <Brand size="md" />
        </Link>
      </div>

      <div className="px-3 py-3">
        <Button
          className="w-full justify-start gap-2"
          onClick={openNewReport}
        >
          <Plus className="size-4" />
          Buat Laporan
        </Button>
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
    </aside>
  )
}
