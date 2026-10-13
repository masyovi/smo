import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/push/register — store (or refresh) the caller's FCM device token.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.role === 'GUEST') {
    // Guests don't get push (no persistent account).
    return NextResponse.json({ ok: true, skipped: 'guest' })
  }
  const body = await req.json().catch(() => ({}))
  const token = (body?.token ?? '').toString().trim()
  if (!token) {
    return NextResponse.json({ error: 'Token wajib diisi' }, { status: 400 })
  }
  // Upsert — a token is unique per device browser.
  await db.pushSubscription.upsert({
    where: { token },
    update: { userId: session.id },
    create: { token, userId: session.id },
  })
  return NextResponse.json({ ok: true })
}

// DELETE /api/push/register — unregister the caller's token (on logout).
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  if (token) {
    try {
      await db.pushSubscription.delete({ where: { token } })
    } catch {
      /* ignore — token may already be gone */
    }
  }
  return NextResponse.json({ ok: true })
}
