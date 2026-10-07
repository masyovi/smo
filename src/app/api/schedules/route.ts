import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isReadOnly } from '@/lib/auth'
import { computeNextDueDate, Frequency } from '@/lib/schedule-utils'

// GET /api/schedules — list all maintenance schedules (visible to everyone)
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const schedules = await db.maintenanceSchedule.findMany({
    where: { active: true },
    orderBy: [{ nextDueDate: 'asc' }],
    include: {
      location: { select: { id: true, name: true, building: true, floor: true } },
      creator: { select: { id: true, name: true, role: true } },
    },
  })
  return NextResponse.json({ data: schedules })
}

// POST /api/schedules — create a schedule (Teknisi only; guests 403)
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
  const description = (body?.description ?? '').toString().trim() || null
  const locationId = (body?.locationId ?? null)?.toString() || null
  const frequency: Frequency = body?.frequency === 'INTERVAL' ? 'INTERVAL' : 'MONTHLY'
  const dayOfMonth = frequency === 'MONTHLY' ? Number(body?.dayOfMonth) : null
  const intervalMonths = frequency === 'INTERVAL' ? Number(body?.intervalMonths) : null
  const startDateStr = (body?.startDate ?? '').toString()
  if (!title) {
    return NextResponse.json({ error: 'Judul jadwal wajib diisi' }, { status: 400 })
  }
  if (frequency === 'MONTHLY' && (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31)) {
    return NextResponse.json({ error: 'Tanggal (1-31) wajib diisi untuk jadwal bulanan' }, { status: 400 })
  }
  if (frequency === 'INTERVAL' && (!intervalMonths || intervalMonths < 1)) {
    return NextResponse.json({ error: 'Interval bulan wajib diisi (min 1)' }, { status: 400 })
  }
  let startDate: Date
  try {
    startDate = startDateStr ? new Date(startDateStr) : new Date()
  } catch {
    startDate = new Date()
  }
  if (isNaN(startDate.getTime())) startDate = new Date()
  const nextDueDate = computeNextDueDate({
    frequency,
    dayOfMonth,
    intervalMonths,
    startDate,
    fromDate: startDate,
  })
  const schedule = await db.maintenanceSchedule.create({
    data: {
      title,
      description,
      locationId,
      frequency,
      dayOfMonth,
      intervalMonths,
      startDate,
      nextDueDate,
      createdBy: session.id,
    },
    include: {
      location: { select: { id: true, name: true, building: true, floor: true } },
      creator: { select: { id: true, name: true, role: true } },
    },
  })
  return NextResponse.json(schedule, { status: 201 })
}
