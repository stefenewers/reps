'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { useSolveLog } from '@/components/use-solve-log'
import { PLAN_DAYS, dayExercises } from '@/data/curriculum'
import { CHECKPOINTS, PHASE_LABEL } from '@/data/program-90day'
import { addDays, parseLocal, shortDate } from '@/lib/dates'
import { passedSet } from '@/lib/progress'
import { planSolveId } from '@/lib/solve-log'

/** The whole 90 days, week by week. Every day links to its page. */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** The Sunday that starts a date's calendar row. */
const rowOf = (date: string) => addDays(date, -parseLocal(date).getDay())

export default function PlanView() {
  const { attempts, today } = useReps()
  const { entries } = useSolveLog()
  const passed = passedSet(attempts)
  const logged = new Set(entries.map((e) => e.id))
  // One row per calendar week, Sunday to Saturday, so days always read in date order (Day 1 is a Sunday).
  const rows = [...new Set(PLAN_DAYS.map((d) => rowOf(d.date)))]
  const checkpoint = new Map<string, string>(CHECKPOINTS.map((c) => [c.date, c.label]))

  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-28 pt-10 sm:px-8">
        <h1 className="display-xl">Plan</h1>
        <p className="mt-2 max-w-[680px] text-[15px] leading-relaxed text-ink-2">
          Ninety days, Oct 11 to Jan 8. Each pattern is a ladder in Reps, a mastery check, then its LeetCode problems, with re-solves spaced out after. Sundays are off after Day 1; weeks 7 and 11 are buffers.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted">
          <span>
            <span className="num font-medium text-ink-2">R</span> ladder reps in Reps
          </span>
          <span>
            <span className="num font-medium text-ink-2">N</span> new on LeetCode
          </span>
          <span>
            <span className="num font-medium text-ink-2">↻</span> re-solves
          </span>
          <span>
            <span aria-hidden="true" className="mr-1 inline-block size-2 rounded-full bg-accent align-middle" />
            mastery check
          </span>
        </p>

        <div className="mt-8 flex flex-col gap-6">
          {rows.map((row) => {
            const days = PLAN_DAYS.filter((d) => rowOf(d.date) === row)
            const patterns = [...new Set(days.flatMap((d) => (d.phase === 'off' ? [] : d.title.split(' → '))))]
            const phase = days.find((d) => d.phase !== 'off')?.phase
            // The plan numbers its weeks from the working days, so a leading Sunday off takes the next week's number.
            const w = (days.find((d) => d.phase !== 'off') ?? days[days.length - 1]).planWeek!
            const cells = WEEKDAYS.map((_, i) => days.find((d) => parseLocal(d.date).getDay() === i))
            return (
              <section key={w} aria-labelledby={`wk-${w}`}>
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 id={`wk-${w}`} className="h2">
                    Week {w}
                  </h2>
                  <p className="text-[13px] text-muted">
                    {shortDate(days[0].date)} – {shortDate(days[days.length - 1].date)}
                    {phase ? ` · ${PHASE_LABEL[phase]}` : ''}
                    {patterns.length ? ` · ${patterns.join(', ')}` : ''}
                  </p>
                </div>
                <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {cells.map((d, i) => {
                    if (!d) return <li key={i} aria-hidden="true" className="hidden rounded-xl lg:block" />
                    const reps = dayExercises(d)
                    const repsDone = reps.filter((e) => passed.has(e.id)).length
                    const lc = d.leetcode ?? []
                    const lcDone = lc.filter((x) => logged.has(planSolveId(x))).length
                    const news = lc.filter((x) => x.type === 'new').length
                    const work = reps.length + lc.length
                    const complete = work > 0 && repsDone === reps.length && lcDone === lc.length
                    const off = d.phase === 'off'
                    const isToday = d.date === today
                    const gate = d.sections.some((s) => s.gate)
                    return (
                      <li key={d.date}>
                        <Link
                          href={`/day/${d.date}`}
                          aria-current={isToday ? 'date' : undefined}
                          aria-label={`${shortDate(d.date)}, day ${d.planDay}: ${off ? 'off' : `${d.title}. ${reps.length} rep${reps.length === 1 ? '' : 's'}, ${news} new problem${news === 1 ? '' : 's'}, ${lc.length - news} re-solve${lc.length - news === 1 ? '' : 's'}`}${complete ? '. Complete' : ''}`}
                          className={`flex h-full min-h-[92px] flex-col rounded-xl px-3 py-2.5 text-[12.5px] transition-colors ${
                            isToday ? 'bg-bg shadow-[0_0_0_2px_var(--accent)]' : off ? 'bg-transparent shadow-[inset_0_0_0_1px_var(--line)] hover:bg-surface' : 'bg-bg shadow-[0_0_0_1px_var(--line)] hover:bg-surface'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className={`num font-medium ${isToday ? 'text-accent-ink' : 'text-ink'}`}>
                              {WEEKDAYS[i]} {shortDate(d.date).replace(/^[A-Za-z]+ /, '')}
                            </span>
                            <span className="num text-muted">
                              {complete ? '✓' : ''} {d.planDay}
                            </span>
                          </span>
                          {off ? (
                            <span className="mt-1 text-muted">Off</span>
                          ) : (
                            <>
                              <span className="mt-1 line-clamp-2 leading-snug text-ink-2">
                                {gate && <span aria-hidden="true" className="mr-1 inline-block size-1.5 rounded-full bg-accent align-middle" />}
                                {d.short}
                              </span>
                              <span className="num mt-auto pt-1.5 text-muted">
                                {[reps.length ? `${repsDone}/${reps.length} R` : '', news ? `${news} N` : '', lc.length - news ? `${lc.length - news} ↻` : ''].filter(Boolean).join(' · ') || '—'}
                              </span>
                            </>
                          )}
                          {checkpoint.has(d.date) && <span className="mt-1 font-medium text-accent-ink">{checkpoint.get(d.date)} checkpoint</span>}
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
