'use client'

import Link from 'next/link'
import { formatMinutes, shortDate } from '@/lib/dates'
import type { PaceCalendar } from '@/lib/pace-calendar'
import type { DailyCapacity } from '@/lib/training-capacity'

/**
 * The pace gauge: where you are against the original line, and what today's
 * pace would cover. It reports; it does not set a target. A missed day moves
 * the needle and changes nothing else.
 */

/** How you came into today. It says nothing about whether today's own work is done. */
const HEADLINE = {
  'not-started': 'Not started yet',
  'on-pace': 'Starting today: on track',
  ahead: 'Starting today: ahead',
  behind: 'Behind the original line',
  complete: 'Queue complete',
} as const

export default function PaceGauge({ pace, planEnd, load }: { pace: PaceCalendar; planEnd: string; load?: DailyCapacity }) {
  const { status, finish, finishDelta, doneTodayMinutes, todayBudget } = pace
  const days = status.days
  const word = `${days} working day${days === 1 ? '' : 's'}`
  // A deliberate, slower ramp is healthy, so being behind the original line is said plainly, never in alarm colours.
  const tone = status.state === 'ahead' || status.state === 'complete' ? 'text-pass' : 'text-ink'
  const pct = Math.round(status.fraction * 100)
  const stretch = todayBudget > 0 ? Math.min(100, Math.round((doneTodayMinutes / todayBudget) * 100)) : 0

  return (
    <section aria-labelledby="pace-h" className="panel p-6" data-testid="pace-gauge" data-pace={status.state}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="pace-h" className="h2">
          Pace
        </h2>
        <p className="text-[12.5px] text-muted">
          A gauge, not a goal. <Link href="/plan" className="underline underline-offset-4 hover:text-ink">See the forecast</Link>
        </p>
      </div>

      <div className="mt-3 grid gap-x-10 gap-y-5 sm:grid-cols-3">
        <div>
          <p className={`text-[22px] font-semibold leading-tight tracking-tight ${tone}`}>
            {HEADLINE[status.state]}
            {(status.state === 'ahead' || status.state === 'behind') && <span className="num"> by {word}</span>}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
            {status.state === 'behind' && 'That is fine. The training load sets the pace now, the forecast moves with it, and nothing is lost: the next thing is still the next thing.'}
            {status.state === 'ahead' && 'Later work has moved forward. Keep the pace or bank the time.'}
            {status.state === 'on-pace' && 'Everything the plan expected before today is done. Today’s own target is separate: it is at the top of Today.'}
            {status.state === 'not-started' && 'The queue starts with the last Dictionary ladder rung.'}
            {status.state === 'complete' && 'Every rep and problem in the plan is done.'}
          </p>
        </div>

        <div>
          <p className="text-[12.5px] text-muted">{load ? 'Training load' : 'Today’s pace'}</p>
          <p className="num mt-0.5 text-[18px] font-semibold tracking-tight text-ink">
            {load ? (
              <>
                {load.requiredReps} reps a day <span className="text-[13px] font-normal text-muted">· week {load.week}, {load.stage.title.toLowerCase()}</span>
              </>
            ) : todayBudget > 0 ? (
              <>
                {formatMinutes(doneTodayMinutes)} <span className="text-[13px] font-normal text-muted">of about {formatMinutes(todayBudget)} of new work</span>
              </>
            ) : (
              <span className="text-[15px] font-medium text-ink-2">A day off{doneTodayMinutes ? ` · ${formatMinutes(doneTodayMinutes)} done anyway` : ''}</span>
            )}
          </p>
          {!load && todayBudget > 0 && (
            <span className="bar mt-2 block" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stretch} aria-label={`${stretch}% of today's pace`}>
              <span style={{ width: `${stretch}%`, background: 'var(--accent)' }} />
            </span>
          )}
        </div>

        <div>
          <p className="text-[12.5px] text-muted">{load ? 'At this load you finish' : 'At this pace you finish'}</p>
          <p className="num mt-0.5 text-[18px] font-semibold tracking-tight text-ink">
            {finish ? shortDate(finish) : '—'}
            {finish && (
              <span className="ml-2 text-[13px] font-normal text-muted">
                {finishDelta === 0 ? `on the last day (${shortDate(planEnd)})` : finishDelta > 0 ? `${finishDelta} day${finishDelta === 1 ? '' : 's'} after ${shortDate(planEnd)}` : `${-finishDelta} day${finishDelta === -1 ? '' : 's'} early`}
              </span>
            )}
          </p>
          <p className="mt-2 text-[12.5px] text-muted">
            <span className="num">{pct}%</span> of the queue done
          </p>
        </div>
      </div>
    </section>
  )
}
