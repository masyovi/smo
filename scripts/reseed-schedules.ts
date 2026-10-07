import { createClient } from '@libsql/client'

const c = createClient({ url: process.env.TURSO_DATABASE_URL! })

// Wipe and re-seed schedules with proper Date arithmetic (JS Date handles
// month overflow/underflow correctly, unlike the previous naive iso() helper).
await c.execute('DELETE FROM MaintenanceSchedule')
console.log('Cleared old schedules')

const now = new Date()
const Y = now.getUTCFullYear()
const M = now.getUTCMonth() // 0-indexed
const today = now.getUTCDate()

const users = await c.execute("SELECT id FROM User WHERE role='TECHNICIAN' ORDER BY name LIMIT 1")
const tekId = users.rows[0]?.id as string
const locs = await c.execute('SELECT id, name FROM Location ORDER BY name')
const locById = (name: string) => locs.rows.find((r: any) => r.name === name)?.id

// Helper: build a Date from year, month (can be out of range — JS normalizes),
// and day. Returns an ISO string.
const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, day)).toISOString()

// Maintenance Lift — DUE TODAY (so the notification demo works immediately)
const liftDue = d(Y, M, today)
// Service AC — 3 days from now (upcoming)
const acDue = d(Y, M, today + 3)
// Inspeksi APAR — next month, day 1
const aparDue = d(Y, M + 1, 1)
// Smoke detector — far future (6 months from a start 2 months ago)
const smokeDue = d(Y, M + 4, 20)
// CCTV — 5 days from now (upcoming)
const cctvDue = d(Y, M, today + 5)

const samples = [
  {
    title: 'Maintenance Lift Utama',
    description: 'Service rutin lift utama: cek kabel, pelumasan, tombol darurat, dan alarm. Vendor lift dihubungi H-3.',
    locationName: 'Lobi Utama',
    frequency: 'MONTHLY', dayOfMonth: 15, intervalMonths: null,
    startDate: d(Y, M - 6, 15), nextDueDate: liftDue,
  },
  {
    title: 'Service AC Ruang Server',
    description: 'Cek refrigerant, bersihkan filter, dan cek tekanan AC ruang server. Kritis untuk mencegah overheating server.',
    locationName: 'Ruang Server Utama',
    frequency: 'INTERVAL', dayOfMonth: null, intervalMonths: 3,
    startDate: d(Y, M - 3, 10), nextDueDate: acDue,
  },
  {
    title: 'Inspeksi APAR (Alat Pemadam Api Ringan)',
    description: 'Cek tekanan, masa berlaku, dan kondisi fisik semua APAR. Ganti yang expired.',
    locationName: null,
    frequency: 'MONTHLY', dayOfMonth: 1, intervalMonths: null,
    startDate: d(Y, M - 12, 1), nextDueDate: aparDue,
  },
  {
    title: 'Cek Sistem Smoke Detector',
    description: 'Tes semua smoke detector dan sistem alarm kebakaran. Pastikan baterai backup berfungsi.',
    locationName: null,
    frequency: 'INTERVAL', dayOfMonth: null, intervalMonths: 6,
    startDate: d(Y, M - 2, 20), nextDueDate: smokeDue,
  },
  {
    title: 'Maintenance Sistem CCTV',
    description: 'Cek kamera, penyimpanan rekaman, dan kabel koneksi CCTV. Bersihkan lensa kamera.',
    locationName: 'Parkir Basement',
    frequency: 'MONTHLY', dayOfMonth: 28, intervalMonths: null,
    startDate: d(Y, M - 3, 28), nextDueDate: cctvDue,
  },
]

for (const s of samples) {
  const locId = s.locationName ? locById(s.locationName) : null
  await c.execute({
    sql: `INSERT INTO "MaintenanceSchedule" ("id","title","description","locationId","frequency","dayOfMonth","intervalMonths","startDate","nextDueDate","active","createdBy","createdAt","updatedAt") VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))`,
    args: [s.title, s.description, locId, s.frequency, s.dayOfMonth, s.intervalMonths, s.startDate, s.nextDueDate, tekId],
  })
  console.log('Inserted:', s.title, '→ start', s.startDate.slice(0, 10), 'due', s.nextDueDate.slice(0, 10))
}

const count = await c.execute('SELECT COUNT(*) as n FROM MaintenanceSchedule')
console.log('Total schedules:', count.rows[0].n)
