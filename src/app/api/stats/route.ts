import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { STATUS_LIST, PRIORITY_LIST } from '@/lib/types'
import type { ReportStatus, ReportPriority } from '@/lib/types'

// GET /api/stats
export async function GET(_req: NextRequest) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Scope filtering
  const scopedWhere =
    user.role === 'USER'
      ? { OR: [{ reporterId: user.id }, { assigneeId: user.id }] }
      : {}

  const [total, byStatusRows, byPriorityRows, urgentOpen, pendingUnassigned] =
    await Promise.all([
      db.report.count({ where: scopedWhere }),
      db.report.groupBy({
        by: ['status'],
        where: scopedWhere,
        _count: { _all: true },
      }),
      db.report.groupBy({
        by: ['priority'],
        where: scopedWhere,
        _count: { _all: true },
      }),
      db.report.count({
        where: {
          ...scopedWhere,
          priority: 'URGENT',
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      }),
      db.report.count({
        where: {
          ...scopedWhere,
          status: 'PENDING',
          assigneeId: null,
        },
      }),
    ])

  const byStatus: Record<string, number> = {}
  for (const s of STATUS_LIST) byStatus[s] = 0
  for (const r of byStatusRows) byStatus[r.status as ReportStatus] = r._count._all

  const byPriority: Record<string, number> = {}
  for (const p of PRIORITY_LIST) byPriority[p] = 0
  for (const r of byPriorityRows) byPriority[r.priority as ReportPriority] = r._count._all

  // Recent 5 reports (for quick view)
  const recent = await db.report.findMany({
    where: scopedWhere,
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      location: true,
      category: true,
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  return NextResponse.json({
    totalReports: total,
    byStatus,
    byPriority,
    urgentOpen,
    pendingUnassigned,
    recent,
  })
}
