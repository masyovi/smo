'use client'

import * as React from 'react'
import { ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'

type AccessDeniedProps = {
  title?: string
  message?: string
  /** Override the back-to-home label */
  backLabel?: string
}

// Reusable "Akses Ditolak" empty state for views that the current user role
// cannot access (e.g. management views reached by a guest through persisted
// view state). Renders a centered card with a shield icon and a CTA back
// to the dashboard.
export function AccessDenied({
  title = 'Akses Ditolak',
  message = 'Halaman ini hanya untuk teknisi. Anda masuk sebagai tamu.',
  backLabel = 'Kembali ke Beranda',
}: AccessDeniedProps) {
  const goDashboard = useAppStore((s) => s.goDashboard)

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-dashed bg-muted/30 text-center">
        <CardContent className="flex flex-col items-center gap-3 p-8">
          <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
            <ShieldAlert className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold">{title}</p>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {message}
            </p>
          </div>
          <Button size="sm" onClick={goDashboard} className="mt-1">
            {backLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
