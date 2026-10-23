'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { WEEK_STATUS_LABEL } from '@/components/course/course-cards'
import ReadinessReport from '@/components/course/readiness-report'
import { useReps } from '@/components/reps-provider'
import { useCourseDay } from '@/components/use-course-day'
import { COURSE_START, COURSE_TARGET, courseWeekOf, dayType, weekDates } from '@/data/course/calendar'
import { LABS } from '@/data/course/lessons'
import { motivate } from '@/data/course/motivation'
import { WEEKS } from '@/data/course/weeks'
import { skillName } from '@/data/skills'
import { addDays } from '@/lib/dates'
import { labKey, labProgress, type LabState } from '@/lib/course/labs'
import type { WeekState } from '@/lib/course/contract'

/**
 * Progress during the course (REPS_2_1_SPEC.md §9, §26): one model, from the
 * bottom up. Day → week → course → readiness, every number from the same
 * contract. Time is supporting telemetry, folded away.
 */

const STATE_LABEL: Record<WeekState, string> = { upcoming: 'Upcoming', 'on-track': WEEK_STATUS_LABEL['on-track'], recoverable: WEEK_STATUS_LABEL.recoverable, 'off-track': WEEK_STATUS_LABEL['off-track'], complete: 'Complete' }
const STATE_TONE: Record<WeekState, string> = { upcoming: 'text-faint', 'on-track': 'text-green-ink', recoverable: 'text-repair', 'off-track': 'text-repair', complete: 'text-green-ink' }
const FRESH_DAYS = 10

function Stat({ label, value, sub, testid }: { label: string; value: string; sub?: string; testid?: string }) {
  return (
    <div className="rounded-xl bg-bg px-4 py-3.5 shadow-[0_0_0_1px_var(--line)]" data-testid={testid}>
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className="num mt-0.5 text-[24px] font-semibold tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-muted">{sub}</p>}
    </div>
  )
}

