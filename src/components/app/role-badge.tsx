'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ROLE_CONFIG } from '@/lib/types'
import type { UserRole } from '@/lib/types'

export function RoleBadge({
  role,
  className,
}: {
  role: UserRole
  className?: string
}) {
  const cfg = ROLE_CONFIG[role]
  if (!cfg) return null
  return (
    <Badge variant="outline" className={cn(cfg.badge, className)}>
      {cfg.label}
    </Badge>
  )
}
