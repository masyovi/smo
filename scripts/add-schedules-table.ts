import { createClient } from '@libsql/client'

const c = createClient({ url: process.env.TURSO_DATABASE_URL! })

const stmts = [
  `CREATE TABLE IF NOT EXISTS "MaintenanceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "locationId" TEXT,
    "frequency" TEXT NOT NULL,
    "dayOfMonth" INTEGER,
    "intervalMonths" INTEGER,
    "startDate" DATETIME NOT NULL,
    "nextDueDate" DATETIME NOT NULL,
    "lastCompletedAt" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceSchedule_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceSchedule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "MaintenanceSchedule_active_idx" ON "MaintenanceSchedule"("active")`,
  `CREATE INDEX IF NOT EXISTS "MaintenanceSchedule_nextDueDate_idx" ON "MaintenanceSchedule"("nextDueDate")`,
]

for (const s of stmts) {
  try {
    await c.execute(s)
    console.log('OK:', s.slice(0, 55).replace(/\n/g, ' '))
  } catch (e) {
    console.log('FAIL:', e.message.slice(0, 90))
  }
}

// Seed sample maintenance schedules.
// Compute dates relative to today so at least one is DUE and one is UPCOMMING.
const now = new Date()
const Y = now.getFullYear()
const M = now.getMonth() // 0-indexed
const today = now.getDate()
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}T08:00:00.000Z`

// helper: last day of a month
const lastDay = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

// Get a technician user to be the creator
const users = await c.execute("SELECT id, name FROM User WHERE role='TECHNICIAN' ORDER BY name LIMIT 1")
const tekId = users.rows[0]?.id as string
if (!tekId) { console.log('No technician found, aborting seed'); process.exit(1) }

// Locations for linking
const locs = await c.execute('SELECT id, name FROM Location ORDER BY name')
const locById = (name: string) => locs.rows.find((r: any) => r.name === name)?.id

// Build sample schedules
// 1. Maintenance Lift — MONTHLY day 15. If today > 15, nextDue is next month's 15; else this month's 15.
//    To force a DUE demo: set nextDueDate to today (override).
let liftDue: string
if (today >= 15) {
  // this month's 15 has passed → due this month (overdue) for demo
  liftDue = iso(Y, M, 15)
} else {
  liftDue = iso(Y, M, 15) // upcoming this month
}
// Make it DUE today for demo:
liftDue = iso(Y, M, today)

// 2. Service AC Ruang Server — INTERVAL every 3 months, start 3 months ago → due now
const acStart = new Date(Y, M - 3, 10)
const acDue = new Date(Y, M, 10) // 3 months later = around now
const acDueIso = acDue.toISOString()

// 3. Inspeksi APAR — MONTHLY day 1, upcoming (next month 1) if today > 1
const aparDue = iso(Y, M + 1, 1)

// 4. Cek Smoke Detector — INTERVAL every 6 months, far future
const smokeStart = new Date(Y, M - 2, 20)
const smokeDue = new Date(Y, M + 4, 20) // 6 months from start

// 5. Maintenance CCTV — MONTHLY day 28, upcoming in a few days
const cctvDue = iso(Y, M, Math.min(today + 4, lastDay(Y, M)))

const samples = [
  {
    title: 'Maintenance Lift Utama',
    description: 'Service rutin lift utama: cek kabel, pelumasan, tombol darurat, dan alarm. Vendor lift dihubungi H-3.',
    locationName: 'Lobi Utama',
    frequency: 'MONTHLY',
    dayOfMonth: 15,
    intervalMonths: null,
    startDate: iso(Y, M - 6, 15),
    nextDueDate: liftDue,
  },
  {
    title: 'Service AC Ruang Server',
    description: 'Cok refrigerant, bersihkan filter, dan cek tekanan AC ruang server. Kritis untuk mencegah overheating server.',
    locationName: 'Ruang Server Utama',
    frequency: 'INTERVAL',
    dayOfMonth: null,
    intervalMonths: 3,
    startDate: acStart.toISOString(),
    nextDueDate: acDueIso,
  },
  {
    title: 'Inspeksi APAR (Alat Pemadam Api Ringan)',
    description: 'Cek tekanan, masa berlaku, dan kondisi fisik semua APAR. Ganti yang expired.',
    locationName: null,
    frequency: 'MONTHLY',
    dayOfMonth: 1,
    intervalMonths: null,
    startDate: iso(Y, M - 12, 1),
    nextDueDate: aparDue,
  },
  {
    title: 'Cek Sistem Smoke Detector',
    description: 'Tes semua smoke detector dan sistem alarm kebakaran. Pastikan baterai backup berfungsi.',
    locationName: null,
    frequency: 'INTERVAL',
    dayOfMonth: null,
    intervalMonths: 6,
    startDate: smokeStart.toISOString(),
    nextDueDate: smokeDue.toISOString(),
  },
  {
    title: 'Maintenance Sistem CCTV',
    description: 'Cek kamera, penyimpanan rekaman, dan kabel koneksi CCTV. Bersihkan lensa kamera.',
    locationName: 'Parkir Basement',
    frequency: 'MONTHLY',
    dayOfMonth: 28,
    intervalMonths: null,
    startDate: iso(Y, M - 3, 28),
    nextDueDate: cctvDue,
  },
]

for (const s of samples) {
  const locId = s.locationName ? locById(s.locationName) : null
  await c.execute({
    sql: `INSERT INTO "MaintenanceSchedule" ("id","title","description","locationId","frequency","dayOfMonth","intervalMonths","startDate","nextDueDate","active","createdBy","createdAt","updatedAt") VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))`,
    args: [s.title, s.description, locId, s.frequency, s.dayOfMonth, s.intervalMonths, s.startDate, s.nextDueDate, tekId],
  })
  console.log('Inserted:', s.title, '→ due', s.nextDueDate.slice(0, 10), s.locationName ? `@${s.locationName}` : '')
}

const count = await c.execute('SELECT COUNT(*) as n FROM MaintenanceSchedule')
console.log('Total maintenance schedules now:', count.rows[0].n)
