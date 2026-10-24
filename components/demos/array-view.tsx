import type { CSSProperties } from 'react'

/**
 * A row of cells with pointers above, a live region (window, search space) as
 * one band behind them, and cells marked hot, ruled out or found. Pointers and
 * the band are positioned by index, so they glide to their new place when the
 * state changes: the learner sees the window slide and the pointers move.
 * Shared by two pointers, sliding window, binary search and heaps.
 */
export interface ArrayPointer {
  name: string
  index: number
  tone?: 'learn' | 'flame' | 'cold' | 'ink'
}

const TONE: Record<NonNullable<ArrayPointer['tone']>, string> = {
  learn: 'var(--learn)',
  flame: 'var(--flame)',
  cold: 'var(--cold)',
  ink: 'var(--ink)'
}

/** One cell step: cell width plus the gap (see .cells in learning.css). */
const STEP = 'calc(var(--cell) + var(--gap))'

export default function ArrayView({
  values,
  pointers = [],
  region,
  ruledOut = [],
  highlight = [],
  regionLabel,
  found = []
}: {
  values: (number | string)[]
  pointers?: ArrayPointer[]
  /** [from, to] inclusive: the live region (window, search space). */
  region?: [number, number] | null
  ruledOut?: number[]
  highlight?: number[]
  regionLabel?: string
  found?: number[]
}) {
  const inRegion = (i: number) => Boolean(region && i >= region[0] && i <= region[1])
  const live = pointers.filter((p) => p.index >= 0 && p.index < values.length)
  // Pointers on the same cell stack upward, so none hides another.
  const stackAt = (p: ArrayPointer) => live.filter((q) => q.index === p.index).indexOf(p)
  const rows = Math.max(1, ...live.map((p) => stackAt(p) + 1))
  const validRegion = region && region[1] >= region[0] && region[0] >= 0 && region[1] < values.length ? region : null
  return (
    <div className="overflow-x-auto pb-2" data-testid="array-view">
      <div className="cells inline-flex min-w-full flex-col">
        {/* Pointers: positioned by index, so they travel. */}
        <div className="relative" style={{ height: `${(rows - 1) * 22 + 30}px` }} aria-hidden="true">
          {live.map((p) => (
            <span
              key={p.name}
              className="ptr"
              style={{ transform: `translate(calc(${p.index} * ${STEP}), ${(rows - 1 - stackAt(p)) * 22}px)` } as CSSProperties}
              data-pointer={p.name}
            >
              <span className="ptr-label" style={{ background: TONE[p.tone ?? 'ink'] }}>
                {p.name}
              </span>
              {stackAt(p) === 0 && <span className="ptr-stem" style={{ background: TONE[p.tone ?? 'ink'] }} />}
            </span>
          ))}
        </div>
        {/* Cells, with the live region as one gliding band behind them. */}
        <div className="relative flex gap-[var(--gap)] pt-[5px] pb-[5px]">
          <span
            aria-hidden="true"
            className="cells-band"
            style={{
              left: validRegion ? `calc(${validRegion[0]} * ${STEP} - 5px)` : '0px',
              width: validRegion ? `calc(${validRegion[1] - validRegion[0] + 1} * ${STEP} - var(--gap) + 10px)` : '0px',
              top: 0,
              opacity: validRegion ? 1 : 0
            }}
          />
          {values.map((v, i) => {
            const out = ruledOut.includes(i)
            const hit = found.includes(i)
            const state = hit ? 'found' : out ? 'ruled-out' : highlight.includes(i) ? 'hot' : inRegion(i) ? 'region' : 'idle'
            return (
              <div key={i} className="cell relative" data-cell={i} data-state={state === 'hot' && inRegion(i) ? 'hot' : state}>
                {v}
              </div>
            )
          })}
        </div>
        {/* Indexes */}
        <div className="mt-1 flex gap-[var(--gap)]">
          {values.map((_, i) => (
            <span key={i} className="mono shrink-0 text-center text-[10.5px] text-faint" style={{ width: 'var(--cell)' }}>
              {i}
            </span>
          ))}
        </div>
        {regionLabel && <p className="mt-2 text-[12.5px] font-medium text-learn">{regionLabel}</p>}
      </div>
    </div>
  )
}
