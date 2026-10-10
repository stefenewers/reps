'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { useReps } from '@/components/reps-provider'
import RoadToReady from '@/components/road-to-ready'
import { InterviewTargetCompact } from '@/components/interview-target'
import LearningPath from '@/components/learning-path'
import ChallengeMe from '@/components/challenge-me'
import ProgressIO from '@/components/progress-io'
import LeetcodeList from '@/components/leetcode-list'
import { ScoreBar, StatusLabel } from '@/components/mastery-bits'
import { kindOf } from '@/components/rep-kind'
import { BarsPattern, EmptyState, RepsBars } from '@/components/motif'
import { ConceptGlyph } from '@/components/concept-icons'
import { IconArrowRight, IconClock, IconSnow, IconSpark } from '@/components/icons'
import WinstonPerch from '@/components/winston-perch'
import { ALL_EXERCISES, DAY_BY_DATE, DAY_OF_EXERCISE, DAYS, MODULE_OF_EXERCISE, dayExercises, dayLabel } from '@/data/curriculum'
import { PROGRAM_STAGES } from '@/data/program'
import { skillName } from '@/data/skills'
import { formatMinutes, localDate, parseLocal } from '@/lib/dates'
import { blockingGate, dayStats, nextExercise, passedSet, weakestSkills } from '@/lib/progress'
import { buildReviewSession, dueReviews } from '@/lib/schedule'
import { buildSkillSession, createSession } from '@/lib/sessions'

const LONG_DAY = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

const noop = () => () => {}

export default function Dashboard() {
  // The page is prerendered at deploy time, so "today" on the server is the deploy date.
  // Draw the day only once we are in the browser and know the real one.
  const inBrowser = useSyncExternalStore(noop, () => true, () => false)
  if (!inBrowser) return <main className="relative flex-1 bg-canvas" aria-busy="true" />
  return <DashboardToday />
}

