'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Building2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { Skeleton } from '@/components/ui/skeleton'

import { apiFetch, ApiError } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { EmptyState } from '@/components/app/empty-state'
import { AccessDenied } from '@/components/app/access-denied'
import { formatDate } from '@/lib/types'

type Location = {
  id: string
  name: string
  building: string
  floor: string | null
  description: string | null
  createdAt: string
}

export function LocationsView() {
  const user = useAppStore((s) => s.user)
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => apiFetch<Location[]>('/api/locations'),
    enabled: !!user,
  })

  if (!user) return null

  // Per SMO policy: only Teknisi (and ADMIN for backward-compat) can manage
  // locations. Guests and regular users get an "Akses Ditolak" empty state.
  const canManage = user.role === 'ADMIN' || user.role === 'TECHNICIAN'
  if (!canManage) {
    return <AccessDenied />
  }

  if (isLoading) return <ListSkeleton />
  if (error) {
    return (
      <EmptyState
        icon={MapPin}
        title="Gagal memuat lokasi"
        description={(error as Error).message}
        action={{ label: 'Coba lagi', onClick: () => refetch() }}
      />
    )
  }

  const list = data ?? []

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
            Manajemen Lokasi
          </h2>
          <p className="text-muted-foreground text-sm">
            Kelola daftar lokasi/gedung untuk laporan.
          </p>
        </div>
        <LocationForm
          trigger={
            <Button>
              <Plus className="size-4" />
              Tambah Lokasi
            </Button>
          }
          onSaved={() => qc.invalidateQueries({ queryKey: ['locations'] })}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Belum ada lokasi"
          description="Tambahkan lokasi pertama Anda sekarang."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((loc) => (
            <Card key={loc.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <Building2 className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-tight">{loc.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {loc.building && loc.building !== '-'
                          ? `${loc.building}${loc.floor ? ` · Lt. ${loc.floor}` : ''}`
                          : loc.floor
                            ? `Lt. ${loc.floor}`
                            : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <LocationForm
                      report={loc}
                      onSaved={() => qc.invalidateQueries({ queryKey: ['locations'] })}
                      trigger={
                        <Button size="icon" variant="ghost" aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <DeleteLocation
                      id={loc.id}
                      name={loc.name}
                      onDeleted={() => qc.invalidateQueries({ queryKey: ['locations'] })}
                    />
                  </div>
                </div>
                {loc.description && (
                  <p className="text-muted-foreground text-xs">{loc.description}</p>
                )}
                <p className="text-muted-foreground/70 text-[11px]">
                  Ditambahkan {formatDate(loc.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function LocationForm({
  report,
  trigger,
  onSaved,
}: {
  report?: Location
  trigger: React.ReactNode
  onSaved: () => void
}) {
  const isEdit = !!report
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(report?.name ?? '')
  const [floor, setFloor] = React.useState(report?.floor ?? '')
  const [description, setDescription] = React.useState(report?.description ?? '')
  const [submitting, setSubmitting] = React.useState(false)

  function reset() {
    setName('')
    setFloor('')
    setDescription('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = { name, floor: floor || null, description: description || null }
      if (isEdit && report) {
        await apiFetch(`/api/locations/${report.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        toast.success('Lokasi diperbarui')
      } else {
        await apiFetch('/api/locations', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        toast.success('Lokasi ditambahkan')
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
          <DialogTitle>{isEdit ? 'Edit Lokasi' : 'Tambah Lokasi'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui informasi lokasi.'
              : 'Lengkapi informasi lokasi baru.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="loc-name">Nama Lokasi</Label>
            <Input
              id="loc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ruang Meeting Mawar"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-floor">Lantai</Label>
            <Input
              id="loc-floor"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Contoh: 2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-desc">Deskripsi (opsional)</Label>
            <Textarea
              id="loc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detail tambahan tentang lokasi ini…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEdit ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteLocation({
  id,
  name,
  onDeleted,
}: {
  id: string
  name: string
  onDeleted: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  async function handleDelete() {
    setSubmitting(true)
    try {
      await apiFetch(`/api/locations/${id}`, { method: 'DELETE', skipJson: true })
      toast.success('Lokasi dihapus')
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
        <Button size="icon" variant="ghost" aria-label="Hapus" className="text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus lokasi &ldquo;{name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Lokasi yang masih memiliki laporan tidak dapat dihapus.
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

function ListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  )
}
