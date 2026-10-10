'use client'

import Link from 'next/link'
import type { Attempt, DayModule, ReviewItem } from '@/lib/types'
import { passedSet } from '@/lib/progress'
import { formatMinutes } from '@/lib/dates'
import { compositionText } from '@/components/rep-kind'
import { conceptGlyph, sectionKind } from '@/components/concept-icons'
import { IconArrowRight, IconCheck } from '@/components/icons'

/**
 * Today's progression as a rail. Done sections recede behind an ink check, the
 * current one is the only blue node and is raised with its next rep, capstones
 * are diamonds, upcoming ones stay quiet but reachable. Shape and glyph carry
 * the meaning; colour only marks where you are.
 */
export default function LearningPath({ day, attempts, reviews = [] }: { day: DayModule; attempts: Attempt[]; reviews?: ReviewItem[] }) {
  const passed = passedSet(attempts)
  const now = new Date().toISOString()
  const dueSkills = new Set(reviews.filter((r) => r.status === 'pending' && r.dueAt <= now && r.skillId).map((r) => r.skillId!))
  const rows = day.sections.filter((s) => !s.optional).map((s) => {
    const done = s.exercises.filter((e) => passed.has(e.id)).length
    const minutes = s.exercises.reduce((n, e) => n + e.minutes, 0)
    const next = s.exercises.find((e) => !passed.has(e.id))
    const reviewDue = s.exercises.some((e) => e.skills.some((k) => dueSkills.has(k)))
    return { s, done, total: s.exercises.length, minutes, next, reviewDue, kind: sectionKind(s.title, s.exercises) }
  })
  const current = rows.findIndex((r) => r.done < r.total)

  return (
    <>
    <ol className="relative flex flex-col" aria-label="Today's learning path">
      {rows.map((r, i) => {
        const complete = r.total > 0 && r.done === r.total
        const isCurrent = i === current
        const pct = r.total ? (r.done / r.total) * 100 : 0
        const last = i === rows.length - 1
        const Glyph = conceptGlyph(r.s.title)
        const diamond = r.kind === 'capstone'
        const node = complete
          ? 'bg-ink text-white'
          : isCurrent
            ? 'bg-bg shadow-[0_0_0_2px_var(--accent)]'
            : diamond
              ? 'bg-bg shadow-[0_0_0_1.5px_var(--ink)]'
              : 'bg-bg shadow-[0_0_0_1.5px_var(--line-strong)]'
        return (
          <li key={r.s.id} className="relative grid grid-cols-[30px_1fr] gap-x-3">
            <div className="relative flex justify-center">
              {!last && <span aria-hidden="true" className={`absolute top-8 bottom-0 w-[2px] rounded-full ${complete ? 'bg-ink/25' : 'bg-line'}`} />}
              <span
                aria-hidden="true"
                className={`relative z-10 mt-3 grid place-items-center transition-[box-shadow,background-color] duration-300 ${isCurrent ? 'size-[22px]' : 'size-[18px]'} ${diamond ? 'rotate-45 rounded-[5px]' : 'rounded-full'} ${node}`}
              >
                <span className={diamond ? '-rotate-45' : ''}>
                  {complete && <IconCheck size={11} strokeWidth={2.6} />}
                  {isCurrent && <span className="block size-2 rounded-full bg-accent" />}
                </span>
              </span>
            </div>

            <div className={`mb-1.5 rounded-2xl transition-colors ${isCurrent ? 'bg-surface px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--line)]' : 'px-1 py-2.5'}`}>
              <Link href={r.next ? `/rep/${r.next.id}` : `/day/${day.date}`} className="group flex items-center justify-between gap-3" aria-current={isCurrent ? 'step' : undefined}>
                <span className="flex min-w-0 items-center gap-2.5">
                  <Glyph
                    size={15}
                    className={`shrink-0 ${complete ? 'text-faint' : isCurrent ? 'text-accent' : r.kind === 'capstone' ? 'text-ink' : 'text-muted group-hover:text-ink'}`}
                  />
                  <span
                    className={`truncate text-[14.5px] ${
                      isCurrent ? 'font-semibold text-ink' : complete ? 'text-muted' : r.kind === 'capstone' ? 'font-medium text-ink-2 group-hover:text-ink' : 'text-ink-2 group-hover:text-ink'
                    }`}
                  >
                    {r.s.title}
                  </span>
                  <span className="sr-only">{complete ? ', complete' : isCurrent ? ', in progress' : ', upcoming'}</span>
                  {r.kind === 'capstone' && !complete && <span className="rounded-md bg-ink px-1.5 py-px text-[10px] font-semibold tracking-wide text-white uppercase">Capstone</span>}
                  {r.reviewDue && !isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-2">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                      Review due
                    </span>
                  )}
                </span>
                <span className={`num shrink-0 text-[12px] ${complete ? 'text-muted' : 'text-faint'}`}>{complete ? 'Done' : `${r.done}/${r.total}`}</span>
              </Link>
              {(isCurrent || (!complete && i === current + 1)) && (
                <p className="mt-1 pl-[25px] text-[12.5px] text-muted">
                  {r.total} rep{r.total === 1 ? '' : 's'} · {formatMinutes(r.minutes)} · {compositionText(r.s.exercises)}
                </p>
              )}
              {isCurrent && (
                <div className="mt-3 flex items-center gap-3 pl-[25px]">
                  <span className="bar flex-1 !bg-surface-3" aria-hidden="true">
                    <span style={{ width: `${pct}%`, background: 'var(--accent)' }} />
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
    </>
  )
}
