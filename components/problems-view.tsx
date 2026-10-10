'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { IconArrowRight, IconCheck, IconExternal, IconSnow } from '@/components/icons'
import { ConceptGlyph } from '@/components/concept-icons'
import { PROBLEMS } from '@/data/problems'
import { DAY_BY_DATE, DAY_OF_EXERCISE, MODULE_OF_EXERCISE } from '@/data/curriculum'
import { PROGRAM_STAGES } from '@/data/program'
import { skillName } from '@/data/skills'
import { problemReadiness } from '@/lib/progress'
import { relativeDue } from '@/lib/dates'

/** Canonical capstones, organised around readiness: what you can solve, and what's missing. */
export default function ProblemsView() {
  const { attempts, mastery, reviews } = useReps()
  // Group by where each capstone sits in the 90-day plan: its week and pattern. Solved-before-the-plan ones lead.
  const groupOf = (p: (typeof PROBLEMS)[number]) => {
    const day = DAY_BY_DATE[DAY_OF_EXERCISE[`cap-${p.id}`]]
    const required = day?.sections.some((s) => !s.optional && s.exercises.some((e) => e.id === `cap-${p.id}`))
    const pattern = PROGRAM_STAGES.find((st) => st.dayDate === MODULE_OF_EXERCISE[`cap-${p.id}`])?.title ?? p.pattern
    if (!day?.planDay) return { key: '0', order: 0, label: 'Done before the plan' }
    if (!required) return { key: '99', order: 99, label: 'Not in the plan · extra' }
    return { key: `${day.planWeek}:${pattern}`, order: day.planWeek! + day.planDay! / 1000, label: `Week ${day.planWeek} · ${pattern}` }
  }
  const groups = [...new Map(PROBLEMS.map((p) => groupOf(p)).sort((a, b) => a.order - b.order).map((g) => [g.key, g])).values()]
  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-10 sm:px-8">
        <h1 className="display-xl">Problems</h1>
        <p className="mt-2 max-w-[640px] text-[14.5px] text-muted">
          The capstones, in the order the plan reaches them. Readiness is the mastery of each problem’s skills: climb the ladder on <Link href="/" className="text-ink underline underline-offset-4">Today</Link>, solve the capstone in the editor, then come back cold.
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {groups.map((g) => (
            <section key={g.key} aria-labelledby={`g-${g.key}`}>
              <h2 id={`g-${g.key}`} className="label mb-3">
                {g.label}
              </h2>
              <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {PROBLEMS.filter((p) => groupOf(p).key === g.key).map((p) => {
                  const mine = attempts.filter((a) => a.exerciseId === `cap-${p.id}` || a.exerciseId === `cold-${p.id}`)
                  const counted = mine.filter((a) => a.completedAt || a.attemptsBeforePass > 0)
                  const solved = mine.some((a) => a.passed && a.completedAt)
                  const clean = mine.some((a) => a.passed && a.hintsUsed === 0 && !a.solutionViewed)
                  const cold = mine.some((a) => a.passed && a.retrievalType === 'cold')
                  const review = reviews.find((r) => r.id === `ex:cap-${p.id}` && r.status === 'pending')
                  const ready = problemReadiness(p, mastery)
                  const needs = p.skills
                    .map((s) => ({ s, score: mastery[s]?.score ?? 0 }))
                    .filter((x) => x.score < 50)
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 2)
                  return (
                    <li key={p.id} className="card interactive relative flex min-w-0 flex-col overflow-hidden">
                      <div className="flex items-start gap-3 px-5 pt-5">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-white shadow-sm">
                          <ConceptGlyph name={p.pattern} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="eyebrow text-faint">{p.pattern}</p>
                          <Link href={`/rep/cap-${p.id}`} className="mt-0.5 line-clamp-2 block text-[16.5px] font-semibold leading-snug tracking-tight hover:underline">
                            {p.title}
                          </Link>
                        </div>
                        <a href={p.leetcode} target="_blank" rel="noreferrer" className="icon-btn -mr-1 shrink-0" aria-label={`${p.title} on LeetCode`} title={`LeetCode ${p.number}`}>
                          <IconExternal size={14} />
                        </a>
                      </div>

                      <div className="px-5 pt-4">
                        <div className="flex items-baseline justify-between">
                          <span className="num text-[22px] font-semibold tracking-tight">{ready}%</span>
                          <span className="text-[12px] text-muted">ready</span>
                        </div>
                        <span className="bar mt-1.5 block" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ready} aria-label={`${ready}% ready`}>
                          <span style={{ width: `${ready}%`, background: 'var(--accent)' }} />
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 px-5 pt-3.5 text-[12px]">
                        {needs.length ? (
                          <>
                            <span className="text-muted">Needs</span>
                            {needs.map((x) => (
                              <Link key={x.s} href={`/skills/${x.s}`} className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-ink-2 transition-colors hover:bg-surface-3">
                                {skillName(x.s)}
                              </Link>
                            ))}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-ink-2">
                            <IconCheck size={11} strokeWidth={2.2} className="text-pass" /> Skills in place
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center gap-2 px-5 pb-4 pt-5 text-[12px]">
                        {solved ? (
                          <span className="inline-flex items-center gap-1 font-medium text-ink">
                            <IconCheck size={12} strokeWidth={2.2} className="text-pass" /> {clean ? 'Solved clean' : 'Solved with help'}
                          </span>
                        ) : (
                          <span className="text-muted">{counted.length ? `${counted.length} attempt${counted.length === 1 ? '' : 's'} · not solved yet` : 'Not started'}</span>
                        )}
                        {cold && (
                          <span className="inline-flex items-center gap-1 font-medium text-ink-2">
                            <IconSnow size={11} /> Cold
                          </span>
                        )}
                        {review && <span className="text-faint">· review {relativeDue(review.dueAt).toLowerCase()}</span>}
                        <Link href={`/rep/cap-${p.id}`} className="ml-auto inline-flex items-center gap-1 font-medium text-ink hover:text-accent">
                          {solved ? 'Again' : 'Solve'} <IconArrowRight size={12} />
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
