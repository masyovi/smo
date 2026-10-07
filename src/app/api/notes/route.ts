import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isReadOnly } from '@/lib/auth'

// GET /api/notes — list all notes (visible to everyone, incl. read-only guests)
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const notes = await db.note.findMany({
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  })
  return NextResponse.json({ data: notes })
}

// POST /api/notes — create a note (Teknisi only; guests get 403)
export async function POST(req: NextRequest) {
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
  const body = await req.json()
  const title = (body?.title ?? '').toString().trim()
  const content = (body?.content ?? '').toString().trim()
  const color = ['default', 'yellow', 'green', 'blue', 'pink'].includes(body?.color)
    ? body.color
    : 'default'
  const pinned = !!body?.pinned
  if (!title || !content) {
    return NextResponse.json(
      { error: 'Judul dan isi catatan wajib diisi' },
      { status: 400 }
    )
  }
  const note = await db.note.create({
    data: {
      title,
      content,
      color,
      pinned,
      authorId: session.id,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  })
  return NextResponse.json(note, { status: 201 })
}
