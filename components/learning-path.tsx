'use client'

import Link from 'next/link'
import type { Attempt, DayModule, ReviewItem } from '@/lib/types'
import { passedSet } from '@/lib/progress'
import { formatMinutes } from '@/lib/dates'
import { compositionText } from '@/components/rep-kind'
import { IconArrowRight, IconCheck } from '@/components/icons'

/**
 * Today's progression as a rail: completed sections are checked, the current one
 * is raised with its next rep, upcoming ones stay quiet but reachable.
 */
export default function LearningPath({ day, attempts, reviews = [] }: { day: DayModule; attempts: Attempt[]; reviews?: ReviewItem[] }) {
  const passed = passedSet(attempts)
  const now = new Date().toISOString()
  const dueSkills = new Set(reviews.filter((r) => r.status === 'pending' && r.dueAt <= now && r.skillId).map((r) => r.skillId!))
  const rows = day.sections.map((s) => {
    const done = s.exercises.filter((e) => passed.has(e.id)).length
    const minutesLeft = s.exercises.filter((e) => !passed.has(e.id)).reduce((n, e) => n + e.minutes, 0)
    const minutes = s.exercises.reduce((n, e) => n + e.minutes, 0)
    const next = s.exercises.find((e) => !passed.has(e.id))
    const reviewDue = s.exercises.some((e) => e.skills.some((k) => dueSkills.has(k)))
    return { s, done, total: s.exercises.length, minutes, minutesLeft, next, reviewDue }
  })
  const current = rows.findIndex((r) => r.done < r.total)

  return (
    <ol className="relative flex flex-col" aria-label="Today's learning path">
      {rows.map((r, i) => {
        const complete = r.total > 0 && r.done === r.total
        const isCurrent = i === current
        const pct = r.total ? (r.done / r.total) * 100 : 0
        const last = i === rows.length - 1
        return (
          <li key={r.s.id} className="relative grid grid-cols-[28px_1fr] gap-x-3">
            {/* rail */}
            <div className="relative flex justify-center">
              {!last && <span aria-hidden="true" className={`absolute top-7 bottom-0 w-px ${complete ? 'bg-pass/40' : 'bg-line'}`} />}
              <span
                aria-hidden="true"
                className={`relative z-10 mt-3 grid size-[18px] place-items-center rounded-full transition-colors ${
                  complete ? 'bg-pass text-white' : isCurrent ? 'bg-bg shadow-[0_0_0_2px_var(--ink)]' : 'bg-bg shadow-[0_0_0_1.5px_var(--line-strong)]'
                }`}
              >
                {complete && <IconCheck size={11} strokeWidth={2.4} />}
                {isCurrent && <span className="size-2 rounded-full bg-ink" />}
              </span>
            </div>

            <div className={`mb-1.5 rounded-xl transition-colors ${isCurrent ? 'bg-surface px-4 py-3.5' : 'px-1 py-2.5'}`}>
              <Link
                href={r.next ? `/rep/${r.next.id}` : `/day/${day.date}`}
                className="group flex items-baseline justify-between gap-3"
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className={`text-[14.5px] ${isCurrent ? 'font-semibold text-ink' : complete ? 'text-ink-2' : 'text-muted group-hover:text-ink'}`}>
                  {r.s.title}
                  <span className="sr-only">{complete ? ', complete' : isCurrent ? ', in progress' : ', upcoming'}</span>
                </span>
                <span className="num shrink-0 text-[12px] text-faint">
                  {complete ? 'Done' : `${r.done}/${r.total}`}
                </span>
              </Link>
              {(isCurrent || (!complete && i === current + 1)) && (
                <p className="mt-1 text-[12.5px] text-muted">
                  {r.total} reps · {formatMinutes(r.minutes)} · {compositionText(r.s.exercises)}
                </p>
              )}
              {r.reviewDue && !isCurrent && <p className="mt-0.5 text-[12px] text-accent">Review due</p>}
              {isCurrent && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="bar flex-1" aria-hidden="true">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                  {r.next && (
                    <Link href={`/rep/${r.next.id}`} className="btn btn-sm shrink-0">
                      Continue <IconArrowRight size={13} />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
