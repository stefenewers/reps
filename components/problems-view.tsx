'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import ProgressRing from '@/components/progress-ring'
import { IconCheck, IconExternal, IconSnow } from '@/components/icons'
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
        <h1 className="display">Problems</h1>
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
                    <li key={p.id} className="card interactive flex min-w-0 flex-col gap-4 p-5">
                      <div className="flex items-start gap-4">
                        <ProgressRing value={ready} size={46} stroke={4} tone={ready >= 80 ? 'pass' : 'ink'} label={`${ready}% ready`}>
                          <span className="num text-[11.5px] font-semibold">{ready}%</span>
                        </ProgressRing>
                        <div className="min-w-0 flex-1">
                          <Link href={`/rep/cap-${p.id}`} className="h3 line-clamp-2 block hover:underline">
                            {p.title}
                          </Link>
                          <p className="mt-0.5 text-[12.5px] text-muted">{p.pattern}</p>
                        </div>
                        <a href={p.leetcode} target="_blank" rel="noreferrer" className="icon-btn shrink-0" aria-label={`${p.title} on LeetCode`} title={`LeetCode ${p.number}`}>
                          <IconExternal size={14} />
                        </a>
                      </div>

                      <p className="text-[12.5px] text-muted">
                        {needs.length ? (
                          <>
                            <span className="text-ink-2">Needs</span> {needs.map((x) => skillName(x.s)).join(', ')}
                          </>
                        ) : (
                          <span className="text-pass">Skills in place</span>
                        )}
                      </p>

                      <div className="mt-auto flex items-center gap-2 text-[12px]">
                        {solved ? (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${clean ? 'bg-pass-soft text-pass' : 'bg-surface-2 text-ink-2'}`}>
                            <IconCheck size={11} strokeWidth={2.2} /> {clean ? 'Solved clean' : 'Solved with help'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">{counted.length ? 'Not solved yet' : 'Not started'}</span>
                        )}
                        {cold && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent-ink">
                            <IconSnow size={11} /> Cold
                          </span>
                        )}
                        <span className="ml-auto text-faint">
                          {counted.length ? `${counted.length} attempt${counted.length === 1 ? '' : 's'}` : ''}
                          {review ? `${counted.length ? ' · ' : ''}review ${relativeDue(review.dueAt).toLowerCase()}` : ''}
                        </span>
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
