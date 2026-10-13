import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { startOfDay, endOfDay, addDays } from '@/lib/schedule-utils'

// GET /api/notifications
// Returns maintenance schedules grouped by:
//   - due:     nextDueDate <= end of today (overdue or due today)
//   - upcoming: nextDueDate within the next 7 days (excluding due)
//   - later:   everything else (active, for the full list)
// Visible to everyone (incl. read-only guests) — they help everyone stay aware.
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const now = new Date()
  const todayEnd = endOfDay(now)
  const weekEnd = endOfDay(addDays(now, 7))

  const all = await db.maintenanceSchedule.findMany({
    where: { active: true },
    orderBy: [{ nextDueDate: 'asc' }],
    include: {
      location: { select: { id: true, name: true, building: true, floor: true } },
      creator: { select: { id: true, name: true, role: true } },
    },
  })

  const due = all.filter((s) => startOfDay(new Date(s.nextDueDate)).getTime() <= todayEnd.getTime())
  const upcoming = all.filter((s) => {
    const d = startOfDay(new Date(s.nextDueDate)).getTime()
    return d > todayEnd.getTime() && d <= weekEnd.getTime()
  })
  const later = all.filter((s) => {
    const d = startOfDay(new Date(s.nextDueDate)).getTime()
    return d > weekEnd.getTime()
  })

  return NextResponse.json({
    due,
    upcoming,
    later,
    totalDue: due.length,
    totalUpcoming: upcoming.length,
  })
}
