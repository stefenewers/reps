'use client'

import Link from 'next/link'
import { Blocks, learnAdvice } from '@/components/building-toward'
import { IconArrowRight, IconCheck, IconExternal, IconPlay } from '@/components/icons'
import { ConceptGlyph } from '@/components/concept-icons'
import { useReps } from '@/components/reps-provider'
import { useTargets, type TargetState } from '@/components/use-targets'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { TARGET_BY_LC } from '@/data/problem-bridges'
import { PROBLEMS } from '@/data/problems'
import { PLAN_UNITS } from '@/data/schedule-90'
import { skillName } from '@/data/skills'
import { shortDate } from '@/lib/dates'

/**
 * Every target problem of the 90-day plan as a destination at the end of a
 * skill graph: its building blocks, which are in place, the bridge reps left,
 * how the first solve went, and where its re-solves stand.
 */
export default function ProblemsView() {
  const { mastery, attempts } = useReps()
  const { states, conversion } = useTargets()
  const outside = PROBLEMS.filter((p) => !TARGET_BY_LC.has(p.number))
  const planned = states.filter((s) => !s.target.whenAhead)
  const ahead = states.filter((s) => s.target.whenAhead)
  const solved = planned.filter((s) => s.first !== null).length
  const ready = planned.filter((s) => s.first === null && s.ready).length

  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-10 sm:px-8">
        <h1 className="display-xl">Problems</h1>
        <p className="mt-2 max-w-[680px] text-[14.5px] leading-relaxed text-muted">
          Each problem is the last step of a short ladder. Its building blocks are moves you can name; when every block is in place, the problem is those moves assembled. If one feels impossible, the missing block is listed here.
        </p>
        <dl className="mt-6 grid max-w-[680px] grid-cols-3 gap-6">
          {[
            [`${solved}`, `of ${planned.length} solved`],
            [`${ready}`, 'ready to attempt'],
            [conversion.rate === null ? '—' : `${Math.round(conversion.rate * 100)}%`, conversion.attempted ? `solved unaided first time (${conversion.converted} of ${conversion.attempted})` : 'target conversion: none attempted yet'],
          ].map(([v, k]) => (
            <div key={k}>
              <dt className="num text-[24px] font-semibold tracking-tight text-ink">{v}</dt>
              <dd className="text-[12.5px] text-muted">{k}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-col gap-10">
          {PLAN_UNITS.map((u, i) => {
            const mine = planned.filter((s) => s.target.unit === u.name)
            if (!mine.length) return null
            return (
              <section key={u.name} aria-labelledby={`u-${i}`}>
                <h2 id={`u-${i}`} className="label mb-3 flex items-center gap-2">
                  <span className="num">{i + 1}</span> {u.name}
                  <span className="font-normal normal-case tracking-normal text-faint">
                    · {mine.filter((s) => s.first !== null).length} of {mine.length} solved
                  </span>
                </h2>
                <ul className="grid gap-3 md:grid-cols-2">
                  {mine.map((s) => (
                    <TargetCard key={s.target.lc} state={s} missing={s.target.prerequisiteSkills.filter((k) => (mastery[k]?.score ?? 0) < 50).slice(0, 3)} />
                  ))}
                </ul>
              </section>
            )
          })}

          {ahead.length > 0 && (
            <section aria-labelledby="u-ahead">
              <h2 id="u-ahead" className="label mb-1">
                When you are ahead
              </h2>
              <p className="mb-3 max-w-[680px] text-[13px] leading-relaxed text-muted">
                These have their bridges ready but do not fit inside the 90 days at the plan’s pace. They are next in, most valuable first, whenever the gauge says you are ahead. Their bridge reps are in the day pages as extras.
              </p>
              <ul className="grid gap-3 md:grid-cols-2">
                {ahead.map((s) => (
                  <TargetCard key={s.target.lc} state={s} missing={[]} />
                ))}
              </ul>
            </section>
          )}

          {outside.length > 0 && (
            <section aria-labelledby="u-out">
              <h2 id="u-out" className="label mb-3">
                Capstones outside the plan
              </h2>
              <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {outside.map((p) => {
                  const done = attempts.some((a) => a.exerciseId === `cap-${p.id}` && a.passed && a.completedAt)
                  return (
                    <li key={p.id}>
                      <Link href={`/rep/cap-${p.id}`} className="card interactive flex items-center gap-3 px-4 py-3 text-[14px]">
                        <span className={`grid size-5 shrink-0 place-items-center rounded-md ${done ? 'text-pass' : 'text-faint shadow-[inset_0_0_0_1px_var(--line-strong)]'}`}>{done && <IconCheck size={12} strokeWidth={2.2} />}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
                        <span className="num text-[12px] text-muted">LC {p.number}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

function TargetCard({ state, missing }: { state: TargetState; missing: string[] }) {
  const { target } = state
  const next = state.nextRep ? EXERCISE_BY_ID[state.nextRep] : undefined
  const done = state.resolves.filter((r) => r.doneOn).length
  const status = state.first === 'unaided' ? 'Solved unaided' : state.first === 'aided' ? 'Solved with help' : state.ready ? 'Ready to attempt' : `${state.readyCount} of ${state.total} blocks ready`
  return (
    <li className="card flex min-w-0 flex-col p-5" data-testid={`target-${target.lc}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl shadow-sm ${state.first ? 'bg-ink text-white' : 'bg-surface-2 text-ink-2'}`}>
          <ConceptGlyph name={target.unit} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-faint">
            LC {target.lc} · {target.source === 'reps' ? 'first solve in Reps' : 'on LeetCode'}
          </p>
          <h3 className="mt-0.5 text-[16px] font-semibold leading-snug tracking-tight">{target.title}</h3>
        </div>
        <a href={state.url} target="_blank" rel="noreferrer" className="icon-btn -mr-1 shrink-0" aria-label={`${target.title} on LeetCode`} title={`LeetCode ${target.lc}`}>
          <IconExternal size={14} />
        </a>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 text-[13.5px] font-medium ${state.first === 'unaided' ? 'text-ink' : 'text-ink-2'}`} data-testid="target-status">
            {state.first === 'unaided' && <IconCheck size={12} strokeWidth={2.2} className="text-pass" />}
            {status}
          </span>
          {state.first === null && !state.ready && (
            <span className="num text-[12px] text-muted">
              {state.repsLeft} rep{state.repsLeft === 1 ? '' : 's'} to go
            </span>
          )}
        </div>
        <span className="mt-2 flex gap-1" role="meter" aria-valuemin={0} aria-valuemax={state.total} aria-valuenow={state.readyCount} aria-label={`${state.readyCount} of ${state.total} building blocks ready`}>
          {state.blocks.map((b, i) => (
            <span key={i} className={`h-[5px] flex-1 rounded-full ${b.ready ? 'bg-accent' : 'bg-ink/[0.08]'}`} />
          ))}
        </span>
      </div>

      <details className="group mt-3" open={state.first === null && !state.ready && state.readyCount > 0}>
        <summary className="cursor-pointer list-none text-[12.5px] text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Show the {state.total} building blocks</span>
          <span className="hidden group-open:inline">Building blocks</span>
        </summary>
        <div className="mt-2">
          <Blocks state={state} dense />
        </div>
      </details>

      {missing.length > 0 && state.first === null && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
          Skills still thin
          {missing.map((k) => (
            <Link key={k} href={`/skills/${k}`} className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-ink-2 transition-colors hover:bg-surface-3">
              {skillName(k)}
            </Link>
          ))}
        </p>
      )}

      {state.first !== null && (
        <p className="num mt-3 text-[12.5px] text-muted">
          Re-solves {done} of {state.resolves.length || 3}
          {state.nextReview ? ` · next ${shortDate(state.nextReview)}` : done && done === state.resolves.length ? ' · all done' : ''}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-[12.5px]">
        {state.video && (
          <a href={state.video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-ink" title={learnAdvice(target, state.ready)}>
            <IconPlay size={9} /> Walkthrough
          </a>
        )}
        {next && state.first === null ? (
          <Link href={`/rep/${next.id}`} className="ml-auto inline-flex items-center gap-1 font-medium text-ink hover:text-accent">
            Next block rep <IconArrowRight size={12} />
          </Link>
        ) : target.source === 'reps' && target.exerciseId ? (
          <Link href={`/rep/${target.exerciseId}`} className="ml-auto inline-flex items-center gap-1 font-medium text-ink hover:text-accent">
            {state.first ? 'Solve again' : 'Solve in Reps'} <IconArrowRight size={12} />
          </Link>
        ) : (
          <a href={state.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 font-medium text-ink hover:text-accent">
            {state.first ? 'Open on LeetCode' : 'Attempt on LeetCode'} <IconExternal size={11} />
          </a>
        )}
      </div>
    </li>
  )
}
