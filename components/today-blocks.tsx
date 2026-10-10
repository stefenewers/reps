'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconClock, IconPlay } from '@/components/icons'
import { PHASE_LABEL, blockAt, blocksFor, clock12, minutesRemaining, type DayBlock } from '@/data/program-90day'
import { formatMinutes } from '@/lib/dates'
import type { DayModule } from '@/lib/types'

/**
 * Today as four blocks with clock times: new work, re-solves, the afternoon
 * track, the log. Shows which block the clock is in, what is next, how much
 * planned time is left, and a countdown timer for the block you are doing.
 */

const nowMinutes = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}
/** Wall-clock milliseconds, read only from event handlers and timers (never while rendering). */
const stamp = () => Date.now()
const mmss = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function TodayBlocks({ day, resolves }: { day: DayModule; resolves: number }) {
  const blocks = blocksFor(day, resolves)
  const [now, setNow] = useState(nowMinutes)
  // One timer at a time: the block it is for, and either when it ends (running) or how much is left (paused).
  const [timer, setTimer] = useState<{ id: string; endsAt?: number; leftMs: number } | null>(null)
  // The wall clock as of the last tick, so the countdown renders from state rather than reading the clock.
  const [nowMs, setNowMs] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => setNow(nowMinutes()), 30_000)
    return () => window.clearInterval(t)
  }, [])
  useEffect(() => {
    if (!timer?.endsAt) return
    const t = window.setInterval(() => setNowMs(stamp()), 1000)
    return () => window.clearInterval(t)
  }, [timer?.endsAt])

  if (!blocks.length) return null
  const { current, next } = blockAt(blocks, now)
  const left = minutesRemaining(blocks, now)
  const total = blocks.reduce((n, b) => n + b.minutes, 0)
  const timerLeft = timer ? (timer.endsAt ? timer.endsAt - Math.max(nowMs, timer.endsAt - timer.leftMs) : timer.leftMs) : 0
  const start = (b: DayBlock) => {
    const at = stamp()
    setNowMs(at)
    setTimer({ id: b.id, endsAt: at + b.minutes * 60_000, leftMs: b.minutes * 60_000 })
  }
  const toggle = () => {
    const at = stamp()
    setNowMs(at)
    setTimer((t) => (!t ? t : t.endsAt ? { id: t.id, leftMs: Math.max(0, t.endsAt - at) } : { id: t.id, endsAt: at + t.leftMs, leftMs: t.leftMs }))
  }

  return (
    <section aria-labelledby="blocks-h" className="panel p-6" data-testid="today-blocks">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="blocks-h" className="h2">
          Today’s blocks
        </h2>
        <p className="text-[12.5px] text-muted">
          {day.phase && PHASE_LABEL[day.phase]} · {formatMinutes(total)} planned ·{' '}
          <span className="num font-medium text-ink-2">{left > 0 ? `${formatMinutes(left)} left by the clock` : 'the planned day is over'}</span>
        </p>
      </div>
      <p className="mt-1 text-[13.5px] text-muted" role="status">
        {current ? (
          <>
            Now: <span className="font-medium text-ink">{current.title}</span>, until {clock12(current.end)}.{next ? ` Next up: ${next.title} at ${clock12(next.start)}.` : ' That is the last block.'}
          </>
        ) : next ? (
          <>
            Next up: <span className="font-medium text-ink">{next.title}</span> at {clock12(next.start)}. Start whenever you are ready; the times are a shape, not an alarm.
          </>
        ) : (
          <>The planned blocks are behind you. Anything left can wait for tomorrow.</>
        )}
      </p>

      <ol className="mt-4 flex flex-col divide-y divide-line">
        {blocks.map((b) => {
          const isNow = current?.id === b.id
          const mine = timer?.id === b.id
          return (
            <li key={b.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 py-3 ${isNow ? 'relative before:absolute before:inset-y-2 before:-left-3 before:w-[2px] before:rounded-full before:bg-accent' : ''}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-[13px] font-semibold text-ink-2">{b.id}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium text-ink">
                  {b.title}
                  <span className="num ml-2 text-[12.5px] font-normal text-muted">
                    {clock12(b.start)} – {clock12(b.end)} · {b.minutes} min
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] text-ink-2">{b.what}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {mine ? (
                  <>
                    <span className={`mono num inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-[13px] font-medium ${timerLeft <= 0 ? 'text-fail' : 'text-ink'}`} aria-live="off" aria-label={`${mmss(timerLeft)} left in this block`}>
                      <IconClock size={13} className="text-muted" /> {timerLeft <= 0 ? 'Time' : mmss(timerLeft)}
                    </span>
                    <button type="button" className="btn btn-sm" onClick={toggle}>
                      {timer.endsAt ? 'Pause' : 'Resume'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTimer(null)}>
                      Reset
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-sm" onClick={() => start(b)}>
                    <IconPlay size={10} /> Start timer
                  </button>
                )}
                {b.href &&
                  (b.href.startsWith('#') ? (
                    <a href={b.href} className="btn btn-ghost btn-sm">
                      Open
                    </a>
                  ) : (
                    <Link href={b.href} className="btn btn-ghost btn-sm">
                      Open
                    </Link>
                  ))}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
