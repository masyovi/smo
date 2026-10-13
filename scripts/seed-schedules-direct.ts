import { createClient } from '@libsql/client'

const c = createClient({ url: process.env.TURSO_DATABASE_URL! })

async function main() {
  const users = await c.execute("SELECT id FROM User WHERE role='TECHNICIAN' LIMIT 1")
  const tekId = users.rows[0]?.id as string
  if (!tekId) { console.log('No technician'); process.exit(1) }

  const locs = await c.execute('SELECT id, name FROM Location ORDER BY name')
  const locById = (n: string) => locs.rows.find(r => r.name === n)?.id || null

  const Y = new Date().getUTCFullYear()
  const M = new Date().getUTCMonth()
  const today = new Date().getUTCDate()
  const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, day)).toISOString()
  const now = new Date().toISOString()

  // 13 columns. VALUES: hex(id) + 12 ? = 13 values. 12 args.
  const SQL = `INSERT INTO MaintenanceSchedule
    (id,title,description,locationId,frequency,dayOfMonth,intervalMonths,startDate,nextDueDate,active,createdBy,createdAt,updatedAt)
    VALUES (lower(hex(randomblob(16))),?,?,?,?,?,?,?,?,?,?,?,?)`

  const samples = [
    { t: 'Maintenance Lift Utama', d: 'Service lift utama: cek kabel, pelumasan, alarm.', l: 'Lobi Utama', f: 'MONTHLY', dom: 15, im: null as number | null, s: d(Y, M - 6, 15), due: d(Y, M, today) },
    { t: 'Service AC Ruang Server', d: 'Cek refrigerant AC server.', l: 'Ruang Server Utama', f: 'INTERVAL', dom: null as number | null, im: 3, s: d(Y, M - 3, 10), due: d(Y, M, today + 3) },
    { t: 'Maintenance Sistem CCTV', d: 'Cek kamera CCTV.', l: 'Parkir Basement', f: 'MONTHLY', dom: 28, im: null as number | null, s: d(Y, M - 3, 28), due: d(Y, M, today + 5) },
    { t: 'Inspeksi APAR', d: 'Cek APAR.', l: null as string | null, f: 'MONTHLY', dom: 1, im: null as number | null, s: d(Y, M - 12, 1), due: d(Y, M + 1, 1) },
  ]

  for (const s of samples) {
    const locId = s.l ? locById(s.l) : null
    const args = [s.t, s.d, locId, s.f, s.dom, s.im, s.s, s.due, 1, tekId, now, now]
    try {
      await c.execute({ sql: SQL, args })
      console.log('OK:', s.t, '→ due', s.due.slice(0, 10))
    } catch (e: any) {
      console.log('FAIL:', s.t, '-', e.message?.slice(0, 80))
    }
  }

  const n = await c.execute('SELECT COUNT(*) as n FROM MaintenanceSchedule')
  console.log('Total schedules:', n.rows[0].n)
}

main().catch(console.error)
