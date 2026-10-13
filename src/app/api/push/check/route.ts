import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canManageAll } from '@/lib/auth'
import { sendPush } from '@/lib/firebase-admin'
import { startOfDay, endOfDay, addDays } from '@/lib/schedule-utils'

/**
 * GET/POST /api/push/check
 * Check for maintenance schedules that are due and send push notifications
 * to all registered FCM tokens. Designed to be called by Vercel Cron (GET)
 * or manually (POST).
 *
 * Optional `?notify=due|upcoming` (default: due only).
 *
 * Auth (any one):
 *   - Vercel Cron: `Authorization: Bearer <CRON_SECRET>` header (auto-injected
 *     by Vercel Cron when CRON_SECRET env var is set).
 *   - Manual: `x-cron-secret: <CRON_SECRET>` header.
 *   - Manual: authenticated technician/admin session (Bearer token).
 */

async function runCheck(req: NextRequest) {
  // Auth: Vercel Cron bearer, x-cron-secret header, or technician session.
  const authHeader = req.headers.get('authorization') || ''
  const vercelCron = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim() === process.env.CRON_SECRET
    : false
  const cronSecret = req.headers.get('x-cron-secret')
  const isCron = vercelCron || (cronSecret && cronSecret === process.env.CRON_SECRET)
  const session = await getSession()
  if (!isCron && (!session || !canManageAll(session))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const notify = url.searchParams.get('notify') || 'due'
  const now = new Date()
  const todayEnd = endOfDay(now)

  const schedules = await db.maintenanceSchedule.findMany({
    where: { active: true },
    orderBy: { nextDueDate: 'asc' },
  })

  const due = schedules.filter(
    (s) => startOfDay(new Date(s.nextDueDate)).getTime() <= todayEnd.getTime()
  )
  const upcoming = schedules.filter((s) => {
    const d = startOfDay(new Date(s.nextDueDate)).getTime()
    return d > todayEnd.getTime() && d <= endOfDay(addDays(now, 7)).getTime()
  })

  const subs = await db.pushSubscription.findMany({ select: { token: true } })
  const tokens = subs.map((s) => s.token)

  let sent = 0
  const toNotify = notify === 'upcoming' ? [...due, ...upcoming] : due
  if (toNotify.length && tokens.length) {
    const titles = toNotify.map((s) => s.title).join(', ')
    const title =
      toNotify.length === 1
        ? `SMO — ${toNotify[0].title}`
        : `SMO — ${toNotify.length} jadwal maintenance`
    const body =
      toNotify.length === 1
        ? `Jadwal jatuh tempo: ${toNotify[0].title}${
            toNotify[0].location ? ` (${toNotify[0].location})` : ''
          }. Buka SMO untuk menindaklanjuti.`
        : `Jadwal jatuh tempo: ${titles}. Buka SMO untuk menindaklanjuti.`
    sent = await sendPush(tokens, title, body)
  }

  return NextResponse.json({
    due: due.length,
    upcoming: upcoming.length,
    tokens: tokens.length,
    sent,
    firebaseConfigured: !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ),
  })
}

export async function GET(req: NextRequest) {
  return runCheck(req)
}

export async function POST(req: NextRequest) {
  return runCheck(req)
}
