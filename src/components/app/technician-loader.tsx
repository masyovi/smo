'use client'

import { motion } from 'framer-motion'
import { Cog, HardHat, Wrench } from 'lucide-react'

/**
 * TechnicianLoader — a "teknisi at work" loading animation.
 * A technician hard-hat badge sits in the center with a swinging wrench
 * and a counter-rotating gear behind, framed by a pulsing emerald glow.
 * No "Memuat" text — pure animation.
 */
export function TechnicianLoader() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6">
      {/* Pulsing emerald glow behind everything */}
      <motion.div
        className="pointer-events-none absolute size-64 rounded-full bg-emerald-500/25 blur-3xl"
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Secondary teal glow */}
      <motion.div
        className="pointer-events-none absolute size-44 rounded-full bg-teal-400/20 blur-2xl"
        animate={{ scale: [1.05, 0.92, 1.05], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex size-32 items-center justify-center">
        {/* Outer spinning gear (background) */}
        <motion.div
          className="absolute text-emerald-500/25"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <Cog className="size-28" strokeWidth={1.5} />
        </motion.div>

        {/* Inner counter-spinning gear */}
        <motion.div
          className="absolute text-teal-500/30"
          style={{ translate: '-40% 40%' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
          <Cog className="size-14" strokeWidth={1.75} />
        </motion.div>

        {/* Rotating dashed ring */}
        <motion.div
          className="absolute size-24 rounded-full border-[2.5px] border-dashed border-emerald-400/40"
          style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Technician hard-hat badge — bobs gently */}
        <motion.div
          className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/50 ring-2 ring-emerald-300/40"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <HardHat className="size-8" strokeWidth={2.1} />
        </motion.div>

        {/* Swinging wrench (working motion) */}
        <motion.div
          className="absolute -right-1 -top-1 text-emerald-600"
          style={{ originX: '0.5px 0.5px' }}
          animate={{ rotate: [0, 28, -22, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Wrench className="size-7" strokeWidth={2.2} />
        </motion.div>
      </div>
    </div>
  )
}
