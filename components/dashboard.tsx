'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useReps } from '@/components/reps-provider'
import DateStrip from '@/components/date-strip'
import LearningPath from '@/components/learning-path'
import ChallengeMe from '@/components/challenge-me'
import ProgressIO from '@/components/progress-io'
import { ScoreBar, StatusLabel } from '@/components/mastery-bits'
import { ALL_EXERCISES, DAY_BY_DATE, DAY_OF_EXERCISE, INTERVIEW_DATE } from '@/data/curriculum'
import { skillName } from '@/data/skills'
import { daysBetween, formatMinutes, localDate, longDate } from '@/lib/dates'
import { dayStats, nextExercise, weakestSkills } from '@/lib/progress'
import { buildReviewSession, dueReviews } from '@/lib/schedule'
import { buildSkillSession, createSession } from '@/lib/sessions'

export default function Dashboard() {
  const router = useRouter()
  const { repo, attempts, reviews, mastery, today, loaded } = useReps()
  const [busy, setBusy] = useState(false)
  const day = DAY_BY_DATE[today]
  const stats = dayStats(day, attempts)
  const next = nextExercise(day, attempts)
  const due = dueReviews(reviews)
  const weakest = weakestSkills(mastery, 6)
  const daysLeft = Math.max(0, daysBetween(localDate(), INTERVIEW_DATE))
  const started = stats.completed > 0

  const startReview = async () => {
    setBusy(true)
    const ids = buildReviewSession(due, ALL_EXERCISES, DAY_OF_EXERCISE, attempts, today, new Date())
    if (ids.length) {
      const s = await createSession(repo, 'review', 'Review Reps', ids)
      router.push(`/rep/${ids[0]}?s=${s.id}`)
    }
    setBusy(false)
  }

  const startWeakest = async () => {
    setBusy(true)
    const ids = buildSkillSession(
      weakest.map((m) => m.skillId),
      attempts,
      today,
      10,
    )
    if (ids.length) {
      const s = await createSession(repo, 'weakest', 'Weakest skills', ids)
      router.push(`/rep/${ids[0]}?s=${s.id}`)
    }
    setBusy(false)
  }

  return (
    <main className="mx-auto w-full max-w-[1080px] px-5 pb-28 pt-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[13px] text-muted">
            <span suppressHydrationWarning>{longDate(localDate())}</span> · Google SWE Internship · October 12
          </p>
          <h1 className="mt-1 text-[32px] font-semibold tracking-tight">Today&apos;s Reps</h1>
          <p className="mt-1 text-[15px] text-ink-2">{day.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {next ? (
            <Link href={`/rep/${next.id}`} className="btn btn-primary btn-lg" data-testid="start-today">
              {started ? 'Continue today’s reps' : 'Start today’s reps'} →
            </Link>
          ) : (
            <Link href={`/day/${today}/summary`} className="btn btn-primary btn-lg">
              Reps complete · Review the day
            </Link>
          )}
        </div>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        <Stat label="Days to interview" value={String(daysLeft)} sub="Oct 12 · Google" />
        <Stat label="Today" value={`${stats.percent}%`} sub={`${stats.completed} of ${stats.total} reps`} bar={stats.percent} />
        <Stat label="Remaining" value={formatMinutes(stats.minutesRemaining)} sub="estimated practice" />
        <Stat label="Reviews due" value={String(due.length)} sub={due.length ? 'cold reps waiting' : 'nothing due'} />
      </dl>

      <section className="mt-8" aria-labelledby="focus">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="focus" className="text-[15px] font-semibold tracking-tight">
            Today&apos;s focus
          </h2>
          <Link href={`/day/${today}`} className="text-[13px] text-muted hover:text-ink">
            All {stats.total} reps →
          </Link>
        </div>
        <p className="mt-1 max-w-[720px] text-[14px] text-muted">{day.focus}</p>
        <div className="mt-4">
          <LearningPath day={day} attempts={attempts} />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="plan">
        <h2 id="plan" className="sr-only">
          Plan
        </h2>
        <DateStrip today={today} attempts={attempts} />
      </section>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="weakest">
          <div className="flex items-baseline justify-between">
            <h2 id="weakest" className="text-[15px] font-semibold tracking-tight">
              Weakest skills
            </h2>
            {weakest.length > 0 && (
              <button type="button" className="text-[13px] text-muted hover:text-ink" onClick={startWeakest} disabled={busy}>
                Do reps →
              </button>
            )}
          </div>
          {weakest.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted">{loaded ? 'Nothing yet. Weak spots show up after a few reps.' : ' '}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {weakest.map((m) => (
                <li key={m.skillId}>
                  <Link href={`/skills/${m.skillId}`} className="grid grid-cols-[1fr_auto_auto_92px] items-center gap-4 py-2 text-[14px] hover:bg-surface">
                    <span>{skillName(m.skillId)}</span>
                    <ScoreBar score={m.score} />
                    <span className="w-6 text-right tabular-nums text-ink-2">{m.score}</span>
                    <StatusLabel status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-8" aria-label="More practice">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">Review Reps</h2>
            <p className="mt-1 text-[14px] text-muted">
              {due.length ? `${due.length} skill${due.length === 1 ? '' : 's'} ready for a cold rep.` : 'Nothing due right now. Cold reps resurface skills you produced earlier.'}
            </p>
            {due.length > 0 && (
              <button type="button" className="btn mt-3" onClick={startReview} disabled={busy}>
                Start review reps
              </button>
            )}
          </div>
          <ChallengeMe />
        </section>
      </div>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="text-[12.5px] text-faint">Build fluency through repetition.</p>
        <ProgressIO />
      </footer>
    </main>
  )
}

function Stat({ label, value, sub, bar }: { label: string; value: string; sub: string; bar?: number }) {
  return (
    <div className="flex flex-col gap-1 bg-bg px-4 py-3.5">
      <dt className="label">{label}</dt>
      <dd className="text-[22px] font-semibold tracking-tight tabular-nums">{value}</dd>
      <dd className="text-[12.5px] text-muted">{sub}</dd>
      {bar !== undefined && (
        <dd className="bar mt-1" aria-hidden="true">
          <span style={{ width: `${bar}%` }} />
        </dd>
      )}
    </div>
  )
}
