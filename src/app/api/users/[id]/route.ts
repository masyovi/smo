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

// GET /api/users/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (isReadOnly(user) || !canManageAll(user)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const { id } = await params
  const target = await db.user.findUnique({
    where: { id },
    select: userSelect,
  })
  if (!target) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
  }
  return NextResponse.json(target)
}

// PATCH /api/users/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Guests are read-only viewers — they cannot edit anything.
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
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const { id } = await params
  const target = await db.user.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
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
  if (body.email !== undefined) {
    const e = (body.email as string).toString().trim().toLowerCase()
    if (!e) {
      return NextResponse.json(
        { error: 'Email tidak boleh kosong' },
        { status: 400 }
      )
    }
    if (e !== target.email) {
      const conflict = await db.user.findUnique({ where: { email: e } })
      if (conflict) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 409 }
        )
      }
    }
    data.email = e
  }
  if (body.role !== undefined) {
    const r = (body.role as string).toString()
    if (!['ADMIN', 'TECHNICIAN', 'USER'].includes(r)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }
    data.role = r
  }
  if (body.phone !== undefined) {
    data.phone = (body.phone as string | null)
  }
  if (body.department !== undefined) {
    data.department = (body.department as string | null)
  }
  if (body.password !== undefined && (body.password as string).length > 0) {
    data.password = hashPassword((body.password as string).toString())
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: userSelect,
  })
  return NextResponse.json(updated)
}

// DELETE /api/users/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Guests are read-only viewers — they cannot delete anything.
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
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const { id } = await params
  if (id === user.id) {
    return NextResponse.json(
      { error: 'Tidak dapat menghapus akun sendiri' },
      { status: 400 }
    )
  }
  const target = await db.user.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
  }
  const reportCount =
    (await db.report.count({ where: { reporterId: id } })) +
    (await db.report.count({ where: { assigneeId: id } }))
  if (reportCount > 0) {
    return NextResponse.json(
      {
        error:
          'Tidak bisa menghapus pengguna yang masih memiliki laporan. Ubah pelapor/penugasan laporan terlebih dahulu.',
      },
      { status: 409 }
    )
  }
  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
