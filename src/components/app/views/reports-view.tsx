'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ClipboardList,
  ChevronRight,
  Eye,
  FileDown,
  Filter,
  Plus,
  Printer,
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
  formatDate,
  formatDateTime,
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

// ---------- print helpers (used by handlePrintPDF) ----------
function escapeHtml(s: string | null | undefined) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
function statusClass(s: ReportStatus) {
  return (
    {
      PENDING: 'p-pending',
      IN_PROGRESS: 'p-progress',
      RESOLVED: 'p-resolved',
      CLOSED: 'p-closed',
    }[s] || 'p-closed'
  )
}
function prioClass(p: ReportPriority) {
  return (
    {
      LOW: 'prio-low',
      MEDIUM: 'prio-medium',
      HIGH: 'prio-high',
      URGENT: 'prio-urgent',
    }[p] || 'prio-low'
  )
}

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

  // ---------- Export CSV ----------
  function handleExportCSV() {
    if (!items.length) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    const esc = (v: unknown) => {
      const s = String(v ?? '')
      if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const header = [
      'Judul',
      'Lokasi',
      'Gedung',
      'Kategori',
      'Prioritas',
      'Status',
      'Pelapor',
      'Ditugaskan',
      'Dibuat',
    ]
    const rows = items.map((r) =>
      [
        r.title,
        r.location?.name ?? '-',
        r.location?.building ?? '-',
        r.category?.name ?? '-',
        PRIORITY_CONFIG[r.priority].label,
        STATUS_CONFIG[r.status].label,
        r.reporter?.name ?? '-',
        r.assignee?.name ?? 'Belum ditugaskan',
        formatDateTime(r.createdAt),
      ].map(esc).join(',')
    )
    const csv = [header.map(esc).join(','), ...rows].join('\r\n')
    // Prefix with BOM so Excel reads the Indonesian characters correctly.
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date().toISOString().slice(0, 10)
    a.download = `riwayat-laporan-smo-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('CSV diekspor', {
      description: `${items.length} laporan diunduh sebagai CSV.`,
    })
  }

  // ---------- Cetak PDF (print) ----------
  function handlePrintPDF() {
    if (!items.length) {
      toast.error('Tidak ada data untuk dicetak')
      return
    }
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Gagal membuka jendela cetak', {
        description: 'Izinkan pop-up untuk browser ini.',
      })
      return
    }
    const genAt = formatDateTime(new Date().toISOString())
    const filterInfo = [
      statusFilter !== 'ALL' ? `Status: ${STATUS_CONFIG[statusFilter as ReportStatus].label}` : null,
      priorityFilter !== 'ALL' ? `Prioritas: ${PRIORITY_CONFIG[priorityFilter as ReportPriority].label}` : null,
      searchQuery.trim() ? `Pencarian: "${searchQuery.trim()}"` : null,
    ].filter(Boolean).join(' • ')

    const rows = items
      .map(
        (r, i) => `<tr>
          <td style="text-align:right">${i + 1}</td>
          <td>${escapeHtml(r.title)}</td>
          <td>${escapeHtml(r.location?.name ?? '-')}<br><span class="muted">${escapeHtml(r.location?.building ?? '')}</span></td>
          <td>${escapeHtml(r.category?.name ?? '-')}</td>
          <td><span class="pill ${prioClass(r.priority)}">${PRIORITY_CONFIG[r.priority].label}</span></td>
          <td><span class="pill ${statusClass(r.status)}">${STATUS_CONFIG[r.status].label}</span></td>
          <td>${escapeHtml(r.reporter?.name ?? '-')}</td>
          <td>${escapeHtml(r.assignee?.name ?? 'Belum ditugaskan')}</td>
          <td>${formatDate(r.createdAt)}</td>
        </tr>`
      )
      .join('')

    win.document.write(`<!DOCTYPE html><html lang="id"><head>
      <meta charset="utf-8" />
      <title>Riwayat Laporan — SMO</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1a2e2a; margin: 0; padding: 32px; }
        header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #14b8a6); flex-shrink: 0; }
        h1 { font-size: 20px; margin: 0; }
        .sub { color: #64748b; font-size: 12px; margin-top: 2px; }
        .meta { margin: 0 0 16px; font-size: 12px; color: #64748b; }
        .meta b { color: #1a2e2a; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f1f5f4; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) td { background: #fafbfb; }
        .muted { color: #94a3b8; font-size: 10px; }
        .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .p-pending { background: #fef3c7; color: #b45309; }
        .p-progress { background: #dbeafe; color: #1d4ed8; }
        .p-resolved { background: #d1fae5; color: #047857; }
        .p-closed { background: #e2e8f0; color: #475569; }
        .prio-low { background: #e2e8f0; color: #475569; }
        .prio-medium { background: #fef9c3; color: #a16207; }
        .prio-high { background: #ffedd5; color: #c2410c; }
        .prio-urgent { background: #fee2e2; color: #b91c1c; }
        footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          table { font-size: 11px; }
          th, td { padding: 6px 8px; }
        }
      </style>
    </head><body>
      <header>
        <div class="logo"></div>
        <div>
          <h1>SMO — Save My Office</h1>
          <div class="sub">Daftar Riwayat Laporan Kerusakan</div>
        </div>
      </header>
      <p class="meta">
        <b>Dicetak:</b> ${genAt}
        ${filterInfo ? ' &nbsp;•&nbsp; <b>Filter:</b> ' + escapeHtml(filterInfo) : ''}
        &nbsp;•&nbsp; <b>Total:</b> ${items.length} laporan
        &nbsp;•&nbsp; <b>Pengguna:</b> ${escapeHtml(user?.name ?? '-')}
      </p>
      <table>
        <thead><tr>
          <th style="width:32px">No</th>
          <th>Judul</th>
          <th>Lokasi</th>
          <th>Kategori</th>
          <th>Prioritas</th>
          <th>Status</th>
          <th>Pelapor</th>
          <th>Ditugaskan</th>
          <th>Dibuat</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <footer>SMO — Save My Office • Dokumen ini dicetak otomatis dari aplikasi SMO • ${genAt}</footer>
      <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };<\/script>
    </body></html>`)
    win.document.close()
    toast.success('Menyiapkan PDF', {
      description: 'Jendela cetak terbuka — pilih "Save as PDF".',
    })
  }

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={items.length === 0}
            title="Unduh daftar laporan sebagai file CSV"
            className="self-start sm:self-auto"
          >
            <FileDown className="size-4" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPDF}
            disabled={items.length === 0}
            title="Cetak / simpan sebagai PDF"
            className="self-start sm:self-auto"
          >
            <Printer className="size-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          {!isGuest && (
            <Button onClick={openNewReport} size="sm" className="self-start sm:self-auto">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Buat Laporan</span>
              <span className="sm:hidden">Buat</span>
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
