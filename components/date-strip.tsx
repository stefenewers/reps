'use client'

import Link from 'next/link'
import { DAYS } from '@/data/curriculum'
import { dayStats } from '@/lib/progress'
import { shortDate } from '@/lib/dates'
import type { Attempt } from '@/lib/types'
import { DAY_GLYPH, GlyphBraces } from '@/components/concept-icons'
import { IconCheck } from '@/components/icons'

/**
 * Oct 2 → Oct 11 as a journey: finished days carry a green check and tint,
 * today is raised with a blue top line, the road ahead stays quiet.
 */
export default function DateStrip({ today, attempts }: { today: string; attempts: Attempt[] }) {
  return (
    <nav aria-label="Study days" className="relative -mx-1 overflow-x-auto pb-1">
      <ol className="flex gap-2 px-1 py-1">
        {DAYS.map((d) => {
          const st = dayStats(d, attempts)
          const state = d.date === today ? 'current' : d.date < today ? 'past' : 'future'
          const Glyph = DAY_GLYPH[d.date] ?? GlyphBraces
          return (
            <li key={d.date} className="min-w-[100px] flex-1">
              <Link
                href={`/day/${d.date}`}
                aria-current={state === 'current' ? 'date' : undefined}
                className={`interactive relative flex h-full flex-col gap-2.5 overflow-hidden rounded-2xl px-3 pb-3 pt-3.5 ${
                  st.complete
                    ? 'bg-green-soft/70 shadow-[0_0_0_1px_rgba(36,166,106,0.18)]'
                    : state === 'current'
                      ? 'bg-bg shadow-[0_0_0_1px_var(--hairline),var(--shadow-md)]'
                      : state === 'past'
                        ? 'bg-bg shadow-[0_0_0_1px_var(--hairline)]'
                        : 'bg-transparent shadow-[0_0_0_1px_var(--hairline)] hover:bg-bg'
                }`}
              >
                {state === 'current' && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-accent" />}
                <span className="flex items-center justify-between">
                  <Glyph size={15} className={st.complete ? 'text-green-ink' : state === 'current' ? 'text-accent' : 'text-faint'} />
                  {st.complete ? (
                    <span className="grid size-[18px] place-items-center rounded-full bg-green text-white" aria-hidden="true">
                      <IconCheck size={10} strokeWidth={2.8} />
                    </span>
                  ) : (
                    st.percent > 0 && <span className="num text-[11px] font-medium text-accent">{st.percent}%</span>
                  )}
                </span>
                <span className="flex flex-col">
                  <span className={`text-[14px] leading-tight ${state === 'current' ? 'font-semibold text-ink' : state === 'past' || st.complete ? 'font-medium text-ink-2' : 'text-muted'}`}>{d.short}</span>
                  <span className={`mono mt-1 text-[10.5px] uppercase tracking-wider ${state === 'current' ? 'text-accent' : 'text-faint'}`}>
                    {state === 'current' ? 'Today' : shortDate(d.date)}
                  </span>
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
