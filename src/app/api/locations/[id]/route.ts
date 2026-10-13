import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageAll, isReadOnly } from '@/lib/auth'

// PATCH /api/locations/[id]
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
    return NextResponse.json(
      { error: 'Hanya teknisi yang dapat mengubah lokasi' },
      { status: 403 }
    )
  }
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = (body.name as string).toString().trim()
  // Building is optional now — default empty to '-' so the NOT NULL column
  // stays satisfied. If not sent at all, it's left unchanged.
  if (body.building !== undefined) {
    const b = (body.building as string).toString().trim()
    data.building = b || '-'
  }
  if (body.floor !== undefined) data.floor = (body.floor as string | null)
  if (body.description !== undefined) data.description = (body.description as string | null)

  if (data.name === '') {
    return NextResponse.json(
      { error: 'Nama lokasi tidak boleh kosong' },
      { status: 400 }
    )
  }

  const updated = await db.location.update({ where: { id }, data })
  return NextResponse.json(updated)
}

// DELETE /api/locations/[id]
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
    return NextResponse.json(
      { error: 'Hanya teknisi yang dapat menghapus lokasi' },
      { status: 403 }
    )
  }
  const { id } = await params
  const count = await db.report.count({ where: { locationId: id } })
  if (count > 0) {
    return NextResponse.json(
      {
        error:
          'Tidak bisa menghapus lokasi yang masih memiliki laporan. Hapus atau pindahkan laporan terlebih dahulu.',
      },
      { status: 409 }
    )
  }
  await db.location.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
