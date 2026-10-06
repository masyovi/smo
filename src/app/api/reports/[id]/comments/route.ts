import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/reports/[id]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const report = await db.report.findUnique({ where: { id } })
  if (!report) {
    return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 })
  }
  // Authorization: USER only on own reports
  if (user.role === 'USER' && report.reporterId !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const message = (body?.message ?? '').toString().trim()
  if (!message) {
    return NextResponse.json({ error: 'Komentar tidak boleh kosong' }, { status: 400 })
  }

  const entry = await db.reportHistory.create({
    data: {
      reportId: id,
      userId: user.id,
      action: 'COMMENTED',
      message,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  return NextResponse.json(entry, { status: 201 })
}
