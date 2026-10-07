'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  MapPin,
  Plus,
  Save,
  Tag,
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
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { CategoryIcon } from '@/components/app/category-icon'
import { PriorityBadge } from '@/components/app/priority-badge'
import { AccessDenied } from '@/components/app/access-denied'
import { apiFetch, ApiError } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { PRIORITY_LIST, PRIORITY_CONFIG, type ReportPriority } from '@/lib/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  locationId: z.string().min(1, 'Lokasi wajib dipilih'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
})

type FormValues = z.infer<typeof schema>

export function ReportFormView() {
  const setView = useAppStore((s) => s.setView)
  const openReport = useAppStore((s) => s.openReport)
  const user = useAppStore((s) => s.user)

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiFetch<Array<{ id: string; name: string; building: string; floor: string | null }>>('/api/locations'),
    // Guests can't reach this form (the "Buat Laporan" CTA is hidden for them),
    // so we only fetch locations/categories when the user is allowed.
    enabled: !!user && user.role !== 'GUEST',
  })
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Array<{ id: string; name: string; icon: string | null }>>('/api/categories'),
    enabled: !!user && user.role !== 'GUEST',
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      locationId: '',
      categoryId: '',
      priority: 'MEDIUM',
    },
  })

  const [submitting, setSubmitting] = React.useState(false)

  // Safety net: guests should never reach this view (the "Buat Laporan" CTA is
  // hidden for them in the sidebar/dashboard). If a guest somehow lands here
  // (e.g. persisted view state), show the Access Denied card instead.
  if (user?.role === 'GUEST') {
    return <AccessDenied />
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const created = await apiFetch<{ id: string }>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      toast.success('Laporan dibuat', {
        description: 'Laporan berhasil dikirim dan akan ditindaklanjuti.',
      })
      openReport(created.id)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Gagal membuat laporan'
      toast.error('Gagal membuat laporan', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto max-w-3xl space-y-4"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Buat Laporan Kerusakan</CardTitle>
          <CardDescription>
            Lengkapi detail laporan agar teknisi dapat menindaklanjuti dengan cepat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="title">Judul Laporan *</Label>
              <Input
                id="title"
                placeholder="Contoh: AC ruang meeting tidak dingin"
                disabled={submitting}
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi *</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="Jelaskan kerusakan, gejala, dan dampaknya secara detail…"
                disabled={submitting}
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="locationId">
                  <MapPin className="size-3.5" />
                  Lokasi *
                </Label>
                <Select
                  value={form.watch('locationId')}
                  onValueChange={(v) => form.setValue('locationId', v, { shouldValidate: true })}
                >
                  <SelectTrigger id="locationId" className="w-full">
                    <SelectValue placeholder="Pilih lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {(locations ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} · {l.building}
                        {l.floor ? ` (${l.floor})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.locationId && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.locationId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">
                  <Tag className="size-3.5" />
                  Kategori *
                </Label>
                <Select
                  value={form.watch('categoryId')}
                  onValueChange={(v) => form.setValue('categoryId', v, { shouldValidate: true })}
                >
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <CategoryIcon name={c.icon} className="size-3.5" />
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prioritas</Label>
              <RadioGroup
                value={form.watch('priority')}
                onValueChange={(v) => form.setValue('priority', v as ReportPriority, { shouldValidate: true })}
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {PRIORITY_LIST.map((p) => (
                  <label
                    key={p}
                    htmlFor={`p-${p}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent',
                      form.watch('priority') === p &&
                        'border-primary bg-primary/5 ring-1 ring-primary/30'
                    )}
                  >
                    <RadioGroupItem id={`p-${p}`} value={p} />
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={p} />
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setView('reports')}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Mengirim…
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Kirim Laporan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
