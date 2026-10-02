'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { DAY_BY_DATE } from '@/data/curriculum'
import { PROBLEM_BY_ID } from '@/data/problems'
import { MOCKS } from '@/data/mocks'
import { formatMinutes, longDate } from '@/lib/dates'
import { REP_TYPE_LABEL } from '@/lib/labels'
import { attemptedSet, dayStats, exerciseUnlocked, nextExercise, passedSet, sectionUnlocked } from '@/lib/progress'

export default function DayView({ date }: { date: string }) {
  const { attempts, today } = useReps()
  const day = DAY_BY_DATE[date]
  if (!day) {
    return (
      <main className="mx-auto w-full max-w-[880px] px-5 py-16">
        <p className="text-muted">No reps planned for {date}.</p>
      </main>
    )
  }
  const stats = dayStats(day, attempts)
  const passed = passedSet(attempts)
  const tried = attemptedSet(attempts)
  const next = nextExercise(day, attempts)
  let n = 0

  return (
    <main className="mx-auto w-full max-w-[880px] px-5 pb-28 pt-10">
      <p className="text-[13px] text-muted">
        {longDate(day.date)}
        {day.date === today ? ' · Today' : ''}
      </p>
      <h1 className="mt-1 text-[32px] font-semibold tracking-tight">{day.date === '2026-10-11' ? 'Interview Reps' : 'Today’s Reps'}</h1>
      <p className="mt-1 text-[15px] text-ink-2">{day.title}</p>
      <p className="mt-2 max-w-[680px] text-[14px] text-muted">{day.focus}</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        {next ? (
          <Link href={`/rep/${next.id}`} className="btn btn-primary btn-lg">
            {stats.completed ? 'Continue' : 'Start'} →
          </Link>
        ) : (
          <Link href={`/day/${day.date}/summary`} className="btn btn-primary btn-lg">
            Review the day
          </Link>
        )}
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <div className="flex justify-between text-[12.5px] text-muted">
            <span>
              {stats.completed} of {stats.total} reps · {stats.percent}%
            </span>
            <span>{formatMinutes(stats.minutesRemaining)} left</span>
          </div>
          <div className="bar" aria-hidden="true">
            <span style={{ width: `${stats.percent}%` }} />
          </div>
        </div>
        {stats.completed > 0 && (
          <Link href={`/day/${day.date}/summary`} className="text-[13px] text-muted hover:text-ink">
            Day summary
          </Link>
        )}
      </div>

      {day.capstones.length > 0 && (
        <p className="mt-6 text-[13px] text-muted">
          Capstones:{' '}
          {day.capstones.map((c, i) => (
            <span key={c}>
              {i > 0 && ' · '}
              <span className="text-ink-2">{PROBLEM_BY_ID[c]?.title}</span>
            </span>
          ))}
        </p>
      )}
      {day.mocks && day.mocks.length > 0 && (
        <p className="mt-2 text-[13px] text-muted">
          Includes {day.mocks.length} mock interviews ·{' '}
          <Link href="/interview" className="text-ink underline decoration-line-strong underline-offset-2">
            Interview Reps
          </Link>{' '}
          ({MOCKS.map((m) => m.minutes).join(' + ')} min)
        </p>
      )}

      <ol className="mt-10 flex flex-col gap-10">
        {day.sections.map((s, si) => {
          const unlocked = sectionUnlocked(day, si, attempts)
          const done = s.exercises.filter((e) => passed.has(e.id)).length
          return (
            <li key={s.id} aria-labelledby={`sec-${s.id}`}>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
                <h2 id={`sec-${s.id}`} className="text-[16px] font-semibold tracking-tight">
                  {s.title}
                  {!unlocked && <span className="ml-2 text-[12px] font-normal text-faint">Locked · finish more of the previous block</span>}
                </h2>
                <span className="text-[12px] tabular-nums text-muted">
                  {done}/{s.exercises.length}
                </span>
              </div>
              <p className="mt-2 text-[13.5px] text-muted">{s.summary}</p>
              <ol className="mt-3 flex flex-col">
                {s.exercises.map((e) => {
                  n++
                  const isDone = passed.has(e.id)
                  const isTried = tried.has(e.id) && !isDone
                  const open = exerciseUnlocked(day, e.id, attempts)
                  const isNext = next?.id === e.id
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/rep/${e.id}`}
                        className={`grid grid-cols-[36px_18px_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 text-[14px] hover:bg-surface ${isNext ? 'bg-surface-2' : ''} ${!open && !isDone ? 'text-muted' : ''}`}
                        aria-label={`Rep ${n}: ${e.title}. ${isDone ? 'Complete.' : isTried ? 'Attempted, not passed.' : open ? '' : 'Locked, open anyway.'}`}
                      >
                        <span className="text-right text-[11.5px] tabular-nums text-faint">{n}</span>
                        <span aria-hidden="true" className={isDone ? 'text-pass' : isTried ? 'text-warn' : 'text-faint'}>
                          {isDone ? '✓' : isTried ? '◐' : open ? '○' : '·'}
                        </span>
                        <span className="truncate">{e.title}</span>
                        <span className="text-[11.5px] text-faint">
                          {e.repType === 'foundation' ? '' : REP_TYPE_LABEL[e.repType]} {e.minutes >= 5 ? `· ${Math.round(e.minutes)} min` : ''}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