export default function CourseProgress() {
  const cd = useCourseDay()
  const { attempts, mastery, repo, today } = useReps()
  const current = Math.min(14, Math.max(1, courseWeekOf(today)))

  const data = useMemo(() => {
    const c = cd.contracts
    const weeks = WEEKS.filter((w) => w.number <= current).map((w) => ({ w, k: c.weekContract(w.number, w.number < current ? weekDates(w.number)[6] : today) }))
    // Training consistency: required days completed, and planned rest taken (never a penalty).
    let trainingDays = 0
    let daysComplete = 0
    let restDays = 0
    for (let d = COURSE_START; d <= today; d = addDays(d, 1)) {
      const t = dayType(d)
      if (t === 'rest') restDays++
      if (t !== 'training' || d > today) continue
      if (d === today && !c.dayContract(d).complete) continue
      trainingDays++
      if (c.dayContract(d).complete) daysComplete++
    }
    const units = cd.course.statuses
    const ready = units.filter((u) => u.state === 'ready' || u.state === 'maintenance').length
    const blocked = units.filter((u) => u.state === 'gate-blocked')
    // Mastery and freshness, kept apart.
    const skills = Object.values(mastery).filter((m) => m.attempts > 0)
    const fresh = (iso?: string) => Boolean(iso && Date.parse(iso) >= Date.parse(`${addDays(today, -FRESH_DAYS)}T00:00:00`))
    const masteredFresh = skills.filter((m) => (m.status === 'competent' || m.status === 'fluent') && fresh(m.lastPracticed))
    const masteredStale = skills.filter((m) => (m.status === 'competent' || m.status === 'fluent') && !fresh(m.lastPracticed))
    const developing = skills.filter((m) => m.status === 'introduced' || m.status === 'practicing' || m.status === 'weak')
    // Actionable weaknesses only: skills failing now, and the skills behind a checkpoint that needs repair.
    const weak = new Map<string, string>()
    for (const m of skills) if (m.status === 'weak') weak.set(m.skillId, 'failing recently')
    for (const u of blocked) for (const g of u.gates.filter((x) => x.failed)) for (const s of g.gate.skills) if (!weak.has(s)) weak.set(s, `behind the ${g.gate.title.toLowerCase()} checkpoint`)
    const labs = LABS.map((lab) => ({ lab, p: labProgress(lab, repo.state<LabState>(labKey(lab.id)), attempts) }))
    // Supporting telemetry: minutes per course week (an attempt counts for at most 30 minutes).
    const minutes = WEEKS.filter((w) => w.number <= current).map((w) => {
      const dates = new Set(weekDates(w.number))
      return { w: w.number, m: Math.round(attempts.filter((a) => dates.has(a.date)).reduce((n, a) => n + Math.min(1800, a.durationSeconds ?? 0), 0) / 60) }
    })
    return { weeks, trainingDays, daysComplete, restDays, units, ready, blocked, masteredFresh, masteredStale, developing, weak, labs, minutes }
  }, [cd, current, today, mastery, repo, attempts])

  const thisWeek = data.weeks.find((x) => x.w.number === current)?.k
  const weeksComplete = data.weeks.filter((x) => x.k.complete).length
  const swe = data.labs.filter((l) => !l.lab.aiFde && !l.lab.optional)
  const ai = data.labs.filter((l) => l.lab.aiFde)

  return (
    <div className="mt-8 flex flex-col gap-10" data-testid="course-progress">
      {/* COURSE */}
      <section aria-labelledby="course-h">
        <h2 id="course-h" className="h2">
          Course
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Qualifying problems" value={`${cd.total}`} sub={`of ${COURSE_TARGET} in the course`} testid="course-total" />
          <Stat label="Weeks complete" value={`${weeksComplete}`} sub={`of ${current - (thisWeek?.complete ? 0 : 1)} finished so far`} testid="weeks-complete" />
          <Stat label="Current week" value={`${current}`} sub={WEEKS[current - 1]?.title} />
          <Stat label="Units ready" value={`${data.ready}`} sub={`of ${data.units.length} units`} testid="units-ready" />
          <Stat label="Units blocked" value={`${data.blocked.length}`} sub={data.blocked.length ? 'a checkpoint needs repair' : 'none'} testid="units-blocked" />
        </div>
      </section>

      {/* WEEK */}
      {thisWeek && (
        <section aria-labelledby="week-out-h" className="panel p-6" data-testid="week-output" data-status={thisWeek.status}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="week-out-h" className="h2">
              Week {current}
            </h2>
            <span className={`text-[12px] font-semibold uppercase tracking-wide ${STATE_TONE[thisWeek.status]}`}>{STATE_LABEL[thisWeek.status]}</span>
          </div>
          <p className="num mt-2 text-[15px] text-ink">
            {thisWeek.output.done} / {thisWeek.output.target} problems · {thisWeek.labs.filter((l) => !l.optional && l.done).length} / {thisWeek.labs.filter((l) => !l.optional).length} builds · {thisWeek.gates.filter((g) => g.cleared).length} / {thisWeek.gates.length} checkpoints
            {thisWeek.targets.length ? ` · ${thisWeek.targets.filter((t) => t.solved).length} / ${thisWeek.targets.length} targets` : ''}
          </p>
          {thisWeek.overdue.length > 0 && <p className="mt-1 text-[13px] text-repair">Overdue: {thisWeek.overdue.join(' · ')}</p>}
        </section>
      )}

      {/* CONSISTENCY */}
      <section aria-labelledby="consistency-h">
        <h2 id="consistency-h" className="h2">
          Training consistency
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="Training streak" value={cd.streak ? `🔥 ${cd.streak}` : '0'} sub="required days in a row" testid="streak-stat" />
          <Stat label="Required days complete" value={`${data.daysComplete}`} sub={`of ${data.trainingDays} training days so far`} testid="days-complete" />
          <Stat label="Rest days taken" value={`${data.restDays}`} sub="planned rest: never a penalty" />
        </div>
      </section>

      {/* READINESS (dimensions, Core DSA detail, evidence by kind) */}
      <ReadinessReport />

      {/* MASTERY vs FRESHNESS */}
      <section aria-labelledby="mastery-h" data-testid="mastery-freshness">
        <h2 id="mastery-h" className="h2">
          Mastery and freshness
        </h2>
        <p className="mt-1 text-[13px] text-muted">Mastered means produced well and often; fresh means practised in the last {FRESH_DAYS} days. A skill can be mastered and stale: spaced retrieval brings it back.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(
            [
              ['Mastered · fresh', data.masteredFresh, 'text-green-ink'],
              ['Mastered · stale', data.masteredStale, 'text-repair'],
              ['Developing', data.developing, 'text-learn'],
            ] as const
          ).map(([label, list, tone]) => (
            <div key={label} className="rounded-xl bg-bg p-4 shadow-[0_0_0_1px_var(--line)]" data-group={label}>
              <p className={`text-[12px] font-semibold uppercase tracking-wide ${tone}`}>
                {label} · {list.length}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {list.slice(0, 18).map((m) => (
                  <li key={m.skillId}>
                    <Link href={`/skills/${m.skillId}`} className="chip">
                      {skillName(m.skillId)}
                    </Link>
                  </li>
                ))}
                {list.length > 18 && <li className="text-[12px] text-muted">+{list.length - 18}</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* WEAK SKILLS: actionable only */}
      <section aria-labelledby="weak-h" data-testid="weak-skills">
        <h2 id="weak-h" className="h2">
          What to repair
        </h2>
        {data.weak.size ? (
          <ul className="mt-3 flex flex-col gap-1.5">
            {[...data.weak].map(([s, why]) => (
              <li key={s} className="flex flex-wrap items-baseline gap-2 text-[14px]">
                <Link href={`/skills/${s}`} className="font-medium text-ink hover:underline">
                  {skillName(s)}
                </Link>
                <span className="text-muted">· {why}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13.5px] text-muted">Nothing is failing right now. Today&apos;s list brings back what is due.</p>
        )}
      </section>

      {/* BUILDING */}
      <section aria-labelledby="labs-h" data-testid="labs-progress">
        <h2 id="labs-h" className="h2">
          Building
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(
            [
              ['Junior SWE builds', swe],
              ['Applied AI / FDE builds', ai],
            ] as const
          ).map(([label, list]) => (
            <div key={label} className="rounded-xl bg-bg p-4 shadow-[0_0_0_1px_var(--line)]">
              <p className="text-[13px] font-medium text-ink">
                {label} · {list.filter((l) => l.p.done).length} / {list.length}
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {list.map(({ lab, p }) => (
                  <li key={lab.id} className="flex items-baseline justify-between gap-2 text-[13px]">
                    <Link href={`/lab/${lab.id}`} className="text-ink-2 hover:underline">
                      Week {lab.week} · {lab.title}
                    </Link>
                    <span className={p.done ? 'text-green-ink' : 'text-faint'}>{p.done ? 'Done' : lab.week <= current ? 'Not done' : 'Later'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* WEEK SUMMARIES */}
      {data.weeks.filter((x) => x.w.number < current).length > 0 && (
        <section aria-labelledby="weeks-h" data-testid="week-summaries">
          <h2 id="weeks-h" className="h2">
            Weeks so far
          </h2>
          <ol className="mt-3 flex flex-col gap-3">
            {data.weeks
              .filter((x) => x.w.number < current)
              .reverse()
              .map(({ w, k }) => (
                <li key={w.number} className="panel p-5" data-week={w.number} data-status={k.status}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[16px] font-semibold tracking-tight text-ink">
                      Week {w.number} {k.complete ? 'complete' : `· ${w.title}`}
                    </p>
                    <span className={`text-[12px] font-semibold uppercase tracking-wide ${STATE_TONE[k.status]}`}>{STATE_LABEL[k.status]}</span>
                  </div>
                  <p className="num mt-1 text-[14px] text-ink-2">
                    {k.daysComplete} of {k.trainingDays} training days complete · {k.output.done} / {k.output.target} qualifying problems
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                    {k.labs.map((l) => (
                      <li key={l.id} className={l.done ? 'text-green-ink' : 'text-muted'}>
                        {l.done ? '✓' : '—'} {l.title}
                        {l.optional ? ' (optional)' : ''}
                      </li>
                    ))}
                    {k.gates.map((g) => (
                      <li key={g.id} className={g.cleared ? 'text-cold' : 'text-muted'}>
                        {g.cleared ? '✓' : '—'} {g.title} checkpoint
                      </li>
                    ))}
                  </ul>
                  {k.complete && <p className="mt-2 text-[13.5px] text-ink">{motivate('week-complete', { week: w.number, weekDone: k.output.done }).text}</p>}
                </li>
              ))}
          </ol>
        </section>
      )}

      {/* TIME: supporting telemetry */}
      <details className="group" data-testid="time-telemetry">
        <summary className="cursor-pointer text-[13.5px] font-medium text-ink-2">Time per week (supporting telemetry, not the score)</summary>
        <ul className="mt-2 flex flex-wrap gap-3 text-[13px] text-muted">
          {data.minutes.map((x) => (
            <li key={x.w}>
              Week {x.w}: <span className="num text-ink-2">{x.m} min</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
