'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useReps } from '@/components/reps-provider'
import DateStrip from '@/components/date-strip'
import LearningPath from '@/components/learning-path'
import ChallengeMe from '@/components/challenge-me'
import ProgressIO from '@/components/progress-io'
import ProgressRing from '@/components/progress-ring'
import { ScoreBar, StatusLabel } from '@/components/mastery-bits'
import { kindOf } from '@/components/rep-kind'
import { IconArrowRight, IconSnow } from '@/components/icons'
import { ALL_EXERCISES, DAY_BY_DATE, DAY_OF_EXERCISE, DAYS, INTERVIEW_DATE } from '@/data/curriculum'
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
  const dayIndex = DAYS.findIndex((d) => d.date === today) + 1
  const stats = dayStats(day, attempts)
  const next = nextExercise(day, attempts)
  const all = day.sections.flatMap((s) => s.exercises)
  const nextIndex = next ? all.findIndex((e) => e.id === next.id) + 1 : all.length
  const nextSection = next ? day.sections.find((s) => s.exercises.some((e) => e.id === next.id)) : undefined
  const due = dueReviews(reviews)
  const weakest = weakestSkills(mastery, 5)
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
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-muted">
              <span suppressHydrationWarning>{longDate(localDate())}</span> · Day {dayIndex} of {DAYS.length}
            </p>
            <h1 className="display mt-1.5">Today&apos;s Reps</h1>
            <p className="mt-1.5 text-[15.5px] text-ink-2">{day.title}</p>
          </div>
          <p className="text-[13px] text-muted">Google SWE Internship · October 12</p>
        </header>

        {/* The one thing to do now */}
        <section aria-labelledby="now" className="panel mt-8 overflow-hidden">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-7">
            <ProgressRing value={stats.percent} size={76} stroke={6} label={`${stats.percent}% of today's reps complete`}>
              <span className="num text-[17px] font-semibold tracking-tight">{stats.percent}%</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p id="now" className="label">
                {next ? (started ? 'Continue' : 'Start here') : 'Done for today'}
              </p>
              {next ? (
                <>
                  <h2 className="h1 mt-1 truncate">{nextSection?.title}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[14px] text-muted">
                    <span className="num">
                      Rep {nextIndex} of {all.length}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5 text-ink-2">
                      {(() => {
                        const k = kindOf(next)
                        return (
                          <>
                            <k.Icon size={13} className="text-muted" /> {next.title}
                          </>
                        )
                      })()}
                    </span>
                  </p>
                </>
              ) : (
                <h2 className="h1 mt-1">Reps complete</h2>
              )}
            </div>
            {next ? (
              <Link href={`/rep/${next.id}`} className="btn btn-primary btn-lg shrink-0" data-testid="start-today">
                {started ? 'Continue' : 'Start today’s reps'} <IconArrowRight size={15} />
              </Link>
            ) : (
              <Link href={`/day/${today}/summary`} className="btn btn-primary btn-lg shrink-0">
                Review the day <IconArrowRight size={15} />
              </Link>
            )}
          </div>
          <dl className="grid grid-cols-2 bg-surface sm:grid-cols-4" style={{ boxShadow: '0 -1px 0 var(--line)' }}>
            <Stat label="Reps done" value={`${stats.completed}`} sub={`of ${stats.total} today`} />
            <Stat label="Remaining" value={formatMinutes(stats.minutesRemaining)} sub="planned practice" />
            <Stat label="Reviews due" value={String(due.length)} sub={due.length ? 'cold reps ready' : 'all clear'} />
            <Stat label="Interview" value={`${daysLeft} day${daysLeft === 1 ? '' : 's'}`} sub="Google · Oct 12" />
          </dl>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <section aria-labelledby="path" className="panel p-6">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <div>
                <h2 id="path" className="h2">
                  Today&apos;s path
                </h2>
                <p className="mt-1 max-w-[520px] text-[13.5px] leading-relaxed text-muted">{day.focus}</p>
              </div>
              <Link href={`/day/${today}`} className="shrink-0 text-[13px] text-muted hover:text-ink">
                All reps →
              </Link>
            </div>
            <LearningPath day={day} attempts={attempts} reviews={reviews} />
          </section>

          <div className="flex flex-col gap-6">
            <section aria-labelledby="reviews" className="card p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <IconSnow size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="reviews" className="h3">
                    Review Reps
                  </h2>
                  <p className="mt-0.5 text-[13.5px] text-muted">
                    {due.length ? `${due.length} skill${due.length === 1 ? '' : 's'} ready for a cold rep.` : 'You’re clear. No review reps due yet.'}
                  </p>
                </div>
                {due.length > 0 && (
                  <button type="button" className="btn btn-sm shrink-0" onClick={startReview} disabled={busy}>
                    Start
                  </button>
                )}
              </div>
            </section>

            <section aria-labelledby="weakest" className="card p-5">
              <div className="flex items-baseline justify-between">
                <h2 id="weakest" className="h3">
                  Weakest skills
                </h2>
                {weakest.length > 0 && (
                  <button type="button" className="text-[13px] text-muted hover:text-ink" onClick={startWeakest} disabled={busy}>
                    Do reps →
                  </button>
                )}
              </div>
              {weakest.length === 0 ? (
                <p className="mt-2 text-[13.5px] text-muted">{loaded ? 'Nothing to flag yet. Weak spots show up after a few reps.' : ' '}</p>
              ) : (
                <ul className="mt-3 flex flex-col">
                  {weakest.map((m) => (
                    <li key={m.skillId}>
                      <Link href={`/skills/${m.skillId}`} className="-mx-2 grid grid-cols-[1fr_64px_24px] items-center gap-3 rounded-lg px-2 py-2 text-[13.5px] hover:bg-surface">
                        <span className="truncate">
                          {skillName(m.skillId)}
                          <span className="ml-2">
                            <StatusLabel status={m.status} compact />
                          </span>
                        </span>
                        <ScoreBar score={m.score} className="!w-16" />
                        <span className="num text-right text-ink-2">{m.score}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-5">
              <ChallengeMe />
            </section>
          </div>
        </div>

        <section className="mt-10" aria-labelledby="plan">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="plan" className="h2">
              The plan
            </h2>
            <p className="text-[12.5px] text-muted">Ten days to October 12</p>
          </div>
          <DateStrip today={today} attempts={attempts} />
        </section>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 pt-5" style={{ boxShadow: '0 -1px 0 var(--line)' }}>
          <p className="text-[12.5px] text-faint">Build fluency through repetition.</p>
          <ProgressIO />
        </footer>
      </div>
    </main>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-6 py-4 sm:px-7">
      <dt className="label">{label}</dt>
      <dd className="num mt-1 text-[19px] font-semibold tracking-tight">{value}</dd>
      <dd className="text-[12.5px] text-muted">{sub}</dd>
    </div>
  )
}
