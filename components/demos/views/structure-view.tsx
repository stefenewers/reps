import type { ReactNode } from 'react'
import ArrayView, { type ArrayPointer } from '@/components/demos/array-view'
import type { DemoViewProps } from '@/components/demos/demo-player'
import { treeEdges, treeNodes, type VisualNode, type VisualState } from '@/lib/demos/visual-state'

/**
 * Spatial views share labels and motion but draw the actual structure each
 * algorithm changes: cells and a gliding window, links, tree edges, stack
 * frames, the frontier, the DP table or the timeline. Colour is state:
 * flame = acting now, learn = in play, pass = settled, grey = ruled out.
 */

const POINTER_TONE: Record<string, ArrayPointer['tone']> = { left: 'learn', lo: 'learn', prev: 'ink', right: 'flame', hi: 'flame', mid: 'cold', curr: 'flame', next: 'learn' }

function Label({ children }: { children: ReactNode }) {
  return <p className="label mb-2">{children}</p>
}

/** Node-link drawing for lists, trees, graphs, decision trees and heaps. */
function Graph({ state, nodes, edges }: { state: VisualState; nodes: VisualNode[]; edges: [string, string][] }) {
  const node = (id: string) => nodes.find((n) => n.id === id)
  const maxY = Math.max(150, ...nodes.map((n) => n.y + 40))
  const visited = new Set((state.visited ?? []).map(String))
  const active = new Set(nodes.filter((n) => n.active).map((n) => n.id))
  const pointersAt = (id: string) =>
    Object.entries(state.pointers ?? {})
      .filter(([, v]) => v !== null && String(v) === id)
      .map(([k]) => k)
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 640 ${maxY}`} role="img" aria-label={`${state.kind}: current nodes and references`} className="w-full min-w-[340px]">
        <defs>
          <marker id={`arrow-${state.kind}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--ink-2)" />
          </marker>
        </defs>
        {edges.map(([a, b], i) => {
          const from = node(a),
            to = node(b)
          if (!from || !to) return null
          const dx = to.x - from.x,
            dy = to.y - from.y,
            len = Math.hypot(dx, dy) || 1,
            ux = dx / len,
            uy = dy / len
          const hot = active.has(b) || active.has(a)
          return (
            <line
              key={`${a}-${b}-${i}`}
              className="svg-edge"
              x1={from.x + ux * 25}
              y1={from.y + uy * 25}
              x2={to.x - ux * 27}
              y2={to.y - uy * 27}
              stroke={hot ? 'var(--flame)' : 'var(--line-strong)'}
              strokeWidth={hot ? 2.5 : 2}
              markerEnd={state.kind === 'links' || state.kind === 'graph' ? `url(#arrow-${state.kind})` : undefined}
            />
          )
        })}
        {nodes.map((n) => {
          const on = n.active
          const seen = !on && (visited.has(n.id) || visited.has(n.value))
          const labels = pointersAt(n.id)
          return (
            <g key={n.id} className="svg-node" opacity={n.muted ? 0.35 : 1}>
              {on && <circle className="node-halo" cx={n.x} cy={n.y} r={25} fill="none" stroke="var(--flame)" strokeWidth="3" />}
              <circle
                cx={n.x}
                cy={n.y}
                r={24}
                style={{
                  fill: on ? 'var(--flame-soft)' : seen ? 'var(--pass-soft)' : 'var(--bg)',
                  stroke: on ? 'var(--flame)' : seen ? 'var(--pass)' : 'var(--line-strong)'
                }}
                strokeWidth={on ? 3 : 2}
              />
              <text x={n.x} y={n.y + 4.5} textAnchor="middle" style={{ fill: 'var(--ink)' }} fontSize={n.value.length > 10 ? 8 : 13} fontWeight={650}>
                {n.value}
              </text>
              {labels.length > 0 && (
                <g>
                  <rect x={n.x - 6 - labels.join(' / ').length * 3.3} y={n.y + 30} width={12 + labels.join(' / ').length * 6.6} height={17} rx={6} fill="var(--ink)" />
                  <text x={n.x} y={n.y + 42} textAnchor="middle" fill="#fff" fontSize="10.5" fontWeight={700}>
                    {labels.join(' / ')}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function StructureView({ state }: DemoViewProps<VisualState>) {
  const graph = state.nodes && state.nodes.length > 0
  const min = Math.min(0, ...(state.intervals ?? []).map((x) => x[0]))
  const max = Math.max(1, ...(state.intervals ?? []).map((x) => x[1]))
  const span = Math.max(1, max - min)

  // Arrays and heaps: pointers by name, a live region when there is one, the acting cell hot.
  const ptrs = Object.entries(state.pointers ?? {})
    .filter((e): e is [string, number] => typeof e[1] === 'number')
    .map(([name, index]) => ({ name, index, tone: POINTER_TONE[name] ?? 'ink' }))
  const p = state.pointers ?? {}
  const active = state.active ?? []
  const contiguous = active.length > 1 && active.every((v, i) => i === 0 || v === active[i - 1] + 1)
  const region: [number, number] | null =
    typeof p.lo === 'number' && typeof p.hi === 'number'
      ? [p.lo, p.hi]
      : typeof p.left === 'number' && typeof p.right === 'number' && p.right >= p.left
        ? [p.left, p.right]
        : contiguous
          ? [active[0], active[active.length - 1]]
          : null
  const hot = typeof p.mid === 'number' ? [p.mid] : region ? [] : active
  // A DP table fills left to right: the newest filled cell is the one being decided.
  const filled = (state.table ?? []).map((v) => v !== '—' && v !== '')
  const newest = filled.lastIndexOf(true)

  return (
    <div className="flex flex-col gap-5" data-testid={`visual-${state.kind}`}>
      {state.kind === 'heap' && state.values.length > 0 && (
        <div>
          <Label>As a tree · the smallest on top</Label>
          <Graph
            state={state}
            nodes={treeNodes(state.values.map(Number)).map((n, i) => ({ ...n, value: String(state.values[i]), x: 20 + n.x, active: active.includes(i) }))}
            edges={treeEdges(state.values.length)}
          />
        </div>
      )}
      {graph && <Graph state={state} nodes={state.nodes!} edges={state.edges ?? []} />}

      {state.kind === 'array' || state.kind === 'heap' ? (
        <div>
          {state.kind === 'heap' && <Label>Backing array</Label>}
          <ArrayView
            values={state.values}
            pointers={ptrs}
            region={region}
            ruledOut={state.discarded ?? []}
            highlight={hot}
            regionLabel={region ? (typeof p.lo === 'number' ? 'Search space: the answer can only be in here' : 'The window') : undefined}
          />
        </div>
      ) : null}

      {state.frames && (
        <div>
          <Label>Call stack · newest frame on top</Label>
          <ol className="flex flex-col gap-1.5">
            {[...state.frames].reverse().map((f, i) => (
              <li
                key={state.frames!.length - i}
                className={`frame flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-mono text-[13px] ${
                  i === 0 ? 'bg-flame-soft shadow-[inset_0_0_0_2px_var(--flame)]' : 'bg-bg shadow-[inset_0_0_0_1px_var(--line-strong)]'
                }`}
                style={{ marginLeft: `${Math.min(i, 6) * 6}px`, opacity: Math.max(0.55, 1 - i * 0.1) }}
              >
                <span className="num text-[10.5px] font-semibold text-muted">#{state.frames!.length - i}</span>
                {f}
                {i === 0 && <span className="tag tag-flame ml-auto">running</span>}
              </li>
            ))}
          </ol>
          {!state.frames.length && <p className="rounded-xl bg-surface px-3.5 py-2.5 text-[13px] text-muted">Stack empty: every call has returned.</p>}
        </div>
      )}

      {state.frontier && (
        <div>
          <Label>{state.kind === 'decisions' ? 'Current path' : 'Frontier · next out first'}</Label>
          <ol className="flex flex-wrap items-center gap-1.5">
            {state.frontier.length === 0 && <li className="text-[13px] text-muted">Empty</li>}
            {state.frontier.map((v, i) => (
              <li key={`${i}-${v}`} className="chip-in flex items-center gap-1.5">
                {state.kind === 'decisions' && i > 0 && (
                  <span aria-hidden="true" className="text-faint">
                    →
                  </span>
                )}
                <span
                  className={`num rounded-lg px-3 py-1.5 text-[13.5px] font-semibold ${
                    i === 0 && state.kind !== 'decisions' ? 'bg-learn text-white' : 'bg-learn-soft text-ink shadow-[inset_0_0_0_1px_rgba(47,111,219,0.35)]'
                  }`}
                >
                  {v}
                </span>
                {i === 0 && state.kind !== 'decisions' && <span className="text-[11px] font-semibold text-learn">next</span>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {state.visited && (
        <div>
          <Label>Visited, in order</Label>
          <ol className="flex flex-wrap items-center gap-1.5">
            {state.visited.length === 0 && <li className="text-[13px] text-muted">None yet</li>}
            {state.visited.map((v, i) => (
              <li key={`${i}-${v}`} className="chip-in flex items-center gap-1.5">
                {i > 0 && (
                  <span aria-hidden="true" className="text-faint">
                    →
                  </span>
                )}
                <span className="num rounded-lg bg-pass-soft px-2.5 py-1 text-[13px] font-semibold text-green-ink">{v}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {state.table &&
        (state.kind === 'dp' ? (
          <div>
            <Label>Table · each cell built from cells already filled</Label>
            <div className="overflow-x-auto">
              <ol className="inline-flex gap-1.5">
                {state.table.map((v, i) => (
                  <li key={i} className="flex flex-col items-center gap-1">
                    <span className="mono text-[10.5px] text-faint">{i}</span>
                    <span
                      className="cell !h-11 !w-12 !text-[14px]"
                      data-state={i === newest ? 'hot' : filled[i] ? 'region' : 'ruled-out'}
                      style={!filled[i] ? { textDecoration: 'none' } : undefined}
                    >
                      {v}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <div>
            <Label>{state.kind === 'graph' ? 'Adjacency list' : 'Merged so far'}</Label>
            <ol className={state.kind === 'graph' ? 'grid gap-1 sm:grid-cols-2' : 'flex flex-wrap gap-1.5'}>
              {state.table.map((v, i) => (
                <li key={i} className="chip-in rounded-lg bg-bg px-3 py-1.5 font-mono text-[12.5px] shadow-[inset_0_0_0_1px_var(--line-strong)]">
                  {v}
                </li>
              ))}
            </ol>
          </div>
        ))}

      {state.intervals && (
        <div className="rounded-xl bg-bg p-3 shadow-[inset_0_0_0_1px_var(--line)]">
          <Label>Timeline</Label>
          <div className="flex flex-col gap-2">
            {state.intervals.map(([a, b], i) => (
              <div key={i} className="relative h-8">
                <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line" />
                <div
                  className="absolute top-0 h-8 min-w-6 rounded-lg bg-learn-soft text-center text-[12px] font-semibold leading-8 text-learn shadow-[inset_0_0_0_1.5px_var(--learn)] transition-all duration-300"
                  style={{ left: `${((a - min) / span) * 92}%`, width: `${Math.max(4, ((b - a) / span) * 92)}%` }}
                >
                  [{a}, {b}]
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10.5px] text-faint" aria-hidden="true">
            <span>{min}</span>
            <span>{Math.round((min + max) / 2)}</span>
            <span>{max}</span>
          </div>
        </div>
      )}

      {state.result && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-pass-soft px-3.5 py-2.5">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-green-ink">Result so far</p>
          <p className="num break-words text-[14px] font-semibold text-ink">{state.result.join(' · ')}</p>
        </div>
      )}
    </div>
  )
}
