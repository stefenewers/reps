'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { IconArrowRight, IconCheck, IconExternal, IconSnow } from '@/components/icons'
import { ConceptGlyph } from '@/components/concept-icons'
import { PROBLEMS } from '@/data/problems'
import { skillName } from '@/data/skills'
import { problemReadiness } from '@/lib/progress'
import { relativeDue, shortDate } from '@/lib/dates'

/** Canonical capstones, organised around readiness: what you can solve, and what's missing. */
export default function ProblemsView() {
  const { attempts, mastery, reviews } = useReps()
  const days = [...new Set(PROBLEMS.map((p) => p.day))]
  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-10 sm:px-8">
        <h1 className="display-xl">Problems</h1>
        <p className="mt-2 max-w-[640px] text-[14.5px] text-muted">The canonical capstones. Readiness is the mastery of each problem’s skills; solve them in the editor, then come back cold.</p>

        <div className="mt-10 flex flex-col gap-10">
          {days.map((d) => (
            <section key={d} aria-labelledby={`d-${d}`}>
              <h2 id={`d-${d}`} className="label mb-3">
                {shortDate(d)}
              </h2>
              <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {PROBLEMS.filter((p) => p.day === d).map((p) => {
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
                          <span style={{ width: `${ready}%`, background: ready >= 80 ? 'var(--green)' : 'var(--accent)' }} />
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 px-5 pt-3.5 text-[12px]">
                        {needs.length ? (
                          <>
                            <span className="text-muted">Needs</span>
                            {needs.map((x) => (
                              <Link key={x.s} href={`/skills/${x.s}`} className="rounded-full bg-amber-soft px-2 py-0.5 font-medium text-amber-ink hover:brightness-95">
                                {skillName(x.s)}
                              </Link>
                            ))}
                          </>
                        ) : (
                          <span className="rounded-full bg-green-soft px-2 py-0.5 font-medium text-green-ink">Skills in place</span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center gap-2 px-5 pb-4 pt-5 text-[12px]">
                        {solved ? (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${clean ? 'bg-green-soft text-green-ink' : 'bg-surface-2 text-ink-2'}`}>
                            <IconCheck size={11} strokeWidth={2.2} /> {clean ? 'Solved clean' : 'Solved with help'}
                          </span>
                        ) : (
                          <span className="text-muted">{counted.length ? `${counted.length} attempt${counted.length === 1 ? '' : 's'} · not solved yet` : 'Not started'}</span>
                        )}
                        {cold && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-soft px-2 py-0.5 font-medium text-violet-ink">
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
