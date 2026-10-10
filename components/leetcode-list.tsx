'use client'

import Link from 'next/link'
import { lcMeta, useSolveLog } from '@/components/use-solve-log'
import { IconCheck, IconExternal, IconPlay } from '@/components/icons'
import { DAYS } from '@/data/curriculum'
import { leetcodeFor, unaidedRate, type SolveResult } from '@/lib/solve-log'
import type { DayModule, LeetcodeItem } from '@/lib/types'

/**
 * The day's LeetCode problems: new ones for the pattern just laddered, spaced
 * re-solves of earlier ones, and any redo that is due. They are solved on
 * LeetCode; here you get the links, how to approach each, and a one-tap record
 * of how it went, which feeds the solve log.
 */

const ROUND = { review1: '1 of 3', review2: '2 of 3 (about 10 days on)', review3: '3 of 3 (about a month on)' } as const

function how(item: LeetcodeItem) {
  if (item.type === 'redo') return 'Redo · you needed help last time · cold, about 15 min'
  if (item.type !== 'new') return `Re-solve ${ROUND[item.type]} · cold, about 15 min`
  return item.mode === 'study-first' ? 'New · watch the walkthrough first, then write it from blank' : 'New · attempt for up to 30 min, then study'
}

export default function LeetcodeList({ day, heading = 'On LeetCode today' }: { day: DayModule; heading?: string }) {
  const { entries, save, remove, today } = useSolveLog()
  const items = leetcodeFor(day, entries, DAYS, lcMeta)
  if (!items.length) return null
  const byId = new Map(entries.map((e) => [e.id, e]))
  const done = items.filter((i) => byId.has(i.solveId)).length
  const rate = unaidedRate(entries)
  const set = (i: (typeof items)[number], result: SolveResult) => {
    const prev = byId.get(i.solveId)
    if (prev?.result === result) return void remove(i.solveId)
    // Keep any details already added in the solve log; only the result changes.
    void save({ ...(prev ?? { id: i.solveId, lc: i.lc, title: i.title, kind: i.type, date: today }), result })
  }

  return (
    <section aria-labelledby="lc-heading" className="panel p-6" data-testid="leetcode-list">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="lc-heading" className="h2">
          {heading}
        </h2>
        <p className="num text-[12.5px] text-muted">
          {done} of {items.length} logged
          {rate.rate !== null && ` · ${Math.round(rate.rate * 100)}% of re-solves unaided`}
        </p>
      </div>
      <p className="mt-1 max-w-[640px] text-[13.5px] leading-relaxed text-muted">
        Solve these on LeetCode, from a blank editor, saying your approach out loud, then log how it went. A re-solve you needed help on comes back on your next working day.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-line">
        {items.map((i) => {
          const r = byId.get(i.solveId)?.result
          return (
            <li key={i.solveId} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span aria-hidden="true" className={`grid size-[22px] shrink-0 place-items-center rounded-md ${r ? (r === 'unaided' ? 'text-pass' : 'text-amber') : 'text-faint shadow-[inset_0_0_0_1px_var(--line-strong)]'}`}>
                {r && <IconCheck size={12} strokeWidth={2.2} />}
              </span>
              <div className="min-w-0 flex-1">
                <a href={i.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 text-[14.5px] font-medium text-ink hover:underline">
                  <span className="num text-muted">LC {i.lc}</span>
                  <span className="truncate">{i.title}</span>
                  <IconExternal size={12} className="shrink-0 text-muted" />
                </a>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {how(i)} · {i.difficulty} · {i.pattern}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {i.video && (
                  <a href={i.video} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                    <IconPlay size={10} /> Walkthrough
                  </a>
                )}
                <button type="button" aria-pressed={r === 'unaided'} onClick={() => set(i, 'unaided')} className={`btn btn-sm ${r === 'unaided' ? 'btn-primary' : ''}`}>
                  Unaided
                </button>
                <button type="button" aria-pressed={r === 'hinted' || r === 'failed'} onClick={() => set(i, 'hinted')} className={`btn btn-sm ${r === 'hinted' || r === 'failed' ? 'btn-primary' : ''}`}>
                  Needed help
                </button>
                {r && (
                  <Link href={`/log?edit=${encodeURIComponent(i.solveId)}`} className="btn btn-ghost btn-sm">
                    Add notes
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
