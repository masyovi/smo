import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword, verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth'

const safeSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  department: true,
} as const

// GET /api/profile
export async function GET() {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const full = await db.user.findUnique({
    where: { id: user.id },
    select: { ...safeSelect, createdAt: true, updatedAt: true },
  })
  if (!full) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
  }
  return NextResponse.json({ user: full })
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const n = (body.name as string).toString().trim()
    if (!n) {
      return NextResponse.json(
        { error: 'Nama tidak boleh kosong' },
        { status: 400 }
      )
    }
    data.name = n
  }
  if (body.phone !== undefined) {
    data.phone = (body.phone as string | null)
  }
  if (body.department !== undefined) {
    data.department = (body.department as string | null)
  }

  // Password change requires current password
  if (body.newPassword !== undefined && (body.newPassword as string).length > 0) {
    const currentPassword = (body.currentPassword ?? '').toString()
    const dbUser = await db.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }
    if (!verifyPassword(currentPassword, dbUser.password)) {
      return NextResponse.json(
        { error: 'Password lama salah' },
        { status: 400 }
      )
    }
    data.password = hashPassword((body.newPassword as string).toString())
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 400 })
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data,
    select: safeSelect,
  })

  // Refresh session cookie with updated info (in case role/email changed in future)
  const token = createSessionToken({
    id: updated.id,
    email: updated.email,
    role: updated.role,
  })
  await setSessionCookie(token)

  return NextResponse.json({ user: updated })
}
