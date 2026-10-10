'use client'

import { useReps } from '@/components/reps-provider'
import { IconCheck, IconExternal, IconPlay } from '@/components/icons'
import type { LeetcodeItem } from '@/lib/types'

/**
 * The day's LeetCode problems: new ones for the pattern just laddered, and
 * spaced re-solves of earlier ones. They are solved on LeetCode; here you get
 * the links, how to approach each, and a one-tap record of how it went.
 */

const ROUND = { review1: '1 of 3', review2: '2 of 3 (about 10 days on)', review3: '3 of 3 (about a month on)' } as const

export type LcResult = 'unaided' | 'helped'

export function lcKey(item: Pick<LeetcodeItem, 'lc' | 'type'>) {
  return `lc:${item.lc}:${item.type}`
}

function how(item: LeetcodeItem) {
  if (item.type !== 'new') return `Re-solve ${ROUND[item.type]} · cold, about 15 min`
  return item.mode === 'study-first' ? 'New · watch the walkthrough first, then write it from blank' : 'New · attempt for up to 30 min, then study'
}

export default function LeetcodeList({ items, heading = 'On LeetCode today' }: { items: LeetcodeItem[]; heading?: string }) {
  const { repo, version } = useReps()
  void version // re-render when synced state changes
  if (!items.length) return null
  const result = (i: LeetcodeItem) => (repo.state(lcKey(i)) as { result?: LcResult } | undefined)?.result
  const done = items.filter((i) => result(i)).length
  const set = (i: LeetcodeItem, r: LcResult) => void repo.setState(lcKey(i), result(i) === r ? {} : { result: r, at: new Date().toISOString() })

  return (
    <section aria-labelledby="lc-heading" className="panel p-6" data-testid="leetcode-list">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="lc-heading" className="h2">
          {heading}
        </h2>
        <p className="num text-[12.5px] text-muted">
          {done} of {items.length} logged
        </p>
      </div>
      <p className="mt-1 max-w-[620px] text-[13.5px] leading-relaxed text-muted">
        Solve these on LeetCode, from a blank editor, saying your approach out loud. Then log how it went: a re-solve you needed help on should be redone tomorrow.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-line">
        {items.map((i) => {
          const r = result(i)
          return (
            <li key={lcKey(i)} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span aria-hidden="true" className={`grid size-[22px] shrink-0 place-items-center rounded-md ${r ? 'text-pass' : 'text-faint shadow-[inset_0_0_0_1px_var(--line-strong)]'}`}>
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
                <button type="button" aria-pressed={r === 'helped'} onClick={() => set(i, 'helped')} className={`btn btn-sm ${r === 'helped' ? 'btn-primary' : ''}`}>
                  Needed help
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
