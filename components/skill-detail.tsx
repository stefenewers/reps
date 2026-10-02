'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useReps } from '@/components/reps-provider'
import { ScoreBar, StatusLabel } from '@/components/mastery-bits'
import { SKILL_BY_ID, skillName } from '@/data/skills'
import { PROBLEMS } from '@/data/problems'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { explainMastery } from '@/lib/mastery'
import { relativeDue, shortDate } from '@/lib/dates'
import { buildSkillSession, createSession } from '@/lib/sessions'
import { MISTAKE_LABEL } from '@/lib/coach/schemas'

export default function SkillDetail({ id }: { id: string }) {
  const router = useRouter()
  const { repo, mastery, attempts, reviews, today } = useReps()
  const skill = SKILL_BY_ID[id]
  if (!skill) return <main className="mx-auto max-w-[720px] px-5 py-16 text-muted">Unknown skill.</main>
  const m = mastery[id]
  const mine = attempts
    .filter((a) => a.skills.includes(id) && (a.completedAt || a.attemptsBeforePass > 0))
    .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt))
  const mistakes = new Map<string, number>()
  for (const a of mine) if (a.mistakeType) mistakes.set(a.mistakeType, (mistakes.get(a.mistakeType) ?? 0) + 1)
  const notes = mine.filter((a) => a.mistakeNote).slice(0, 4)
  const review = reviews.find((r) => r.id === `skill:${id}` && r.status === 'pending')
  const related = PROBLEMS.filter((p) => p.skills.includes(id))

  const doReps = async () => {
    const ids = buildSkillSession([id], attempts, today, 6)
    if (!ids.length) return
    const s = await createSession(repo, 'weakest', `${skill.name} reps`, ids)
    router.push(`/rep/${ids[0]}?s=${s.id}`)
  }

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 pb-28 pt-10">
      <Link href="/skills" className="text-[13px] text-muted hover:text-ink">
        ← Skills
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">{skill.group}</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight">{skill.name}</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={doReps}>
          Do reps
        </button>
      </div>
      <p className="mt-3 text-[15px] text-ink-2">{skill.definition}</p>
      {skill.prerequisites.length > 0 && <p className="mt-2 text-[13px] text-muted">Builds on: {skill.prerequisites.map(skillName).join(', ')}</p>}

      <section className="mt-8 rounded-lg border border-line p-4">
        <div className="flex items-center gap-4">
          <span className="text-[28px] font-semibold tabular-nums">{m.status === 'unseen' ? '—' : m.score}</span>
          <ScoreBar score={m.score} className="!w-40" />
          <StatusLabel status={m.status} />
        </div>
        <p className="mt-3 text-[13.5px] text-muted">{explainMastery(m)}</p>
        <dl className="mt-4 grid grid-cols-3 gap-y-3 text-[13px] sm:grid-cols-6">
          {[
            ['Attempts', m.attempts],
            ['Correct', m.correct],
            ['Failed', m.failures],
            ['Clean streak', m.consecutiveCorrect],
            ['Cold', `${m.coldCorrect}/${m.coldAttempts}`],
            ['Hints', m.hintsUsed],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="text-faint">{k}</dt>
              <dd className="tabular-nums text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[13px] text-muted">
          Next review: {review ? relativeDue(review.dueAt) : m.status === 'unseen' ? 'after your first rep' : 'not scheduled'}
          {m.lastPracticed ? ` · Last practiced ${shortDate(m.lastPracticed.slice(0, 10))}` : ''}
        </p>
      </section>

      {(mistakes.size > 0 || notes.length > 0) && (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold tracking-tight">Repeated mistakes</h2>
          <ul className="mt-2 text-[14px] text-ink-2">
            {[...mistakes].map(([k, n]) => (
              <li key={k}>
                {MISTAKE_LABEL[k as keyof typeof MISTAKE_LABEL] ?? k} · {n}×
              </li>
            ))}
            {notes.map((a) => (
              <li key={a.id} className="mt-1 text-[13px] text-muted">
                “{a.mistakeNote}”
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold tracking-tight">Recent attempts</h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-[14px] text-muted">No reps yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line border-y border-line text-[13.5px]">
            {mine.slice(0, 12).map((a) => {
              const ex = EXERCISE_BY_ID[a.exerciseId]
              return (
                <li key={a.id} className="grid grid-cols-[18px_1fr_auto] items-center gap-3 py-1.5">
                  <span aria-label={a.passed ? 'passed' : 'failed'} className={a.passed ? 'text-pass' : 'text-fail'}>
                    {a.passed ? '✓' : '✗'}
                  </span>
                  <Link href={`/rep/${a.exerciseId}`} className="truncate hover:underline">
                    {ex?.title ?? 'Generated rep'}
                  </Link>
                  <span className="text-[12px] text-faint">
                    {a.retrievalType === 'cold' ? 'cold · ' : a.retrievalType === 'immediate-reconstruction' ? 'run back · ' : ''}
                    {a.hintsUsed ? `${a.hintsUsed} hint${a.hintsUsed > 1 ? 's' : ''} · ` : ''}
                    {a.solutionViewed ? 'solution · ' : ''}
                    {shortDate(a.date)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold tracking-tight">Related problems</h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-[13.5px]">
            {related.map((p) => (
              <li key={p.id}>
                <Link href={`/rep/cap-${p.id}`} className="rounded-md border border-line px-2.5 py-1 hover:border-line-strong">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
