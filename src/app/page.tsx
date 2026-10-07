'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api'
import { LoginScreen } from '@/components/app/login-screen'
import { AppShell } from '@/components/app/app-shell'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function Home() {
  const user = useAppStore((s) => s.user)
  const authLoading = useAppStore((s) => s.authLoading)
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)
  const logout = useAppStore((s) => s.logout)

  // Fetch current session on mount
  React.useEffect(() => {
    let cancelled = false
    async function fetchMe() {
      setAuthLoading(true)
      try {
        const res = await apiFetch<{ user: any }>('/api/auth/me')
        if (!cancelled) setUser(res.user)
      } catch {
        if (!cancelled) logout()
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }
    fetchMe()
    return () => {
      cancelled = true
    }
  }, [])

  if (authLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-3 p-6">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
          <ShieldCheck className="size-6" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat SMO…
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <AppShell />
}
