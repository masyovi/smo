'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ImageOff,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Send,
  Tag,
  Trash2,
  User,
  UserCog,
  Wrench,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { apiFetch, ApiError } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import {
  STATUS_CONFIG,
  STATUS_LIST,
  PRIORITY_CONFIG,
  PRIORITY_LIST,
  ROLE_CONFIG,
  ACTION_LABELS,
  formatDateTime,
  timeAgo,
  type ReportStatus,
  type ReportPriority,
  type ReportAction,
  type UserRole,
} from '@/lib/types'
import { StatusBadge } from '@/components/app/status-badge'
import { PriorityBadge } from '@/components/app/priority-badge'
import { RoleBadge } from '@/components/app/role-badge'
import { CategoryIcon } from '@/components/app/category-icon'
import { EmptyState } from '@/components/app/empty-state'
import { cn } from '@/lib/utils'

type ReportDetail = {
  id: string
  title: string
  description: string
  status: ReportStatus
  priority: ReportPriority
  imageUrl: string | null
  resolution: string | null
  locationId: string
  categoryId: string
  reporterId: string
  assigneeId: string | null
  createdAt: string
  updatedAt: string
  location: { id: string; name: string; building: string; floor: string | null; description: string | null } | null
  category: { id: string; name: string; icon: string | null } | null
  reporter: {
    id: string
    name: string
    email: string
    role: UserRole
    phone: string | null
    department: string | null
  } | null
  assignee: {
    id: string
    name: string
    email: string
    role: UserRole
    phone: string | null
    department: string | null
  } | null
  history: Array<{
    id: string
    userId: string
    action: ReportAction
    message: string | null
    previousValue: string | null
    newValue: string | null
    createdAt: string
    user: { id: string; name: string; email: string; role: UserRole }
  }>
}

const ACTION_ICON: Record<ReportAction, typeof CheckCircle2> = {
  CREATED: CheckCircle2,
  STATUS_CHANGED: ArrowLeft,
  PRIORITY_CHANGED: AlertTriangle,
  ASSIGNED: UserCog,
  COMMENTED: MessageSquare,
  RESOLVED: CheckCircle2,
  REOPENED: Clock,
}

