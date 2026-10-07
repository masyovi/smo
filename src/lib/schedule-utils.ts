// Date helpers for maintenance schedules.
// All dates are stored as ISO strings (UTC). We compare on the calendar-day
// level (date-only, no time) for "due today" / "upcoming" logic.

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(23, 59, 59, 999)
  return x
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + days)
  return x
}

export function addMonths(d: Date, months: number): Date {
  const x = new Date(d)
  const day = x.getUTCDate()
  const targetMonth = x.getUTCMonth() + months
  x.setUTCMonth(targetMonth)
  // handle month overflow (e.g. Jan 31 + 1 month → Mar 3)
  if (x.getUTCDate() < day) {
    // we overflowed — set to last day of the target month
    x.setUTCDate(0)
  }
  return x
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

// Compute the NEXT due date for a schedule based on its frequency,
// given a "from" date (usually today, or the just-completed due date).
export function computeNextDueDate(opts: {
  frequency: 'MONTHLY' | 'INTERVAL'
  dayOfMonth?: number | null
  intervalMonths?: number | null
  startDate: Date | string
  fromDate: Date
}): Date {
  const from = startOfDay(new Date(opts.fromDate))
  if (opts.frequency === 'MONTHLY' && opts.dayOfMonth) {
    const day = Math.min(Math.max(opts.dayOfMonth, 1), 31)
    // Find the next date (>= from) whose day-of-month == day.
    // If this month's day >= from's day-of-month AND >= today, use this month.
    const fromDay = from.getUTCDate()
    const fromMonth = from.getUTCMonth()
    const fromYear = from.getUTCFullYear()
    const lastDayThisMonth = new Date(Date.UTC(fromYear, fromMonth + 1, 0)).getUTCDate()
    const targetDayThisMonth = Math.min(day, lastDayThisMonth)
    let candidate = new Date(Date.UTC(fromYear, fromMonth, targetDayThisMonth))
    if (candidate.getTime() < from.getTime()) {
      // move to next month
      candidate = new Date(Date.UTC(fromYear, fromMonth + 1, Math.min(day, new Date(Date.UTC(fromYear, fromMonth + 2, 0)).getUTCDate())))
    }
    return candidate
  }
  if (opts.frequency === 'INTERVAL' && opts.intervalMonths) {
    const start = startOfDay(new Date(opts.startDate))
    const interval = opts.intervalMonths
    // Find the first occurrence >= from: start + k*interval months where k >= 0
    let next = new Date(start)
    while (next.getTime() < from.getTime()) {
      next = addMonths(next, interval)
    }
    // If next equals exactly from (due today), keep it; otherwise it's the next upcoming.
    return next
  }
  // fallback: +30 days
  return addDays(from, 30)
}

export type Frequency = 'MONTHLY' | 'INTERVAL'

export function frequencyLabel(f: string, dayOfMonth?: number | null, intervalMonths?: number | null): string {
  if (f === 'MONTHLY') return `Setiap tanggal ${dayOfMonth ?? '?'}/bulan`
  if (f === 'INTERVAL') return `Setiap ${intervalMonths ?? '?'} bulan`
  return f
}
