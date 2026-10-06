'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronDown, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { apiFetch, ApiError } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Brand } from '@/components/app/brand'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type FormValues = z.infer<typeof schema>

const DEMO_ACCOUNTS = [
  {
    role: 'Administrator',
    email: 'admin@smo.com',
    password: 'admin123',
    desc: 'Akses penuh: pengguna, lokasi, kategori, laporan',
  },
  {
    role: 'Teknisi',
    email: 'teknisi@smo.com',
    password: 'teknisi123',
    desc: 'Perbarui status, prioritas, dan resolusi laporan',
  },
  {
    role: 'Karyawan',
    email: 'user@smo.com',
    password: 'user123',
    desc: 'Buat laporan dan lihat laporan milik Anda',
  },
]

export function LoginScreen() {
  const setUser = useAppStore((s) => s.setUser)
  const [submitting, setSubmitting] = React.useState(false)
  const [demoOpen, setDemoOpen] = React.useState(false)
  const [formErr, setFormErr] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setFormErr(null)
    setSubmitting(true)
    try {
      const res = await apiFetch<{ user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      setUser(res.user)
      toast.success('Berhasil masuk', { description: `Selamat datang, ${res.user.name}` })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal masuk'
      setFormErr(msg)
      toast.error('Gagal masuk', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (email: string, password: string) => {
    form.setValue('email', email)
    form.setValue('password', password)
    setFormErr(null)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight">SMO</div>
            <div className="text-sm text-white/80">Save My Office</div>
          </div>
        </div>

        <div className="relative space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight">
              Laporkan kerusakan,
              <br />
              selamatkan produktivitas.
            </h1>
            <p className="max-w-md text-white/85 text-base">
              Sistem manajemen laporan kerusakan bangunan untuk kantor Anda. Buat
              laporan, tugaskan teknisi, dan pantau penyelesaian dari satu tempat.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { k: 'Cepat', v: 'Lapor 1 menit' },
              { k: 'Transparan', v: 'Riwayat lengkap' },
              { k: 'Kolaboratif', v: 'Multi-peran' },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur"
              >
                <div className="text-sm font-semibold">{s.k}</div>
                <div className="text-xs text-white/75">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/70">
          &copy; {new Date().getFullYear()} SMO. Dibuat untuk produktivitas.
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
              <ShieldCheck className="size-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SMO</h1>
            <p className="text-muted-foreground text-sm">Save My Office</p>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-xl">Masuk ke akun Anda</CardTitle>
              <CardDescription>
                Masukkan kredensial untuk melanjutkan ke dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@kantor.com"
                      className="pl-9"
                      autoComplete="email"
                      disabled={submitting}
                      {...form.register('email')}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      autoComplete="current-password"
                      disabled={submitting}
                      {...form.register('password')}
                    />
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {formErr && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formErr}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Memproses…
                    </>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </form>

              <Collapsible open={demoOpen} onOpenChange={setDemoOpen} className="mt-5">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span>Demo akun</span>
                    <ChevronDown
                      className={cn(
                        'size-3.5 transition-transform',
                        demoOpen && 'rotate-180'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2 data-[state=closed]:hidden">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.email}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-muted/40 p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{acc.role}</div>
                        <div className="text-muted-foreground text-xs truncate">
                          {acc.email}
                        </div>
                        <div className="text-muted-foreground/80 text-[11px] mt-0.5">
                          {acc.desc}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fillDemo(acc.email, acc.password)}
                        disabled={submitting}
                        type="button"
                      >
                        Gunakan
                      </Button>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            SMO &mdash; Laporkan kerusakan, selamatkan produktivitas.
          </p>
        </div>
      </div>
    </div>
  )
}
