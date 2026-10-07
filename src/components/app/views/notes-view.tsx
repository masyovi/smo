'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Eye,
  Pin,
  PinOff,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

import { apiFetch, ApiError } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { timeAgo } from '@/lib/types'
import { EmptyState } from '@/components/app/empty-state'
import { cn } from '@/lib/utils'

type NoteColor = 'default' | 'yellow' | 'green' | 'blue' | 'pink'

type Note = {
  id: string
  title: string
  content: string
  color: string
  pinned: boolean
  authorId: string
  createdAt: string
  updatedAt: string
  author: { id: string; name: string; role: string }
}

// Sticky-note color → tailwind classes mapping.
// Blue is OK here as a sticky-note COLOR (not a brand color).
const NOTE_COLOR_CONFIG: Record<string, { card: string; bar: string; dot: string }> = {
  default: { card: 'bg-card border-border', bar: 'bg-slate-400', dot: 'bg-slate-500' },
  yellow: {
    card: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-900',
    bar: 'bg-yellow-400',
    dot: 'bg-yellow-500',
  },
  green: {
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900',
    bar: 'bg-emerald-400',
    dot: 'bg-emerald-500',
  },
  blue: {
    card: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900',
    bar: 'bg-sky-400',
    dot: 'bg-sky-500',
  },
  pink: {
    card: 'bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-900',
    bar: 'bg-pink-400',
    dot: 'bg-pink-500',
  },
}

const COLOR_OPTIONS: NoteColor[] = ['default', 'yellow', 'green', 'blue', 'pink']

function colorConfig(c: string) {
  return NOTE_COLOR_CONFIG[c] ?? NOTE_COLOR_CONFIG.default
}

