import { NextResponse } from 'next/server'
import { createGuestSessionToken, setSessionCookie, GUEST_USER } from '@/lib/auth'

// Guest login — no credentials required.
// Guests are read-only viewers: they can browse reports and history but
// cannot create, edit, delete, or comment (enforced in the mutation routes
// via isReadOnly()).
export async function POST() {
  const token = createGuestSessionToken()
  await setSessionCookie(token)
  return NextResponse.json({ user: GUEST_USER })
}
