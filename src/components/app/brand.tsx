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
          'flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20',
          s.box
        )}
        aria-hidden
      >
        <ShieldCheck className={s.icon} strokeWidth={2.2} />
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
        'flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm',
        className
      )}
      aria-hidden
    >
      <Icon className="size-1/2" strokeWidth={2} />
    </div>
  )
}
