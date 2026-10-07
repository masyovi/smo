import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isReadOnly } from '@/lib/auth'
import { computeNextDueDate, Frequency } from '@/lib/schedule-utils'

type Params = { params: Promise<{ id: string }> }

// GET /api/schedules/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const schedule = await db.maintenanceSchedule.findUnique({
    where: { id },
    include: {
      location: { select: { id: true, name: true, building: true, floor: true } },
      creator: { select: { id: true, name: true, role: true } },
    },
  })
  if (!schedule) {
    return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
  }
  return NextResponse.json(schedule)
}

// PATCH /api/schedules/[id] — Teknisi only
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
  if (typeof body?.description === 'string') data.description = body.description.trim() || null
  if (body?.locationId !== undefined) data.locationId = body.locationId || null
  if (typeof body?.active === 'boolean') data.active = body.active
  // If frequency fields change, recompute nextDueDate.
  let recompute = false
  let frequency: Frequency | undefined
  let dayOfMonth: number | null | undefined
  let intervalMonths: number | null | undefined
  let startDate: Date | undefined
  if (body?.frequency === 'INTERVAL' || body?.frequency === 'MONTHLY') {
    data.frequency = body.frequency
    frequency = body.frequency
    recompute = true
  }
  if (body?.dayOfMonth !== undefined) {
    data.dayOfMonth = body.dayOfMonth ? Number(body.dayOfMonth) : null
    dayOfMonth = data.dayOfMonth as number | null
    recompute = true
  }
  if (body?.intervalMonths !== undefined) {
    data.intervalMonths = body.intervalMonths ? Number(body.intervalMonths) : null
    intervalMonths = data.intervalMonths as number | null
    recompute = true
  }
  if (typeof body?.startDate === 'string') {
    const d = new Date(body.startDate)
    if (!isNaN(d.getTime())) {
      data.startDate = d
      startDate = d
      recompute = true
    }
  }
  if (recompute) {
    const existing = await db.maintenanceSchedule.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
    }
    const freq = frequency ?? (existing.frequency as Frequency)
    const dom = dayOfMonth ?? existing.dayOfMonth
    const im = intervalMonths ?? existing.intervalMonths
    const sd = startDate ?? existing.startDate
    data.nextDueDate = computeNextDueDate({
      frequency: freq,
      dayOfMonth: dom,
      intervalMonths: im,
      startDate: sd,
      fromDate: new Date(),
    })
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Tidak ada field yang diubah' }, { status: 400 })
  }
  try {
    const updated = await db.maintenanceSchedule.update({
      where: { id },
      data,
      include: {
        location: { select: { id: true, name: true, building: true, floor: true } },
        creator: { select: { id: true, name: true, role: true } },
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
  }
}

// DELETE /api/schedules/[id] — Teknisi only
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
    await db.maintenanceSchedule.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
  }
}
