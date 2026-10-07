'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type BrandProps = {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact'
  className?: string
}

const sizeMap = {
  sm: { box: 'size-8', text: 'text-base', sub: 'text-[10px]' },
  md: { box: 'size-10', text: 'text-lg', sub: 'text-[11px]' },
  lg: { box: 'size-14', text: 'text-2xl', sub: 'text-xs' },
} as const

export function Brand({
  size = 'md',
  variant = 'default',
  className,
}: BrandProps) {
  const s = sizeMap[size]
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* App icon — the user-provided SMO logo image. */}
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-xl',
          'shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30',
          s.box
        )}
        aria-hidden
      >
        <img
          src="/smo-icon.png"
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
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
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-xl',
        'shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30',
        className
      )}
      aria-hidden
    >
      <img
        src="/smo-icon.png"
        alt=""
        className="size-full object-cover"
        draggable={false}
      />
    </div>
  )
}
