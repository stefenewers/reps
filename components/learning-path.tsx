'use client'

import Link from 'next/link'
import type { Attempt, DayModule, ReviewItem } from '@/lib/types'
import { passedSet } from '@/lib/progress'
import { formatMinutes } from '@/lib/dates'
import { compositionText } from '@/components/rep-kind'
import { conceptGlyph, sectionKind } from '@/components/concept-icons'
import { IconArrowRight, IconCheck } from '@/components/icons'

/**
 * Today's progression as a rail. Done sections recede behind a green check, the
 * current one is raised with a glowing node and its next rep, capstones are
 * diamonds, cold sections are violet, upcoming ones stay quiet but reachable.
 */
export default function LearningPath({ day, attempts, reviews = [] }: { day: DayModule; attempts: Attempt[]; reviews?: ReviewItem[] }) {
  const passed = passedSet(attempts)
  const now = new Date().toISOString()
  const dueSkills = new Set(reviews.filter((r) => r.status === 'pending' && r.dueAt <= now && r.skillId).map((r) => r.skillId!))
  const rows = day.sections.map((s) => {
    const done = s.exercises.filter((e) => passed.has(e.id)).length
    const minutes = s.exercises.reduce((n, e) => n + e.minutes, 0)
    const next = s.exercises.find((e) => !passed.has(e.id))
    const reviewDue = s.exercises.some((e) => e.skills.some((k) => dueSkills.has(k)))
    return { s, done, total: s.exercises.length, minutes, next, reviewDue, kind: sectionKind(s.title, s.exercises) }
  })
  const current = rows.findIndex((r) => r.done < r.total)

  return (
    <ol className="relative flex flex-col" aria-label="Today's learning path">
      {rows.map((r, i) => {
        const complete = r.total > 0 && r.done === r.total
        const isCurrent = i === current
        const pct = r.total ? (r.done / r.total) * 100 : 0
        const last = i === rows.length - 1
        const Glyph = conceptGlyph(r.s.title)
        const diamond = r.kind === 'capstone'
        const node = complete
          ? 'bg-green text-white shadow-[0_0_0_3px_var(--green-soft)]'
          : isCurrent
            ? 'bg-bg shadow-[0_0_0_2px_var(--accent),0_0_0_6px_var(--accent-soft)]'
            : r.kind === 'cold'
              ? 'bg-violet-soft shadow-[0_0_0_1.5px_rgba(114,89,217,0.45)]'
              : 'bg-bg shadow-[0_0_0_1.5px_var(--line-strong)]'
        return (
          <li key={r.s.id} className="relative grid grid-cols-[30px_1fr] gap-x-3">
            <div className="relative flex justify-center">
              {!last && <span aria-hidden="true" className={`absolute top-8 bottom-0 w-[2px] rounded-full ${complete ? 'bg-green/35' : 'bg-line'}`} />}
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

            <div className={`mb-1.5 rounded-2xl transition-colors ${isCurrent ? 'bg-accent-soft/60 px-4 py-3.5 shadow-[inset_0_0_0_1px_rgba(49,87,213,0.12)]' : 'px-1 py-2.5'}`}>
              <Link href={r.next ? `/rep/${r.next.id}` : `/day/${day.date}`} className="group flex items-center justify-between gap-3" aria-current={isCurrent ? 'step' : undefined}>
                <span className="flex min-w-0 items-center gap-2.5">
                  <Glyph
                    size={15}
                    className={`shrink-0 ${complete ? 'text-green-ink/70' : isCurrent ? 'text-accent' : r.kind === 'cold' ? 'text-violet' : r.kind === 'capstone' ? 'text-ink' : 'text-faint group-hover:text-muted'}`}
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
                  {r.reviewDue && !isCurrent && <span className="rounded-md bg-violet-soft px-1.5 py-px text-[10.5px] font-medium text-violet-ink">Review due</span>}
                </span>
                <span className={`num shrink-0 text-[12px] ${complete ? 'font-medium text-green-ink' : 'text-faint'}`}>{complete ? 'Done' : `${r.done}/${r.total}`}</span>
              </Link>
              {(isCurrent || (!complete && i === current + 1)) && (
                <p className="mt-1 pl-[25px] text-[12.5px] text-muted">
                  {r.total} reps · {formatMinutes(r.minutes)} · {compositionText(r.s.exercises)}
                </p>
              )}
              {isCurrent && (
                <div className="mt-3 flex items-center gap-3 pl-[25px]">
                  <span className="bar flex-1 !bg-bg" aria-hidden="true">
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
  )
}