export function ReportDetailView() {
  const reportId = useAppStore((s) => s.activeReportId)
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<ReportDetail>({
    queryKey: ['report', reportId],
    queryFn: () => apiFetch<ReportDetail>(`/api/reports/${reportId}`),
    enabled: !!reportId && !!user,
  })

  if (!reportId) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Tidak ada laporan yang dipilih"
        description="Pilih laporan dari daftar untuk melihat detail."
        action={{ label: 'Kembali ke Laporan', onClick: () => setView('reports') }}
      />
    )
  }

  if (isLoading) return <DetailSkeleton />
  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Gagal memuat laporan"
        description={(error as Error).message}
        action={{ label: 'Kembali', onClick: () => setView('reports') }}
      />
    )
  }
  if (!data) return null

  const isOwner = user?.id === data.reporterId
  const canEditStatus = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN'
  const canAssign = user?.role === 'ADMIN'
  const canDelete = user?.role === 'ADMIN'
  const canEditMeta = isOwner && data.status === 'PENDING'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-5"
    >
      <button
        type="button"
        onClick={() => setView('reports')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali ke daftar laporan
      </button>

      {/* Hero */}
      <Card>
        <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={data.status} withDot />
                <PriorityBadge priority={data.priority} />
              </div>
              <h2 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                {data.title}
              </h2>
            </div>
            {canDelete && (
              <DeleteReportButton
                reportId={data.id}
                onDeleted={() => {
                  qc.invalidateQueries({ queryKey: ['reports'] })
                  qc.invalidateQueries({ queryKey: ['stats'] })
                  setView('reports')
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-4">
            <InfoTile icon={MapPin} label="Lokasi">
              {data.location ? (
                <>
                  <div className="font-medium">{data.location.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {data.location.building}
                    {data.location.floor ? ` · ${data.location.floor}` : ''}
                  </div>
                </>
              ) : (
                '—'
              )}
            </InfoTile>
            <InfoTile icon={Tag} label="Kategori">
              <div className="flex items-center gap-1.5 font-medium">
                <CategoryIcon
                  name={data.category?.icon}
                  className="size-3.5 text-muted-foreground"
                />
                {data.category?.name ?? '—'}
              </div>
            </InfoTile>
            <InfoTile icon={User} label="Pelapor">
              <div className="font-medium">{data.reporter?.name ?? '—'}</div>
              <div className="text-muted-foreground text-xs">
                {data.reporter?.department ?? '—'}
              </div>
            </InfoTile>
            <InfoTile icon={UserCog} label="Ditugaskan">
              <div className="font-medium">
                {data.assignee?.name ?? 'Belum ditugaskan'}
              </div>
              {data.assignee && (
                <div className="text-muted-foreground text-xs">
                  {data.assignee.email}
                </div>
              )}
            </InfoTile>
          </div>

          <div className="flex flex-wrap gap-4 border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              Dibuat {formatDateTime(data.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              Diperbarui {timeAgo(data.updatedAt)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Deskripsi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {data.description}
          </p>
          {data.imageUrl && (
            <div className="mt-4 overflow-hidden rounded-lg border bg-muted/40">
              <img
                src={data.imageUrl}
                alt={data.title}
                className="max-h-96 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution (read-only display) */}
      {data.resolution && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4" />
              Resolusi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {data.resolution}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action panel */}
      {canEditStatus && (
        <ActionPanel
          report={data}
          currentUserId={user?.id ?? ''}
          onUpdated={() => {
            qc.invalidateQueries({ queryKey: ['report', reportId] })
            qc.invalidateQueries({ queryKey: ['reports'] })
            qc.invalidateQueries({ queryKey: ['stats'] })
          }}
        />
      )}

      {/* Owner edit panel */}
      {canEditMeta && (
        <OwnerEditPanel
          report={data}
          onUpdated={() => {
            qc.invalidateQueries({ queryKey: ['report', reportId] })
            qc.invalidateQueries({ queryKey: ['reports'] })
          }}
        />
      )}

      {/* Comment composer */}
      <CommentComposer
        reportId={data.id}
        onCommented={() => {
          qc.invalidateQueries({ queryKey: ['report', reportId] })
        }}
      />

      {/* History timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Riwayat Aktivitas</CardTitle>
          <CardDescription className="text-xs">
            Semua perubahan, komentar, dan penugasan
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {data.history.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Belum ada riwayat aktivitas.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l pl-5">
              {data.history.map((h) => {
                const Icon =
                  ACTION_ICON[h.action as ReportAction] ?? MessageSquare
                return (
                  <li key={h.id} className="relative">
                    <span className="bg-background ring-border absolute -left-[27px] flex size-6 items-center justify-center rounded-full ring-2">
                      <Icon className="size-3 text-muted-foreground" />
                    </span>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {ACTION_LABELS[h.action as ReportAction] ?? h.action}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          oleh {h.user?.name ?? '—'}
                        </span>
                      </div>
                      <span
                        className="text-muted-foreground/80 text-[11px]"
                        title={formatDateTime(h.createdAt)}
                      >
                        {timeAgo(h.createdAt)}
                      </span>
                    </div>
                    {h.message && (
                      <p className="mt-1 text-sm">{h.message}</p>
                    )}
                    {h.action === 'COMMENTED' && h.message && (
                      <div className="bg-muted mt-1.5 rounded-md p-2 text-sm">
                        {h.message}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function InfoTile({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-muted-foreground inline-flex items-center gap-1 text-[11px] uppercase tracking-wide">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  )
}

function ActionPanel({
  report,
  currentUserId,
  onUpdated,
}: {
  report: ReportDetail
  currentUserId: string
  onUpdated: () => void
}) {
  const qc = useQueryClient()
  const [status, setStatus] = React.useState<ReportStatus>(report.status)
  const [priority, setPriority] = React.useState<ReportPriority>(report.priority)
  const [resolution, setResolution] = React.useState(report.resolution ?? '')
  const [assigneeId, setAssigneeId] = React.useState<string>(report.assigneeId ?? '__none__')
  const [submitting, setSubmitting] = React.useState(false)

  // Keep local state synced when report changes
  React.useEffect(() => {
    setStatus(report.status)
    setPriority(report.priority)
    setResolution(report.resolution ?? '')
    setAssigneeId(report.assigneeId ?? '__none__')
  }, [report.id, report.status, report.priority, report.resolution, report.assigneeId])

  const { data: technicians } = useQuery<{
    id: string
    name: string
    email: string
    role: string
  }[]>({
    queryKey: ['technicians'],
    queryFn: async () => {
      const all = await apiFetch<Array<{ id: string; name: string; email: string; role: string }>>(
        '/api/users'
      )
      return all.filter((u) => u.role === 'TECHNICIAN' || u.role === 'ADMIN')
    },
    enabled: useAppStore.getState().user?.role === 'ADMIN',
  })

  const statusChanged = status !== report.status
  const priorityChanged = priority !== report.priority
  const resolutionChanged = resolution !== (report.resolution ?? '')
  const assigneeChanged =
    (assigneeId === '__none__' ? null : assigneeId) !==
    (report.assigneeId ?? null)

  const hasChange =
    statusChanged || priorityChanged || resolutionChanged || assigneeChanged

  async function handleSave() {
    setSubmitting(true)
    const body: Record<string, unknown> = {}
    if (statusChanged) body.status = status
    if (priorityChanged) body.priority = priority
    if (resolutionChanged) body.resolution = resolution
    if (assigneeChanged) body.assigneeId = assigneeId === '__none__' ? null : assigneeId
    try {
      await apiFetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      toast.success('Perubahan disimpan')
      onUpdated()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal menyimpan'
      toast.error('Gagal menyimpan', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="size-4" />
          Panel Aksi
        </CardTitle>
        <CardDescription className="text-xs">
          Perbarui status, prioritas, resolusi, atau penugasan laporan
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 px-4 sm:px-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus)}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn('size-1.5 rounded-full', STATUS_CONFIG[s].dot)}
                    />
                    {STATUS_CONFIG[s].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioritas</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as ReportPriority)}>
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_LIST.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_CONFIG[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {useAppStore.getState().user?.role === 'ADMIN' && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="assignee">Penugasan Teknisi</Label>
            <Select value={assigneeId} onValueChange={(v) => setAssigneeId(v)}>
              <SelectTrigger id="assignee" className="w-full">
                <SelectValue placeholder="Pilih teknisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Tidak ditugaskan</SelectItem>
                {technicians?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({ROLE_CONFIG[t.role as UserRole].label})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="resolution">Resolusi</Label>
          <Textarea
            id="resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Jelaskan langkah penyelesaian, temuan, atau catatan teknis…"
            rows={3}
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">
            {hasChange ? 'Ada perubahan belum disimpan' : 'Tidak ada perubahan'}
          </span>
          <Button onClick={handleSave} disabled={!hasChange || submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OwnerEditPanel({
  report,
  onUpdated,
}: {
  report: ReportDetail
  onUpdated: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState(report.title)
  const [description, setDescription] = React.useState(report.description)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    setTitle(report.title)
    setDescription(report.description)
  }, [report.id, report.title, report.description])

  const changed = title !== report.title || description !== report.description

  async function handleSave() {
    setSubmitting(true)
    try {
      await apiFetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, description }),
      })
      toast.success('Laporan diperbarui')
      onUpdated()
      setOpen(false)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal menyimpan'
      toast.error('Gagal menyimpan', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Pencil className="size-4" />
          Edit laporan saya
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Laporan</DialogTitle>
          <DialogDescription>
            Anda dapat mengedit judul dan deskripsi selama laporan masih berstatus PENDING.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Judul</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Deskripsi</Label>
            <Textarea
              id="edit-desc"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={!changed || submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CommentComposer({
  reportId,
  onCommented,
}: {
  reportId: string
  onCommented: () => void
}) {
  const [message, setMessage] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSend() {
    const text = message.trim()
    if (!text) return
    setSubmitting(true)
    try {
      await apiFetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      })
      setMessage('')
      toast.success('Komentar ditambahkan')
      onCommented()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal menambah komentar'
      toast.error('Gagal menambah komentar', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4" />
          Tambah Komentar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tulis komentar atau update singkat untuk laporan ini…"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSend()
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-[11px]">
            Tekan Cmd/Ctrl + Enter untuk kirim cepat
          </span>
          <Button onClick={handleSend} disabled={!message.trim() || submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Kirim Komentar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DeleteReportButton({
  reportId,
  onDeleted,
}: {
  reportId: string
  onDeleted: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  async function handleDelete() {
    setSubmitting(true)
    try {
      await apiFetch(`/api/reports/${reportId}`, { method: 'DELETE', skipJson: true })
      toast.success('Laporan dihapus')
      onDeleted()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal menghapus'
      toast.error('Gagal menghapus', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus laporan ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Seluruh riwayat aktivitas juga akan terhapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={submitting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Hapus Laporan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
