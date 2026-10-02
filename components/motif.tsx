import type { CSSProperties, ReactNode } from 'react'

/**
 * The Reps motif: descending bars, one per rep. The logo is three of them; the
 * same shape scales into patterns, empty states and completion moments, so the
 * product stays recognisable without the word "Reps" on screen.
 */

export function RepsBars({ count = 3, width = 28, bar = 4, gap = 3, color = 'currentColor', className = '', style }: { count?: number; width?: number; bar?: number; gap?: number; color?: string; className?: string; style?: CSSProperties }) {
  const h = count * bar + (count - 1) * gap
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} className={className} style={style} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const w = width * (1 - (i / count) * 0.75)
        return <rect key={i} x={0} y={i * (bar + gap)} width={w} height={bar} rx={bar / 2} fill={color} opacity={1 - i * (0.55 / count)} />
      })}
    </svg>
  )
}

/** A faint field of repeated bars, for hero and completion backgrounds. */
export function BarsPattern({ className = '', opacity = 0.06 }: { className?: string; opacity?: number }) {
  return (
    <svg className={`pointer-events-none absolute ${className}`} aria-hidden="true" width="260" height="140" viewBox="0 0 260 140" style={{ opacity }}>
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 3 }, (_, col) => {
          const w = 54 - ((row + col) % 3) * 16
          return <rect key={`${row}-${col}`} x={col * 88} y={row * 15} width={w} height={6} rx={3} fill="currentColor" />
        }),
      )}
    </svg>
  )
}

/** Tiny bespoke empty-state illustration: the bars (or a glyph) in a quiet outlined frame, and a line of copy. */
export function EmptyState({ title, children, glyph }: { title: string; children?: ReactNode; glyph?: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-bg text-ink-2 shadow-[0_0_0_1px_var(--line-strong)]">
        {glyph ?? <RepsBars width={20} bar={3} gap={2.5} />}
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-ink">{title}</p>
        {children && <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{children}</p>}
      </div>
    </div>
  )
}
