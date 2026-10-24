'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { IconArrowRight, IconCheck, IconFlag, IconLock, IconRepair } from '@/components/icons'
import Ring from '@/components/ring'
import Scene from '@/components/scene'
import { weekState, WEEK_STATE_LABEL, type WeekState } from '@/components/course/road-state'
import { useReps } from '@/components/reps-provider'
import { useCourseDay } from '@/components/use-course-day'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { COURSE_TARGET, courseWeekOf } from '@/data/course/calendar'
import { LAB_BY_ID, LESSON_BY_ID } from '@/data/course/lessons'
import { WEEKS } from '@/data/course/weeks'
import { APPLIED_BY_UNIT } from '@/data/course/applied'
import { PROBLEM_URLS } from '@/data/problem-urls'
import { shortDate } from '@/lib/dates'
import type { UnitState, UnitStatus } from '@/lib/course/routing'

/**
 * Road to Ready (REPS_2_MASTER_SPEC.md §32) as a journey: a trail of fourteen
 * milestones up to February 1, the selected week's units with what each needs,
 * and the full index. The calendar can slide; the order cannot.
 */

const UNIT_LABEL: Record<UnitState, string> = {
  unseen: 'Not started',
  placement: 'Placement check',
  learning: 'Learning',
  practicing: 'Practising',
  'gate-blocked': 'Repair, then checkpoint',
  ready: 'Cleared',
  maintenance: 'Cleared · kept fresh'
}

/** The phases the fourteen weeks fall into: why the order exists. */
const PHASES = [
  { from: 1, to: 2, title: 'Foundations', why: 'How programs hold state, and how to take a problem apart.' },
  { from: 3, to: 6, title: 'Core patterns', why: 'Pointers, windows, stacks, search, lists and recursion: the moves most problems are made of.' },
  { from: 7, to: 10, title: 'Structures', why: 'Trees, graphs, heaps and intervals, built on recursion and traversal.' },
  { from: 11, to: 12, title: 'Harder search', why: 'Backtracking and dynamic programming, then consolidation.' },
  { from: 13, to: 14, title: 'Transfer and interview', why: 'Unlabeled problems, then interview conditions.' }
]

// The trail's shape across the scene: rising left to right, gently winding.
const TRAIL = Array.from({ length: 14 }, (_, i) => ({ x: 52 + i * (1096 / 13), y: 236 - i * 12 - 26 * Math.sin(i * 0.95) }))

