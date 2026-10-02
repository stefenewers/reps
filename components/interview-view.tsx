'use client'

import Link from 'next/link'
import { GlyphTerminal, GlyphTimer } from '@/components/concept-icons'
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
    <main data-mode="interview" className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[960px] px-5 pb-28 pt-10 sm:px-8">
      <p className="eyebrow text-faint">Simulation</p>
      <h1 className="display-xl mt-1.5">Interview Reps</h1>
      <p className="mt-2 max-w-[600px] text-[14.5px] text-muted">45-minute mock sessions in a focused room: a timer, a plain editor, your own tests, and minimal assistance.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {MOCKS.map((m) => {
          const past = results.filter((r) => r.mockId === m.id && r.completedAt)
          return (
            <li key={m.id} className="panel flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-ink text-white">
                  <GlyphTerminal size={18} />
                </span>
                <span className="mono inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[12px] text-ink-2">
                  <GlyphTimer size={13} /> {m.minutes}:00
                </span>
              </div>
              <div>
                <h2 className="h2">{m.title}</h2>
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
          <h2 className="h2">Timed cold solves</h2>
          <p className="mt-1 text-[13.5px] text-muted">Capstones from a blank editor, in Interview mode.</p>
          <ul className="mt-3 flex flex-wrap gap-2 text-[13.5px]">
            {cold.map((e) => (
              <li key={e.id}>
                <Link href={`/rep/${e.id}?mode=interview`} className="chip !h-8 !px-3">
                  {e.title.replace(' (cold)', '')}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.length > 0 && (
        <section className="mt-12">
          <h2 className="h2">History</h2>
          <ul className="card mt-3 divide-y divide-line px-4 text-[13.5px]">
            {results.map((r) => (
              <li key={r.id} className="flex justify-between gap-4 py-2.5">
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
      </div>
    </main>
  )
}
