'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { useSolveLog } from '@/components/use-solve-log'
import { PLAN_DAYS } from '@/data/curriculum'
import { PROBLEMS } from '@/data/problems'
import { CHECKPOINTS } from '@/data/program-90day'
import { PLAN_UNITS } from '@/data/schedule-90'
import { SKILLS, skillName } from '@/data/skills'
import { addDays, formatMinutes, parseLocal, shortDate } from '@/lib/dates'
import { MOCKLOG_PREFIX, type MockLogEntry } from '@/lib/mock-log'
import { activeDates, activityByDate, checkpointStatus, problemsSolved, streak, unitReadiness, weakSkillsOverTime, weeklyTime } from '@/lib/progress-90'
import { unaidedRate } from '@/lib/solve-log'
import type { MockResult } from '@/lib/types'

/** How the 90 days are going: activity, time against plan, patterns, weak skills, checkpoints. */

const CAPSTONE_NUMBER: Record<string, number> = Object.fromEntries(PROBLEMS.map((p) => [p.exerciseId ?? `cap-${p.id}`, p.number]))
const SKILL_IDS = SKILLS.map((s) => s.id)

/** Heat by minutes: none, under 30, under 90, under 180, more. */
const HEAT = ['bg-surface-2', 'bg-accent/25', 'bg-accent/50', 'bg-accent/75', 'bg-accent']
const heat = (min: number, active: boolean) => (min >= 180 ? 4 : min >= 90 ? 3 : min >= 30 ? 2 : min > 0 || active ? 1 : 0)

