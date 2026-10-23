'use client'

import Link from 'next/link'
import { useState } from 'react'
import { IconCheck } from '@/components/icons'
import { useReps } from '@/components/reps-provider'
import { useCourseDay } from '@/components/use-course-day'
import { COURSE_TARGET, courseWeekOf, INTERVIEW_CHECKPOINT } from '@/data/course/calendar'
import { LAB_BY_ID, LESSON_BY_ID } from '@/data/course/lessons'
import { WEEKS } from '@/data/course/weeks'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { PROBLEM_URLS } from '@/data/problem-urls'
import { shortDate } from '@/lib/dates'
import type { UnitState, UnitStatus } from '@/lib/course/routing'

type WeekState = 'locked' | 'ready' | 'active' | 'complete' | 'repair'

const WEEK_STATE_LABEL: Record<WeekState, string> = { locked: 'Locked', ready: 'Ready', active: 'Active', complete: 'Complete', repair: 'Repair required' }
const UNIT_LABEL: Record<UnitState, string> = {
  unseen: 'Not started',
  placement: 'Placement check',
  learning: 'Learning',
  practicing: 'Practising',
  'gate-blocked': 'Repair, then checkpoint',
  ready: 'Ready',
  maintenance: 'Maintenance'
}

function weekState(units: UnitStatus[], n: number, current: number, complete: boolean): WeekState {
  if (complete) return 'complete'
  if (units.some((u) => u.state === 'gate-blocked')) return 'repair'
  // The current week, and any earlier week not finished yet, is where the work is.
  if (n <= current) return 'active'
  // Next week is ready once its first units are unlocked; anything further waits its turn.
  if (n === current + 1 && units.some((u) => !u.locked)) return 'ready'
  return 'locked'
}

/**
 * Road to Ready (REPS_2_MASTER_SPEC.md §32): the 14 weeks as milestones, each
 * locked, ready, active, complete or needing repair, with what it holds.
 * A training programme, not a fantasy map.
 */
export default function RoadMap() {
  const { today } = useReps()
  const cd = useCourseDay()
  const { statuses } = cd.course
  const byDate = cd.credits
  const current = Math.max(1, courseWeekOf(today))
  const [open, setOpen] = useState<number | null>(current)
  const totalDone = Object.values(byDate).reduce((a, b) => a + b, 0)
  return (
    <section aria-labelledby="road-h" data-testid="road-map">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="road-h" className="h2">
          Road to Ready
        </h2>
        <p className="num text-[13px] text-muted">
          {totalDone} of {COURSE_TARGET} qualifying problems · Feb 1 checkpoint ({shortDate(INTERVIEW_CHECKPOINT)})
        </p>
      </div>
      <p className="mt-1 max-w-[720px] text-[13.5px] leading-relaxed text-muted">
        Fourteen weeks. Each unit is taught, practised, then proven at a checkpoint before what depends on it opens. The calendar can slide; the order cannot.
      </p>
      <ol className="mt-5 flex flex-col gap-2">
        {WEEKS.map((w) => {
          const units = statuses.filter((s) => s.unit.week === w.number)
          const contract = cd.contracts.weekContract(w.number, today)
          const state = weekState(units, w.number, current, contract.complete)
          const wp = { done: contract.output.done, target: contract.output.target }
          const isOpen = open === w.number
          return (
            <li
              key={w.number}
              className={`rounded-xl ${state === 'active' ? 'bg-bg shadow-[0_0_0_1.5px_var(--flame-2)]' : state === 'complete' ? 'bg-pass-soft/60 shadow-[0_0_0_1px_var(--line)]' : 'bg-bg shadow-[0_0_0_1px_var(--line)]'}`}
              data-week={w.number}
              data-state={state}
            >
              <button
                type="button"
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : w.number)}
              >
                <span
                  aria-hidden="true"
                  className={`num grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${state === 'complete' ? 'bg-pass text-white' : state === 'active' ? 'bg-flame text-white' : state === 'repair' ? 'bg-repair-soft text-repair' : state === 'locked' ? 'bg-surface-2 text-faint' : 'bg-surface-2 text-ink-2'}`}
                >
                  {state === 'complete' ? <IconCheck size={15} strokeWidth={2.6} /> : String(w.number).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold tracking-tight text-ink">{w.title}</span>
                  <span className="block text-[12.5px] text-muted">
                    {shortDate(w.startsOn)}–{shortDate(w.endsOn)} · {w.focus} · {w.targetProblems} problems
                    {w.plannedOffDays.length ? ` · rest: ${w.plannedOffDays.map((d) => d.label).join(', ')}` : ''}
                  </span>
                </span>
                <span className="hidden text-right sm:block">
                  <span
                    className={`block text-[11.5px] font-semibold uppercase tracking-wide ${state === 'active' ? 'text-flame' : state === 'complete' ? 'text-green-ink' : state === 'repair' ? 'text-repair' : 'text-faint'}`}
                  >
                    {WEEK_STATE_LABEL[state]}
                  </span>
                  {(state === 'active' || wp.done > 0) && (
                    <span className="num block text-[12px] text-muted">
                      {wp.done}/{w.targetProblems}
                    </span>
                  )}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-line px-4 pb-4 pt-3" data-testid={`week-${w.number}-detail`}>
                  <p className="text-[13.5px] leading-relaxed text-ink-2">{w.purpose}</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {units.map((u) => (
                      <li key={u.unit.id} className="rounded-lg bg-surface px-3 py-2.5" data-unit={u.unit.id} data-state={u.state}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-[14px] font-medium text-ink">{u.unit.title}</span>
                          <span className="text-[12px] text-muted">
                            {u.locked ? `Locked · needs ${u.blockedBy.length} earlier unit${u.blockedBy.length === 1 ? '' : 's'}` : UNIT_LABEL[u.state]}
                            {!u.locked && u.total > 0 && u.state !== 'ready' && u.state !== 'maintenance' ? ` · ${u.done}/${u.total}` : ''}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-muted">{u.unit.purpose}</p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">
                          {u.unit.lessonIds.map((id) => {
                            const l = LESSON_BY_ID[id] ?? CONCEPT_BY_ID[id]
                            return l ? (
                              <Link key={id} href={`/learn/${id}`} className="text-learn hover:underline">
                                {l.title}
                              </Link>
                            ) : null
                          })}
                          {u.gates.map((g) => (
                            <span key={g.gate.id} className={g.cleared ? 'text-cold' : 'text-muted'}>
                              {g.cleared ? '✓ ' : ''}Checkpoint: {g.gate.title}
                            </span>
                          ))}
                          {u.unit.labIds.map((id) =>
                            LAB_BY_ID[id] ? (
                              <Link key={id} href={`/lab/${id}`} className="text-ink hover:underline">
                                Lab: {LAB_BY_ID[id].title}
                              </Link>
                            ) : null
                          )}
                          {u.unit.targets.map((lc) => (
                            <span key={lc} className="text-muted">
                              LC {lc}
                              {PROBLEM_URLS[lc] ? ` ${PROBLEM_URLS[lc].title}` : ''}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
