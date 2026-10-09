'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api'
import { LoginScreen } from '@/components/app/login-screen'
import { AppShell } from '@/components/app/app-shell'
import { TechnicianLoader } from '@/components/app/technician-loader'

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

  // Register the service worker on every load (PWA installability requires a
  // SW with a fetch handler). The Topbar also registers it for push, but
  // registering here ensures it's active even on the login screen so the
  // browser sees the app as installable immediately.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(() => {
        // SW registration can fail on HTTP/gateway — ignore.
      })
  }, [])

  if (authLoading) {
    return <TechnicianLoader />
  }

  if (!user) {
    return <LoginScreen />
  }

  return <AppShell />
}
