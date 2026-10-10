'use client'

import Link from 'next/link'
import { GlyphTerminal, GlyphTimer } from '@/components/concept-icons'
import { InterviewTargetFull } from '@/components/interview-target'
import { useReps } from '@/components/reps-provider'
import { MOCKS } from '@/data/mocks'
import { DAYS, EXERCISE_BY_ID, MODULES } from '@/data/curriculum'
import MockLog from '@/components/mock-log'
import { DesignTrack, StoriesChecklist } from '@/components/track-checklists'
import { shortDate } from '@/lib/dates'
import type { MockResult } from '@/lib/types'
import type { StudyStateRow } from '@/lib/storage/types'

export default function InterviewView() {
  const { repo, version, today } = useReps()
  void version
  const results = repo.engine
    .all('study_state')
    .filter((r: StudyStateRow) => r.id.startsWith('mock:'))
    .map((r) => r.value as MockResult)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  // Cold capstones for every problem you have met so far: its capstone (or the cold rep itself) is on a day up to today.
  const met = new Set(DAYS.filter((d) => d.date <= today).flatMap((d) => d.sections.flatMap((s) => s.exercises.map((e) => e.problemId).filter(Boolean))))
  const cold = MODULES.flatMap((m) => m.sections.flatMap((s) => s.exercises)).filter((e) => e.repType === 'cold' && e.problemId && met.has(e.problemId))

  return (
    <main data-mode="interview" className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[960px] px-5 pb-28 pt-10 sm:px-8">
      <p className="eyebrow text-faint">Simulation</p>
      <h1 className="display-xl mt-1.5">Interview Reps</h1>
      <p className="mt-2 max-w-[600px] text-[14.5px] text-muted">Rehearsal for the real thing: 45-minute sessions in a focused room with a timer, a plain editor, your own tests, and minimal assistance.</p>

      <div className="mt-8">
        <InterviewTargetFull />
      </div>

      <h2 className="h2 mt-12">Mock interviews</h2>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
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

      {cold.length === 0 && (
        <section className="mt-12">
          <h2 className="h2">Timed cold solves</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            These open as you meet each capstone in the plan. The first is Two Sum, in week 1. <Link href="/" className="text-ink underline underline-offset-4">Go to Today</Link>.
          </p>
        </section>
      )}

      {results.length > 0 && (
        <section className="mt-12">
          <h2 className="h2">In-app mock history</h2>
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
      <MockLog />
      <DesignTrack />
      <StoriesChecklist />
      </div>
    </main>
  )
}
