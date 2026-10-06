'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PRIORITY_CONFIG } from '@/lib/types'
import type { ReportPriority } from '@/lib/types'

export function PriorityBadge({
  priority,
  className,
}: {
  priority: ReportPriority
  className?: string
}) {
  const cfg = PRIORITY_CONFIG[priority]
  if (!cfg) return null
  return (
    <Badge variant="outline" className={cn(cfg.badge, className)}>
      {cfg.label}
    </Badge>
  )
}