function DashboardToday() {
  const router = useRouter()
  const { repo, attempts, reviews, mastery, today, loaded } = useReps()
  const [busy, setBusy] = useState(false)
  const day = DAY_BY_DATE[today]
  const lcToday = day.leetcode ?? []
  const stats = dayStats(day, attempts)
  const passed = passedSet(attempts)
  // An uncleared mastery check from an earlier day comes first: it is what holds today's reps.
  const carry = blockingGate(day, 0, attempts)
  const next = carry ? carry.exercises.find((e) => !passed.has(e.id)) : nextExercise(day, attempts)
  const all = dayExercises(day)
  const nextIndex = next ? all.findIndex((e) => e.id === next.id) + 1 : all.length
  const section = carry ?? (next ? day.sections.find((s) => !s.optional && s.exercises.some((e) => e.id === next.id)) : undefined)
  const sectionLeft = section ? section.exercises.filter((e) => !passed.has(e.id)).reduce((n, e) => n + e.minutes, 0) : 0
  const due = dueReviews(reviews)
  const weakest = weakestSkills(mastery, 5)
  // The topic the next rep belongs to (a calendar day can span two topics).
  const todayStage = PROGRAM_STAGES.find((s) => s.dayDate === (next ? MODULE_OF_EXERCISE[next.id] : day.modules?.[day.modules.length - 1]))
  const started = stats.completed > 0
  const nextKind = next ? kindOf(next) : null
  // Done early? The next scheduled rep on a later day, to get ahead.
  const ahead = next
    ? undefined
    : DAYS.filter((d) => d.date > today)
        .map((d) => nextExercise(d, attempts))
        .find(Boolean)

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
        <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <p className="eyebrow text-muted" suppressHydrationWarning>
              {LONG_DAY.format(parseLocal(localDate()))} · {dayLabel(day)}
            </p>
            <h1 className="display-xl mt-2">Today&apos;s Reps</h1>
            <p className="mt-2 text-[16px] text-ink-2">{day.title}</p>
          </div>
          <InterviewTargetCompact />
        </header>

        {/* The anchor: the one thing to do now. */}
        <section aria-labelledby="now" className="relative mt-9 overflow-hidden rounded-[20px] bg-bg shadow-[0_0_0_1px_var(--hairline),0_2px_4px_rgba(28,24,12,0.04),0_18px_40px_-16px_rgba(28,24,12,0.18)]">
          <BarsPattern className="-right-10 -top-16 text-ink [mask-image:linear-gradient(to_bottom,black,transparent)]" opacity={0.045} />
          <div className="relative flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
              <span className="eyebrow text-ink-2">
                {carry ? `Finish first · ${carry.title}` : `${day.planDay ? day.title : (todayStage?.title ?? day.short)} · ${next ? (started ? 'Continue' : 'Start here') : 'Done for today'}`}
              </span>
            </div>

            {next && section ? (
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-white shadow-[0_6px_14px_-6px_rgba(13,13,14,0.5)]">
                    <ConceptGlyph name={section?.title ?? day.short} size={22} />
                  </span>
                  <div className="min-w-0">
                    <h2 id="now" className="text-[28px] font-semibold leading-tight tracking-tight">
                      {section.title}
                    </h2>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-muted">
                      <span className="num font-medium text-ink-2">
                        {carry ? `Carried over · ${carry.exercises.filter((e) => !passed.has(e.id)).length} left to clear` : `Rep ${nextIndex} of ${all.length}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      {nextKind && (
                        <span className="inline-flex items-center gap-1.5 text-ink-2">
                          <nextKind.Icon size={13} className="text-muted" /> {next.title}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Link href={`/rep/${next.id}`} className="btn btn-accent btn-lg shrink-0 self-start lg:self-auto" data-testid="start-today">
                  {carry ? 'Continue' : started ? 'Continue' : 'Start today’s reps'} <IconArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                {day.phase === 'off' || (stats.total === 0 && !lcToday.length) ? (
                  <EmptyState title="Rest day">Nothing is planned today. Rest is part of the plan.</EmptyState>
                ) : stats.total === 0 && lcToday.length ? (
                  <EmptyState title="LeetCode day">No ladder reps today. Today’s work is the LeetCode list below.</EmptyState>
                ) : (
                  <EmptyState title="Reps complete">
                    Every required rep for today is done.{lcToday.length ? ' Your LeetCode problems for today are below.' : ' Cold reps are scheduled for tomorrow.'}
                  </EmptyState>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/day/${today}/summary`} className="btn btn-lg">
                    Review the day
                  </Link>
                  {ahead && (
                    <Link href={`/rep/${ahead.id}`} className="btn btn-primary btn-lg">
                      Get ahead: {ahead.title.replace(/^[A-Za-z]+: /, '')} <IconArrowRight size={15} />
                    </Link>
                  )}
                </div>
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

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 px-2 sm:grid-cols-3">
          <MiniStat label="Done today" value={`${stats.completed}`} sub={`of ${stats.total} reps · ${stats.percent}%`} />
          <MiniStat label="Planned" value={formatMinutes(stats.minutesRemaining)} sub="left today" />
          <MiniStat label="Cold reps" value={String(due.length)} sub={due.length ? 'due now' : 'none due'} />
        </dl>

        <div className="mt-8 empty:hidden">
          <LeetcodeList day={day} />
        </div>

        <div className="mt-8">
          <RoadToReady />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <section aria-labelledby="path" className="panel p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="path" className="h2 flex items-center gap-2">
                  <RepsBars width={16} bar={2.5} gap={2} className="text-ink" /> Today&apos;s path
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
            <section aria-labelledby="reviews" className="card p-5">
              <h2 id="reviews" className="sr-only">
                Review Reps
              </h2>
              {due.length ? (
                <div className="flex items-center gap-4">
                  <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-white">
                    <IconSnow size={19} />
                    <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-accent shadow-[0_0_0_2px_var(--bg)]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">
                      {due.length} cold rep{due.length === 1 ? '' : 's'} ready
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted">Recall it before it fades.</p>
                  </div>
                  <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={startReview} disabled={busy}>
                    Start
                  </button>
                </div>
              ) : (
                <EmptyState title="All clear." glyph={<IconSnow size={19} />}>
                  No cold reps due yet. They come back a day after you write something.
                </EmptyState>
              )}
            </section>

            <section aria-labelledby="weakest" className="card p-5">
              <div className="flex items-baseline justify-between">
                <h2 id="weakest" className="h3 flex items-center gap-2">
                  <IconSpark size={14} className="text-muted" /> Weakest skills
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

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[12px] text-faint">{label}</dt>
      <dd className="num mt-0.5 text-[17px] font-semibold tracking-tight">
        {value} <span className="text-[12.5px] font-normal text-muted">{sub}</span>
      </dd>
    </div>
  )
}
