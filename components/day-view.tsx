'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import ProgressRing from '@/components/progress-ring'
import { kindOf, compositionText } from '@/components/rep-kind'
import { IconArrowRight, IconCheck, IconLock } from '@/components/icons'
import { ConceptGlyph, sectionKind } from '@/components/concept-icons'
import { DAY_BY_DATE, dayExercises, dayLabel } from '@/data/curriculum'
import LeetcodeList from '@/components/leetcode-list'
import { PROBLEM_BY_ID } from '@/data/problems'
import { MOCKS } from '@/data/mocks'
import { formatMinutes, longDate } from '@/lib/dates'
import { attemptedSet, blockingGate, dayStats, exerciseUnlocked, nextExercise, passedSet, sectionUnlocked } from '@/lib/progress'

export default function DayView({ date }: { date: string }) {
  const { attempts, today } = useReps()
  const day = DAY_BY_DATE[date]
  if (!day) {
    return (
      <main className="flex-1 bg-canvas">
        <div className="mx-auto w-full max-w-[880px] px-5 py-16 text-muted">No reps planned for {date}.</div>
      </main>
    )
  }
  const stats = dayStats(day, attempts)
  const passed = passedSet(attempts)
  const tried = attemptedSet(attempts)
  const next = nextExercise(day, attempts)
  const currentSection = day.sections.findIndex((s) => !s.optional && s.exercises.some((e) => !passed.has(e.id)))
  const offsets = day.sections.map((_, i) => day.sections.slice(0, i).reduce((c, x) => c + x.exercises.length, 0))

  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[920px] px-5 pb-28 pt-10 sm:px-8">
        <p className="text-[13px] text-muted">
          {longDate(day.date)} · {dayLabel(day)}
          {day.date === today ? ' · Today' : ''}
        </p>
        <h1 className="display-xl mt-1.5">{day.short}</h1>
        <p className="mt-1.5 text-[15.5px] text-ink-2">{day.title}</p>
        <p className="mt-2 max-w-[680px] text-[14px] leading-relaxed text-muted">{day.focus}</p>

        <section className="panel mt-7 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <ProgressRing value={stats.percent} size={64} stroke={5} tone="accent">
            <span className="num text-[15px] font-semibold">{stats.percent}%</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="num text-[15px] font-semibold">
              {stats.completed} of {stats.total} reps
            </p>
            <p className="mt-0.5 text-[13.5px] text-muted">
              {formatMinutes(stats.minutesRemaining)} left · {compositionText(dayExercises(day))}
            </p>
            {(day.capstones.length > 0 || (day.mocks?.length ?? 0) > 0) && (
              <p className="mt-1.5 text-[13px] text-muted">
                {day.capstones.length > 0 && <>Capstones: {day.capstones.map((c) => PROBLEM_BY_ID[c]?.title).join(' · ')}</>}
                {day.mocks && day.mocks.length > 0 && (
                  <>
                    {day.capstones.length > 0 ? ' · ' : ''}
                    {day.mocks.length} mock interviews in{' '}
                    <Link href="/interview" className="text-ink underline decoration-line-strong underline-offset-4">
                      Interview Reps
                    </Link>{' '}
                    ({MOCKS.map((m) => m.minutes).join(' + ')} min)
                  </>
                )}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {stats.completed > 0 && (
              <Link href={`/day/${day.date}/summary`} className="btn btn-ghost">
                Day summary
              </Link>
            )}
            {next ? (
              <Link href={`/rep/${next.id}`} className="btn btn-accent btn-lg">
                {stats.completed ? 'Continue' : 'Start'} <IconArrowRight size={15} />
              </Link>
            ) : (
              <Link href={`/day/${day.date}/summary`} className="btn btn-primary btn-lg">
                Review the day <IconArrowRight size={15} />
              </Link>
            )}
          </div>
        </section>

        <ol className="mt-8 flex flex-col gap-4">
          {/* Only the required plan is shown. Extras (required sections come first, so indexes still line up) stay off the page. */}
          {day.sections.filter((s) => !s.optional).map((s, si) => {
            const unlocked = sectionUnlocked(day, si, attempts)
            const gated = s.optional ? undefined : blockingGate(day, si, attempts)
            const done = s.exercises.filter((e) => passed.has(e.id)).length
            const complete = done === s.exercises.length && s.exercises.length > 0
            const isCurrent = si === currentSection
            const minutes = s.exercises.reduce((m, e) => m + e.minutes, 0)
            const sectionNext = s.exercises.find((e) => !passed.has(e.id))
            const sk = sectionKind(s.title, s.exercises)
            const startN = offsets[si]
            return [
              <li
                key={s.id}
                aria-labelledby={`sec-${s.id}`}
                className={`relative overflow-hidden rounded-2xl ${isCurrent ? 'panel' : complete ? 'bg-bg/60 shadow-[0_0_0_1px_var(--hairline)]' : 'card'}`}
              >
                <div className="flex flex-wrap items-start gap-4 px-5 py-4 sm:px-6">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                      isCurrent || sk === 'capstone'
                        ? 'bg-ink text-white'
                        : complete
                          ? 'bg-surface-2 text-ink-2'
                          : 'bg-bg text-muted shadow-[0_0_0_1px_var(--line-strong)]'
                    }`}
                  >
                    {complete ? <IconCheck size={16} strokeWidth={2.2} /> : gated || (!unlocked && sk === 'normal') ? <IconLock size={14} /> : <ConceptGlyph name={s.title} size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <h2 id={`sec-${s.id}`} className="h2">
                        {s.title}
                      </h2>
                      {complete && <span className="text-[12px] text-muted">Done</span>}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" /> In progress
                        </span>
                      )}
                      {s.gate && !complete && <span className="text-[12px] font-medium text-accent-ink">Mastery check · no solutions</span>}
                      {gated ? (
                        <span className="text-[12px] text-faint">Locked · clear the {gated.title} first</span>
                      ) : (
                        !unlocked && !complete && <span className="text-[12px] text-faint">Up next · open any rep anyway</span>
                      )}
                    </div>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.summary}</p>
                    <p className="mt-1.5 text-[12.5px] text-faint">
                      {s.exercises.length} reps · {formatMinutes(minutes)} · {compositionText(s.exercises)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="num text-[12.5px] text-muted">
                      {done}/{s.exercises.length}
                    </span>
                    {isCurrent && sectionNext && (
                      <Link href={`/rep/${sectionNext.id}`} className="btn btn-sm">
                        Next rep <IconArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
                {(isCurrent || !complete) && (
                  <ol className="px-2 pb-2 sm:px-3">
                    {s.exercises.map((e, i) => {
                      const num = startN + i + 1
                      const isDone = passed.has(e.id)
                      const isTried = tried.has(e.id) && !isDone
                      const open = exerciseUnlocked(day, e.id, attempts)
                      const isNext = next?.id === e.id
                      const k = kindOf(e)
                      return (
                        <li key={e.id} className={gated ? 'pointer-events-none select-none opacity-60' : undefined}>
                          <Link
                            href={`/rep/${e.id}`}
                            tabIndex={gated ? -1 : undefined}
                            aria-disabled={gated ? true : undefined}
                            className={`group relative grid grid-cols-[30px_22px_1fr_auto] items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors hover:bg-surface ${isNext ? 'bg-surface-2 hover:bg-surface-2 before:absolute before:inset-y-2 before:left-0 before:w-[2px] before:rounded-full before:bg-accent' : ''} ${
                              !open && !isDone ? 'text-muted' : ''
                            }`}
                            aria-label={`Rep ${num}: ${e.title}, ${k.short}. ${isDone ? 'Complete.' : isTried ? 'Attempted, not passed.' : isNext ? 'Next up.' : ''}`}
                          >
                            <span className="num text-right text-[11.5px] text-faint">{num}</span>
                            <span
                              aria-hidden="true"
                              className={`grid size-[22px] place-items-center rounded-md ${
                                isDone ? 'text-pass' : isTried ? 'text-fail' : k.key === 'capstone' ? 'bg-ink text-white' : k.key === 'debug' ? 'text-amber' : 'text-muted'
                              }`}
                            >
                              {isDone ? <IconCheck size={12} strokeWidth={2.2} /> : <k.Icon size={12} />}
                            </span>
                            <span className={`truncate ${isNext ? 'font-medium text-ink' : ''}`}>{e.title}</span>
                            <span className="flex items-center gap-2 text-[11.5px] text-faint">
                              <span className={k.key === 'capstone' || k.key === 'debug' ? 'font-medium text-ink-2' : ''}>{k.short}</span>
                              <span className="num w-10 text-right">{Math.round(e.minutes)} min</span>
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </li>,
            ]
          })}
        </ol>

        {(day.leetcode?.length ?? 0) > 0 && (
          <div className="mt-8">
            <LeetcodeList items={day.leetcode!} heading={day.date === today ? 'On LeetCode today' : 'On LeetCode this day'} />
          </div>
        )}
      </div>
    </main>
  )
}
