'use client'

import * as React from 'react'

/**
 * useDeviceNotifications — registers the SMO service worker and shows
 * OS-level (device) push notifications when maintenance schedules are due.
 *
 * Returns:
 *   - permission: 'default' | 'granted' | 'denied' | 'unsupported'
 *   - requestPermission(): async, asks the browser for permission
 *   - notify(title, body, opts?): shows an OS notification via the SW
 */
export type NotificationPermissionState =
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported'

const SW_PATH = '/sw.js'
const SW_SCOPE = '/'

export function useDeviceNotifications() {
  const [permission, setPermission] = React.useState<NotificationPermissionState>(
    typeof window === 'undefined' || !('Notification' in window)
      ? 'unsupported'
      : (Notification.permission as NotificationPermissionState)
  )
  const registrationRef = React.useRef<ServiceWorkerRegistration | null>(null)

  // Register the service worker on mount.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    let cancelled = false
    navigator.serviceWorker
      .register(SW_PATH, { scope: SW_SCOPE })
      .then((reg) => {
        if (cancelled) return
        registrationRef.current = reg
      })
      .catch(() => {
        // SW registration can fail on HTTP/gateway contexts — silently
        // fall back to in-app toasts only.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const requestPermission =
    React.useCallback(async (): Promise<NotificationPermissionState> => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported'
      }
      try {
        const result = await Notification.requestPermission()
        const next = result as NotificationPermissionState
        setPermission(next)
        return next
      } catch {
        return 'denied'
      }
    }, [])

  /**
   * Show an OS-level notification with a title + body (keterangan).
   * Uses the SW's showNotification when available, falls back to the
   * page-level Notification API.
   */
  const notify = React.useCallback(
    async (title: string, body: string, opts?: { tag?: string }) => {
      if (permission !== 'granted') return
      const options: NotificationOptions & { data?: { url?: string } } = {
        body,
        icon: '/smo-icon.png',
        badge: '/smo-icon.png',
        tag: opts?.tag || 'smo-maintenance',
        renotify: true,
        data: { url: '/' },
      }
      try {
        const reg =
          registrationRef.current ||
          (await navigator.serviceWorker?.getRegistration?.())
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, options)
          return
        }
      } catch {
        // fall through to direct Notification
      }
      try {
        new Notification(title, options)
      } catch {
        // ignore
      }
    },
    [permission]
  )

  return { permission, requestPermission, notify }
}
