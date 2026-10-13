'use client'

import { useAppStore } from './store'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// Read the persisted auth token from localStorage directly (works outside of
// React render cycles). The store persists `authToken` under the
// `smo-app-store` localStorage key.
function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    // Zustand persist stores the whole partialized state under the key.
    const raw = window.localStorage.getItem('smo-app-store')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.authToken || null
  } catch {
    return null
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { skipJson?: boolean }
): Promise<T> {
  const token = readAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(path, {
    ...options,
    headers,
  })
  if (!res.ok) {
    // On 401, clear the local auth state so the app returns to the login
    // screen on the next navigation.
    if (res.status === 401) {
      try {
        useAppStore.getState().logout()
      } catch {
        /* ignore */
      }
    }
    let msg = `Request gagal (${res.status})`
    try {
      const data = await res.json()
      msg = data.error || data.message || msg
    } catch {
      /* ignore */
    }
    throw new ApiError(msg, res.status)
  }
  if (options?.skipJson) return undefined as T
  return (await res.json()) as T
}
