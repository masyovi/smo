/* eslint-disable */
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { scryptSync, randomBytes } from 'crypto'

const TURSO_URL = process.env.TURSO_DATABASE_URL

function createPrismaClient() {
  if (TURSO_URL && TURSO_URL.startsWith('libsql://')) {
    // Pass { url, authToken } directly to the adapter (NOT a pre-created
    // libsql client) — otherwise the Prisma engine throws URL_INVALID.
    const url = TURSO_URL.split('?')[0]
    const authToken = TURSO_URL.match(/[?&]authToken=([^&]*)/)?.[1] || undefined
    const adapter = new PrismaLibSQL({ url, authToken })
    return new PrismaClient({ adapter })
  }
  return new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL || 'file:/home/z/my-project/db/smoid.db' },
    },
  })
}

const prisma = createPrismaClient()

// Password hashing using Node's built-in scrypt
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function main() {
  console.log('🌱 Seeding SMO database...')

  // ---- Users ----
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smo.com' },
    update: { role: 'TECHNICIAN' },
    create: {
      email: 'admin@smo.com',
      name: 'Administrator',
      password: hashPassword('admin123'),
      role: 'TECHNICIAN',
      phone: '081200000001',
      department: 'IT Operations',
    },
  })

  const technician = await prisma.user.upsert({
    where: { email: 'teknisi@smo.com' },
    update: {},
    create: {
      email: 'teknisi@smo.com',
      name: 'Budi Santoso',
      password: hashPassword('teknisi123'),
      role: 'TECHNICIAN',
      phone: '081200000002',
      department: 'Maintenance',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@smo.com' },
    update: {},
    create: {
      email: 'user@smo.com',
      name: 'Siti Rahma',
      password: hashPassword('user123'),
      role: 'USER',
      phone: '081200000003',
      department: 'Marketing',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'andreas@smo.com' },
    update: {},
    create: {
      email: 'andreas@smo.com',
      name: 'Andreas Wijaya',
      password: hashPassword('user123'),
      role: 'USER',
      phone: '081200000004',
      department: 'Finance',
    },
  })

  console.log('✅ Users created:', [admin, technician, user, user2].map(u => `${u.email} (${u.role})`).join(', '))

  // ---- Categories ----
  const categories = [
    { name: 'Listrik', icon: 'Zap' },
    { name: 'AC / Pendingin', icon: 'Wind' },
    { name: 'Perpipaan', icon: 'Droplets' },
    { name: 'Furnitur', icon: 'Armchair' },
    { name: 'Jaringan / Internet', icon: 'Wifi' },
    { name: 'Keamanan', icon: 'ShieldCheck' },
    { name: 'Saniter / Toilet', icon: 'Bath' },
    { name: 'Lainnya', icon: 'Wrench' },
  ]

  const categoryRecords = []
  for (const c of categories) {
    const rec = await prisma.category.upsert({
      where: { name: c.name },
      update: { icon: c.icon },
      create: c,
    })
    categoryRecords.push(rec)
  }
  console.log('✅ Categories:', categoryRecords.length)

  // ---- Locations ----
  const locations = [
    { name: 'Ruang Server Utama', building: 'Gedung A', floor: 'Lt. 1', description: 'Datacenter utama, akses terbatas' },
    { name: 'Open Space Marketing', building: 'Gedung A', floor: 'Lt. 2', description: 'Area kerja tim marketing' },
    { name: 'Ruang Rapat Eksekutif', building: 'Gedung A', floor: 'Lt. 3', description: 'Ruang rapat boardroom' },
    { name: 'Pantry Lt. 2', building: 'Gedung A', floor: 'Lt. 2', description: 'Dapur & pantry karyawan' },
    { name: 'Toilet Pria Lt. 1', building: 'Gedung A', floor: 'Lt. 1', description: 'Toilet umum pria' },
    { name: 'Toilet Wanita Lt. 1', building: 'Gedung A', floor: 'Lt. 1', description: 'Toilet umum wanita' },
    { name: 'Lobi Utama', building: 'Gedung A', floor: 'Lt. 1', description: 'Lobi resepsionis' },
    { name: 'Ruang Finance', building: 'Gedung B', floor: 'Lt. 2', description: 'Kantor tim finance' },
    { name: 'Ruang HRD', building: 'Gedung B', floor: 'Lt. 2', description: 'Kantor HRD' },
    { name: 'Parkir Basement', building: 'Gedung B', floor: 'Basement', description: 'Area parkir bawah tanah' },
    { name: 'Ruang Server Backup', building: 'Gedung B', floor: 'Lt. 1', description: 'Server cadangan & jaringan' },
    { name: 'Koridor Lt. 3 Gedung B', building: 'Gedung B', floor: 'Lt. 3', description: 'Koridor umum' },
  ]

  const locationRecords = []
  for (const l of locations) {
    const rec = await prisma.location.create({ data: l })
    locationRecords.push(rec)
  }
  console.log('✅ Locations:', locationRecords.length)

  // ---- Reports ----
  const reportsData = [
    {
      title: 'AC tidak dingin di Ruang Server',
      description: 'AC split di ruang server utama mati total sejak pagi. Suhu ruangan naik ke 30°C, berbahaya untuk server. Mohon segera ditindaklanjuti.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      categoryName: 'AC / Pendingin',
      locationName: 'Ruang Server Utama',
      reporterEmail: 'admin@smo.com',
      assigneeEmail: 'teknisi@smo.com',
      resolution: 'Tim maintenance sudah cek, refrigerant habis. Sudah isi ulang, menunggu stabilisasi suhu.',
    },
    {
      title: 'Lampu mati di Open Space Marketing',
      description: '3 titik lampu LED mati di area kerja marketing. Mengganggu produktivitas tim.',
      status: 'PENDING',
      priority: 'MEDIUM',
      categoryName: 'Listrik',
      locationName: 'Open Space Marketing',
      reporterEmail: 'user@smo.com',
    },
    {
      title: 'Kran air bocor di Pantry Lt. 2',
      description: 'Kran air panas bocor terus-menerus, air menetes ke lantai. Bahaya licin & boros air.',
      status: 'RESOLVED',
      priority: 'HIGH',
      categoryName: 'Perpipaan',
      locationName: 'Pantry Lt. 2',
      reporterEmail: 'andreas@smo.com',
      assigneeEmail: 'teknisi@smo.com',
      resolution: 'Sudah ganti seal kran & cek tekanan. Tidak ada kebocoran lagi.',
    },
    {
      title: 'Jaringan internet lambat di Finance',
      description: 'Akses internet sangat lambat sejak 2 hari lalu. VPN sering disconnect. Menghambat transaksi.',
      status: 'PENDING',
      priority: 'HIGH',
      categoryName: 'Jaringan / Internet',
      locationName: 'Ruang Finance',
      reporterEmail: 'andreas@smo.com',
    },
    {
      title: 'Kursi rodi pecah di Ruang Rapat',
      description: 'Salah satu kursi rodi di ruang rapat eksekutif roda-nya patah. Bahaya untuk dipakai.',
      status: 'CLOSED',
      priority: 'LOW',
      categoryName: 'Furnitur',
      locationName: 'Ruang Rapat Eksekutif',
      reporterEmail: 'admin@smo.com',
      assigneeEmail: 'teknisi@smo.com',
      resolution: 'Kursi sudah diganti dengan unit baru. Kursi lama dibuang.',
    },
    {
      title: 'Door lock rusak di Toilet Pria Lt. 1',
      description: 'Gagang pintu toilet patah, sulit dibuka dari dalam. Pernah ada karyawan terjebak.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      categoryName: 'Keamanan',
      locationName: 'Toilet Pria Lt. 1',
      reporterEmail: 'user@smo.com',
      assigneeEmail: 'teknisi@smo.com',
      resolution: 'Sudah order sparepart, menunggu pengiriman 2 hari.',
    },
    {
      title: 'WC tersumbat di Toilet Wanita',
      description: 'Salah satu kloset tersumbat, air meluap. Mohon segera ditangani karena bau & kotor.',
      status: 'PENDING',
      priority: 'URGENT',
      categoryName: 'Saniter / Toilet',
      locationName: 'Toilet Wanita Lt. 1',
      reporterEmail: 'user@smo.com',
    },
    {
      title: 'Lampu koridor redup Lt. 3',
      description: 'Lampu koridor gedung B lt 3 sangat redup, takut digunakan jam malam.',
      status: 'PENDING',
      priority: 'MEDIUM',
      categoryName: 'Listrik',
      locationName: 'Koridor Lt. 3 Gedung B',
      reporterEmail: 'andreas@smo.com',
    },
    {
      title: 'Sistem alarm parkir tidak aktif',
      description: 'Alarm keamanan area parkir basement tidak berbunyi saat diuji. Cukup mengkhawatirkan.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      categoryName: 'Keamanan',
      locationName: 'Parkir Basement',
      reporterEmail: 'admin@smo.com',
      assigneeEmail: 'teknisi@smo.com',
      resolution: 'Vendor alarm sudah survey, menunggu penggantian sensor.',
    },
    {
      title: 'Stop kontak mati di Ruang HRD',
      description: '2 stop kontak di ruang HRD tidak mengalir listrik. Tidak bisa charge laptop.',
      status: 'RESOLVED',
      priority: 'LOW',
      categoryName: 'Listrik',
      locationName: 'Ruang HRD',
      reporterEmail: 'andreas@smo.com',
      assigneeEmail: 'teknisi@smo.com',
      resolution: 'Sudah ganti MCB & cek wiring. Semua stop kontak berfungsi normal.',
    },
    {
      title: 'AC berisik di Ruang Server Backup',
      description: 'AC di server backup menimbulkan suara aneh, takut kompresor akan rusak total.',
      status: 'PENDING',
      priority: 'MEDIUM',
      categoryName: 'AC / Pendingin',
      locationName: 'Ruang Server Backup',
      reporterEmail: 'admin@smo.com',
    },
    {
      title: 'Meja kerja gores di Marketing',
      description: 'Permukaan meja kerja marketing tergores cukup dalam, mohon di-upkeep atau diganti.',
      status: 'CLOSED',
      priority: 'LOW',
      categoryName: 'Furnitur',
      locationName: 'Open Space Marketing',
      reporterEmail: 'user@smo.com',
      assigneeEmail: 'teknisi@smo.com',
      resolution: 'Sudah diamplas & dilapisi ulang. Kondisi kembali baik.',
    },
  ]

  for (const r of reportsData) {
    const category = categoryRecords.find(c => c.name === r.categoryName)!
    const location = locationRecords.find(l => l.name === r.locationName)!
    const reporter = [admin, technician, user, user2].find(u => u.email === r.reporterEmail)!
    const assignee = r.assigneeEmail
      ? [admin, technician, user, user2].find(u => u.email === r.assigneeEmail)!
      : null

    const report = await prisma.report.create({
      data: {
        title: r.title,
        description: r.description,
        status: r.status,
        priority: r.priority,
        resolution: r.resolution || null,
        locationId: location.id,
        categoryId: category.id,
        reporterId: reporter.id,
        assigneeId: assignee?.id || null,
      },
    })

    // History: created
    await prisma.reportHistory.create({
      data: {
        reportId: report.id,
        userId: reporter.id,
        action: 'CREATED',
        message: `Laporan dibuat oleh ${reporter.name}`,
      },
    })

    if (assignee) {
      await prisma.reportHistory.create({
        data: {
          reportId: report.id,
          userId: admin.id,
          action: 'ASSIGNED',
          message: `Ditugaskan kepada ${assignee.name}`,
          newValue: assignee.name,
        },
      })
    }

    if (r.status === 'IN_PROGRESS') {
      await prisma.reportHistory.create({
        data: {
          reportId: report.id,
          userId: assignee?.id || admin.id,
          action: 'STATUS_CHANGED',
          message: 'Status diperbarui ke Sedang Dikerjakan',
          previousValue: 'PENDING',
          newValue: 'IN_PROGRESS',
        },
      })
    }

    if (r.status === 'RESOLVED' || r.status === 'CLOSED') {
      await prisma.reportHistory.create({
        data: {
          reportId: report.id,
          userId: assignee?.id || admin.id,
          action: 'STATUS_CHANGED',
          message: `Status diperbarui ke ${r.status === 'RESOLVED' ? 'Selesai' : 'Ditutup'}`,
          previousValue: 'IN_PROGRESS',
          newValue: r.status,
        },
      })
    }
  }

  console.log('✅ Reports created:', reportsData.length)
  console.log('🎉 Seed complete!')
  console.log('\n📋 Login credentials:')
  console.log('  Admin      → admin@smo.com / admin123')
  console.log('  Teknisi    → teknisi@smo.com / teknisi123')
  console.log('  Karyawan   → user@smo.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
