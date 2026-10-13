// Tone system for SMO navigation icons.
//
// Each AppView gets an accent "tone" so the sidebar / mobile nav feels
// colorful and scannable instead of monochrome. The tone controls the
// gradient background used on the active icon container, the tinted
// background used on hover/idle, and the icon/text colors.
//
// IMPORTANT: All Tailwind class strings below are FULL literals so the
// Tailwind v4 JIT can detect them. Do NOT build class names dynamically.

import type { AppView } from '@/lib/store'

export type NavTone =
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'violet'
  | 'teal'
  | 'rose'
  | 'cyan'
  | 'orange'
  | 'slate'

// Map every AppView to a tone. Report-detail/new share the reports tone
// (sky) so the experience feels continuous while browsing a single report.
export const NAV_TONES: Record<AppView, NavTone> = {
  dashboard: 'emerald',
  reports: 'sky',
  'report-detail': 'sky',
  'report-new': 'emerald',
  notes: 'amber',
  schedules: 'violet',
  locations: 'teal',
  categories: 'rose',
  users: 'cyan',
  profile: 'orange',
}

// Full literal Tailwind class fragments per tone.
//
// `tintHover` and `iconHover` are pre-built with the `group-hover:` variant
// prefix so they can be used as static literals inside a `group`-wrapped
// parent element.
export const TONE_CLASSES: Record<
  NavTone,
  {
    gradient: string // active icon container gradient bg + white text
    tint: string // inactive/hover tinted bg (no variant prefix)
    tintHover: string // tinted bg applied on group-hover
    iconActive: string // icon color when active (on gradient → white)
    iconIdle: string // icon color when inactive
    iconHover: string // icon color applied on group-hover
    dot: string // small accent dot
    ring: string // ring color
    text: string // text color for active label
  }
> = {
  emerald: {
    gradient:
      'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/30',
    tint: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    tintHover: 'group-hover:bg-emerald-500/10 group-hover:dark:bg-emerald-500/15',
    iconActive: 'text-white',
    iconIdle: 'text-emerald-600 dark:text-emerald-400',
    iconHover:
      'group-hover:text-emerald-600 group-hover:dark:text-emerald-400',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  sky: {
    gradient:
      'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/30',
    tint: 'bg-sky-500/10 dark:bg-sky-500/15',
    tintHover: 'group-hover:bg-sky-500/10 group-hover:dark:bg-sky-500/15',
    iconActive: 'text-white',
    iconIdle: 'text-sky-600 dark:text-sky-400',
    iconHover: 'group-hover:text-sky-600 group-hover:dark:text-sky-400',
    dot: 'bg-sky-500',
    ring: 'ring-sky-500/30',
    text: 'text-sky-700 dark:text-sky-300',
  },
  amber: {
    gradient:
      'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30',
    tint: 'bg-amber-500/10 dark:bg-amber-500/15',
    tintHover: 'group-hover:bg-amber-500/10 group-hover:dark:bg-amber-500/15',
    iconActive: 'text-white',
    iconIdle: 'text-amber-600 dark:text-amber-400',
    iconHover:
      'group-hover:text-amber-600 group-hover:dark:text-amber-400',
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/30',
    text: 'text-amber-700 dark:text-amber-300',
  },
  violet: {
    gradient:
      'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-500/30',
    tint: 'bg-violet-500/10 dark:bg-violet-500/15',
    tintHover: 'group-hover:bg-violet-500/10 group-hover:dark:bg-violet-500/15',
    iconActive: 'text-white',
    iconIdle: 'text-violet-600 dark:text-violet-400',
    iconHover:
      'group-hover:text-violet-600 group-hover:dark:text-violet-400',
    dot: 'bg-violet-500',
    ring: 'ring-violet-500/30',
    text: 'text-violet-700 dark:text-violet-300',
  },
  teal: {
    gradient:
      'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-sm shadow-teal-500/30',
    tint: 'bg-teal-500/10 dark:bg-teal-500/15',
    tintHover: 'group-hover:bg-teal-500/10 group-hover:dark:bg-teal-500/15',
    iconActive: 'text-white',
    iconIdle: 'text-teal-600 dark:text-teal-400',
    iconHover: 'group-hover:text-teal-600 group-hover:dark:text-teal-400',
    dot: 'bg-teal-500',
    ring: 'ring-teal-500/30',
    text: 'text-teal-700 dark:text-teal-300',
  },
  rose: {
    gradient:
      'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/30',
    tint: 'bg-rose-500/10 dark:bg-rose-500/15',
    tintHover: 'group-hover:bg-rose-500/10 group-hover:dark:bg-rose-500/15',
    iconActive: 'text-white',
    iconIdle: 'text-rose-600 dark:text-rose-400',
    iconHover: 'group-hover:text-rose-600 group-hover:dark:text-rose-400',
    dot: 'bg-rose-500',
    ring: 'ring-rose-500/30',
    text: 'text-rose-700 dark:text-rose-300',
  },
  cyan: {
    gradient:
      'bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-sm shadow-cyan-500/30',
    tint: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    tintHover: 'group-hover:bg-cyan-500/10 group-hover:dark:bg-cyan-500/15',
    iconActive: 'text-white',
    iconIdle: 'text-cyan-600 dark:text-cyan-400',
    iconHover: 'group-hover:text-cyan-600 group-hover:dark:text-cyan-400',
    dot: 'bg-cyan-500',
    ring: 'ring-cyan-500/30',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  orange: {
    gradient:
      'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/30',
    tint: 'bg-orange-500/10 dark:bg-orange-500/15',
    tintHover: 'group-hover:bg-orange-500/10 group-hover:dark:bg-orange-500/15',
    iconActive: 'text-white',
    iconIdle: 'text-orange-600 dark:text-orange-400',
    iconHover:
      'group-hover:text-orange-600 group-hover:dark:text-orange-400',
    dot: 'bg-orange-500',
    ring: 'ring-orange-500/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
  slate: {
    gradient:
      'bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-sm shadow-slate-500/30',
    tint: 'bg-slate-500/10 dark:bg-slate-400/15',
    tintHover: 'group-hover:bg-slate-500/10 group-hover:dark:bg-slate-400/15',
    iconActive: 'text-white',
    iconIdle: 'text-slate-600 dark:text-slate-300',
    iconHover:
      'group-hover:text-slate-600 group-hover:dark:text-slate-300',
    dot: 'bg-slate-500',
    ring: 'ring-slate-500/30',
    text: 'text-slate-700 dark:text-slate-200',
  },
}
