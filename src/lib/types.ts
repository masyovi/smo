// Shared types & constants for SMO

export type ReportStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'USER' | 'GUEST'

export type ReportAction =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'ASSIGNED'
  | 'COMMENTED'
  | 'RESOLVED'
  | 'REOPENED'

export const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; color: string; badge: string; dot: string; step: number }
> = {
  PENDING: {
    label: 'Menunggu',
    color: 'amber',
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
    dot: 'bg-amber-500',
    step: 0,
  },
  IN_PROGRESS: {
    label: 'Sedang Dikerjakan',
    color: 'blue',
    badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900',
    dot: 'bg-blue-500',
    step: 1,
  },
  RESOLVED: {
    label: 'Selesai',
    color: 'emerald',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
    dot: 'bg-emerald-500',
    step: 2,
  },
  CLOSED: {
    label: 'Ditutup',
    color: 'slate',
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
    dot: 'bg-slate-500',
    step: 3,
  },
}

export const PRIORITY_CONFIG: Record<
  ReportPriority,
  { label: string; badge: string; ring: string }
> = {
  LOW: {
    label: 'Rendah',
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
    ring: 'ring-slate-300',
  },
  MEDIUM: {
    label: 'Sedang',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-900',
    ring: 'ring-yellow-300',
  },
  HIGH: {
    label: 'Tinggi',
    badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900',
    ring: 'ring-orange-300',
  },
  URGENT: {
    label: 'Darurat',
    badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900',
    ring: 'ring-red-300',
  },
}

export const ROLE_CONFIG: Record<UserRole, { label: string; badge: string }> = {
  ADMIN: {
    label: 'Administrator',
    badge: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900',
  },
  TECHNICIAN: {
    label: 'Teknisi',
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-900',
  },
  USER: {
    label: 'Karyawan',
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
  },
  GUEST: {
    label: 'Tamu',
    badge: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900',
  },
}

export const STATUS_LIST: ReportStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
export const PRIORITY_LIST: ReportPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export const ACTION_LABELS: Record<ReportAction, string> = {
  CREATED: 'Laporan Dibuat',
  STATUS_CHANGED: 'Status Diubah',
  PRIORITY_CHANGED: 'Prioritas Diubah',
  ASSIGNED: 'Penugasan',
  COMMENTED: 'Komentar',
  RESOLVED: 'Diselesaikan',
  REOPENED: 'Dibuka Kembali',
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'baru saja'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} menit lalu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} hari lalu`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month} bulan lalu`
  return `${Math.floor(month / 12)} tahun lalu`
}
