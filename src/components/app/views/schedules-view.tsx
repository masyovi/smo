'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { apiFetch, ApiError } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { EmptyState } from '@/components/app/empty-state'
import { formatDate } from '@/lib/types'
import {
  frequencyLabel,
  startOfDay,
  daysBetween,
  type Frequency,
} from '@/lib/schedule-utils'
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
  description: string | null
  locationId: string | null
  frequency: string
  dayOfMonth: number | null
  intervalMonths: number | null
  startDate: string
  nextDueDate: string
  lastCompletedAt: string | null
  active: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  location: ScheduleLocation
  creator: { id: string; name: string; role: string } | null
}

type Location = {
  id: string
  name: string
  building: string
  floor: string | null
}

type NotificationsResponse = {
  due: Schedule[]
  upcoming: Schedule[]
  later: Schedule[]
  totalDue: number
  totalUpcoming: number
}

// ---------- helpers ----------

function todayDate(): Date {
  return new Date()
}

function dueLabel(nextDueDate: string): string {
  const due = startOfDay(new Date(nextDueDate))
  const today = startOfDay(todayDate())
  const diff = daysBetween(today, due)
  if (diff === 0) return 'Jatuh tempo hari ini'
  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`
  if (diff === 1) return 'Dalam 1 hari'
  return `Dalam ${diff} hari`
}

function toInputDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  // YYYY-MM-DD in UTC
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ---------- main view ----------

export function SchedulesView() {
  const user = useAppStore((s) => s.user)
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<NotificationsResponse>('/api/notifications'),
    enabled: !!user,
    refetchInterval: 60_000,
  })

  const isGuest = user?.role === 'GUEST'
  const canManage = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN'

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
    qc.invalidateQueries({ queryKey: ['schedules'] })
  }

  if (isLoading) return <SchedulesSkeleton />
  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Gagal memuat jadwal"
        description={(error as Error).message || 'Terjadi kesalahan saat memuat data.'}
        action={{ label: 'Coba lagi', onClick: () => refetch() }}
      />
    )
  }
  if (!data || !user) return null

  const due = data.due ?? []
  const upcoming = data.upcoming ?? []
  const later = data.later ?? []
  const totalActive = due.length + upcoming.length + later.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Jadwal Maintenance
          </h2>
          <p className="text-muted-foreground text-sm">
            Atur jadwal perawatan berkala dan pantau pengingat otomatis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGuest && (
            <Badge
              variant="outline"
              className="bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900"
            >
              <Eye className="size-3" />
              Mode tamu — hanya melihat
            </Badge>
          )}
          {!isGuest && canManage && (
            <ScheduleForm
              onSaved={invalidate}
              trigger={
                <Button>
                  <Plus className="size-4" />
                  Tambah Jadwal
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryPill
          tone="red"
          icon={AlertTriangle}
          label="Jatuh Tempo"
          value={due.length}
        />
        <SummaryPill
          tone="amber"
          icon={Clock}
          label="Segera"
          value={upcoming.length}
        />
        <SummaryPill
          tone="emerald"
          icon={CalendarClock}
          label="Aktif"
          value={totalActive}
        />
      </div>

      {totalActive === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Belum ada jadwal"
          description="Tambah jadwal maintenance untuk mendapatkan pengingat otomatis."
        />
      ) : (
        <>
          <ScheduleSection
            title="Jatuh Tempo"
            description="Sudah jatuh tempo — tindakan segera diperlukan."
            tone="red"
            schedules={due}
            canManage={canManage}
            onSaved={invalidate}
          />
          <ScheduleSection
            title="Segera"
            description="Jatuh tempo dalam 7 hari ke depan."
            tone="amber"
            schedules={upcoming}
            canManage={canManage}
            onSaved={invalidate}
          />
          <ScheduleSection
            title="Jadwal Lainnya"
            description="Jadwal aktif dengan tanggal jatuh tempo lebih jauh."
            tone="muted"
            schedules={later}
            canManage={canManage}
            onSaved={invalidate}
          />
        </>
      )}
    </motion.div>
  )
}

// ---------- subcomponents ----------

type Tone = 'red' | 'amber' | 'emerald' | 'muted'

const TONE_STYLES: Record<
  Tone,
  { pill: string; bar: string; dot: string; badge: string; sectionIcon: string }
> = {
  red: {
    pill:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    bar: 'bg-red-500',
    dot: 'bg-red-500',
    badge:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900',
    sectionIcon:
      'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300',
  },
  amber: {
    pill:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    badge:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
    sectionIcon:
      'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
  },
  emerald: {
    pill:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    badge:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900',
    sectionIcon:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  muted: {
    pill:
      'bg-muted text-muted-foreground border-border',
    bar: 'bg-slate-400',
    dot: 'bg-slate-400',
    badge:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
    sectionIcon:
      'bg-muted text-muted-foreground',
  },
}

function SummaryPill({
  tone,
  icon: Icon,
  label,
  value,
}: {
  tone: Tone
  icon: typeof Clock
  label: string
  value: number
}) {
  const styles = TONE_STYLES[tone]
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
        styles.pill
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background/60 dark:bg-background/20">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none tabular-nums">{value}</p>
        <p className="text-[11px] leading-tight opacity-80">{label}</p>
      </div>
    </div>
  )
}

function ScheduleSection({
  title,
  description,
  tone,
  schedules,
  canManage,
  onSaved,
}: {
  title: string
  description: string
  tone: Tone
  schedules: Schedule[]
  canManage: boolean
  onSaved: () => void
}) {
  if (schedules.length === 0) return null
  const styles = TONE_STYLES[tone]
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className={cn('inline-block size-2.5 rounded-full', styles.dot)} aria-hidden />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          <p className="text-muted-foreground text-[11px] leading-tight">{description}</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px] tabular-nums">
          {schedules.length}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {schedules.map((s) => (
          <ScheduleCard
            key={s.id}
            schedule={s}
            tone={tone}
            canManage={canManage}
            onSaved={onSaved}
          />
        ))}
      </div>
    </section>
  )
}

function ScheduleCard({
  schedule,
  tone,
  canManage,
  onSaved,
}: {
  schedule: Schedule
  tone: Tone
  canManage: boolean
  onSaved: () => void
}) {
  const qc = useQueryClient()
  const styles = TONE_STYLES[tone]
  const freqLabel = frequencyLabel(
    schedule.frequency,
    schedule.dayOfMonth,
    schedule.intervalMonths
  )

  const completeMutation = useMutation({
    mutationFn: () =>
      apiFetch<Schedule>(`/api/schedules/${schedule.id}/complete`, {
        method: 'POST',
      }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['schedules'] })
      toast.success('Jadwal diselesaikan', {
        description: `Jadwal berikutnya: ${formatDate(updated.nextDueDate)}`,
      })
      onSaved()
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : 'Gagal menyelesaikan jadwal'
      toast.error('Gagal menyelesaikan jadwal', { description: msg })
    },
  })

  const dueBadge = dueLabel(schedule.nextDueDate)
  const showDueBadge = tone !== 'muted'
  // A schedule can only be marked complete once it has actually reached its
  // due date (today or overdue). Future/upcoming schedules can't be completed
  // early — the button stays disabled until the due date arrives.
  const isDue =
    daysBetween(startOfDay(todayDate()), startOfDay(new Date(schedule.nextDueDate))) <= 0

  return (
    <Card
      className={cn(
        'group relative overflow-hidden py-0 transition-shadow hover:shadow-md',
        tone !== 'muted' && 'border-l-0'
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', styles.bar)} aria-hidden />
      <CardContent className="space-y-3 p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
              {schedule.title}
            </h3>
            <p className="text-muted-foreground text-[11px]">{freqLabel}</p>
          </div>
          {showDueBadge && (
            <Badge
              variant="outline"
              className={cn('shrink-0 text-[10px]', styles.badge)}
            >
              {dueBadge}
            </Badge>
          )}
        </div>

        {schedule.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {schedule.location.name}
              {schedule.location.building ? ` · ${schedule.location.building}` : ''}
              {schedule.location.floor ? ` · ${schedule.location.floor}` : ''}
            </span>
          </div>
        )}

        {schedule.description && (
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
            {schedule.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="size-3 shrink-0" />
            <span>
              Jadwal berikutnya:{' '}
              <span className="font-medium text-foreground">
                {formatDate(schedule.nextDueDate)}
              </span>
            </span>
          </div>
        </div>

        {schedule.lastCompletedAt && (
          <p className="text-[10px] text-muted-foreground/80">
            Terakhir selesai: {formatDate(schedule.lastCompletedAt)}
          </p>
        )}

        {canManage && (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 h-7 px-2.5 text-[11px]"
                disabled={completeMutation.isPending || !isDue}
                title={
                  isDue
                    ? 'Tandai siklus ini selesai dan maju ke jadwal berikutnya'
                    : `Belum jatuh tempo — bisa diselesaikan mulai ${formatDate(schedule.nextDueDate)}`
                }
                onClick={() => completeMutation.mutate()}
              >
                <CheckCircle2 className="size-3.5" />
                Tandai Selesai
              </Button>
              <ScheduleForm
                schedule={schedule}
                onSaved={onSaved}
                trigger={
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-[11px]"
                    aria-label="Edit jadwal"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                }
              />
              <DeleteSchedule
                id={schedule.id}
                title={schedule.title}
                onDeleted={onSaved}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- form (create / edit) ----------

function ScheduleForm({
  schedule,
  trigger,
  onSaved,
}: {
  schedule?: Schedule
  trigger: React.ReactNode
  onSaved: () => void
}) {
  const isEdit = !!schedule
  const [open, setOpen] = React.useState(false)

  const [title, setTitle] = React.useState(schedule?.title ?? '')
  const [description, setDescription] = React.useState(schedule?.description ?? '')
  const [locationId, setLocationId] = React.useState<string>(schedule?.locationId ?? 'none')
  const [frequency, setFrequency] = React.useState<Frequency>(
    (schedule?.frequency as Frequency) ?? 'MONTHLY'
  )
  const [dayOfMonth, setDayOfMonth] = React.useState<number>(schedule?.dayOfMonth ?? 1)
  const [intervalMonths, setIntervalMonths] = React.useState<number>(
    schedule?.intervalMonths ?? 3
  )
  const [startDate, setStartDate] = React.useState<string>(
    schedule ? toInputDate(schedule.startDate) : toInputDate(new Date())
  )
  const [submitting, setSubmitting] = React.useState(false)

  const { data: locations } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => apiFetch<Location[]>('/api/locations'),
    enabled: open,
  })

  // Re-sync state when the dialog opens for the edit case.
  React.useEffect(() => {
    if (!open) return
    if (isEdit && schedule) {
      setTitle(schedule.title)
      setDescription(schedule.description ?? '')
      setLocationId(schedule.locationId ?? 'none')
      setFrequency((schedule.frequency as Frequency) ?? 'MONTHLY')
      setDayOfMonth(schedule.dayOfMonth ?? 1)
      setIntervalMonths(schedule.intervalMonths ?? 3)
      setStartDate(toInputDate(schedule.startDate))
    } else if (!isEdit) {
      // Reset for create
      setTitle('')
      setDescription('')
      setLocationId('none')
      setFrequency('MONTHLY')
      setDayOfMonth(new Date().getUTCDate())
      setIntervalMonths(3)
      setStartDate(toInputDate(new Date()))
    }
  }, [open, isEdit, schedule])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (t.length < 3) {
      toast.error('Judul minimal 3 karakter')
      return
    }
    if (frequency === 'MONTHLY' && (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31)) {
      toast.error('Tanggal (1-31) wajib diisi untuk jadwal bulanan')
      return
    }
    if (frequency === 'INTERVAL' && (!intervalMonths || intervalMonths < 1 || intervalMonths > 24)) {
      toast.error('Interval bulan harus antara 1 dan 24')
      return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        title: t,
        description: description.trim(),
        locationId: locationId === 'none' ? null : locationId,
        frequency,
        startDate,
      }
      if (frequency === 'MONTHLY') body.dayOfMonth = dayOfMonth
      if (frequency === 'INTERVAL') body.intervalMonths = intervalMonths

      if (isEdit && schedule) {
        await apiFetch<Schedule>(`/api/schedules/${schedule.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        toast.success('Jadwal diperbarui')
      } else {
        await apiFetch<Schedule>('/api/schedules', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        toast.success('Jadwal ditambahkan')
      }
      onSaved()
      setOpen(false)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal menyimpan jadwal'
      toast.error('Gagal menyimpan', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui jadwal maintenance berikut.'
              : 'Buat jadwal maintenance baru — sistem akan menghitung tanggal jatuh tempo otomatis.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sched-title">Judul</Label>
            <Input
              id="sched-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Maintenance Lift Utama"
              required
              minLength={3}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sched-desc">Deskripsi</Label>
            <Textarea
              id="sched-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Catatan ringkas terkait jadwal ini…"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sched-loc">Lokasi</Label>
            <Select
              value={locationId}
              onValueChange={setLocationId}
              disabled={submitting}
            >
              <SelectTrigger id="sched-loc" className="w-full">
                <SelectValue placeholder="Pilih lokasi (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa lokasi</SelectItem>
                {(locations ?? []).map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} · {loc.building}
                    {loc.floor ? ` · ${loc.floor}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Frekuensi</Label>
            <RadioGroup
              value={frequency}
              onValueChange={(v) => setFrequency(v as Frequency)}
              className="grid gap-2"
              disabled={submitting}
            >
              <label
                htmlFor="freq-monthly"
                className="flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors has-[[data-state=checked]]:border-emerald-400 has-[[data-state=checked]]:bg-emerald-50/50 dark:has-[[data-state=checked]]:border-emerald-700 dark:has-[[data-state=checked]]:bg-emerald-950/30"
              >
                <RadioGroupItem value="MONTHLY" id="freq-monthly" className="mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">Bulanan</p>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    Setiap tanggal tertentu setiap bulan (mis. tanggal 15).
                  </p>
                </div>
              </label>
              <label
                htmlFor="freq-interval"
                className="flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors has-[[data-state=checked]]:border-emerald-400 has-[[data-state=checked]]:bg-emerald-50/50 dark:has-[[data-state=checked]]:border-emerald-700 dark:has-[[data-state=checked]]:bg-emerald-950/30"
              >
                <RadioGroupItem value="INTERVAL" id="freq-interval" className="mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">Per N bulan</p>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    Berulang setiap N bulan, dihitung dari tanggal mulai.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {frequency === 'MONTHLY' ? (
            <div className="space-y-2">
              <Label htmlFor="sched-day">Tanggal (1-31)</Label>
              <Select
                value={String(dayOfMonth)}
                onValueChange={(v) => setDayOfMonth(Number(v))}
                disabled={submitting}
              >
                <SelectTrigger id="sched-day" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Tanggal {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-[11px]">
                Pada bulan dengan tanggal lebih kecil, tanggal akan disesuaikan ke hari terakhir bulan tersebut.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="sched-interval">Setiap N bulan</Label>
              <Input
                id="sched-interval"
                type="number"
                min={1}
                max={24}
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(Number(e.target.value))}
                disabled={submitting}
                required
              />
              <p className="text-muted-foreground text-[11px]">
                Contoh: 3 = setiap 3 bulan sekali.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sched-start">Tanggal Mulai</Label>
            <Input
              id="sched-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={submitting}
              required
            />
            <p className="text-muted-foreground text-[11px]">
              {frequency === 'MONTHLY'
                ? 'Informasional — tanggal jatuh tempo mengikuti pilihan "Tanggal" di atas.'
                : 'Titik awal perhitungan untuk jadwal interval.'}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEdit ? 'Simpan' : 'Tambah Jadwal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- delete ----------

function DeleteSchedule({
  id,
  title,
  onDeleted,
}: {
  id: string
  title: string
  onDeleted: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  async function handleDelete() {
    setSubmitting(true)
    try {
      await apiFetch(`/api/schedules/${id}`, { method: 'DELETE', skipJson: true })
      toast.success('Jadwal dihapus')
      onDeleted()
      setOpen(false)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal menghapus jadwal'
      toast.error('Gagal menghapus', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-[11px] text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Hapus jadwal"
        >
          <Trash2 className="size-3.5" />
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus jadwal &ldquo;{title}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Jadwal akan dihapus permanen dan tidak dapat dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={submitting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------- skeleton ----------

function SchedulesSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    </div>
  )
}
