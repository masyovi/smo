import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isReadOnly } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/notes/[id] — view a single note (everyone)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const note = await db.note.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, role: true } } },
  })
  if (!note) {
    return NextResponse.json({ error: 'Catatan tidak ditemukan' }, { status: 404 })
  }
  return NextResponse.json(note)
}

// PATCH /api/notes/[id] — edit a note (Teknisi only; guests 403)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (isReadOnly(session)) {
    return NextResponse.json(
      { error: 'Akses tamu hanya untuk melihat. Silakan login sebagai teknisi untuk mengelola.' },
      { status: 403 }
    )
  }
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (typeof body?.title === 'string') data.title = body.title.trim()
  if (typeof body?.content === 'string') data.content = body.content.trim()
  if (['default', 'yellow', 'green', 'blue', 'pink'].includes(body?.color)) data.color = body.color
  if (typeof body?.pinned === 'boolean') data.pinned = body.pinned
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Tidak ada field yang diubah' }, { status: 400 })
  }
  try {
    const note = await db.note.update({
      where: { id },
      data,
      include: { author: { select: { id: true, name: true, role: true } } },
    })
    return NextResponse.json(note)
  } catch {
    return NextResponse.json({ error: 'Catatan tidak ditemukan' }, { status: 404 })
  }
}

// DELETE /api/notes/[id] — delete a note (Teknisi only; guests 403)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (isReadOnly(session)) {
    return NextResponse.json(
      { error: 'Akses tamu hanya untuk melihat. Silakan login sebagai teknisi untuk mengelola.' },
      { status: 403 }
    )
  }
  const { id } = await params
  try {
    await db.note.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Catatan tidak ditemukan' }, { status: 404 })
  }
}
