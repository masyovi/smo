/**
 * DecorativeBackground — fixed, non-interactive layer behind all app content.
 * Gives SMO a polished "canggih" look: a subtle base gradient, soft emerald/teal
 * glow orbs, and a faint dot-grid pattern. Adapts to light & dark mode.
 */
export function DecorativeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base vertical gradient — top is pure background, fades to a muted tint
          at the bottom for depth. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/60" />

      {/* Soft glow orbs — emerald/teal to match the SMO brand.
          Light mode uses higher opacity so the color reads on a pale base;
          dark mode keeps the orbs vivid but not overpowering. */}
      <div className="absolute -top-40 -right-32 size-[520px] rounded-full bg-emerald-500/25 blur-[140px] dark:bg-emerald-500/25" />
      <div className="absolute top-1/4 -left-48 size-[440px] rounded-full bg-teal-400/25 blur-[120px] dark:bg-teal-500/20" />
      <div className="absolute -bottom-44 right-1/4 size-[500px] rounded-full bg-emerald-400/20 blur-[150px] dark:bg-emerald-400/18" />
      <div className="absolute top-1/2 left-1/2 size-[360px] -translate-x-1/2 rounded-full bg-sky-400/15 blur-[120px] dark:bg-sky-500/12" />

      {/* Faint dot-grid pattern — tech/blueprint feel.
          Darker dots on light mode, lighter dots on dark mode. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.07)_1px,transparent_0)] [background-size:22px_22px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)]" />

      {/* A very subtle top sheen for a "glass" feel. */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
    </div>
  )
}
