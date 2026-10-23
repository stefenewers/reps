import type { DemoViewProps } from '@/components/demos/demo-player'
import type { VisualState } from '@/lib/demos/visual-state'

/** Spatial views share labels and motion but draw the actual structure each
 * algorithm changes: links, tree edges, stack frames, frontier or timeline. */
export default function StructureView({ state }: DemoViewProps<VisualState>) {
  const graph = state.nodes && state.nodes.length > 0
  const node = (id: string) => state.nodes?.find((n) => n.id === id)
  const maxY = Math.max(150, ...(state.nodes ?? []).map((n) => n.y + 35))
  const min = Math.min(0, ...(state.intervals ?? []).map((x) => x[0]))
  const span = Math.max(1, ...(state.intervals ?? []).map((x) => x[1] - min))
  return (
    <div className="flex flex-col gap-4" data-testid={`visual-${state.kind}`}>
      {graph && (
        <div className="overflow-x-auto rounded-xl bg-surface p-2">
          <svg viewBox={`0 0 640 ${maxY}`} role="img" aria-label={`${state.kind}: current nodes and references`} className="w-full min-w-[360px]">
            {(state.edges ?? []).map(([a, b], i) => {
              const from = node(a),
                to = node(b)
              if (!from || !to) return null
              const dx = to.x - from.x,
                dy = to.y - from.y,
                len = Math.hypot(dx, dy) || 1,
                ux = dx / len,
                uy = dy / len,
                x = to.x - ux * 24,
                y = to.y - uy * 24
              return (
                <g key={`${a}-${b}-${i}`} stroke="var(--ink-2)" strokeWidth="1.5">
                  <line x1={from.x + ux * 24} y1={from.y + uy * 24} x2={x} y2={y} />
                  <path d={`M ${x - ux * 9 - uy * 4} ${y - uy * 9 + ux * 4} L ${x} ${y} L ${x - ux * 9 + uy * 4} ${y - uy * 9 - ux * 4}`} fill="none" />
                </g>
              )
            })}
            {state.nodes!.map((n) => (
              <g key={n.id} opacity={n.muted ? 0.45 : 1}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={23}
                  fill={n.active ? 'var(--flame-soft)' : 'var(--bg)'}
                  stroke={n.active ? 'var(--flame)' : 'var(--line-strong)'}
                  strokeWidth="2"
                />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fill="var(--ink)" fontSize={n.value.length > 10 ? '8' : '12'}>
                  {n.value}
                </text>
                <text x={n.x} y={n.y + 38} textAnchor="middle" fill="var(--muted)" fontSize="10">
                  {Object.entries(state.pointers ?? {})
                    .filter(([, v]) => v !== null && String(v) === n.id)
                    .map(([k]) => k)
                    .join(' / ')}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
      {state.kind === 'array' || state.kind === 'heap' ? (
        <ol className="flex flex-wrap gap-2" aria-label="Backing array">
          {state.values.map((v, i) => (
            <li
              key={i}
              className={`min-w-12 rounded-lg border p-2 text-center ${state.discarded?.includes(i) ? 'border-line opacity-30' : state.active?.includes(i) ? 'border-flame bg-flame-soft' : 'border-line bg-surface'}`}
            >
              <span className="num text-sm font-semibold">{v}</span>
              <span className="mt-1 block text-[10px] text-muted">[{i}]</span>
              <span className="mt-1 block text-[10px] text-learn">
                {Object.entries(state.pointers ?? {})
                  .filter(([, n]) => n === i)
                  .map(([label]) => label)
                  .join(' / ')}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      {state.pointers && (
        <p className="num text-xs text-muted">
          {Object.entries(state.pointers)
            .map(([k, v]) => `${k}=${v ?? 'None'}`)
            .join(' · ')}
        </p>
      )}
      {state.frames && (
        <div>
          <p className="label">Call stack · newest frame first</p>
          <ol className="mt-2 flex flex-col gap-1">
            {[...state.frames].reverse().map((f, i) => (
              <li key={i} className={`rounded-lg border px-3 py-2 font-mono text-sm ${i === 0 ? 'border-flame bg-flame-soft' : 'border-line bg-surface'}`}>
                {f}
              </li>
            ))}
          </ol>
          {!state.frames.length && <p className="mt-1 text-sm text-muted">Stack empty</p>}
        </div>
      )}
      {state.frontier && (
        <div>
          <p className="label">{state.kind === 'decisions' ? 'Current path' : 'Frontier · next item first'}</p>
          <p className="num mt-1 rounded-lg bg-surface p-3 text-sm">[{state.frontier.join(', ')}]</p>
        </div>
      )}
      {state.visited && (
        <div>
          <p className="label">Visited</p>
          <p className="num mt-1 text-sm">{state.visited.join(' → ') || 'None yet'}</p>
        </div>
      )}
      {state.table && (
        <div>
          <p className="label">{state.kind === 'dp' ? 'Memo / table' : state.kind === 'graph' ? 'Adjacency list' : 'Merged so far'}</p>
          <ol className="mt-2 flex flex-wrap gap-2">
            {state.table.map((v, i) => (
              <li key={i} className="rounded-lg border border-line px-3 py-2 font-mono text-xs">
                {state.kind === 'dp' ? `${i}: ` : ''}
                {v}
              </li>
            ))}
          </ol>
        </div>
      )}
      {state.intervals && (
        <div className="rounded-xl bg-surface p-3">
          <p className="label mb-3">Timeline</p>
          {state.intervals.map(([a, b], i) => (
            <div key={i} className="relative mb-3 h-8 border-b border-line">
              <div
                className="absolute top-0 h-7 min-w-1 rounded bg-learn-soft text-center text-xs leading-7 text-learn"
                style={{ left: `${((a - min) / span) * 90}%`, width: `${Math.max(1, ((b - a) / span) * 90)}%` }}
              >
                [{a}, {b}]
              </div>
            </div>
          ))}
        </div>
      )}
      {state.result && (
        <div className="rounded-lg border border-line p-3">
          <p className="label">Result so far</p>
          <p className="num mt-1 break-words text-sm">{state.result.join(' · ')}</p>
        </div>
      )}
    </div>
  )
}
