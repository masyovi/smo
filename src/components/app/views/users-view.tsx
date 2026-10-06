'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User as UserIcon,
  Users as UsersIcon,
} from 'lucide-react'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { apiFetch, ApiError } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { EmptyState } from '@/components/app/empty-state'
import { RoleBadge } from '@/components/app/role-badge'
import { formatDate } from '@/lib/types'
import type { UserRole } from '@/lib/types'

type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  phone: string | null
  department: string | null
  createdAt: string
}

export function UsersView() {
  const user = useAppStore((s) => s.user)
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<UserRow[]>({
    queryKey: ['users'],
    queryFn: () => apiFetch<UserRow[]>('/api/users'),
    enabled: !!user,
  })

  if (!user) return null
  if (user.role !== 'ADMIN') {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Akses ditolak"
        description="Hanya administrator yang dapat mengelola pengguna."
      />
    )
  }

  if (isLoading) return <ListSkeleton />
  if (error) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Gagal memuat pengguna"
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
            Manajemen Pengguna
          </h2>
          <p className="text-muted-foreground text-sm">
            Kelola akun pengguna sistem.
          </p>
        </div>
        <UserForm
          trigger={
            <Button>
              <Plus className="size-4" />
              Tambah Pengguna
            </Button>
          }
          onSaved={() => qc.invalidateQueries({ queryKey: ['users'] })}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={UsersIcon} title="Belum ada pengguna" />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                            {u.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                        {u.id === user.id && (
                          <span className="text-muted-foreground text-xs">(Anda)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><RoleBadge role={u.role} /></TableCell>
                    <TableCell className="text-muted-foreground">{u.department ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.phone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <UserForm
                          user={u}
                          onSaved={() => qc.invalidateQueries({ queryKey: ['users'] })}
                          trigger={
                            <Button size="icon" variant="ghost" aria-label="Edit">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        {u.id !== user.id && (
                          <DeleteUser
                            id={u.id}
                            name={u.name}
                            onDeleted={() => qc.invalidateQueries({ queryKey: ['users'] })}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-2 md:hidden">
            {list.map((u) => (
              <Card key={u.id}>
                <CardContent className="flex items-start justify-between gap-2 p-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {u.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium leading-tight">{u.name}</p>
                        {u.id === user.id && (
                          <span className="text-muted-foreground text-[11px]">(Anda)</span>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                      <div className="mt-1.5">
                        <RoleBadge role={u.role} />
                      </div>
                      <p className="text-muted-foreground mt-1 text-[11px]">
                        {u.department ?? '—'} {u.phone ? ` · ${u.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <UserForm
                      user={u}
                      onSaved={() => qc.invalidateQueries({ queryKey: ['users'] })}
                      trigger={
                        <Button size="icon" variant="ghost" aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    {u.id !== user.id && (
                      <DeleteUser
                        id={u.id}
                        name={u.name}
                        onDeleted={() => qc.invalidateQueries({ queryKey: ['users'] })}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}

function UserForm({
  user,
  trigger,
  onSaved,
}: {
  user?: UserRow
  trigger: React.ReactNode
  onSaved: () => void
}) {
  const isEdit = !!user
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(user?.name ?? '')
  const [email, setEmail] = React.useState(user?.email ?? '')
  const [role, setRole] = React.useState<UserRole>(user?.role ?? 'USER')
  const [phone, setPhone] = React.useState(user?.phone ?? '')
  const [department, setDepartment] = React.useState(user?.department ?? '')
  const [password, setPassword] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        name,
        email,
        role,
        phone: phone || null,
        department: department || null,
      }
      if (password) body.password = password
      if (isEdit && user) {
        await apiFetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        toast.success('Pengguna diperbarui')
      } else {
        if (!password) {
          toast.error('Password wajib diisi untuk pengguna baru')
          setSubmitting(false)
          return
        }
        await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        toast.success('Pengguna ditambahkan')
      }
      onSaved()
      setOpen(false)
      setPassword('')
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui informasi pengguna. Kosongkan password jika tidak ingin mengubahnya.'
              : 'Tambahkan akun pengguna baru.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="u-name">Nama</Label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="u-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="u-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Karyawan</SelectItem>
                  <SelectItem value="TECHNICIAN">Teknisi</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-phone">Telepon</Label>
              <Input id="u-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-dept">Departemen</Label>
            <Input id="u-dept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Contoh: IT, HR, Finance" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-pass">
              Password {isEdit && <span className="text-muted-foreground">(kosongkan jika tidak diubah)</span>}
            </Label>
            <Input
              id="u-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••' : 'Min. 8 karakter'}
              required={!isEdit}
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

function DeleteUser({
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
      await apiFetch(`/api/users/${id}`, { method: 'DELETE', skipJson: true })
      toast.success('Pengguna dihapus')
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
          <AlertDialogTitle>Hapus pengguna &ldquo;{name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Pengguna yang masih memiliki laporan tidak dapat dihapus.
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
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
