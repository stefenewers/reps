'use client'

import Link from 'next/link'
import { IconArrowRight, IconCheck, IconLock } from '@/components/icons'
import { weekState, WEEK_STATE_LABEL } from '@/components/course/road-state'
import type { useCourseDay } from '@/components/use-course-day'
import { useReps } from '@/components/reps-provider'
import { COURSE_TARGET, courseWeekOf } from '@/data/course/calendar'
import { WEEKS } from '@/data/course/weeks'

type CourseDayState = ReturnType<typeof useCourseDay>

/** The Road to Ready at a glance, under Today: fourteen milestones, where you are, what is next. */
export default function RoadMini({ cd }: { cd: CourseDayState }) {
  const { today } = useReps()
  const current = Math.max(1, courseWeekOf(today))
  const total = Object.values(cd.credits).reduce((a, b) => a + b, 0)
  const weeks = WEEKS.map((w) => {
    const units = cd.course.statuses.filter((s) => s.unit.week === w.number)
    return { w, state: weekState(units, w.number, current, cd.contracts.weekContract(w.number, today).complete) }
  })
  const next = weeks.find((x) => x.w.number > current)
  return (
    <section aria-labelledby="road-mini-h" className="rounded-2xl bg-shell p-5 text-shell-ink sm:p-6" data-testid="road-mini">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="road-mini-h" className="font-display text-[20px] font-semibold tracking-tight">
          Road to Ready
        </h2>
        <p className="num text-[12.5px] text-shell-muted">
          {total} of {COURSE_TARGET} qualifying reps · Week {current} of 14
        </p>
      </div>
      <ol className="mt-5 grid grid-cols-7 gap-y-4 sm:grid-cols-14" aria-label="Fourteen weeks">
        {weeks.map(({ w, state }) => (
          <li key={w.number} className="relative flex flex-col items-center" data-week={w.number} data-state={state}>
            {w.number > 1 && (
              <span
                aria-hidden="true"
                className={`absolute top-[15px] right-1/2 h-[2px] w-full ${w.number === 8 ? 'max-sm:hidden ' : ''}${state === 'complete' || state === 'active' || state === 'repair' ? 'bg-flame-2' : 'border-t-2 border-dashed border-shell-3'}`}
              />
            )}
            <span
              className={`num relative z-10 grid size-8 place-items-center rounded-full text-[12px] font-bold ${
                state === 'complete'
                  ? 'bg-pass text-white'
                  : state === 'active'
                    ? 'bg-white text-[#b9500b] shadow-[0_0_0_3px_var(--flame),0_0_0_7px_rgba(234,106,16,0.25)]'
                    : state === 'repair'
                      ? 'bg-repair-soft text-repair shadow-[0_0_0_3px_var(--repair)]'
                      : state === 'ready'
                        ? 'bg-shell-3 text-shell-ink'
                        : 'bg-shell-2 text-shell-faint'
              }`}
              title={`Week ${w.number} · ${w.title} · ${WEEK_STATE_LABEL[state]}`}
            >
              {state === 'complete' ? <IconCheck size={13} strokeWidth={3} /> : state === 'locked' ? <IconLock size={12} /> : w.number}
            </span>
            <span className={`mt-1.5 hidden max-w-[72px] text-center text-[10.5px] leading-tight sm:block ${state === 'active' ? 'text-shell-ink' : 'text-shell-faint'}`}>
              {w.short}
            </span>
            <span className="sr-only">
              Week {w.number}, {w.title}: {WEEK_STATE_LABEL[state]}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-shell-3 pt-4">
        <p className="text-[13px] text-shell-muted">
          {next ? (
            <>
              Next: <span className="text-shell-ink">Week {next.w.number} · {next.w.title}</span>. It opens when this week&apos;s checkpoints are cleared.
            </>
          ) : (
            'The last week: interview execution.'
          )}
        </p>
        <Link href="/plan" className="inline-flex items-center gap-1.5 rounded-lg bg-shell-2 px-3 py-1.5 text-[13px] font-medium text-shell-ink hover:bg-shell-3">
          Open the road <IconArrowRight size={12} />
        </Link>
      </div>
    </section>
  )
}
