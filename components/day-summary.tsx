'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { DAY_BY_DATE } from '@/data/curriculum'
import { PROBLEM_BY_ID } from '@/data/problems'
import { skillName } from '@/data/skills'
import { addDays, formatMinutes, longDate, parseLocal } from '@/lib/dates'
import { dayStats, daySummary } from '@/lib/progress'

/** End-of-day review. Fully deterministic: zero model tokens. */
export default function DaySummary({ date }: { date: string }) {
  const { attempts, mastery, reviews } = useReps()
  const day = DAY_BY_DATE[date]
  if (!day) return null
  const end = parseLocal(addDays(date, 2))
  end.setMilliseconds(-1)
  const s = daySummary(day, attempts, mastery, reviews, (id) => PROBLEM_BY_ID[id]?.title ?? id, end.toISOString())
  const st = dayStats(day, attempts)
  const complete = st.complete

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pb-28 pt-10">
      <p className="text-[13px] text-muted">{longDate(date)}</p>
      <h1 className="mt-1 text-[32px] font-semibold tracking-tight">{complete ? 'Reps complete' : 'Day so far'}</h1>
      <p className="mt-1 text-[14px] text-muted">
        {s.completed} of {s.total} reps · {formatMinutes(st.timeSpentSeconds / 60)} logged
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <Block title="Strong" items={s.strong.slice(0, 8).map(skillName)} empty="Nothing competent yet today." />
        <Block title="Needs more reps" items={s.needsReps.slice(0, 8).map(skillName)} empty="Nothing shaky today." />
      </div>

      {s.capstones.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold tracking-tight">Capstones</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line text-[14px]">
            {s.capstones.map((c) => (
              <li key={c.problemId} className="flex items-center justify-between py-2">
                <Link href={`/rep/${c.exerciseId}`} className="hover:underline">
                  {c.title}
                </Link>
                <span className={c.status === 'incomplete' ? 'text-muted' : c.status === 'clean' ? 'text-pass' : 'text-ink-2'}>
                  {c.status === 'clean' && '✓ clean'}
                  {c.status === 'assisted' && `✓ with ${c.solutionViewed ? 'solution' : `${c.hints} hint${c.hints === 1 ? '' : 's'}`}`}
                  {c.status === 'incomplete' && '— incomplete'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold tracking-tight">Tomorrow</h2>
        <p className="mt-1 text-[14px] text-ink-2">
          {s.tomorrowReviews} cold rep{s.tomorrowReviews === 1 ? '' : 's'} scheduled.
        </p>
      </section>

      <div className="mt-10 flex gap-2">
        <Link href={`/day/${date}`} className="btn">
          Back to the day
        </Link>
        <Link href="/" className="btn btn-ghost">
          Today
        </Link>
      </div>
    </main>
  )
}

function Block({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section>
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      {items.length ? (
        <ul className="mt-2 flex flex-col gap-1 text-[14px] text-ink-2">
          {items.map((i) => (
            <li key={i}>– {i}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[14px] text-muted">{empty}</p>
      )}
    </section>
  )
}
