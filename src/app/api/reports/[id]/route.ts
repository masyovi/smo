import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canUpdateStatus, canAssign, canManageAll, isReadOnly } from '@/lib/auth'
import { STATUS_CONFIG } from '@/lib/types'
import type { ReportStatus, ReportPriority } from '@/lib/types'
import { buildReportIncludes } from '../route'

// GET /api/reports/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const report = await db.report.findUnique({
    where: { id },
    include: {
      ...(await buildReportIncludes()),
      history: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  })
  if (!report) {
    return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 })
  }
  // Authorization: USER can only view their own.
  // GUEST and TECH/ADMIN can view ANY report (read-only browsing).
  if (user.role === 'USER' && report.reporterId !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return NextResponse.json(report)
}

// PATCH /api/reports/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Guests are read-only viewers — they cannot edit anything.
  if (isReadOnly(user)) {
    return NextResponse.json(
      {
        error:
          'Akses tamu hanya untuk melihat. Silakan login sebagai teknisi untuk mengelola.',
      },
      { status: 403 }
    )
  }
  const { id } = await params
  const report = await db.report.findUnique({ where: { id } })
  if (!report) {
    return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 })
  }

  // Authorization
  const isOwner = report.reporterId === user.id
  const canEditMeta = isOwner && report.status === 'PENDING'
  const canEditStatusFields = canUpdateStatus(user)

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  const historyEntries: Array<{
    action: string
    message: string
    previousValue?: string
    newValue?: string
  }> = []

  // title/description: owner + PENDING only
  if (body.title !== undefined) {
    if (!canEditMeta) {
      return NextResponse.json(
        { error: 'Anda tidak dapat mengubah judul laporan' },
        { status: 403 }
      )
    }
    const newTitle = (body.title as string).toString().trim()
    if (newTitle.length < 3) {
      return NextResponse.json(
        { error: 'Judul minimal 3 karakter' },
        { status: 400 }
      )
    }
    updates.title = newTitle
  }
  if (body.description !== undefined) {
    if (!canEditMeta) {
      return NextResponse.json(
        { error: 'Anda tidak dapat mengubah deskripsi laporan' },
        { status: 403 }
      )
    }
    const newDesc = (body.description as string).toString().trim()
    if (newDesc.length < 10) {
      return NextResponse.json(
        { error: 'Deskripsi minimal 10 karakter' },
        { status: 400 }
      )
    }
    updates.description = newDesc
  }
  if (body.locationId !== undefined) {
    if (!canEditMeta) {
      return NextResponse.json(
        { error: 'Anda tidak dapat mengubah lokasi laporan' },
        { status: 403 }
      )
    }
    updates.locationId = body.locationId
  }
  if (body.categoryId !== undefined) {
    if (!canEditMeta) {
      return NextResponse.json(
        { error: 'Anda tidak dapat mengubah kategori laporan' },
        { status: 403 }
      )
    }
    updates.categoryId = body.categoryId
  }

  // status / priority / resolution / assignee — TECH/ADMIN only (assignee ADMIN only)
  if (body.status !== undefined && canEditStatusFields) {
    const newStatus = (body.status as string).toString() as ReportStatus
    if (!STATUS_CONFIG[newStatus]) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }
    if (newStatus !== report.status) {
      const oldStatusLabel = STATUS_CONFIG[report.status as ReportStatus]?.label ?? report.status
      const newStatusLabel = STATUS_CONFIG[newStatus].label
      updates.status = newStatus

      // RESOLVED specific history
      if (newStatus === 'RESOLVED') {
        historyEntries.push({
          action: 'RESOLVED',
          message: `Laporan diselesaikan`,
          previousValue: report.status,
          newValue: newStatus,
        })
      }
      // REOPENED if going from RESOLVED/CLOSED -> PENDING/IN_PROGRESS
      if (
        (report.status === 'RESOLVED' || report.status === 'CLOSED') &&
        (newStatus === 'PENDING' || newStatus === 'IN_PROGRESS')
      ) {
        historyEntries.push({
          action: 'REOPENED',
          message: `Laporan dibuka kembali ke ${newStatusLabel}`,
          previousValue: report.status,
          newValue: newStatus,
        })
      }
      historyEntries.push({
        action: 'STATUS_CHANGED',
        message: `Status diubah dari ${oldStatusLabel} ke ${newStatusLabel}`,
        previousValue: report.status,
        newValue: newStatus,
      })
    }
  }
  if (body.priority !== undefined && canEditStatusFields) {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    const newPriority = (body.priority as string).toString() as ReportPriority
    if (!validPriorities.includes(newPriority)) {
      return NextResponse.json({ error: 'Prioritas tidak valid' }, { status: 400 })
    }
    if (newPriority !== report.priority) {
      historyEntries.push({
        action: 'PRIORITY_CHANGED',
        message: `Prioritas diubah dari ${report.priority} ke ${newPriority}`,
        previousValue: report.priority,
        newValue: newPriority,
      })
      updates.priority = newPriority
    }
  }
  if (body.resolution !== undefined && canEditStatusFields) {
    const newResolution = (body.resolution as string).toString().trim()
    if (newResolution !== (report.resolution ?? '')) {
      updates.resolution = newResolution || null
      historyEntries.push({
        action: 'COMMENTED',
        message: newResolution
          ? `Memperbarui resolusi: ${newResolution.slice(0, 80)}`
          : 'Menghapus resolusi',
      })
    }
  }
  if (body.assigneeId !== undefined && canAssign(user)) {
    const newAssigneeId = (body.assigneeId as string | null) ?? null
    if (newAssigneeId !== report.assigneeId) {
      let assigneeName = 'Tidak ditugaskan'
      if (newAssigneeId) {
        const a = await db.user.findUnique({ where: { id: newAssigneeId } })
        if (!a) {
          return NextResponse.json({ error: 'Teknisi tidak ditemukan' }, { status: 400 })
        }
        assigneeName = a.name
      }
      const prevAssignee = report.assigneeId
        ? (await db.user.findUnique({ where: { id: report.assigneeId } }))?.name ?? 'Dihapus'
        : 'Tidak ditugaskan'
      historyEntries.push({
        action: 'ASSIGNED',
        message: `Penugasan diubah dari ${prevAssignee} ke ${assigneeName}`,
        previousValue: report.assigneeId ?? '',
        newValue: newAssigneeId ?? '',
      })
      updates.assigneeId = newAssigneeId
    }
  } else if (body.assigneeId !== undefined && !canAssign(user)) {
    return NextResponse.json(
      { error: 'Hanya admin yang dapat menugaskan laporan' },
      { status: 403 }
    )
  }

  if (Object.keys(updates).length === 0 && historyEntries.length === 0) {
    return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 400 })
  }

  updates.updatedAt = new Date()

  const updated = await db.report.update({
    where: { id },
    data: {
      ...updates,
      history:
        historyEntries.length > 0
          ? {
              create: historyEntries.map((h) => ({
                userId: user.id,
                action: h.action,
                message: h.message,
                previousValue: h.previousValue ?? null,
                newValue: h.newValue ?? null,
              })),
            }
          : undefined,
    },
    include: {
      ...(await buildReportIncludes()),
      history: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/reports/[id] — Teknisi/Admin only (full management)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Guests are read-only viewers — they cannot delete anything.
  if (isReadOnly(user)) {
    return NextResponse.json(
      {
        error:
          'Akses tamu hanya untuk melihat. Silakan login sebagai teknisi untuk mengelola.',
      },
      { status: 403 }
    )
  }
  // Per SMO policy: only Teknisi (and ADMIN for backward-compat) can manage everything.
  if (!canManageAll(user)) {
    return NextResponse.json(
      { error: 'Hanya teknisi yang dapat menghapus laporan' },
      { status: 403 }
    )
  }
  const { id } = await params
  const report = await db.report.findUnique({ where: { id } })
  if (!report) {
    return NextResponse.json({ error: 'Laporan tidak ditemukan' }, { status: 404 })
  }
  await db.report.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
