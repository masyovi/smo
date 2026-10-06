import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/categories
export async function GET() {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const data = await db.category.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(data)
}

// POST /api/categories
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Hanya admin yang dapat menambah kategori' },
      { status: 403 }
    )
  }
  const body = await req.json().catch(() => ({}))
  const name = (body?.name ?? '').toString().trim()
  const icon = body?.icon ? (body.icon as string).toString().trim() : null

  if (!name) {
    return NextResponse.json(
      { error: 'Nama kategori wajib diisi' },
      { status: 400 }
    )
  }

  const existing = await db.category.findUnique({ where: { name } })
  if (existing) {
    return NextResponse.json(
      { error: 'Kategori dengan nama tersebut sudah ada' },
      { status: 409 }
    )
  }

  const cat = await db.category.create({ data: { name, icon } })
  return NextResponse.json(cat, { status: 201 })
}
