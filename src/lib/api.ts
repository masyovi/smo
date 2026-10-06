'use client'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { skipJson?: boolean }
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) {
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
