import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PATCH /api/locations/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Hanya admin yang dapat mengubah lokasi' },
      { status: 403 }
    )
  }
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = (body.name as string).toString().trim()
  if (body.building !== undefined) data.building = (body.building as string).toString().trim()
  if (body.floor !== undefined) data.floor = (body.floor as string | null)
  if (body.description !== undefined) data.description = (body.description as string | null)

  if (data.name === '' || data.building === '') {
    return NextResponse.json(
      { error: 'Nama dan gedung tidak boleh kosong' },
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
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Hanya admin yang dapat menghapus lokasi' },
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
