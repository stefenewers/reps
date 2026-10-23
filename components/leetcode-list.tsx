'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { learnAdvice } from '@/components/building-toward'
import { useReps } from '@/components/reps-provider'
import { useTargets, type TargetState } from '@/components/use-targets'
import { lcMeta, useSolveLog } from '@/components/use-solve-log'
import { IconCheck, IconExternal, IconPlay } from '@/components/icons'
import PracticeSite from '@/components/practice-site'
import { practiceSite } from '@/data/problem-urls'
import { DAYS, EXERCISE_BY_ID } from '@/data/curriculum'
import { repairReps } from '@/lib/bridges'
import { createSession } from '@/lib/sessions'
import { leetcodeFor, unaidedRate, type SolveResult } from '@/lib/solve-log'
import { outsideCredit } from '@/lib/course/credit'
import type { DayModule, LeetcodeItem } from '@/lib/types'

/**
 * The day's LeetCode problems: new ones (each reached through its bridge),
 * spaced re-solves of earlier ones, and any redo that is due. They are solved
 * on LeetCode; here you get the links, whether the problem's building blocks
 * are in place, how to approach it, and a one-tap record of how it went.
 *
 * A first solve that needed help does not end there: rebuild it from a blank
 * editor, and go back down the ladder to the block that broke.
 */

const ROUND = { review1: '1 of 3', review2: '2 of 3 (about 10 days on)', review3: '3 of 3 (about a month on)' } as const

function how(item: LeetcodeItem & { rebuild?: boolean }) {
  if (item.rebuild) return 'Rebuild · you saw the solution last time · from a blank editor, about 15 min'
  if (item.type === 'redo') return 'Redo · you needed help last time · cold, about 15 min'
  if (item.type !== 'new') return `Re-solve ${ROUND[item.type]} · cold, about 15 min`
  if (item.mode === 'study-first') return 'New · watch the explanation first, then write it from blank'
  return item.mode === 'bridge-first' ? 'New · bridge first, then attempt for up to 30 min' : 'New · attempt for up to 30 min, then study'
}

