'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from '@/lib/types'
import type { ReportStatus } from '@/lib/types'

export function StatusBadge({
  status,
  className,
  withDot = true,
}: {
  status: ReportStatus
  className?: string
  withDot?: boolean
}) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  return (
    <Badge variant="outline" className={cn(cfg.badge, 'gap-1.5', className)}>
      {withDot && <span className={cn('size-1.5 rounded-full', cfg.dot)} />}
      {cfg.label}
    </Badge>
  )
}
