import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import { db } from './db'
import { cookies, headers } from 'next/headers'

const SESSION_COOKIE = 'smo_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'smo-super-secret-key-change-in-production-2024'

export type SessionUser = {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'TECHNICIAN' | 'USER' | 'GUEST'
  phone: string | null
  department: string | null
}

// Virtual guest user — no DB record. Guests are read-only viewers.
export const GUEST_USER: SessionUser = {
  id: 'guest',
  email: 'tamu@smo.local',
  name: 'Tamu',
  role: 'GUEST',
  phone: null,
  department: null,
}

// ---------- Password hashing ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const testBuf = scryptSync(password, salt, 64)
  if (hashBuf.length !== testBuf.length) return false
  return timingSafeEqual(hashBuf, testBuf)
}

// ---------- Session token (signed) ----------
// Format: base64url(payload).base64url(hmac)
function sign(payload: string): string {
  const b = (s: string) => Buffer.from(s, 'utf8').toString('base64url')
  const sig = b(hmac(payload))
  return `${b(payload)}.${sig}`
}

function hmac(payload: string): string {
  const key = Buffer.from(SESSION_SECRET, 'utf8')
  // simple HMAC-SHA256
  return createHmac('sha256', key).update(payload).digest('hex')
}

export function createSessionToken(user: { id: string; email: string; role: string; name?: string }): string {
  const payload = JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.name ?? '',
    role: user.role,
    iat: Date.now(),
  })
  return sign(payload)
}

// Create a token for the virtual guest user (read-only viewer, no DB record).
export function createGuestSessionToken(): string {
  return createSessionToken(GUEST_USER)
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return null
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const expectedSig = Buffer.from(sigB64, 'base64url').toString('utf8')
    const actualSig = hmac(payload)
    if (expectedSig !== actualSig) return null
    const data = JSON.parse(payload)
    return {
      id: data.sub,
      email: data.email,
      name: data.name ?? '',
      role: data.role,
      phone: data.phone ?? null,
      department: data.department ?? null,
    }
  } catch {
    return null
  }
}

// ---------- Server-side helpers (for API routes) ----------
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const sessionUser = verifySessionToken(token)
  if (!sessionUser) return null
  // Guests are virtual — they have no DB record, so skip the DB lookup.
  if (sessionUser.role === 'GUEST' || sessionUser.id === 'guest') {
    return GUEST_USER
  }
  // refresh name/phone/department from db (token only carries id/email/role)
  const dbUser = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, name: true, role: true, phone: true, department: true },
  })
  if (!dbUser) return null
  return dbUser as SessionUser
}

export async function setSessionCookie(token: string) {
  const store = await cookies()
  // Detect HTTPS via X-Forwarded-Proto (Caddy/gateway SSL termination)
  // so we can emit a Secure cookie in the preview environment even in dev.
  const h = await headers()
  const xProto = (h.get('x-forwarded-proto') || '').toLowerCase()
  const isHttps =
    xProto.includes('https') ||
    process.env.NODE_ENV === 'production'
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps,
    // 'none' is required for the cookie to be sent from cross-site /
    // sandboxed preview iframe contexts. Must be paired with Secure when true.
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE

// ---------- Authorization helpers ----------
// Per SMO policy: only Teknisi (technician) can manage everything.
// ADMIN is treated as equivalent to TECHNICIAN for backward-compat with the
// legacy admin@smo.com account (now re-roled to TECHNICIAN anyway).
// GUEST is read-only — cannot create, edit, delete, or comment.
export function canManageAll(user: SessionUser): boolean {
  return user.role === 'TECHNICIAN' || user.role === 'ADMIN'
}

export function canUpdateStatus(user: SessionUser): boolean {
  return user.role === 'TECHNICIAN' || user.role === 'ADMIN'
}

export function canAssign(user: SessionUser): boolean {
  return user.role === 'TECHNICIAN' || user.role === 'ADMIN'
}

export function isGuest(user: SessionUser | null): boolean {
  return !!user && user.role === 'GUEST'
}

// Read-only roles cannot perform ANY mutation (create/edit/delete/comment).
export function isReadOnly(user: SessionUser | null): boolean {
  return !user || user.role === 'GUEST'
}
