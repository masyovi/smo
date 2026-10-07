import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isReadOnly } from '@/lib/auth'
import { computeNextDueDate, addDays, addMonths, Frequency } from '@/lib/schedule-utils'

type Params = { params: Promise<{ id: string }> }

// POST /api/schedules/[id]/complete
// Marks the schedule as completed for this cycle and advances nextDueDate
// to the next occurrence (next month for MONTHLY, +intervalMonths for INTERVAL).
export async function POST(_req: NextRequest, { params }: Params) {
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
  const schedule = await db.maintenanceSchedule.findUnique({ where: { id } })
  if (!schedule) {
    return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
  }
  // Compute the NEXT due date — the next occurrence of the recurrence rule
  // STRICTLY AFTER the current due date's month (so completing a due schedule
  // always moves to the next cycle, not the same month).
  const currentDue = new Date(schedule.nextDueDate)
  const freq = schedule.frequency as Frequency
  const today = new Date()
  // Anchor the "from" date to the start of the month AFTER currentDue's month,
  // so computeNextDueDate finds the next valid dayOfMonth in that month or later.
  const fromMonthStart = new Date(
    Date.UTC(currentDue.getUTCFullYear(), currentDue.getUTCMonth() + 1, 1)
  )
  const fromDate = fromMonthStart.getTime() > today.getTime() ? fromMonthStart : today
  const nextDue = computeNextDueDate({
    frequency: freq,
    dayOfMonth: schedule.dayOfMonth,
    intervalMonths: schedule.intervalMonths,
    startDate: freq === 'INTERVAL' ? schedule.startDate : fromMonthStart,
    fromDate,
  })
  const updated = await db.maintenanceSchedule.update({
    where: { id },
    data: {
      nextDueDate: nextDue,
      lastCompletedAt: today,
    },
    include: {
      location: { select: { id: true, name: true, building: true, floor: true } },
      creator: { select: { id: true, name: true, role: true } },
    },
  })
  return NextResponse.json(updated)
}
