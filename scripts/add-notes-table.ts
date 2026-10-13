import { createClient } from '@libsql/client'

const c = createClient({ url: process.env.TURSO_DATABASE_URL! })

const stmts = [
  `CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'default',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Note_authorId_idx" ON "Note"("authorId")`,
  `CREATE INDEX IF NOT EXISTS "Note_pinned_idx" ON "Note"("pinned")`,
]

for (const s of stmts) {
  try {
    await c.execute(s)
    console.log('OK:', s.slice(0, 60).replace(/\n/g, ' '))
  } catch (e) {
    console.log('FAIL:', e.message.slice(0, 80))
  }
}

// Insert a few sample notes so the board isn't empty
const users = await c.execute("SELECT id, name FROM User WHERE role='TECHNICIAN' LIMIT 1")
const authorId = users.rows[0]?.id
if (authorId) {
  const samples = [
    { title: 'Jadwal Maintenance AC', content: 'AC Ruang Server dijadwalkan service bulanan setiap tanggal 15. Pastikan refrigerant cukup dan filter bersih.', color: 'yellow', pinned: 1 },
    { title: 'Kontak Vendor Darurat', content: 'Listrik: 0812-1111-2222\nPerpipaan: 0812-3333-4444\nLift: 0812-5555-6666\nSimpan untuk darurat.', color: 'pink', pinned: 1 },
    { title: 'Catatan Meeting Mingguan', content: 'Tim maintenance rapat setiap Senin pukul 09.00 di ruang meeting lt.2. Bawa logbook laporan minggu lalu.', color: 'green', pinned: 0 },
    { title: 'Reminder Inspeksi', content: 'Cek lampu darurat dan jalur evakuasi setiap awal bulan. Ganti baterai APAR yang expired.', color: 'blue', pinned: 0 },
    { title: 'Update SOP', content: 'SOP penanganan laporan urgent sudah diperbarui. Semua teknisi wajib baca sebelum menangani laporan berprioritas DARURAT.', color: 'default', pinned: 0 },
  ]
  for (const n of samples) {
    await c.execute({
      sql: `INSERT INTO "Note" ("id","title","content","color","pinned","authorId","createdAt","updatedAt") VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [n.title, n.content, n.color, n.pinned, authorId],
    })
  }
  console.log('Inserted', samples.length, 'sample notes')
}

const count = await c.execute('SELECT COUNT(*) as n FROM Note')
console.log('Total notes now:', count.rows[0].n)
