'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { apiFetch, ApiError } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { EmptyState } from '@/components/app/empty-state'
import { AccessDenied } from '@/components/app/access-denied'
import {
  CategoryIcon,
  CATEGORY_ICON_OPTIONS,
} from '@/components/app/category-icon'
import { formatDate } from '@/lib/types'

type Category = {
  id: string
  name: string
  icon: string | null
  createdAt: string
}

export function CategoriesView() {
  const user = useAppStore((s) => s.user)
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/api/categories'),
    enabled: !!user,
  })

  if (!user) return null

  // Per SMO policy: only Teknisi (and ADMIN for backward-compat) can manage
  // categories. Guests and regular users get an "Akses Ditolak" empty state.
  const canManage = user.role === 'ADMIN' || user.role === 'TECHNICIAN'
  if (!canManage) {
    return <AccessDenied />
  }

  if (isLoading) return <ListSkeleton />
  if (error) {
    return (
      <EmptyState
        icon={Tag}
        title="Gagal memuat kategori"
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
            Manajemen Kategori
          </h2>
          <p className="text-muted-foreground text-sm">
            Kategori laporan kerusakan.
          </p>
        </div>
        <CategoryForm
          trigger={
            <Button>
              <Plus className="size-4" />
              Tambah Kategori
            </Button>
          }
          onSaved={() => qc.invalidateQueries({ queryKey: ['categories'] })}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Belum ada kategori"
          description="Tambahkan kategori pertama Anda."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-2 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CategoryIcon name={c.icon} className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-tight">{c.name}</p>
                    <p className="text-muted-foreground/70 text-[11px]">
                      Ditambahkan {formatDate(c.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <CategoryForm
                    category={c}
                    onSaved={() => qc.invalidateQueries({ queryKey: ['categories'] })}
                    trigger={
                      <Button size="icon" variant="ghost" aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <DeleteCategory
                    id={c.id}
                    name={c.name}
                    onDeleted={() => qc.invalidateQueries({ queryKey: ['categories'] })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function CategoryForm({
  category,
  trigger,
  onSaved,
}: {
  category?: Category
  trigger: React.ReactNode
  onSaved: () => void
}) {
  const isEdit = !!category
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(category?.name ?? '')
  const [icon, setIcon] = React.useState(category?.icon ?? '')
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = { name, icon: icon || null }
      if (isEdit && category) {
        await apiFetch(`/api/categories/${category.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        toast.success('Kategori diperbarui')
      } else {
        await apiFetch('/api/categories', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        toast.success('Kategori ditambahkan')
      }
      onSaved()
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          <DialogDescription>
            Kategori digunakan untuk mengelompokkan laporan kerusakan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nama Kategori</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: AC & Pendingin"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-icon">Ikon</Label>
            <Select value={icon || '__none__'} onValueChange={(v) => setIcon(v === '__none__' ? '' : v)}>
              <SelectTrigger id="cat-icon" className="w-full">
                <SelectValue placeholder="Pilih ikon (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Tidak ada ikon</SelectItem>
                {CATEGORY_ICON_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="inline-flex items-center gap-2">
                      <CategoryIcon name={o.value} className="size-3.5" />
                      {o.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

function DeleteCategory({
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
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE', skipJson: true })
      toast.success('Kategori dihapus')
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
          <AlertDialogTitle>Hapus kategori &ldquo;{name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Kategori yang masih memiliki laporan tidak dapat dihapus.
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
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}
