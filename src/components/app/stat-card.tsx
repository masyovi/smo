'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: 'emerald' | 'amber' | 'blue' | 'red' | 'slate' | 'purple'
  sub?: string
  className?: string
}

const toneMap: Record<
  NonNullable<StatCardProps['tone']>,
  { iconBg: string; iconFg: string }
> = {
  emerald: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
    iconFg: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
    iconFg: 'text-amber-600 dark:text-amber-400',
  },
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-950/50',
    iconFg: 'text-blue-600 dark:text-blue-400',
  },
  red: {
    iconBg: 'bg-red-100 dark:bg-red-950/50',
    iconFg: 'text-red-600 dark:text-red-400',
  },
  slate: {
    iconBg: 'bg-slate-100 dark:bg-slate-800/50',
    iconFg: 'text-slate-600 dark:text-slate-300',
  },
  purple: {
    iconBg: 'bg-purple-100 dark:bg-purple-950/50',
    iconFg: 'text-purple-600 dark:text-purple-400',
  },
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'emerald',
  sub,
  className,
}: StatCardProps) {
  const t = toneMap[tone]
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex items-center gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            t.iconBg
          )}
        >
          <Icon className={cn('size-5', t.iconFg)} />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-2xl font-semibold tabular-nums leading-none">
            {value}
          </span>
          <span className="text-muted-foreground text-xs sm:text-sm">
            {label}
          </span>
          {sub && (
            <span className="text-muted-foreground/80 text-[11px]">{sub}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
