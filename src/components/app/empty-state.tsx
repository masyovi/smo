'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-8 text-center',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Soft glow behind */}
        <span
          className="pointer-events-none absolute -z-10 size-20 rounded-full bg-emerald-400/20 blur-2xl dark:bg-emerald-500/20"
          aria-hidden
        />
        <div
          className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 ring-1 ring-emerald-500/20 dark:from-emerald-500/20 dark:to-teal-500/25"
        >
          <Icon className="size-7 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  )
}
