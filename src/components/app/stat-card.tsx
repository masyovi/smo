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
  { bar: string; glow: string; iconBg: string; iconFg: string; value: string }
> = {
  emerald: {
    bar: 'bg-emerald-500',
    glow: 'bg-emerald-400/25',
    iconBg:
      'bg-gradient-to-br from-emerald-500/15 to-teal-500/20 dark:from-emerald-500/20 dark:to-teal-500/25',
    iconFg: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    bar: 'bg-amber-500',
    glow: 'bg-amber-400/25',
    iconBg:
      'bg-gradient-to-br from-amber-500/15 to-orange-500/20 dark:from-amber-500/20 dark:to-orange-500/25',
    iconFg: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
  },
  blue: {
    bar: 'bg-blue-500',
    glow: 'bg-blue-400/25',
    iconBg:
      'bg-gradient-to-br from-sky-500/15 to-blue-500/20 dark:from-sky-500/20 dark:to-blue-500/25',
    iconFg: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
  },
  red: {
    bar: 'bg-red-500',
    glow: 'bg-red-400/25',
    iconBg:
      'bg-gradient-to-br from-red-500/15 to-rose-500/20 dark:from-red-500/20 dark:to-rose-500/25',
    iconFg: 'text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
  },
  slate: {
    bar: 'bg-slate-400',
    glow: 'bg-slate-300/25',
    iconBg:
      'bg-gradient-to-br from-slate-500/15 to-slate-600/20 dark:from-slate-400/15 dark:to-slate-500/20',
    iconFg: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-700 dark:text-slate-200',
  },
  purple: {
    bar: 'bg-purple-500',
    glow: 'bg-purple-400/25',
    iconBg:
      'bg-gradient-to-br from-violet-500/15 to-purple-500/20 dark:from-violet-500/20 dark:to-purple-500/25',
    iconFg: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
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
    <Card
      className={cn(
        'group relative overflow-hidden border-border/50 py-0 transition-all hover:border-border hover:shadow-md hover:shadow-foreground/5',
        className
      )}
    >
      {/* Top accent bar */}
      <div className={cn('absolute inset-x-0 top-0 h-[3px]', t.bar)} />
      {/* Corner glow */}
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 size-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100',
          t.glow
        )}
      />
      <CardContent className="relative flex flex-col gap-2 px-4 py-3 sm:px-4">
        <div className="flex items-center justify-between">
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <div
            className={cn(
              'flex size-7 items-center justify-center rounded-lg',
              t.iconBg
            )}
          >
            <Icon className={cn('size-3.5', t.iconFg)} />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'text-2xl font-bold tabular-nums leading-none tracking-tight',
              t.value
            )}
          >
            {value}
          </span>
          {sub && (
            <span className="truncate text-[10px] text-muted-foreground/80">
              {sub}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
