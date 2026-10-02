'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import ProgressRing from '@/components/progress-ring'
import { kindOf, compositionText } from '@/components/rep-kind'
import { IconArrowRight, IconCheck, IconLock } from '@/components/icons'
import { ConceptGlyph, sectionKind } from '@/components/concept-icons'
import { DAY_BY_DATE, DAYS } from '@/data/curriculum'
import { PROBLEM_BY_ID } from '@/data/problems'
import { MOCKS } from '@/data/mocks'
import { formatMinutes, longDate } from '@/lib/dates'
import { attemptedSet, dayStats, exerciseUnlocked, nextExercise, passedSet, sectionUnlocked } from '@/lib/progress'

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
  const dayNumber = DAYS.findIndex((d) => d.date === day.date) + 1
  const currentSection = day.sections.findIndex((s) => s.exercises.some((e) => !passed.has(e.id)))
  const offsets = day.sections.map((_, i) => day.sections.slice(0, i).reduce((c, x) => c + x.exercises.length, 0))

  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[920px] px-5 pb-28 pt-10 sm:px-8">
        <p className="text-[13px] text-muted">
          {longDate(day.date)} · Day {dayNumber} of {DAYS.length}
          {day.date === today ? ' · Today' : ''}
        </p>
        <h1 className="display-xl mt-1.5">{day.date === '2026-10-11' ? 'Interview Reps' : day.short}</h1>
        <p className="mt-1.5 text-[15.5px] text-ink-2">{day.title}</p>
        <p className="mt-2 max-w-[680px] text-[14px] leading-relaxed text-muted">{day.focus}</p>

        <section className="accent-wash mt-7 flex flex-col gap-5 rounded-[20px] p-6 shadow-[0_0_0_1px_rgba(49,87,213,0.14),0_14px_36px_-14px_rgba(49,87,213,0.25)] sm:flex-row sm:items-center">
          <ProgressRing value={stats.percent} size={64} stroke={5} tone="accent">
            <span className="num text-[15px] font-semibold">{stats.percent}%</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="num text-[15px] font-semibold">
              {stats.completed} of {stats.total} reps
            </p>
            <p className="mt-0.5 text-[13.5px] text-muted">
              {formatMinutes(stats.minutesRemaining)} left · {compositionText(day.sections.flatMap((s) => s.exercises))}
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
          {day.sections.map((s, si) => {
            const unlocked = sectionUnlocked(day, si, attempts)
            const done = s.exercises.filter((e) => passed.has(e.id)).length
            const complete = done === s.exercises.length && s.exercises.length > 0
            const isCurrent = si === currentSection
            const minutes = s.exercises.reduce((m, e) => m + e.minutes, 0)
            const sectionNext = s.exercises.find((e) => !passed.has(e.id))
            const sk = sectionKind(s.title, s.exercises)
            const startN = offsets[si]
            return (
              <li
                key={s.id}
                aria-labelledby={`sec-${s.id}`}
                className={`overflow-hidden rounded-2xl ${
                  isCurrent ? 'panel shadow-[0_0_0_1.5px_rgba(49,87,213,0.35),var(--shadow-md)]' : complete ? 'bg-green-soft/50 shadow-[0_0_0_1px_rgba(36,166,106,0.18)]' : 'card'
                }`}
              >
                <div className="flex flex-wrap items-start gap-4 px-5 py-4 sm:px-6">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                      complete
                        ? 'bg-green text-white'
                        : isCurrent
                          ? 'bg-accent text-white shadow-[0_4px_12px_-4px_rgba(49,87,213,0.6)]'
                          : sk === 'capstone'
                            ? 'bg-ink text-white'
                            : sk === 'cold'
                              ? 'bg-violet-soft text-violet'
                              : 'bg-surface-2 text-muted'
                    }`}
                  >
                    {complete ? <IconCheck size={16} strokeWidth={2.2} /> : !unlocked && sk === 'normal' ? <IconLock size={14} /> : <ConceptGlyph name={s.title} size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <h2 id={`sec-${s.id}`} className="h2">
                        {s.title}
                      </h2>
                      {complete && <span className="text-[12px] font-medium text-green-ink">Done</span>}
                      {isCurrent && <span className="text-[12px] font-medium text-accent">In progress</span>}
                      {!unlocked && !complete && <span className="text-[12px] text-faint">Up next · open any rep anyway</span>}
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
                        <li key={e.id}>
                          <Link
                            href={`/rep/${e.id}`}
                            className={`group grid grid-cols-[30px_22px_1fr_auto] items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors hover:bg-surface ${isNext ? 'bg-accent-soft/60 hover:bg-accent-soft' : ''} ${
                              !open && !isDone ? 'text-muted' : ''
                            }`}
                            aria-label={`Rep ${num}: ${e.title}, ${k.short}. ${isDone ? 'Complete.' : isTried ? 'Attempted, not passed.' : isNext ? 'Next up.' : ''}`}
                          >
                            <span className="num text-right text-[11.5px] text-faint">{num}</span>
                            <span
                              aria-hidden="true"
                              className={`grid size-[22px] place-items-center rounded-md ${
                                isDone
                                  ? 'bg-green-soft text-green'
                                  : isTried
                                    ? 'bg-fail-soft text-fail'
                                    : k.key === 'debug'
                                      ? 'bg-amber-soft text-amber-ink'
                                      : k.key === 'cold'
                                        ? 'bg-violet-soft text-violet'
                                        : k.key === 'capstone'
                                          ? 'bg-ink text-white'
                                          : k.key === 'code'
                                            ? 'bg-accent-soft text-accent'
                                            : 'bg-surface-2 text-muted'
                              }`}
                            >
                              {isDone ? <IconCheck size={12} strokeWidth={2.2} /> : <k.Icon size={12} />}
                            </span>
                            <span className={`truncate ${isNext ? 'font-medium text-ink' : ''}`}>{e.title}</span>
                            <span className="flex items-center gap-2 text-[11.5px] text-faint">
                              <span className={k.key === 'debug' ? 'font-medium text-amber-ink' : k.key === 'capstone' ? 'font-medium text-ink' : k.key === 'cold' ? 'font-medium text-violet-ink' : ''}>{k.short}</span>
                              <span className="num w-10 text-right">{Math.round(e.minutes)} min</span>
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </main>
  )
}
