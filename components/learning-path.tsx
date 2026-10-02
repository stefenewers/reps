'use client'

import Link from 'next/link'
import type { Attempt, DayModule } from '@/lib/types'
import { passedSet } from '@/lib/progress'

/** Today's progression, section by section: done, current, next. */
export default function LearningPath({ day, attempts }: { day: DayModule; attempts: Attempt[] }) {
  const passed = passedSet(attempts)
  const states = day.sections.map((s) => {
    const done = s.exercises.filter((e) => passed.has(e.id)).length
    return { s, done, total: s.exercises.length }
  })
  const current = states.findIndex((x) => x.done < x.total)
  return (
    <ol className="flex flex-wrap items-center gap-y-2 text-[13.5px]" aria-label="Today's learning path">
      {states.map(({ s, done, total }, i) => {
        const complete = done === total && total > 0
        const isCurrent = i === current
        const first = s.exercises.find((e) => !passed.has(e.id)) ?? s.exercises[0]
        return (
          <li key={s.id} className="flex items-center">
            {i > 0 && (
              <span aria-hidden="true" className="mx-2 text-faint">
                →
              </span>
            )}
            <Link
              href={first ? `/rep/${first.id}` : `/day/${day.date}`}
              className={`rounded-md px-2 py-1 transition-colors hover:bg-surface-2 ${isCurrent ? 'bg-surface-2 font-medium text-ink' : complete ? 'text-ink-2' : 'text-muted'}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {complete && (
                <span aria-hidden="true" className="mr-1 text-pass">
                  ✓
                </span>
              )}
              {s.title}
              <span className="sr-only">{complete ? ', complete' : isCurrent ? `, in progress, ${done} of ${total}` : `, ${done} of ${total}`}</span>
              {isCurrent && (
                <span className="ml-1.5 text-[11px] tabular-nums text-faint" aria-hidden="true">
                  {done}/{total}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
