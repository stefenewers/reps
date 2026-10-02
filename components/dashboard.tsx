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
import { kindOf } from '@/components/rep-kind'
import { BarsPattern, EmptyState, RepsBars } from '@/components/motif'
import { ConceptGlyph, GlyphTimer } from '@/components/concept-icons'
import { IconArrowRight, IconClock, IconSnow, IconSpark } from '@/components/icons'
import WinstonPerch from '@/components/winston-perch'
import { ALL_EXERCISES, DAY_BY_DATE, DAY_OF_EXERCISE, DAYS, INTERVIEW_DATE } from '@/data/curriculum'
import { skillName } from '@/data/skills'
import { daysBetween, formatMinutes, localDate, parseLocal } from '@/lib/dates'
import { dayStats, nextExercise, passedSet, weakestSkills } from '@/lib/progress'
import { buildReviewSession, dueReviews } from '@/lib/schedule'
import { buildSkillSession, createSession } from '@/lib/sessions'

const LONG_DAY = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

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
  const section = next ? day.sections.find((s) => s.exercises.some((e) => e.id === next.id)) : undefined
  const passed = passedSet(attempts)
  const sectionLeft = section ? section.exercises.filter((e) => !passed.has(e.id)).reduce((n, e) => n + e.minutes, 0) : 0
  const due = dueReviews(reviews)
  const weakest = weakestSkills(mastery, 5)
  const daysLeft = Math.max(0, daysBetween(localDate(), INTERVIEW_DATE))
  const started = stats.completed > 0
  const nextKind = next ? kindOf(next) : null

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
    <main className="relative flex-1 bg-canvas">
      {/* Atmosphere: a faint dot field that fades out under the hero. */}
      <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[360px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <div className="relative mx-auto w-full max-w-[1120px] px-5 pb-10 pt-12 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-muted" suppressHydrationWarning>
              {LONG_DAY.format(parseLocal(localDate()))}
            </p>
            <h1 className="display-xl mt-2">Today&apos;s Reps</h1>
            <p className="mt-2 text-[16px] text-ink-2">{day.title}</p>
          </div>
          <div className="flex items-end gap-5 pb-1">
            <div className="text-right">
              <p className="eyebrow text-faint">Day</p>
              <p className="num text-[28px] font-semibold leading-none tracking-tight">
                {dayIndex}
                <span className="text-[16px] font-medium text-faint"> / {DAYS.length}</span>
              </p>
            </div>
            <span aria-hidden="true" className="h-9 w-px bg-line-strong" />
            <div className="text-right">
              <p className="eyebrow text-faint">Google</p>
              <p className="num text-[28px] font-semibold leading-none tracking-tight">
                {daysLeft}
                <span className="text-[16px] font-medium text-faint"> days</span>
              </p>
            </div>
          </div>
        </header>

        {/* The anchor: the one thing to do now. */}
        <section aria-labelledby="now" className="accent-wash relative mt-9 overflow-hidden rounded-[22px] shadow-[0_0_0_1px_rgba(49,87,213,0.14),0_2px_4px_rgba(28,24,12,0.04),0_18px_44px_-12px_rgba(49,87,213,0.22)]">
          <BarsPattern className="-right-10 -top-16 text-accent [mask-image:linear-gradient(to_bottom,black,transparent)]" opacity={0.06} />
          <div className="relative flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-accent">
                Day {dayIndex} · {next ? (started ? 'Continue' : 'Start here') : 'Done for today'}
              </span>
            </div>

            {next && section ? (
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-bg text-accent shadow-[0_0_0_1px_rgba(49,87,213,0.16),0_4px_12px_-4px_rgba(49,87,213,0.35)]">
                    <ConceptGlyph name={section?.title ?? day.short} size={22} />
                  </span>
                  <div className="min-w-0">
                    <h2 id="now" className="text-[28px] font-semibold leading-tight tracking-tight">
                      {section.title}
                    </h2>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-muted">
                      <span className="num font-medium text-ink-2">
                        Rep {nextIndex} of {all.length}
                      </span>
                      <span aria-hidden="true">·</span>
                      {nextKind && (
                        <span className="inline-flex items-center gap-1.5 text-ink-2">
                          <nextKind.Icon size={13} className="text-accent" /> {next.title}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Link href={`/rep/${next.id}`} className="btn btn-accent btn-lg shrink-0 self-start lg:self-auto" data-testid="start-today">
                  {started ? 'Continue' : 'Start today’s reps'} <IconArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <EmptyState title="Reps complete" tone="green">
                  Every rep for today is done. Cold reps are scheduled for tomorrow.
                </EmptyState>
                <Link href={`/day/${today}/summary`} className="btn btn-primary btn-lg">
                  Review the day <IconArrowRight size={15} />
                </Link>
              </div>
            )}

            {next && section && (
              <div className="flex flex-col gap-2">
                {/* One bar per rep in this section: the motif as progress. */}
                <div className="flex gap-1" aria-hidden="true">
                  {section.exercises.map((e) => (
                    <span
                      key={e.id}
                      className={`h-[6px] flex-1 rounded-full transition-colors duration-500 ${passed.has(e.id) ? 'bg-accent' : e.id === next.id ? 'bg-accent/35' : 'bg-ink/[0.07]'}`}
                    />
                  ))}
                </div>
                <p className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-muted">
                  <span className="num">
                    {section.exercises.filter((e) => passed.has(e.id)).length} of {section.exercises.length} in {section.title}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <IconClock size={13} /> {formatMinutes(sectionLeft)} left in this section
                  </span>
                </p>
              </div>
            )}
          </div>
        </section>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 px-2 sm:grid-cols-4">
          <MiniStat label="Done today" value={`${stats.completed}`} sub={`of ${stats.total} reps · ${stats.percent}%`} />
          <MiniStat label="Planned" value={formatMinutes(stats.minutesRemaining)} sub="left today" />
          <MiniStat label="Cold reps" value={String(due.length)} sub={due.length ? 'due now' : 'none due'} tone={due.length ? 'violet' : undefined} />
          <MiniStat label="Interview" value={`${daysLeft} days`} sub="Google · Oct 12" />
        </dl>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <section aria-labelledby="path" className="panel p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="path" className="h2 flex items-center gap-2">
                  <RepsBars width={16} bar={2.5} gap={2} className="text-accent" /> Today&apos;s path
                </h2>
                <p className="mt-1.5 max-w-[520px] text-[13.5px] leading-relaxed text-muted">{day.focus}</p>
              </div>
              <Link href={`/day/${today}`} className="shrink-0 text-[13px] text-muted hover:text-ink">
                All reps →
              </Link>
            </div>
            <LearningPath day={day} attempts={attempts} reviews={reviews} />
          </section>

          <div className="flex flex-col gap-4">
            <section aria-labelledby="reviews" className={`rounded-2xl p-5 ${due.length ? 'bg-violet-soft shadow-[0_0_0_1px_rgba(114,89,217,0.18)]' : 'card'}`}>
              <h2 id="reviews" className="sr-only">
                Review Reps
              </h2>
              {due.length ? (
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-bg text-violet shadow-sm">
                    <IconSnow size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">
                      {due.length} cold rep{due.length === 1 ? '' : 's'} ready
                    </p>
                    <p className="mt-0.5 text-[13px] text-violet-ink/80">Recall it before it fades.</p>
                  </div>
                  <button type="button" className="btn btn-sm shrink-0" onClick={startReview} disabled={busy}>
                    Start
                  </button>
                </div>
              ) : (
                <EmptyState title="All clear." tone="violet" glyph={<IconSnow size={20} />}>
                  No cold reps due yet. They come back a day after you write something.
                </EmptyState>
              )}
            </section>

            <section aria-labelledby="weakest" className="card p-5">
              <div className="flex items-baseline justify-between">
                <h2 id="weakest" className="h3 flex items-center gap-2">
                  <IconSpark size={14} className="text-amber" /> Weakest skills
                </h2>
                {weakest.length > 0 && (
                  <button type="button" className="text-[13px] text-muted hover:text-ink" onClick={startWeakest} disabled={busy}>
                    Do reps →
                  </button>
                )}
              </div>
              {weakest.length === 0 ? (
                <div className="mt-3">{loaded && <EmptyState title="Clean slate.">Weak spots will show up as you work.</EmptyState>}</div>
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
                        <ScoreBar score={m.score} status={m.status} className="!w-16" />
                        <span className="num text-right text-ink-2">{m.score}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl bg-ink p-5 text-white shadow-[var(--shadow-md)]">
              <ChallengeMe dark />
            </section>
          </div>
        </div>

        <section className="mt-12" aria-labelledby="plan">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="plan" className="h2 flex items-center gap-2">
              <GlyphTimer size={16} className="text-muted" /> The plan
            </h2>
            <p className="text-[12.5px] text-muted">Ten days to October 12</p>
          </div>
          <DateStrip today={today} attempts={attempts} />
        </section>

        <footer className="mt-12">
          <WinstonPerch className="mx-2" />
          <div className="flex flex-wrap items-center justify-between gap-4 px-2 pt-4">
            <p className="flex items-center gap-2 text-[12.5px] text-faint">
              <RepsBars width={14} bar={2} gap={1.5} /> Build fluency through repetition.
            </p>
            <ProgressIO />
          </div>
        </footer>
      </div>
    </main>
  )
}

function MiniStat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'violet' }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[12px] text-faint">{label}</dt>
      <dd className={`num mt-0.5 text-[17px] font-semibold tracking-tight ${tone === 'violet' ? 'text-violet-ink' : ''}`}>
        {value} <span className="text-[12.5px] font-normal text-muted">{sub}</span>
      </dd>
    </div>
  )
}
