'use client'

import * as React from 'react'
import {
  AlertTriangle,
  Bug,
  Building2,
  Cpu,
  Droplet,
  Flame,
  Hammer,
  Lightbulb,
  Lock,
  Plug,
  Power,
  ShowerHead,
  Snowflake,
  Trash2,
  TreePine,
  Users,
  Wind,
  Wrench,
  Zap,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  AlertTriangle,
  Bug,
  Building2,
  Cpu,
  Droplet,
  Flame,
  Hammer,
  Lightbulb,
  Lock,
  Plug,
  Power,
  ShowerHead,
  Snowflake,
  Trash2,
  TreePine,
  Users,
  Wind,
  Wrench,
  Zap,
}

export const CATEGORY_ICON_NAMES = Object.keys(ICON_MAP)

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null
  className?: string
}) {
  const Icon = (name && ICON_MAP[name]) || HelpCircle
  return <Icon className={className} />
}

export const CATEGORY_ICON_OPTIONS = CATEGORY_ICON_NAMES.map((n) => ({
  label: n,
  value: n,
}))
