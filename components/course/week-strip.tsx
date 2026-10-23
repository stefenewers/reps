import { dailyTarget, dayType, weekDates } from '@/data/course/calendar'
import { flameFor } from '@/lib/course/week-status'
import { parseLocal } from '@/lib/dates'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * The week's heat strip: a flame per training day (by how much of its target was
 * done), a quiet rest mark for planned rest, and Saturday as optional recovery.
 * Never an empty "failure" circle for rest.
 */
export default function WeekStrip({ week, today, credits }: { week: number; today: string; credits: Record<string, number> }) {
  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label={`Week ${week}, day by day`} data-testid="week-strip">
      {weekDates(week).map((d) => {
        const type = dayType(d)
        const done = credits[d] ?? 0
        const target = dailyTarget(week)
        const f = type === 'training' ? flameFor(done, target) : done > 0 ? 'ember' : 'unlit'
        const past = d < today
        const isToday = d === today
        const label =
          type === 'rest'
            ? 'rest'
            : type === 'recovery'
              ? done
                ? `${done} extra`
                : 'optional'
              : d > today
                ? 'to come'
                : f === 'blaze'
                  ? `${done}/${target}, done`
                  : `${done}/${target}`
        return (
          <li key={d} className={`flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 ${isToday ? 'bg-flame-soft shadow-[inset_0_0_0_1px_var(--flame-2)]' : ''}`} data-day={d} data-state={type === 'training' ? f : type}>
            <span className="text-[10.5px] font-medium uppercase tracking-wide text-muted">{DOW[parseLocal(d).getDay()]}</span>
            <span aria-hidden="true" className="grid size-6 place-items-center text-[15px] leading-none">
              {type === 'rest' ? (
                <span className="text-rest">☾</span>
              ) : f === 'blaze' ? (
                '🔥'
              ) : f === 'burning' || f === 'ember' ? (
                <span className={f === 'burning' ? 'opacity-80' : 'opacity-45'}>🔥</span>
              ) : (
                <span className={`block size-2.5 rounded-full ${past && type === 'training' ? 'bg-line-strong' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`} />
              )}
            </span>
            <span className="sr-only">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
