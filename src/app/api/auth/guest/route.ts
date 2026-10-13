import { NextResponse } from 'next/server'
import { createGuestSessionToken, setSessionCookie, GUEST_USER } from '@/lib/auth'

// Guest login — no credentials required.
// Guests are read-only viewers: they can browse reports and history but
// cannot create, edit, delete, or comment (enforced in the mutation routes
// via isReadOnly()).
// Returns the token so the client can store it in localStorage and send it
// as a Bearer header (cookie-based auth is unreliable in cross-site iframes).
export async function POST() {
  const token = createGuestSessionToken()
  await setSessionCookie(token)
  return NextResponse.json({ token, user: GUEST_USER })
}