function trailPath(pts: { x: number; y: number }[]) {
  if (!pts.length) return ''
  let d = `M${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 2] ?? pts[i - 1]
    const p1 = pts[i - 1]
    const p2 = pts[i]
    const p3 = pts[i + 1] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

const STATE_TAG: Record<WeekState, string> = {
  complete: 'tag-pass',
  active: 'tag-flame',
  ready: 'tag-learn',
  repair: 'tag-repair',
  locked: 'tag-locked'
}

function NodeGlyph({ state, n }: { state: WeekState; n: number }) {
  if (state === 'complete') return <IconCheck size={15} strokeWidth={3} />
  if (state === 'locked') return <IconLock size={13} />
  if (state === 'repair') return <IconRepair size={14} />
  return <>{n}</>
}

export default function RoadView() {
  const { today } = useReps()
  const cd = useCourseDay()
  const { statuses } = cd.course
  const current = Math.max(1, Math.min(14, courseWeekOf(today)))
  const [selected, setSelected] = useState(current)
  const total = Object.values(cd.credits).reduce((a, b) => a + b, 0)
  const weeks = useMemo(
    () =>
      WEEKS.map((w) => {
        const units = statuses.filter((s) => s.unit.week === w.number)
        const contract = cd.contracts.weekContract(w.number, today)
        return { w, units, contract, state: weekState(units, w.number, current, contract.complete) }
      }),
    [statuses, cd.contracts, today, current]
  )
  const reached = weeks.reduce((n, x, i) => (x.state === 'complete' || x.state === 'active' || x.state === 'repair' ? i : n), 0)
  const sel = weeks[selected - 1]
  const choose = (n: number, scroll = false) => {
    setSelected(n)
    if (scroll) requestAnimationFrame(() => document.getElementById('week-focus')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <main className="flex-1 bg-canvas pb-20">
      <div className="hero" data-mood="dawn">
        <Scene mood="dawn" />
        <div className="hero-veil" />
        <div className="mx-auto w-full max-w-[1180px] px-5 pt-8 sm:px-8 sm:pt-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[620px]">
              <h1 className="headline">Road to Ready</h1>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
                Fourteen weeks from program state to interview execution. Each unit is taught, practised, then proven at a checkpoint before what depends on it
                opens. <span className="font-semibold text-ink">The calendar can slide; the order cannot.</span>
              </p>
            </div>
            <div className="glass flex shrink-0 items-center gap-5 self-start rounded-2xl px-5 py-3">
              <div>
                <p className="num text-[22px] font-semibold tracking-tight">Week {current}</p>
                <p className="text-[12.5px] text-muted">of 14</p>
              </div>
              <span aria-hidden="true" className="h-10 w-px bg-line-strong" />
              <div>
                <p className="num text-[22px] font-semibold tracking-tight">
                  {total}
                  <span className="text-[13px] font-medium text-muted"> / {COURSE_TARGET}</span>
                </p>
                <p className="text-[12.5px] text-muted">qualifying reps</p>
              </div>
            </div>
          </div>

          {/* The trail (wide screens). Each milestone is a button that focuses its week. */}
          <div className="relative mt-4 hidden aspect-[1200/300] w-full lg:block" data-testid="road-trail">
            <svg viewBox="0 0 1200 300" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <path d={trailPath(TRAIL)} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" />
              <path
                d={trailPath(TRAIL.slice(0, reached + 1))}
                fill="none"
                stroke="var(--flame)"
                strokeWidth="5"
                strokeLinecap="round"
                className="trail-done"
                style={{ ['--len' as string]: 1600 }}
              />
              <g transform={`translate(${TRAIL[13].x + 40} ${TRAIL[13].y - 54})`}>
                <path d="M0 0 V46" stroke="#2f3a4d" strokeWidth="2.5" />
                <path d="M1 2 L30 10 L1 19 Z" fill="var(--flame)" />
              </g>
            </svg>
            <span className="absolute whitespace-nowrap text-[11.5px] font-semibold text-ink" style={{ left: `${((TRAIL[13].x + 40) / 1200) * 100}%`, top: `${((TRAIL[13].y - 76) / 300) * 100}%` }}>
              Feb 1
            </span>
            {weeks.map(({ w, state }, i) => (
              <div
                key={w.number}
                className="trail-node"
                data-state={state}
                data-selected={selected === w.number ? 'true' : 'false'}
                style={{ left: `${(TRAIL[i].x / 1200) * 100}%`, top: `${(TRAIL[i].y / 300) * 100}%` }}
              >
                <button
                  type="button"
                  onClick={() => choose(w.number)}
                  aria-label={`Week ${w.number}, ${w.title}: ${WEEK_STATE_LABEL[state]}`}
                  aria-pressed={selected === w.number}
                  className="flex flex-col items-center rounded-lg"
                >
                  <span className="trail-dot num">
                    <NodeGlyph state={state} n={w.number} />
                  </span>
                  <span className={`mt-2 max-w-[86px] text-center text-[11.5px] leading-tight font-semibold ${state === 'locked' ? 'text-ink-2/70' : 'text-ink'}`}>{w.short}</span>
                  {state !== 'locked' && <span className={`tag mt-1 ${STATE_TAG[state]}`}>{state === 'active' ? (w.number === current ? 'Current' : 'Unfinished') : WEEK_STATE_LABEL[state]}</span>}
                </button>
              </div>
            ))}
          </div>
          {/* The trail on small screens: two rows of seven, still one path. */}
          <ol className="mt-6 grid grid-cols-7 gap-y-5 lg:hidden" aria-label="Fourteen weeks" data-testid="road-trail-compact">
            {weeks.map(({ w, state }) => (
              <li key={w.number} className="trail-node !static !transform-none" data-state={state} data-selected={selected === w.number ? 'true' : 'false'}>
                {w.number % 7 !== 1 && (
                  <span
                    aria-hidden="true"
                    className={`absolute mt-[17px] h-[3px] w-[calc(100%/7)] -translate-x-1/2 ${w.number - 1 <= reached ? 'bg-flame' : 'border-t-[3px] border-dotted border-white'}`}
                    style={{ left: `${((((w.number - 1) % 7) - 0.5) / 7) * 100 + 100 / 14}%` }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => choose(w.number)}
                  aria-label={`Week ${w.number}, ${w.title}: ${WEEK_STATE_LABEL[state]}`}
                  aria-pressed={selected === w.number}
                  className="relative z-10 flex flex-col items-center"
                >
                  <span className="trail-dot num !size-[34px] !text-[12px]">
                    <NodeGlyph state={state} n={w.number} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="h-28 lg:h-16" />
        </div>
      </div>

      {/* The selected week, in focus. */}
      <section id="week-focus" aria-labelledby="focus-h" className="relative mx-auto -mt-20 w-full max-w-[1180px] scroll-mt-4 px-5 sm:px-8" data-testid="week-focus">
        <div className="deck p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-muted">
                Week {sel.w.number} of 14 · {shortDate(sel.w.startsOn)}–{shortDate(sel.w.endsOn)}
              </p>
              <h2 id="focus-h" className="section-title mt-1.5">
                Week {sel.w.number} — {sel.w.title}
              </h2>
              <p className="mt-2 max-w-[720px] text-[14.5px] leading-relaxed text-ink-2">{sel.w.purpose}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`tag ${STATE_TAG[sel.state]}`}>{WEEK_STATE_LABEL[sel.state]}</span>
              <span className="num text-[13px] text-muted">
                {sel.contract.output.done} / {sel.w.targetProblems} reps
              </span>
              <span className="flex gap-1">
                <button type="button" className="icon-btn" aria-label="Previous week" disabled={selected === 1} onClick={() => choose(selected - 1)}>
                  ‹
                </button>
                <button type="button" className="icon-btn" aria-label="Next week" disabled={selected === 14} onClick={() => choose(selected + 1)}>
                  ›
                </button>
              </span>
            </div>
          </div>

          {/* What the week asks for, at a glance: the answer to "what do I need to do?" */}
          <dl className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" data-testid="week-asks">
            <div className="rounded-xl bg-surface px-4 py-3">
              <dt className="label">Reps</dt>
              <dd className="num mt-1 text-[14px] font-semibold">
                {sel.contract.output.done} / {sel.contract.output.target}
                <span className="ml-1 font-normal text-muted">· {sel.contract.daysComplete} of {sel.contract.trainingDays} days</span>
              </dd>
            </div>
            <div className="rounded-xl bg-surface px-4 py-3">
              <dt className="label">Builds</dt>
              <dd className="mt-1 text-[13.5px]">
                {sel.contract.labs.filter((l) => !l.optional).length
                  ? sel.contract.labs
                      .filter((l) => !l.optional)
                      .map((l) => `${l.done ? '✓ ' : ''}${l.title}`)
                      .join(' · ')
                  : 'None this week'}
              </dd>
            </div>
            <div className="rounded-xl bg-surface px-4 py-3">
              <dt className="label">Checkpoints</dt>
              <dd className="mt-1 text-[13.5px]">
                {sel.contract.gates.length ? `${sel.contract.gates.filter((g) => g.cleared).length} of ${sel.contract.gates.length} cleared` : 'None this week'}
                {sel.contract.gates.length > 0 && <span className="block text-[12px] text-muted">{sel.contract.gates.map((g) => g.title).join(' · ')}</span>}
              </dd>
            </div>
            <div className="rounded-xl bg-surface px-4 py-3">
              <dt className="label">Unlocks</dt>
              <dd className="mt-1 text-[13.5px]">
                {selected < 14 ? (
                  <>
                    Week {selected + 1} · {weeks[selected].w.title}
                    <span className="block text-[12px] text-muted">as this week&apos;s checkpoints clear</span>
                  </>
                ) : (
                  'The February 1 checkpoint'
                )}
              </dd>
            </div>
          </dl>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sel.units.map((u, i) => (
              <UnitCard key={u.unit.id} u={u} index={`${sel.w.number}.${i + 1}`} statuses={statuses} onGoto={(week) => choose(week, true)} />
            ))}
          </ul>

          {selected < 14 && (
            <div className="mt-5 flex flex-col items-start gap-4 rounded-2xl bg-flame-soft px-5 py-4 sm:flex-row sm:items-center">
              <span className="icon-tile bg-white text-flame">
                <IconFlag size={18} />
              </span>
              <div className="min-w-0 sm:flex-1">
                <p className="text-[14.5px] font-semibold">
                  Milestone ahead — Week {selected + 1} · {weeks[selected].w.title}
                </p>
                <p className="text-[13px] text-ink-2">
                  {weeks[selected].w.focus}. It opens as the units it depends on clear their checkpoints, never just because the date arrives.
                </p>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => choose(selected + 1)}>
                View upcoming <IconArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Every week, by phase: the index. */}
      <section aria-labelledby="road-h" className="mx-auto mt-14 w-full max-w-[1180px] px-5 sm:px-8" data-testid="road-map">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="road-h" className="section-title">
            All fourteen weeks
          </h2>
          <p className="num text-[13px] text-muted">
            {total} of {COURSE_TARGET} qualifying problems · Feb 1 checkpoint
          </p>
        </div>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {PHASES.map((p) => (
            <div key={p.title}>
              <p className="eyebrow text-muted">{p.title}</p>
              <p className="mt-1 text-[13px] text-muted">{p.why}</p>
              <ol className="mt-3 flex flex-col">
                {weeks
                  .filter((x) => x.w.number >= p.from && x.w.number <= p.to)
                  .map(({ w, state, contract, units }) => (
                    <li key={w.number} data-week={w.number} data-state={state} className="relative">
                      <button
                        type="button"
                        className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-bg ${selected === w.number ? 'bg-bg shadow-[0_0_0_1px_var(--hairline)]' : ''}`}
                        aria-expanded={selected === w.number}
                        onClick={() => choose(w.number, true)}
                      >
                        <span
                          aria-hidden="true"
                          className={`num grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
                            state === 'complete'
                              ? 'bg-pass text-white'
                              : state === 'active'
                                ? 'bg-flame text-white'
                                : state === 'repair'
                                  ? 'bg-repair-soft text-repair'
                                  : state === 'ready'
                                    ? 'bg-learn-soft text-learn'
                                    : 'bg-surface-2 text-faint'
                          }`}
                        >
                          <NodeGlyph state={state} n={w.number} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold tracking-tight text-ink">{w.title}</span>
                          {state === 'locked' && (
                            <span className="block text-[12.5px] text-ink-2">{lockedReason(units, statuses)}</span>
                          )}
                          <span className="block text-[12.5px] text-muted">
                            {shortDate(w.startsOn)}–{shortDate(w.endsOn)} · {w.focus}
                            {w.plannedOffDays.length ? ` · rest: ${w.plannedOffDays.map((d) => d.label).join(', ')}` : ''}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className={`tag ${STATE_TAG[state]}`}>{WEEK_STATE_LABEL[state]}</span>
                          {(state === 'active' || contract.output.done > 0) && (
                            <span className="num mt-1 block text-[12px] text-muted">
                              {contract.output.done}/{w.targetProblems}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

/** Why a week is locked, in plain English: the earliest units it is waiting on. */
function lockedReason(units: UnitStatus[], statuses: UnitStatus[]): string {
  const waiting = [...new Set(units.flatMap((u) => u.blockedBy))]
    .map((id) => statuses.find((s) => s.unit.id === id)?.unit)
    .filter((u): u is UnitStatus['unit'] => Boolean(u) && !units.some((x) => x.unit.id === u!.id))
  if (!waiting.length) return 'Opens when the week before it is under way.'
  const names = waiting.slice(0, 2).map((u) => `${u.title} (Week ${u.week})`)
  return `Opens after ${names.join(' and ')}${waiting.length > 2 ? ` and ${waiting.length - 2} more` : ''} ${waiting.length === 1 ? 'clears its checkpoint' : 'clear their checkpoints'}.`
}

function UnitCard({ u, index, statuses, onGoto }: { u: UnitStatus; index: string; statuses: UnitStatus[]; onGoto: (week: number) => void }) {
  const cleared = u.state === 'ready' || u.state === 'maintenance'
  const tone = u.locked ? 'bg-surface' : u.state === 'gate-blocked' ? 'tile-repair' : cleared ? 'tile-pass' : 'bg-bg shadow-[0_0_0_1px_var(--line)]'
  return (
    <li className={`flex flex-col rounded-2xl p-4 ${tone}`} id={`unit-${u.unit.id}`} data-unit={u.unit.id} data-state={u.state}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="num text-[11.5px] font-semibold text-muted">{index}</p>
          <p className="mt-0.5 text-[15px] font-semibold leading-snug tracking-tight text-ink">{u.unit.title}</p>
        </div>
        {u.locked ? (
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-2 text-faint" aria-hidden="true">
            <IconLock size={16} />
          </span>
        ) : (
          <Ring value={cleared ? 1 : u.done} max={cleared ? 1 : Math.max(1, u.total)} size={52} stroke={5} color={cleared ? 'var(--pass)' : u.state === 'gate-blocked' ? 'var(--repair)' : 'var(--accent)'}>
            <span className="num text-[11px] font-semibold">{cleared ? <IconCheck size={14} strokeWidth={3} /> : `${u.total ? Math.round((100 * u.done) / u.total) : 0}%`}</span>
          </Ring>
        )}
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{u.unit.purpose}</p>
      <p className="mt-2 text-[12px] font-medium text-ink-2">
        {u.locked ? `Locked · needs ${u.blockedBy.length} earlier unit${u.blockedBy.length === 1 ? '' : 's'}` : UNIT_LABEL[u.state]}
        {!u.locked && u.total > 0 && !cleared ? ` · ${u.done}/${u.total}` : ''}
      </p>
      {u.locked && (
        <p className="mt-1.5 text-[12.5px] text-repair">
          First clear:{' '}
          {u.blockedBy.map((id, i) => {
            const prerequisite = statuses.find((s) => s.unit.id === id)?.unit
            return (
              <span key={id}>
                {i > 0 ? ', ' : ''}
                <button
                  className="underline underline-offset-2"
                  onClick={() => {
                    onGoto(prerequisite?.week ?? 1)
                    requestAnimationFrame(() => document.getElementById(`unit-${id}`)?.classList.add('unlock-glow'))
                  }}
                >
                  {prerequisite?.title ?? id}
                </button>
              </span>
            )
          })}
          . Today starts with the earliest unfinished prerequisite.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[12px]">
        {u.unit.lessonIds.map((id) => {
          const l = LESSON_BY_ID[id] ?? CONCEPT_BY_ID[id]
          return l ? (
            <Link key={id} href={`/learn/${id}`} className="tag tag-learn !normal-case !tracking-normal hover:underline">
              {l.title}
            </Link>
          ) : null
        })}
        {(APPLIED_BY_UNIT[u.unit.id] ?? []).map((id) =>
          LESSON_BY_ID[id] ? (
            <Link key={id} href={`/learn/${id}`} className="tag tag-plain !normal-case !tracking-normal hover:underline" data-thread={LESSON_BY_ID[id].thread}>
              {LESSON_BY_ID[id].thread === 'applied' ? 'Applied' : 'Design'}: {LESSON_BY_ID[id].title}
            </Link>
          ) : null
        )}
        {u.gates.map((g) => (
          <span key={g.gate.id} className={`tag !normal-case !tracking-normal ${g.cleared ? 'tag-cold' : g.failed ? 'tag-repair' : 'tag-plain'}`}>
            {g.cleared ? '✓ ' : ''}Checkpoint: {g.gate.title}
          </span>
        ))}
        {u.unit.labIds.map((id) =>
          LAB_BY_ID[id] ? (
            <Link key={id} href={`/lab/${id}`} className="tag tag-flame !normal-case !tracking-normal hover:underline">
              Lab: {LAB_BY_ID[id].title}
            </Link>
          ) : null
        )}
        {u.unit.targets.map((lc) => (
          <span key={lc} className="tag tag-plain !normal-case !tracking-normal">
            LC {lc}
            {PROBLEM_URLS[lc] ? ` ${PROBLEM_URLS[lc].title}` : ''}
          </span>
        ))}
      </div>
      {!u.locked && !cleared && (
        <Link href="/" className="btn btn-sm mt-4 self-start">
          {u.state === 'gate-blocked' ? 'Repair on Today' : 'Continue on Today'} <IconArrowRight size={12} />
        </Link>
      )}
    </li>
  )
}
