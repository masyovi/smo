'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ClipboardList,
  ChevronRight,
  Eye,
  Filter,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

import { apiFetch } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import {
  STATUS_CONFIG,
  STATUS_LIST,
  PRIORITY_CONFIG,
  PRIORITY_LIST,
  timeAgo,
  type ReportStatus,
  type ReportPriority,
} from '@/lib/types'
import { StatusBadge } from '@/components/app/status-badge'
import { PriorityBadge } from '@/components/app/priority-badge'
import { EmptyState } from '@/components/app/empty-state'
import { cn } from '@/lib/utils'

type ReportListItem = {
  id: string
  title: string
  status: ReportStatus
  priority: ReportPriority
  createdAt: string
  updatedAt: string
  assigneeId: string | null
  location: { id: string; name: string; building: string; floor: string | null } | null
  category: { id: string; name: string; icon: string | null } | null
  reporter: { id: string; name: string } | null
  assignee: { id: string; name: string } | null
}

const PAGE_SIZE = 20

export function ReportsView() {
  const user = useAppStore((s) => s.user)
  const openReport = useAppStore((s) => s.openReport)
  const openNewReport = useAppStore((s) => s.openNewReport)

  const statusFilter = useAppStore((s) => s.statusFilter)
  const priorityFilter = useAppStore((s) => s.priorityFilter)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setStatusFilter = useAppStore((s) => s.setStatusFilter)
  const setPriorityFilter = useAppStore((s) => s.setPriorityFilter)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const resetFilters = useAppStore((s) => s.resetFilters)

  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState(searchQuery)

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput, setSearchQuery])

  React.useEffect(() => {
    setPage(1)
  }, [statusFilter, priorityFilter])

  const queryStr = React.useMemo(() => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    p.set('limit', String(PAGE_SIZE))
    if (statusFilter !== 'ALL') p.set('status', statusFilter)
    if (priorityFilter !== 'ALL') p.set('priority', priorityFilter)
    if (searchQuery.trim()) p.set('search', searchQuery.trim())
    return p.toString()
  }, [page, statusFilter, priorityFilter, searchQuery])

  const { data, isLoading, isFetching, error, refetch } = useQuery<{
    data: ReportListItem[]
    total: number
    page: number
    limit: number
  }>({
    queryKey: ['reports', queryStr],
    queryFn: () => apiFetch(`/api/reports?${queryStr}`),
    enabled: !!user,
  })

  const items = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const isGuest = user?.role === 'GUEST'
  const isManager = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN'

  const hasFilters =
    statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchQuery.trim() !== ''

  const description = isGuest
    ? 'Telusuri semua laporan kerusakan (mode tamu).'
    : isManager
      ? 'Kelola semua laporan yang masuk.'
      : 'Lihat dan pantau laporan Anda.'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Laporan Kerusakan
          </h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {isGuest && (
            <Badge
              variant="outline"
              className="bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900"
            >
              <Eye className="size-3" />
              Mode tamu
            </Badge>
          )}
          {!isGuest && (
            <Button onClick={openNewReport} className="self-start sm:self-auto">
              <Plus className="size-4" />
              Buat Laporan
            </Button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari laporan berdasarkan judul atau deskripsi…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => setSearchInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v)}
          >
            <SelectTrigger className="min-w-[140px]">
              <Filter className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              {STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v)}
          >
            <SelectTrigger className="min-w-[140px]">
              <SelectValue placeholder="Prioritas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Prioritas</SelectItem>
              {PRIORITY_LIST.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_CONFIG[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reset filter"
              onClick={() => {
                resetFilters()
                setSearchInput('')
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="text-muted-foreground text-xs">
        {isLoading ? 'Memuat…' : `${total} laporan ditemukan`}
      </div>

      {/* Content */}
      {isLoading ? (
        <ReportsSkeleton />
      ) : error ? (
        <EmptyState
          icon={ClipboardList}
          title="Gagal memuat laporan"
          description="Terjadi kesalahan saat memuat data."
          action={{ label: 'Coba lagi', onClick: () => refetch() }}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={hasFilters ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan'}
          description={
            hasFilters
              ? 'Coba ubah filter atau kata kunci pencarian Anda.'
              : isGuest
                ? 'Belum ada laporan yang dapat ditelusuri.'
                : 'Buat laporan pertama Anda sekarang.'
          }
          action={
            hasFilters
              ? {
                  label: 'Reset filter',
                  onClick: () => {
                    resetFilters()
                    setSearchInput('')
                  },
                }
              : isGuest
                ? undefined
                : { label: 'Buat Laporan', onClick: openNewReport }
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="min-w-[200px]">Judul</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pelapor</TableHead>
                  <TableHead>Ditugaskan</TableHead>
                  <TableHead className="text-right">Dibuat</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => openReport(r.id)}
                  >
                    <TableCell className="font-medium max-w-[280px] truncate">
                      {r.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.location ? (
                        <span className="truncate">
                          {r.location.name}
                          <span className="text-muted-foreground/70">
                            {' '}
                            · {r.location.building}
                          </span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.category?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={r.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.reporter?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.assignee?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {timeAgo(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile list */}
          <ul className="space-y-2 md:hidden">
            {items.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => openReport(r.id)}
                  className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {r.location?.name ?? '—'} · {r.location?.building ?? ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={r.status} />
                      <PriorityBadge priority={r.priority} />
                      <span className="text-muted-foreground/80 text-[11px]">
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-muted-foreground text-xs">
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Desktop floating FAB — hidden for guests (read-only) */}
      {!isGuest && (
        <div className="hidden md:block">
          <FloatingFab onClick={openNewReport} />
        </div>
      )}
    </motion.div>
  )
}

function FloatingFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Buat Laporan"
      className="bg-primary text-primary-foreground fixed bottom-6 right-6 z-30 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <Plus className="size-6" />
    </button>
  )
}

function ReportsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-md" />
      ))}
    </div>
  )
}