export default function LeetcodeList({ day, items: given, heading = 'On LeetCode today' }: { day?: DayModule; items?: (LeetcodeItem & { solveId: string; redoDue?: string; rebuild?: boolean })[]; heading?: string }) {
  const { entries, save, remove, today } = useSolveLog()
  const { repo } = useReps()
  const router = useRouter()
  const { byLc, passed } = useTargets()
  const [busy, setBusy] = useState(false)
  // The course passes its own list (lib/course/resolves.ts); the 90-day days build theirs from the calendar.
  const items: (LeetcodeItem & { solveId: string; redoDue?: string; rebuild?: boolean })[] = given ?? (day ? leetcodeFor(day, entries, DAYS, lcMeta) : [])
  if (!items.length) return null
  const byId = new Map(entries.map((e) => [e.id, e]))
  // A rebuild item is done once it has been rebuilt; everything else once it has been logged.
  const done = items.filter((i) => (i.rebuild ? Boolean(byId.get(i.solveId)?.rebuiltOn) : byId.has(i.solveId))).length
  const rate = unaidedRate(entries)
  const set = (i: (typeof items)[number], result: SolveResult) => {
    const prev = byId.get(i.solveId)
    if (prev?.result === result) return void remove(i.solveId)
    // Keep any details already added in the solve log; only the result changes.
    void save({ ...(prev ?? { id: i.solveId, lc: i.lc, title: i.title, kind: i.type, date: today }), result })
  }
  // Down the ladder: redo the reps of one building block, cold, then come back to the problem.
  const repair = async (state: TargetState, block: number) => {
    const { reps } = repairReps(state.target, passed, block)
    if (!reps.length || busy) return
    setBusy(true)
    const s = await createSession(repo, 'repair', `Repair Reps · ${state.target.title}`, reps)
    router.push(`/rep/${reps[0]}?s=${s.id}`)
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
        Solve these on NeetCode, from a blank editor, saying your approach out loud, then log honestly how it went. Unaided and small-hint solves count today; a seen solution counts once you rebuild it from blank on a later day.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-line">
        {items.map((i) => {
          const entry = byId.get(i.solveId)
          const r = entry?.result
          const state = i.type === 'new' ? byLc.get(i.lc) : undefined
          const nextRep = state && !r && state.nextRep ? EXERCISE_BY_ID[state.nextRep] : undefined
          // What the log says, and what it earns (lib/course/credit.ts decides; the copy below says the same thing).
          const credit = entry ? outsideCredit(entry) : null
          const rebuiltToday = Boolean(entry?.rebuiltOn)
          const sawSolution = r === 'solution'
          const notFinished = r === 'failed'
          return (
            <li key={i.solveId} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3" data-testid={`lc-${i.lc}`}>
              <span aria-hidden="true" className={`grid size-[22px] shrink-0 place-items-center rounded-md ${credit ? (credit.evidence === 'outside-hinted' || credit.evidence === 'outside-reconstructed' ? 'text-amber' : 'text-pass') : r ? 'text-repair shadow-[inset_0_0_0_1.5px_var(--repair)]' : 'text-faint shadow-[inset_0_0_0_1px_var(--line-strong)]'}`}>
                {credit && <IconCheck size={12} strokeWidth={2.2} />}
              </span>
              <div className="min-w-0 flex-1 basis-[240px]">
                <a href={i.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 text-[14.5px] font-medium text-ink hover:underline" title={`Practice on ${practiceSite(i.lc)}`}>
                  <span className="num text-muted">LC {i.lc}</span>
                  <span className="truncate">{i.title}</span>
                  <IconExternal size={12} className="shrink-0 text-muted" />
                </a>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {how(i)} · {i.difficulty} · {i.pattern}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-[12px]">
                  <a href={i.url} target="_blank" rel="noreferrer" className="font-medium text-ink-2 hover:underline" data-testid="practice-link">
                    Practice on {practiceSite(i.lc)}
                  </a>
                  <PracticeSite lc={i.lc} />
                </p>
                {state && !r && (
                  <p className="mt-1 text-[12.5px]" data-testid="lc-readiness">
                    {state.ready ? (
                      <span className="inline-flex items-center gap-1 font-medium text-ink-2">
                        <IconCheck size={11} strokeWidth={2.2} className="text-pass" /> Ready: all {state.total} building blocks in place
                      </span>
                    ) : (
                      <>
                        <span className="num font-medium text-ink">
                          {state.readyCount} of {state.total} building blocks ready
                        </span>
                        {nextRep && (
                          <>
                            <span className="text-muted"> · first: </span>
                            <Link href={`/rep/${nextRep.id}`} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                              {nextRep.title}
                            </Link>
                          </>
                        )}
                      </>
                    )}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {i.video && (
                  <a href={i.video} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title={state ? learnAdvice(state.target, state.ready) : 'Only after a real attempt from a blank editor.'}>
                    <IconPlay size={10} /> Walkthrough
                  </a>
                )}
                {i.rebuild ? (
                  <button
                    type="button"
                    aria-pressed={rebuiltToday}
                    disabled={!entry || entry.date >= today}
                    onClick={() => entry && void save({ ...entry, rebuiltOn: entry.rebuiltOn ? undefined : today })}
                    className={`btn btn-sm ${rebuiltToday ? 'btn-primary' : ''}`}
                    data-testid="lc-rebuilt"
                  >
                    {rebuiltToday ? 'Rebuilt from blank' : 'I rebuilt it from blank'}
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-1" role="group" aria-label={`How LC ${i.lc} went`}>
                    {(
                      [
                        ['unaided', 'Unaided'],
                        ['hinted', 'Small hint'],
                        ['solution', 'Saw solution'],
                        ['failed', 'Not finished'],
                      ] as [SolveResult, string][]
                    ).map(([res, label]) => (
                      <button key={res} type="button" aria-pressed={r === res} onClick={() => set(i, res)} className={`btn btn-sm ${r === res ? 'btn-primary' : ''}`} data-testid={`lc-${res}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {r && (
                  <Link href={`/log?edit=${encodeURIComponent(i.solveId)}`} className="btn btn-ghost btn-sm">
                    Add notes
                  </Link>
                )}
              </div>
              {entry && (
                <p className={`w-full text-[12.5px] leading-relaxed ${credit ? 'text-muted' : 'text-repair'}`} data-testid="lc-outcome">
                  {i.rebuild
                    ? entry.rebuiltOn
                      ? 'Counted: rebuilt from blank after seeing the solution. It comes back cold later; that solve proves it.'
                      : 'Not counted yet. Close the solution, write it again from a blank editor, then mark it rebuilt.'
                    : r === 'unaided'
                      ? i.type === 'new'
                        ? 'Counted. It comes back cold in 3 days.'
                        : 'Counted: a cold re-solve, the strongest evidence an outside problem gives.'
                      : r === 'hinted'
                        ? 'Counted, as assisted. It comes back cold, and that solve is the one that proves it.'
                        : sawSolution
                          ? 'Not counted yet: you saw the solution. Rebuild it from a blank editor on a later day; that rebuild counts.'
                          : notFinished
                            ? 'Not counted. It comes back on your next training day.'
                            : null}
                </p>
              )}
              {state && entry && (sawSolution || notFinished) && !i.rebuild && (
                <div className="w-full rounded-xl bg-surface px-3.5 py-3 text-[13px]" data-testid="lc-rebuild">
                  <p className="font-medium text-ink">Go back down the ladder: which move broke?</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {state.blocks.map((b, k) => (
                      <button key={k} type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void repair(state, k)}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
