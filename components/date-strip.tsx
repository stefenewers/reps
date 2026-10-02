'use client'

import Link from 'next/link'
import { DAYS } from '@/data/curriculum'
import { dayStats } from '@/lib/progress'
import { shortDate } from '@/lib/dates'
import type { Attempt } from '@/lib/types'
import ProgressRing from '@/components/progress-ring'
import { IconCheck } from '@/components/icons'

/** Oct 2 → Oct 11. Past, today and upcoming read from weight, fill and a ring, not color alone. */
export default function DateStrip({ today, attempts }: { today: string; attempts: Attempt[] }) {
  return (
    <nav aria-label="Study days" className="relative -mx-1 overflow-x-auto pb-1">
      <ol className="flex gap-2 px-1 py-1">
        {DAYS.map((d, i) => {
          const st = dayStats(d, attempts)
          const state = d.date === today ? 'current' : d.date < today ? 'past' : 'future'
          return (
            <li key={d.date} className="min-w-[98px] flex-1">
              <Link
                href={`/day/${d.date}`}
                aria-current={state === 'current' ? 'date' : undefined}
                className={`interactive flex h-full flex-col gap-2 rounded-xl px-3 py-3 ${
                  state === 'current'
                    ? 'bg-bg shadow-[0_0_0_1.5px_var(--ink),var(--shadow-md)]'
                    : state === 'past'
                      ? 'bg-bg shadow-[0_0_0_1px_var(--hairline)]'
                      : 'bg-transparent shadow-[0_0_0_1px_var(--hairline)] hover:bg-bg'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className={`mono text-[10.5px] uppercase tracking-wider ${state === 'future' ? 'text-faint' : 'text-muted'}`}>{shortDate(d.date)}</span>
                  {st.complete ? (
                    <span className="grid size-4 place-items-center rounded-full bg-pass text-white" aria-hidden="true">
                      <IconCheck size={10} strokeWidth={2.6} />
                    </span>
                  ) : (
                    st.percent > 0 && <ProgressRing value={st.percent} size={16} stroke={2.5} label={`${st.percent}%`} />
                  )}
                </span>
                <span className={`truncate text-[13.5px] ${state === 'current' ? 'font-semibold text-ink' : state === 'past' ? 'font-medium text-ink-2' : 'text-muted'}`}>{d.short}</span>
                <span className="text-[11px] text-faint">Day {i + 1}</span>
                <span className="sr-only">
                  {state === 'current' ? 'Today. ' : state === 'past' ? 'Past. ' : 'Upcoming. '}
                  {st.percent}% complete
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
