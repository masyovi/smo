'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Clock,
  Eye,
  Loader2,
  Plus,
  UserPlus,
  Wrench,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

import { apiFetch } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { StatCard } from '@/components/app/stat-card'
import { StatusBadge } from '@/components/app/status-badge'
import { PriorityBadge } from '@/components/app/priority-badge'
import { EmptyState } from '@/components/app/empty-state'
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  timeAgo,
  type ReportStatus,
  type ReportPriority,
} from '@/lib/types'

type Stats = {
  totalReports: number
  byStatus: Record<ReportStatus, number>
  byPriority: Record<ReportPriority, number>
  urgentOpen: number
  pendingUnassigned: number
  recent: Array<{
    id: string
    title: string
    status: ReportStatus
    priority: ReportPriority
    createdAt: string
    location: { id: string; name: string; building: string; floor: string | null } | null
    assignee: { id: string; name: string } | null
  }>
}

export function DashboardView() {
  const user = useAppStore((s) => s.user)
  const openReport = useAppStore((s) => s.openReport)
  const openNewReport = useAppStore((s) => s.openNewReport)
  const setView = useAppStore((s) => s.setView)

  const { data, isLoading, error } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => apiFetch<Stats>('/api/stats'),
    enabled: !!user,
  })

  if (isLoading) return <DashboardSkeleton />
  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Gagal memuat dashboard"
        description="Coba muat ulang halaman dalam beberapa saat."
        action={{ label: 'Muat ulang', onClick: () => location.reload() }}
      />
    )
  }
  if (!data || !user) return null

  const isGuest = user.role === 'GUEST'
  const isManager = user.role === 'ADMIN' || user.role === 'TECHNICIAN'

  const statusData = (Object.keys(data.byStatus) as ReportStatus[]).map((s) => ({
    name: STATUS_CONFIG[s].label,
    value: data.byStatus[s] ?? 0,
    color: STATUS_CHART_COLORS[s],
    key: s,
  }))
  const priorityData = (Object.keys(data.byPriority) as ReportPriority[]).map((p) => ({
    name: PRIORITY_CONFIG[p].label,
    value: data.byPriority[p] ?? 0,
    fill: PRIORITY_CHART_COLORS[p],
    key: p,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Greeting */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Halo, {user.name.split(' ')[0]} 👋
          </h2>
          <p className="text-muted-foreground text-sm">
            Ringkasan aktivitas laporan kerusakan hari ini.
          </p>
        </div>
        {!isGuest && (
          <Button onClick={openNewReport} className="self-start sm:self-auto">
            <Plus className="size-4" />
            Buat Laporan
          </Button>
        )}
      </div>

      {/* Guest read-only notice */}
      {isGuest && (
        <Card className="border-teal-200/70 bg-teal-50/50 dark:border-teal-900/60 dark:bg-teal-950/20">
          <CardContent className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex size-9 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              <Eye className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Mode tamu — Anda hanya dapat melihat</p>
              <p className="text-muted-foreground text-xs">
                Anda dapat menelusuri laporan dan riwayat, tetapi tidak dapat membuat,
                mengedit, atau menghapus.
              </p>
            </div>
            <Badge
              variant="outline"
              className="hidden bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900 sm:inline-flex"
            >
              Tamu
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Laporan"
          value={data.totalReports}
          icon={ClipboardList}
          tone="emerald"
        />
        <StatCard
          label="Sedang Dikerjakan"
          value={data.byStatus.IN_PROGRESS ?? 0}
          icon={Wrench}
          tone="blue"
        />
        <StatCard
          label="Selesai"
          value={data.byStatus.RESOLVED ?? 0}
          icon={Clock}
          tone="slate"
        />
        <StatCard
          label="Darurat Aktif"
          value={data.urgentOpen}
          icon={AlertTriangle}
          tone="red"
          sub="Prioritas URGENT yang belum selesai"
        />
      </div>

      {/* Manager quick assignment banner — hidden for guests */}
      {isManager && data.pendingUnassigned > 0 && (
        <Card className="border-amber-300/70 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/30">
          <CardContent className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-300">
                <UserPlus className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {data.pendingUnassigned} laporan butuh penugasan
                </p>
                <p className="text-muted-foreground text-xs">
                  Laporan PENDING belum ditugaskan ke teknisi.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setView('reports')}>
              Lihat laporan
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Laporan per Status</CardTitle>
            <CardDescription className="text-xs">
              Distribusi laporan berdasarkan status saat ini
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 px-4 sm:grid-cols-2 sm:px-6">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex flex-col justify-center gap-2 text-sm">
              {statusData.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-muted-foreground">{s.name}</span>
                  </span>
                  <span className="font-medium tabular-nums">{s.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Laporan per Prioritas</CardTitle>
            <CardDescription className="text-xs">
              Distribusi laporan berdasarkan tingkat prioritas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent reports */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Laporan Terbaru</CardTitle>
          <CardDescription className="text-xs">
            5 laporan terbaru yang masuk
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {data.recent.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Belum ada laporan"
              description="Laporan yang dibuat akan muncul di sini."
              action={
                isGuest
                  ? undefined
                  : { label: 'Buat Laporan', onClick: openNewReport }
              }
            />
          ) : (
            <ul className="divide-y">
              {data.recent.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openReport(r.id)}
                    className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-accent/40 -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {r.title}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{r.location?.name ?? '—'}</span>
                        <span aria-hidden>•</span>
                        <span>{r.location?.building ?? ''}</span>
                        <span aria-hidden>•</span>
                        <span>{timeAgo(r.createdAt)}</span>
                        {r.assignee && (
                          <>
                            <span aria-hidden>•</span>
                            <span>Ditugaskan: {r.assignee.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={r.status} />
                      <PriorityBadge priority={r.priority} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setView('reports')}>
              Lihat semua
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const STATUS_CHART_COLORS: Record<ReportStatus, string> = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  RESOLVED: '#10b981',
  CLOSED: '#94a3b8',
}

const PRIORITY_CHART_COLORS: Record<ReportPriority, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  URGENT: '#ef4444',
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  )
}
