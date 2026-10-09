import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageAll, isReadOnly } from '@/lib/auth'

// GET /api/locations
export async function GET() {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Guests (read-only) and managers (TECH/ADMIN) can list locations.
  const data = await db.location.findMany({
    orderBy: [{ building: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(data)
}

// POST /api/locations
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Guests are read-only viewers — they cannot create locations.
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
      { error: 'Hanya teknisi yang dapat menambah lokasi' },
      { status: 403 }
    )
  }
  const body = await req.json().catch(() => ({}))
  const name = (body?.name ?? '').toString().trim()
  // The form no longer collects "Gedung" — default to '-' so the NOT NULL
  // column is satisfied. Old locations keep their real building values.
  const building = (body?.building ?? '').toString().trim() || '-'
  const floor = body?.floor ? (body.floor as string).toString().trim() : null
  const description = body?.description ? (body.description as string).toString().trim() : null

  if (!name) {
    return NextResponse.json(
      { error: 'Nama lokasi wajib diisi' },
      { status: 400 }
    )
  }

  const loc = await db.location.create({
    data: { name, building, floor, description },
  })
  return NextResponse.json(loc, { status: 201 })
}
