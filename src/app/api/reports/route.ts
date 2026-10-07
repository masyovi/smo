import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, isReadOnly } from '@/lib/auth'
import type { ReportStatus, ReportPriority } from '@/lib/types'

// Shared select for relations to keep payloads lean and avoid leaking password
const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  department: true,
} as const

export async function buildReportIncludes() {
  return {
    location: true,
    category: true,
    reporter: { select: userSelect },
    assignee: { select: userSelect },
  } as const
}

export type ReportListItem = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  imageUrl: string | null
  resolution: string | null
  locationId: string
  categoryId: string
  reporterId: string
  assigneeId: string | null
  createdAt: string
  updatedAt: string
  location: { id: string; name: string; building: string; floor: string | null } | null
  category: { id: string; name: string; icon: string | null } | null
  reporter: {
    id: string
    name: string
    email: string
    role: string
    phone: string | null
    department: string | null
  } | null
  assignee: {
    id: string
    name: string
    email: string
    role: string
    phone: string | null
    department: string | null
  } | null
}

// GET /api/reports — scoped by role
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const statusParam = url.searchParams.get('status') || 'ALL'
  const priorityParam = url.searchParams.get('priority') || 'ALL'
  const search = url.searchParams.get('search') || ''
  const pageParam = Number(url.searchParams.get('page') || '1')
  const limitParam = Number(url.searchParams.get('limit') || '20')
  const page = Math.max(1, pageParam)
  const limit = Math.min(100, Math.max(1, limitParam))

  const where: Record<string, unknown> = { AND: [] as unknown[] }

  // Role-based scoping:
  // - GUEST (read-only) and TECHNICIAN/ADMIN (managers) see ALL reports
  // - USER sees only their own reports (as reporter or assignee)
  if (user.role === 'USER') {
    ;(where.AND as unknown[]).push({
      OR: [{ reporterId: user.id }, { assigneeId: user.id }],
    })
  }
  // GUEST, TECHNICIAN, ADMIN can see all reports

  if (statusParam !== 'ALL') {
    ;(where.AND as unknown[]).push({ status: statusParam as ReportStatus })
  }
  if (priorityParam !== 'ALL') {
    ;(where.AND as unknown[]).push({ priority: priorityParam as ReportPriority })
  }
  if (search.trim()) {
    ;(where.AND as unknown[]).push({
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ],
    })
  }

  const [total, data] = await Promise.all([
    db.report.count({ where }),
    db.report.findMany({
      where,
      include: await buildReportIncludes(),
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({
    data: data as unknown as ReportListItem[],
    total,
    page,
    limit,
  })
}

// POST /api/reports — create new report
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Guests are read-only viewers — they cannot create reports.
  if (isReadOnly(user)) {
    return NextResponse.json(
      {
        error:
          'Akses tamu hanya untuk melihat. Silakan login sebagai teknisi untuk mengelola.',
      },
      { status: 403 }
    )
  }
  const body = await req.json()
  const title = (body?.title ?? '').toString().trim()
  const description = (body?.description ?? '').toString().trim()
  const locationId = (body?.locationId ?? '').toString()
  const categoryId = (body?.categoryId ?? '').toString()
  const priority = (body?.priority ?? 'MEDIUM').toString() as ReportPriority
  const imageUrl = body?.imageUrl ? (body.imageUrl as string).toString() : null

  if (!title || title.length < 3) {
    return NextResponse.json(
      { error: 'Judul minimal 3 karakter' },
      { status: 400 }
    )
  }
  if (!description || description.length < 10) {
    return NextResponse.json(
      { error: 'Deskripsi minimal 10 karakter' },
      { status: 400 }
    )
  }
  if (!locationId || !categoryId) {
    return NextResponse.json(
      { error: 'Lokasi dan kategori wajib dipilih' },
      { status: 400 }
    )
  }

  const [location, category] = await Promise.all([
    db.location.findUnique({ where: { id: locationId } }),
    db.category.findUnique({ where: { id: categoryId } }),
  ])
  if (!location) {
    return NextResponse.json({ error: 'Lokasi tidak valid' }, { status: 400 })
  }
  if (!category) {
    return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 })
  }

  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  if (!validPriorities.includes(priority)) {
    return NextResponse.json({ error: 'Prioritas tidak valid' }, { status: 400 })
  }

  const report = await db.report.create({
    data: {
      title,
      description,
      status: 'PENDING',
      priority,
      imageUrl,
      locationId,
      categoryId,
      reporterId: user.id,
      history: {
        create: {
          userId: user.id,
          action: 'CREATED',
          message: `Laporan dibuat oleh ${user.name}`,
        },
      },
    },
    include: await buildReportIncludes(),
  })

  return NextResponse.json(report, { status: 201 })
}
