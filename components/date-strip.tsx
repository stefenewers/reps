'use client'

import Link from 'next/link'
import { DAYS } from '@/data/curriculum'
import { dayStats } from '@/lib/progress'
import { shortDate } from '@/lib/dates'
import type { Attempt } from '@/lib/types'

/** Oct 2 → Oct 11 as a restrained sequence. State reads from weight and fill, not color alone. */
export default function DateStrip({ today, attempts }: { today: string; attempts: Attempt[] }) {
  return (
    <nav aria-label="Study days" className="relative -mx-1 overflow-x-auto">
      <ol className="flex gap-1 px-1">
        {DAYS.map((d) => {
          const st = dayStats(d, attempts)
          const state = d.date === today ? 'current' : d.date < today ? 'past' : 'future'
          return (
            <li key={d.date} className="min-w-[92px] flex-1">
              <Link
                href={`/day/${d.date}`}
                aria-current={state === 'current' ? 'date' : undefined}
                className={`flex flex-col gap-1.5 rounded-md border px-2.5 py-2 transition-colors ${
                  state === 'current' ? 'border-ink' : 'border-line hover:border-line-strong'
                }`}
              >
                <span className={`mono text-[10.5px] uppercase tracking-wider ${state === 'future' ? 'text-faint' : 'text-muted'}`}>{shortDate(d.date)}</span>
                <span className={`truncate text-[13px] ${state === 'current' ? 'font-semibold' : state === 'past' ? 'text-ink-2' : 'text-muted'}`}>{d.short}</span>
                <span className="bar" aria-hidden="true">
                  <span style={{ width: `${st.percent}%` }} className={state === 'future' ? '!bg-line-strong' : ''} />
                </span>
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
