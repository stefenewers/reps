'use client'

import { useState } from 'react'
import Markdown from '@/components/markdown'
import { IconCheck } from '@/components/icons'
import { useReps } from '@/components/reps-provider'
import { checksKey } from '@/data/course/applied'
import type { Lesson } from '@/data/course/types'

interface ChecksState {
  answers: Record<number, string>
  marks: Record<number, 'had-it' | 'missed'>
  /** The day the checks were last all answered (spaced recall reads it). */
  answeredOn?: string
}

/**
 * Think, then reveal. Each check asks for a written answer first, then shows what a good answer contains
 * and lets the learner mark it honestly. Self-checked understanding: never a qualifying rep, never counted.
 */
export default function LessonChecks({ lesson }: { lesson: Lesson }) {
  const { repo, today } = useReps()
  const checks = lesson.checks ?? []
  const saved = repo.state<ChecksState>(checksKey(lesson.id))
  // Saved study state can arrive after the first render (it loads from this device, then syncs): merge, never seed once.
  const [typed, setAnswers] = useState<Record<number, string>>({})
  const [shown, setRevealed] = useState<Record<number, boolean>>({})
  const [local, setMarks] = useState<Record<number, 'had-it' | 'missed'>>({})
  const answers = { ...(saved?.answers ?? {}), ...typed }
  const marks = { ...(saved?.marks ?? {}), ...local }
  const revealed: Record<number, boolean> = { ...Object.fromEntries(Object.keys(marks).map((k) => [Number(k), true])), ...shown }
  if (!checks.length) return null
  const allMarked = checks.every((_, i) => marks[i])
  const mark = (i: number, m: 'had-it' | 'missed') => {
    const next = { ...marks, [i]: m }
    setMarks({ ...local, [i]: m })
    const complete = checks.every((_, k) => next[k])
    void repo.setState(checksKey(lesson.id), { answers, marks: next, answeredOn: complete ? today : saved?.answeredOn })
  }
  return (
    <section id="checks" aria-labelledby="checks-h" className="mt-12 scroll-mt-8" data-testid="lesson-checks">
      <h2 id="checks-h" className="section-title">
        Check yourself
      </h2>
      <p className="mt-1 text-[13.5px] text-muted">
        Write your answer first, then reveal what a good answer contains. Nothing here is graded or counted: it is how you find out what stuck.
      </p>
      <ol className="mt-5 flex flex-col gap-4">
        {checks.map((c, i) => (
          <li key={i} className="rounded-2xl bg-bg p-5 shadow-[0_0_0_1px_var(--hairline)]" data-testid={`check-${i}`} data-marked={marks[i] ?? ''}>
            <p className="num text-[11.5px] font-semibold uppercase tracking-[0.08em] text-learn">Check {i + 1}</p>
            <div className="prose-reps mt-1 text-[15px] text-ink">
              <Markdown text={c.prompt} />
            </div>
            {c.options && (
              <ul className="mt-2 flex flex-col gap-1 text-[14px] text-ink-2">
                {c.options.map((o) => (
                  <li key={o}>· {o}</li>
                ))}
              </ul>
            )}
            <label className="mt-3 block">
              <span className="sr-only">Your answer to check {i + 1}</span>
              <textarea
                className="input min-h-[84px] w-full !py-2.5 text-[14px]"
                placeholder="Your answer, in a sentence or two…"
                value={answers[i] ?? ''}
                disabled={Boolean(revealed[i])}
                onChange={(e) => setAnswers({ ...typed, [i]: e.target.value })}
              />
            </label>
            {!revealed[i] ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={(answers[i] ?? '').trim().length < 10}
                  onClick={() => setRevealed({ ...shown, [i]: true })}
                  data-testid={`reveal-${i}`}
                >
                  Reveal a good answer
                </button>
                {(answers[i] ?? '').trim().length < 10 && <span className="text-[12px] text-muted">Write a sentence first: retrieval is the point.</span>}
              </div>
            ) : (
              <div className="fade-in mt-3 rounded-xl bg-learn-soft px-4 py-3">
                <p className="eyebrow text-learn">A good answer</p>
                <div className="prose-reps mt-1 text-[14px] text-ink">
                  <Markdown text={c.answer} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`How did your answer to check ${i + 1} compare?`}>
                  <button type="button" className={`btn btn-sm ${marks[i] === 'had-it' ? 'btn-accent' : ''}`} aria-pressed={marks[i] === 'had-it'} onClick={() => mark(i, 'had-it')}>
                    I had it
                  </button>
                  <button type="button" className={`btn btn-sm ${marks[i] === 'missed' ? 'btn-accent' : ''}`} aria-pressed={marks[i] === 'missed'} onClick={() => mark(i, 'missed')}>
                    I missed something
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
      {allMarked && (
        <p className="mt-4 flex items-center gap-2 text-[14px] font-medium text-green-ink" role="status" data-testid="checks-done">
          <span className="check" data-on="true" aria-hidden="true">
            <IconCheck size={10} strokeWidth={3} />
          </span>
          Checks answered. {Object.values(marks).some((m) => m === 'missed') ? 'Reread the part you missed; it comes back for recall in a few weeks.' : 'It comes back for a quick recall in a few weeks.'}
        </p>
      )}
    </section>
  )
}
