'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { PROBLEMS } from '@/data/problems'
import { problemReadiness } from '@/lib/progress'
import { relativeDue, shortDate } from '@/lib/dates'

export default function ProblemsView() {
  const { attempts, mastery, reviews } = useReps()
  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 pb-28 pt-10">
      <h1 className="text-[28px] font-semibold tracking-tight">Problems</h1>
      <p className="mt-1 text-[14px] text-muted">Canonical capstones. Readiness comes from the mastery of each problem’s skills.</p>
      <div className="relative mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-line text-[12px] text-faint">
              <th className="py-2 pr-4 font-medium">Problem</th>
              <th className="py-2 pr-4 font-medium">Pattern</th>
              <th className="py-2 pr-4 font-medium">Ready</th>
              <th className="py-2 pr-4 font-medium">Attempts</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Cold</th>
              <th className="py-2 pr-4 font-medium">Next</th>
              <th className="py-2 font-medium">
                <span className="sr-only">LeetCode</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {PROBLEMS.map((p) => {
              const mine = attempts.filter((a) => a.exerciseId === `cap-${p.id}` || a.exerciseId === `cold-${p.id}`)
              const counted = mine.filter((a) => a.completedAt || a.attemptsBeforePass > 0)
              const solved = mine.some((a) => a.passed && a.completedAt)
              const clean = mine.some((a) => a.passed && a.hintsUsed === 0 && !a.solutionViewed)
              const cold = mine.some((a) => a.passed && a.retrievalType === 'cold')
              const review = reviews.find((r) => r.id === `ex:cap-${p.id}` && r.status === 'pending')
              const ready = problemReadiness(p, mastery)
              return (
                <tr key={p.id}>
                  <td className="py-2 pr-4">
                    <Link href={`/rep/cap-${p.id}`} className="hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-muted">{p.pattern}</td>
                  <td className="py-2 pr-4 tabular-nums">{ready}%</td>
                  <td className="py-2 pr-4 tabular-nums text-ink-2">{counted.length || '—'}</td>
                  <td className="py-2 pr-4 text-[13px]">{solved ? (clean ? <span className="text-pass">✓ clean</span> : <span>✓ assisted</span>) : <span className="text-muted">{counted.length ? 'not yet' : '—'}</span>}</td>
                  <td className="py-2 pr-4">{cold ? <span className="text-pass" aria-label="solved cold">✓</span> : <span className="text-faint">—</span>}</td>
                  <td className="py-2 pr-4 text-[13px] text-muted">{review ? relativeDue(review.dueAt) : solved ? '—' : shortDate(p.day)}</td>
                  <td className="py-2 text-right">
                    <a href={p.leetcode} target="_blank" rel="noreferrer" className="text-[12px] text-muted hover:text-ink" aria-label={`${p.title} on LeetCode`}>
                      LC {p.number} ↗
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}