export default function ProgressView() {
  const { attempts, repo, version, today } = useReps()
  const { entries } = useSolveLog()
  const mocks = useMemo(
    () => repo.statesWithPrefix<MockLogEntry>(MOCKLOG_PREFIX),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [repo, version],
  )
  const inAppMocks = useMemo(
    () => repo.statesWithPrefix<MockResult>('mock:').filter((m) => m.completedAt).map((m) => m.completedAt!.slice(0, 10)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [repo, version],
  )
  const activity = useMemo(() => activityByDate(attempts, entries), [attempts, entries])
  const active = useMemo(() => activeDates(attempts, entries), [attempts, entries])
  const weeks = useMemo(() => weeklyTime(activity, PLAN_DAYS), [activity])
  const units = useMemo(() => unitReadiness(PLAN_UNITS, PLAN_DAYS, attempts), [attempts])
  const weak = useMemo(() => weakSkillsOverTime(SKILL_IDS, attempts, today, addDays(today, -7)), [attempts, today])
  const checkpoints = checkpointStatus(CHECKPOINTS, today, { units: PLAN_UNITS, planDays: PLAN_DAYS, attempts, solves: entries, mocks, inAppMocks, capstoneNumber: CAPSTONE_NUMBER })
  const rate = unaidedRate(entries)
  const started = PLAN_DAYS[0].date <= today
  const daysActive = PLAN_DAYS.filter((d) => active.has(d.date)).length
  const maxWeek = Math.max(1, ...weeks.map((w) => Math.max(w.actual, w.planned)))
  const currentWeek = PLAN_DAYS.find((d) => d.date === today)?.planWeek

  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-10 sm:px-8">
        <h1 className="display-xl">Progress</h1>
        <p className="mt-2 max-w-[680px] text-[15px] leading-relaxed text-ink-2">
          {started ? 'How the 90 days are going, from what you actually did.' : `The plan starts ${shortDate(PLAN_DAYS[0].date)}. This page fills in as you practice.`}
        </p>

        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Stat label="Streak" value={`${streak(active, today, PLAN_DAYS)}`} sub="working days in a row" />
          <Stat label="Days practiced" value={`${daysActive}`} sub={`of ${PLAN_DAYS.filter((d) => d.phase !== 'off' && d.date <= today).length} working days so far`} />
          <Stat label="Problems done" value={`${problemsSolved(entries, attempts, CAPSTONE_NUMBER)}`} sub="LeetCode problems, solved at least once" />
          <Stat label="Re-solves unaided" value={rate.rate === null ? '—' : `${Math.round(rate.rate * 100)}%`} sub={rate.total ? `${rate.unaided} of ${rate.total}` : 'none logged yet'} />
        </dl>

        <section aria-labelledby="heat-h" className="panel mt-8 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="heat-h" className="h2">
              90 days
            </h2>
            <p className="flex items-center gap-1.5 text-[12px] text-muted">
              Less
              {HEAT.map((c, i) => (
                <span key={i} aria-hidden="true" className={`size-3 rounded-[3px] ${c}`} />
              ))}
              More
            </p>
          </div>
          <p className="mt-1 text-[13.5px] text-muted">One square a day, darker for more minutes practiced. Outlined squares are days off.</p>
          <div className="mt-4 overflow-x-auto pb-1">
            <ol className="grid w-max grid-flow-col grid-rows-7 gap-1" aria-label="Practice per day">
              {/* Week 1 begins on a Sunday: pad so every column runs Monday to Sunday. */}
              {Array.from({ length: (parseLocal(PLAN_DAYS[0].date).getDay() + 6) % 7 }, (_, i) => (
                <li key={`pad-${i}`} aria-hidden="true" className="size-[18px]" />
              ))}
              {PLAN_DAYS.map((d) => {
                const min = Math.round(activity[d.date] ?? 0)
                const off = d.phase === 'off'
                const future = d.date > today
                return (
                  <li key={d.date}>
                    <Link
                      href={`/day/${d.date}`}
                      title={`${shortDate(d.date)} · day ${d.planDay}${off ? ' · off' : ''}${future ? '' : ` · ${min ? `${min} min` : active.has(d.date) ? 'practiced' : 'no practice'}`}`}
                      aria-label={`${shortDate(d.date)}, day ${d.planDay}${off ? ', off' : ''}${future ? ', upcoming' : `, ${min} minutes`}`}
                      className={`block size-[18px] rounded-[4px] ${d.date === today ? 'ring-2 ring-ink ring-offset-1 ring-offset-bg' : ''} ${
                        off ? 'shadow-[inset_0_0_0_1px_var(--line-strong)]' : future ? 'bg-surface shadow-[inset_0_0_0_1px_var(--line)]' : HEAT[heat(min, active.has(d.date))]
                      }`}
                    />
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="week-h" className="panel p-6">
            <h2 id="week-h" className="h2">
              Time each week, against the plan
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">Minutes in Reps plus minutes you logged on LeetCode. The plan is a ceiling, not a quota.</p>
            <ol className="mt-4 flex flex-col gap-2">
              {weeks.map((w) => (
                <li key={w.week} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 text-[12.5px]">
                  <span className={`num ${w.week === currentWeek ? 'font-medium text-ink' : 'text-muted'}`}>Wk {w.week}</span>
                  <span className="relative block h-3 rounded-full bg-surface-2" role="img" aria-label={`Week ${w.week}: ${formatMinutes(w.actual)} of ${formatMinutes(w.planned)} planned`}>
                    <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${(w.actual / maxWeek) * 100}%` }} />
                    <span className="absolute inset-y-[-3px] w-[2px] rounded-full bg-ink" style={{ left: `${(w.planned / maxWeek) * 100}%` }} />
                  </span>
                  <span className="num text-muted">
                    {formatMinutes(w.actual)} / {formatMinutes(w.planned)}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="cp-h" className="panel p-6">
            <h2 id="cp-h" className="h2">
              Checkpoints
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">Where you stand against each one. Before a checkpoint arrives, the numbers are today’s.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {checkpoints.map((c) => (
                <div key={c.date} className="rounded-xl bg-surface px-4 py-3">
                  <p className="text-[13.5px] font-medium text-ink">
                    {c.label} <span className="num font-normal text-muted">· {shortDate(c.date)}</span>
                  </p>
                  <dl className="mt-2 flex flex-col gap-1.5">
                    {c.rows.map((r) => (
                      <div key={r.name} className="flex items-baseline justify-between gap-2 text-[12.5px]">
                        <dt className="text-ink-2">{r.name}</dt>
                        <dd className={`num ${r.met ? 'font-medium text-pass' : 'text-ink-2'}`}>
                          {r.actual} <span className="text-muted">/ {r.target}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="unit-h" className="panel p-6">
            <h2 id="unit-h" className="h2">
              Pattern readiness
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">Ladder and check reps passed for each pattern. A pattern is cleared when all of them are.</p>
            <ol className="mt-4 flex flex-col gap-2.5">
              {units.map((u) => {
                const pct = u.total ? Math.round((u.done / u.total) * 100) : 0
                return (
                  <li key={u.name} className="grid grid-cols-[minmax(0,1fr)_120px_auto] items-center gap-3 text-[13px]">
                    <span className="truncate text-ink">
                      {u.start ? (
                        <Link href={`/day/${u.start}`} className="hover:underline">
                          {u.name}
                        </Link>
                      ) : (
                        u.name
                      )}
                    </span>
                    {u.total ? (
                      <span className="bar block" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${u.name}: ${pct}%`}>
                        <span style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                      </span>
                    ) : (
                      <span className="text-[12px] text-muted">LeetCode only</span>
                    )}
                    <span className={`num w-[64px] text-right text-[12.5px] ${u.cleared ? 'font-medium text-pass' : 'text-muted'}`}>{u.total ? (u.cleared ? 'Cleared' : `${u.done}/${u.total}`) : '—'}</span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section aria-labelledby="weak-h" className="panel p-6">
            <h2 id="weak-h" className="h2">
              Weak skills, over the last week
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">Your lowest-scoring practiced skills, and whether a week of reps moved them.</p>
            {weak.length ? (
              <table className="mt-4 w-full text-left text-[13px]">
                <thead className="text-[12px] text-muted">
                  <tr className="[&>th]:pb-2 [&>th]:font-medium">
                    <th>Skill</th>
                    <th className="text-right">A week ago</th>
                    <th className="text-right">Now</th>
                    <th className="text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {weak.map((w) => {
                    const delta = w.before === null ? null : w.now - w.before
                    return (
                      <tr key={w.skillId} className="[&>td]:py-2">
                        <td>
                          <Link href={`/skills/${w.skillId}`} className="text-ink hover:underline">
                            {skillName(w.skillId)}
                          </Link>
                        </td>
                        <td className="num text-right text-muted">{w.before ?? 'new'}</td>
                        <td className="num text-right font-medium text-ink">{w.now}</td>
                        <td className={`num text-right ${delta === null || delta === 0 ? 'text-muted' : delta > 0 ? 'text-pass' : 'text-fail'}`}>{delta === null ? '—' : delta > 0 ? `+${delta}` : delta}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p className="mt-4 text-[14px] text-muted">
                No skills practiced yet. <Link href="/" className="text-ink underline underline-offset-4">Start today’s reps</Link>.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="num mt-0.5 text-[22px] font-semibold tracking-tight text-ink">{value}</dd>
      {sub && <dd className="text-[12.5px] text-muted">{sub}</dd>}
    </div>
  )
}