export function NotesView() {
  const user = useAppStore((s) => s.user)
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<{ data: Note[] }>({
    queryKey: ['notes'],
    queryFn: () => apiFetch<{ data: Note[] }>('/api/notes'),
    enabled: !!user,
  })

  const isGuest = user?.role === 'GUEST'
  const notes = data?.data ?? []

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
            Catatan
          </h2>
          <p className="text-muted-foreground text-sm">
            Papan catatan bersama untuk tim dan tamu.
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
          {!isGuest && (
            <NoteForm
              onSaved={() => qc.invalidateQueries({ queryKey: ['notes'] })}
              trigger={
                <Button>
                  <Plus className="size-4" />
                  Tambah Catatan
                </Button>
              }
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <NotesSkeleton />
      ) : error ? (
        <EmptyState
          icon={StickyNote}
          title="Gagal memuat catatan"
          description={(error as Error).message || 'Terjadi kesalahan saat memuat data.'}
          action={{ label: 'Coba lagi', onClick: () => refetch() }}
        />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="Belum ada catatan"
          description="Catatan bersama akan muncul di sini."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              readOnly={isGuest}
              onSaved={() => qc.invalidateQueries({ queryKey: ['notes'] })}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function NoteCard({
  note,
  readOnly,
  onSaved,
}: {
  note: Note
  readOnly: boolean
  onSaved: () => void
}) {
  const qc = useQueryClient()
  const colors = colorConfig(note.color)

  const pinMutation = useMutation({
    mutationFn: (next: boolean) =>
      apiFetch<Note>(`/api/notes/${note.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: next }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      toast.success(note.pinned ? 'Catatan dilepas' : 'Catatan disematkan')
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : 'Gagal mengubah pin'
      toast.error('Gagal mengubah pin', { description: msg })
    },
  })

  function handleTogglePin() {
    pinMutation.mutate(!note.pinned)
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden py-0 transition-shadow hover:shadow-md',
        colors.card
      )}
    >
      {/* Color bar */}
      <div className={cn('h-1.5 w-full', colors.bar)} aria-hidden />
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {note.pinned && (
              <Pin className="size-4 shrink-0 text-amber-500 fill-amber-500" />
            )}
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
              {note.title}
            </h3>
          </div>
          {!readOnly && (
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={handleTogglePin}
                disabled={pinMutation.isPending}
                aria-label={note.pinned ? 'Lepas sematan' : 'Sematkan'}
              >
                {note.pinned ? (
                  <PinOff className="size-3.5" />
                ) : (
                  <Pin className="size-3.5" />
                )}
              </Button>
              <NoteForm
                note={note}
                onSaved={onSaved}
                trigger={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    aria-label="Edit catatan"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                }
              />
              <DeleteNote
                id={note.id}
                title={note.title}
                onDeleted={onSaved}
              />
            </div>
          )}
        </div>

        <p className="whitespace-pre-wrap text-sm text-foreground/80 line-clamp-[12]">
          {note.content}
        </p>

        <div className="flex items-center justify-between gap-2 pt-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn('size-1.5 rounded-full', colors.dot)} aria-hidden />
            <span className="truncate">{note.author?.name ?? 'Tidak diketahui'}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{timeAgo(note.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NoteForm({
  note,
  trigger,
  onSaved,
}: {
  note?: Note
  trigger: React.ReactNode
  onSaved: () => void
}) {
  const isEdit = !!note
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState(note?.title ?? '')
  const [content, setContent] = React.useState(note?.content ?? '')
  const [color, setColor] = React.useState<NoteColor>(
    (note?.color as NoteColor) ?? 'default'
  )
  const [pinned, setPinned] = React.useState<boolean>(note?.pinned ?? false)
  const [submitting, setSubmitting] = React.useState(false)

  function reset() {
    setTitle('')
    setContent('')
    setColor('default')
    setPinned(false)
  }

  // Re-sync form state when the dialog opens for the edit case (so switching
  // between notes while the dialog stays mounted updates the values).
  React.useEffect(() => {
    if (!open) return
    if (isEdit && note) {
      setTitle(note.title)
      setContent(note.content)
      setColor((note.color as NoteColor) ?? 'default')
      setPinned(note.pinned)
    }
  }, [open, isEdit, note])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    const c = content.trim()
    if (t.length < 3) {
      toast.error('Judul minimal 3 karakter')
      return
    }
    if (c.length < 5) {
      toast.error('Isi catatan minimal 5 karakter')
      return
    }
    setSubmitting(true)
    try {
      const body = { title: t, content: c, color, pinned }
      if (isEdit && note) {
        await apiFetch<Note>(`/api/notes/${note.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        toast.success('Catatan diperbarui')
      } else {
        await apiFetch<Note>('/api/notes', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        toast.success('Catatan ditambahkan')
      }
      onSaved()
      setOpen(false)
      if (!isEdit) reset()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal menyimpan'
      toast.error('Gagal menyimpan', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Catatan' : 'Tambah Catatan'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui catatan yang dipilih.'
              : 'Buat catatan baru untuk dipublikasikan di papan bersama.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Judul</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul singkat catatan"
              required
              minLength={3}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-content">Isi</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Tulis isi catatan di sini…"
              required
              minLength={5}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label>Warna</Label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => {
                const cfg = NOTE_COLOR_CONFIG[c]
                const selected = color === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Warna ${c}`}
                    aria-pressed={selected}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full border-2 transition-all',
                      cfg.card,
                      selected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-transparent'
                        : 'border-transparent hover:scale-110'
                    )}
                  >
                    <span className={cn('size-3 rounded-full', cfg.bar)} />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="note-pinned" className="text-sm font-medium cursor-pointer">
                Sematkan
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Catatan sematan akan tampil paling atas.
              </p>
            </div>
            <Switch
              id="note-pinned"
              checked={pinned}
              onCheckedChange={setPinned}
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEdit ? 'Simpan' : 'Tambah Catatan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteNote({
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
      await apiFetch(`/api/notes/${id}`, { method: 'DELETE', skipJson: true })
      toast.success('Catatan dihapus')
      onDeleted()
      setOpen(false)
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
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-destructive hover:text-destructive"
          aria-label="Hapus catatan"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus catatan &ldquo;{title}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Catatan akan dihapus permanen dan tidak dapat dikembalikan.
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

function NotesSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-44 w-full" />
      ))}
    </div>
  )
}
