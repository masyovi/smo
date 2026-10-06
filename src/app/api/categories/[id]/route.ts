import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PATCH /api/categories/[id]
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
      { error: 'Hanya admin yang dapat mengubah kategori' },
      { status: 403 }
    )
  }
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) {
    const n = (body.name as string).toString().trim()
    if (!n) {
      return NextResponse.json(
        { error: 'Nama kategori tidak boleh kosong' },
        { status: 400 }
      )
    }
    data.name = n
  }
  if (body.icon !== undefined) data.icon = (body.icon as string | null)
  const updated = await db.category.update({ where: { id }, data })
  return NextResponse.json(updated)
}

// DELETE /api/categories/[id]
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
      { error: 'Hanya admin yang dapat menghapus kategori' },
      { status: 403 }
    )
  }
  const { id } = await params
  const count = await db.report.count({ where: { categoryId: id } })
  if (count > 0) {
    return NextResponse.json(
      {
        error:
          'Tidak bisa menghapus kategori yang masih memiliki laporan. Hapus atau pindahkan laporan terlebih dahulu.',
      },
      { status: 409 }
    )
  }
  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
