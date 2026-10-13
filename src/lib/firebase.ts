'use client'

import * as React from 'react'

/**
 * Client-side Firebase Cloud Messaging (FCM) setup.
 *
 * Firebase is initialized lazily + only if the public config is present
 * (so the app still works without Firebase configured). The token is
 * registered with the server via POST /api/push/register so the server can
 * send background pushes.
 */

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
}

const vapidKey = process.env.NEXT_PUBLIC_FB_VAPID_KEY

export function isFirebaseConfigured(): boolean {
  return !!(cfg.apiKey && cfg.projectId && cfg.appId && vapidKey)
}

let firebaseApp: any = null
let messaging: any = null

async function getMessaging() {
  if (!isFirebaseConfigured()) return null
  if (messaging) return messaging
  const { initializeApp, getApps } = await import('firebase/app')
  const { getMessaging } = await import('firebase/messaging')
  firebaseApp = getApps().length ? getApps()[0] : initializeApp(cfg)
  messaging = getMessaging(firebaseApp)
  return messaging
}

/**
 * Request notification permission + get an FCM token. Returns the token
 * (or null if permission denied / Firebase not configured).
 */
export async function getFcmToken(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null
  try {
    const m = await getMessaging()
    if (!m) return null
    const { getToken } = await import('firebase/messaging')
    const token = await getToken(m, { vapidKey })
    return token || null
  } catch {
    return null
  }
}

/**
 * Hook that, on mount, gets the FCM token (if permission granted + config
 * present) and registers it with the server. Also listens for foreground
 * messages and converts them to in-app toasts.
 */
export function useFcmPush(registerUrl: string, opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? true
  React.useEffect(() => {
    if (!enabled) return
    if (!isFirebaseConfigured()) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    let cancelled = false
    ;(async () => {
      const token = await getFcmToken()
      if (cancelled || !token) return
      // Register the token with the server.
      try {
        const { apiFetch } = await import('@/lib/api')
        await apiFetch(registerUrl, {
          method: 'POST',
          body: JSON.stringify({ token }),
          skipJson: true,
        })
      } catch {
        // ignore — re-attempts on next load
      }
      // Listen for foreground messages → toast.
      const m = await getMessaging()
      if (!m) return
      const { onMessage } = await import('firebase/messaging')
      const { toast } = await import('sonner')
      onMessage(m, (payload) => {
        const n = payload.notification as
          | { title?: string; body?: string }
          | undefined
        const title = n?.title || 'SMO — Pengingat'
        const body = n?.body || payload.data?.body || ''
        toast(title, { description: body, duration: 8000 })
      })
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, registerUrl])
}
