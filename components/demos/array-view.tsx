/**
 * A row of cells with pointers above, a highlighted region, and cells marked as
 * ruled out. Shared by two pointers, sliding window and binary search.
 */
export interface ArrayPointer {
  name: string
  index: number
  tone?: 'learn' | 'flame' | 'cold' | 'ink'
}

const TONE: Record<NonNullable<ArrayPointer['tone']>, string> = { learn: 'bg-learn text-white', flame: 'bg-flame text-white', cold: 'bg-cold text-white', ink: 'bg-ink text-white' }

export default function ArrayView({
  values,
  pointers = [],
  region,
  ruledOut = [],
  highlight = [],
  regionLabel,
  found = [],
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
  return (
    <div className="overflow-x-auto pb-1" data-testid="array-view">
      <div className="inline-flex min-w-full flex-col gap-1.5">
        {/* Pointers above their cells */}
        <div className="flex gap-1.5">
          {values.map((_, i) => (
            <div key={i} className="flex w-11 shrink-0 flex-col items-center gap-0.5">
              {pointers
                .filter((p) => p.index === i)
                .map((p) => (
                  <span key={p.name} className={`rounded-md px-1.5 py-px text-[10.5px] font-semibold ${TONE[p.tone ?? 'ink']} transition-transform duration-300`} data-pointer={p.name}>
                    {p.name}
                  </span>
                ))}
              <span aria-hidden="true" className="h-2 text-[10px] leading-none text-faint">
                {pointers.some((p) => p.index === i) ? '▼' : ''}
              </span>
            </div>
          ))}
        </div>
        {/* Cells */}
        <div className="flex gap-1.5">
          {values.map((v, i) => {
            const out = ruledOut.includes(i)
            const hit = found.includes(i)
            return (
              <div
                key={i}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[15px] font-semibold tabular-nums transition-all duration-300 ${
                  hit ? 'bg-pass text-white' : out ? 'bg-surface-2 text-faint line-through' : highlight.includes(i) ? 'bg-flame-soft text-ink shadow-[inset_0_0_0_2px_var(--flame)]' : inRegion(i) ? 'bg-learn-soft text-ink shadow-[inset_0_0_0_1.5px_var(--learn)]' : 'bg-bg text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                }`}
                data-cell={i}
                data-state={hit ? 'found' : out ? 'ruled-out' : inRegion(i) ? 'region' : 'idle'}
              >
                {v}
              </div>
            )
          })}
        </div>
        {/* Indexes */}
        <div className="flex gap-1.5">
          {values.map((_, i) => (
            <span key={i} className="mono w-11 shrink-0 text-center text-[10.5px] text-faint">
              {i}
            </span>
          ))}
        </div>
        {regionLabel && <p className="mt-1 text-[12px] text-learn">{regionLabel}</p>}
      </div>
    </div>
  )
}
