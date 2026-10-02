'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { MOCKS } from '@/data/mocks'
import { DAY_BY_DATE, EXERCISE_BY_ID } from '@/data/curriculum'
import { shortDate } from '@/lib/dates'
import type { MockResult } from '@/lib/types'
import type { StudyStateRow } from '@/lib/storage/types'

export default function InterviewView() {
  const { repo, version } = useReps()
  void version
  const results = repo.engine
    .all('study_state')
    .filter((r: StudyStateRow) => r.id.startsWith('mock:'))
    .map((r) => r.value as MockResult)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  const cold = DAY_BY_DATE['2026-10-11']?.sections.flatMap((s) => s.exercises).filter((e) => e.repType === 'cold' && e.problemId) ?? []

  return (
    <main className="mx-auto w-full max-w-[880px] px-5 pb-28 pt-10">
      <h1 className="text-[28px] font-semibold tracking-tight">Interview Reps</h1>
      <p className="mt-1 text-[14px] text-muted">45-minute mock sessions. Timer, plain editor, your own tests, minimal assistance.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {MOCKS.map((m) => {
          const past = results.filter((r) => r.mockId === m.id && r.completedAt)
          return (
            <li key={m.id} className="card flex flex-col gap-3 p-5">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight">{m.title}</h2>
                <p className="mt-1 text-[13.5px] text-muted">{m.note}</p>
              </div>
              <p className="text-[12.5px] text-faint">
                {m.minutes} min · {m.exerciseIds.length} problems
                {past.length ? ` · done ${past.length}×, last ${shortDate(past[0].startedAt.slice(0, 10))}` : ''}
              </p>
              <Link href={`/interview/${m.id}`} className="btn btn-primary self-start">
                {past.length ? 'Run it again' : 'Start'}
              </Link>
            </li>
          )
        })}
      </ul>

      {cold.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[15px] font-semibold tracking-tight">Timed cold solves</h2>
          <p className="mt-1 text-[13.5px] text-muted">Capstones from a blank editor, in Interview mode.</p>
          <ul className="mt-3 flex flex-wrap gap-2 text-[13.5px]">
            {cold.map((e) => (
              <li key={e.id}>
                <Link href={`/rep/${e.id}?mode=interview`} className="rounded-md border border-line px-2.5 py-1 hover:border-line-strong">
                  {e.title.replace(' (cold)', '')}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[15px] font-semibold tracking-tight">History</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line text-[13.5px]">
            {results.map((r) => (
              <li key={r.id} className="flex justify-between py-2">
                <span>
                  {MOCKS.find((m) => m.id === r.mockId)?.title} · {shortDate(r.startedAt.slice(0, 10))}
                </span>
                <span className="text-muted">
                  {r.problems.map((p) => `${EXERCISE_BY_ID[p.exerciseId]?.title ?? p.exerciseId}: ${p.passed ? '✓' : '✗'}`).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
