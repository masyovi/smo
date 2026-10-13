'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Eye,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  User as UserIcon,
  UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
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
import { RoleBadge } from '@/components/app/role-badge'
import { formatDate } from '@/lib/types'

type Profile = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'TECHNICIAN' | 'USER' | 'GUEST'
  phone: string | null
  department: string | null
  createdAt: string
  updatedAt: string
}

export function ProfileView() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const logout = useAppStore((s) => s.logout)
  const { data, isLoading, refetch } = useQuery<{ user: Profile }>({
    queryKey: ['profile'],
    queryFn: () => apiFetch<{ user: Profile }>('/api/profile'),
    enabled: !!user,
  })

  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [department, setDepartment] = React.useState('')
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [savingPassword, setSavingPassword] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)

  React.useEffect(() => {
    if (data?.user) {
      setName(data.user.name)
      setPhone(data.user.phone ?? '')
      setDepartment(data.user.department ?? '')
    }
  }, [data])

  const isGuest = user?.role === 'GUEST'

  // ---------- Guest read-only profile ----------
  async function handleGuestLogout() {
    setLoggingOut(true)
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', skipJson: true })
    } catch {
      // ignore network errors
    } finally {
      logout()
      toast.success('Berhasil keluar', { description: 'Sampai jumpa!' })
      setLoggingOut(false)
    }
  }

  if (isGuest) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="mx-auto max-w-3xl space-y-4"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Profil Tamu
          </h2>
          <p className="text-muted-foreground text-sm">
            Anda masuk sebagai tamu — hanya dapat melihat.
          </p>
        </div>

        <Card className="border-teal-200/70 bg-teal-50/50 dark:border-teal-900/60 dark:bg-teal-950/20">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 ring-2 ring-teal-200 dark:ring-teal-900">
              <UserRound className="size-7" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{user?.name ?? 'Tamu'}</p>
                <RoleBadge role="GUEST" />
              </div>
              <p className="text-muted-foreground text-xs">
                {user?.email ?? 'tamu@smo.local'}
              </p>
              <p className="text-muted-foreground/80 text-[11px] inline-flex items-center gap-1">
                <Eye className="size-3" />
                Akun tamu tidak memiliki informasi profil yang dapat diedit.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">
              Untuk mengelola laporan, lokasi, kategori, atau pengguna, silakan
              keluar dan masuk sebagai teknisi.
            </p>
            <Separator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-center text-destructive hover:text-destructive sm:w-auto"
                >
                  <LogOut className="size-4" />
                  Keluar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Keluar dari SMO?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda akan keluar dari akun tamu dan kembali ke halaman
                    login.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleGuestLogout}
                    disabled={loggingOut}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loggingOut ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LogOut className="size-4" />
                    )}
                    Ya, Keluar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ---------- Regular user/technician profile (editable) ----------
  if (isLoading) return <ProfileSkeleton />
  if (!user || !data?.user) return null
  const profile = data.user

  const profileChanged =
    name !== profile.name ||
    phone !== (profile.phone ?? '') ||
    department !== (profile.department ?? '')

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await apiFetch<{ user: Profile }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          phone: phone || null,
          department: department || null,
        }),
      })
      setUser({
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        role: res.user.role,
        phone: res.user.phone,
        department: res.user.department,
      })
      toast.success('Profil disimpan')
      refetch()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal menyimpan'
      toast.error('Gagal menyimpan', { description: msg })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter')
      return
    }
    setSavingPassword(true)
    try {
      await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      toast.success('Password berhasil diubah')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal mengubah password'
      toast.error('Gagal mengubah password', { description: msg })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto max-w-3xl space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          Profil Saya
        </h2>
        <p className="text-muted-foreground text-sm">
          Kelola informasi akun dan keamanan Anda.
        </p>
      </div>

      {/* Profile summary */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold ring-2 ring-primary/20">
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{profile.name}</p>
              <RoleBadge role={profile.role} />
            </div>
            <p className="text-muted-foreground text-xs">{profile.email}</p>
            <p className="text-muted-foreground/80 text-[11px]">
              Bergabung sejak {formatDate(profile.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="size-4" />
            Informasi Akun
          </CardTitle>
          <CardDescription className="text-xs">
            Perbarui nama, telepon, dan departemen Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Nama</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={savingProfile} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-email">Email</Label>
                <Input id="p-email" value={profile.email} disabled />
                <p className="text-muted-foreground text-[11px]">
                  Email tidak dapat diubah sendiri. Hubungi admin.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-dept">Departemen</Label>
                <Input id="p-dept" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={savingProfile} placeholder="Contoh: IT" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-phone">Telepon</Label>
              <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={savingProfile} placeholder="08xxxxxxx" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!profileChanged || savingProfile}>
                {savingProfile && <Loader2 className="size-4 animate-spin" />}
                <Save className="size-4" />
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" />
            Ganti Password
          </CardTitle>
          <CardDescription className="text-xs">
            Demi keamanan, masukkan password lama Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-cur">Password Lama</Label>
              <Input
                id="p-cur"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={savingPassword}
                autoComplete="current-password"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-new">Password Baru</Label>
                <Input
                  id="p-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={savingPassword}
                  autoComplete="new-password"
                  placeholder="Min. 8 karakter"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-confirm">Konfirmasi Password Baru</Label>
                <Input
                  id="p-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={savingPassword}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingPassword}>
                {savingPassword && <Loader2 className="size-4 animate-spin" />}
                <ShieldCheck className="size-4" />
                Ubah Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}
