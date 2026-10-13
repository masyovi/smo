import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword, canManageAll, isReadOnly } from '@/lib/auth'

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  department: true,
  createdAt: true,
  updatedAt: true,
} as const

// GET /api/users — Teknisi/Admin only (management view). Guests get 403.
export async function GET() {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Guests (and any non-manager) cannot see the user list.
  if (isReadOnly(user) || !canManageAll(user)) {
    return NextResponse.json(
      { error: 'Hanya teknisi yang dapat melihat daftar pengguna' },
      { status: 403 }
    )
  }
  const data = await db.user.findMany({
    select: userSelect,
    orderBy: [{ name: 'asc' }],
  })
  return NextResponse.json(data)
}

// POST /api/users
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Guests are read-only viewers — they cannot create users.
  if (isReadOnly(user)) {
    return NextResponse.json(
      {
        error:
          'Akses tamu hanya untuk melihat. Silakan login sebagai teknisi untuk mengelola.',
      },
      { status: 403 }
    )
  }
  // Per SMO policy: only Teknisi (and ADMIN for backward-compat) can manage everything.
  if (!canManageAll(user)) {
    return NextResponse.json(
      { error: 'Hanya teknisi yang dapat menambah pengguna' },
      { status: 403 }
    )
  }
  const body = await req.json().catch(() => ({}))
  const email = (body?.email ?? '').toString().trim().toLowerCase()
  const name = (body?.name ?? '').toString().trim()
  const password = (body?.password ?? '').toString()
  const role = (body?.role ?? 'USER').toString()
  const phone = body?.phone ? (body.phone as string).toString().trim() : null
  const department = body?.department ? (body.department as string).toString().trim() : null

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: 'Email, nama, dan password wajib diisi' },
      { status: 400 }
    )
  }
  if (!['ADMIN', 'TECHNICIAN', 'USER'].includes(role)) {
    return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
  }
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'Email sudah terdaftar' },
      { status: 409 }
    )
  }

  const created = await db.user.create({
    data: {
      email,
      name,
      password: hashPassword(password),
      role,
      phone,
      department,
    },
    select: userSelect,
  })
  return NextResponse.json(created, { status: 201 })
}
