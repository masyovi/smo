'use client'

import * as React from 'react'
import { Building2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

type BrandProps = {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact'
  className?: string
}

const sizeMap = {
  sm: { box: 'size-8', icon: 'size-4', text: 'text-base', sub: 'text-[10px]' },
  md: { box: 'size-10', icon: 'size-5', text: 'text-lg', sub: 'text-[11px]' },
  lg: { box: 'size-14', icon: 'size-7', text: 'text-2xl', sub: 'text-xs' },
} as const

export function Brand({
  size = 'md',
  variant = 'default',
  className,
}: BrandProps) {
  const s = sizeMap[size]
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl',
          'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
          'shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400/30',
          s.box
        )}
        aria-hidden
      >
        {/* Subtle inner highlight for a glassy feel */}
        <span
          className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]"
          aria-hidden
        />
        <ShieldCheck className={cn('relative', s.icon)} strokeWidth={2.2} />
      </div>
      {variant !== 'compact' && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-semibold tracking-tight', s.text)}>
            SMO
          </span>
          <span className={cn('text-muted-foreground font-medium', s.sub)}>
            Save My Office
          </span>
        </div>
      )}
    </div>
  )
}

export function BrandMark({
  className,
  icon: Icon = Building2,
}: {
  className?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-xl text-white',
        'bg-gradient-to-br from-emerald-500 to-teal-600',
        'shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400/30',
        className
      )}
      aria-hidden
    >
      {/* Subtle inner highlight */}
      <span
        className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]"
        aria-hidden
      />
      <Icon className="relative size-1/2" strokeWidth={2} />
    </div>
  )
}
