'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { WEEK_STATUS_LABEL } from '@/components/course/course-cards'
import ReadinessReport from '@/components/course/readiness-report'
import AppliedEvidence from '@/components/course/applied-evidence'
import TrainingFlame from '@/components/course/training-flame'
import { IconArrowRight, IconCheck, IconRepair } from '@/components/icons'
import Ring from '@/components/ring'
import { useReps } from '@/components/reps-provider'
import { useCourseDay } from '@/components/use-course-day'
import { COURSE_START, COURSE_TARGET, courseWeekOf, dailyTarget, dayType, weekDates } from '@/data/course/calendar'
import { LABS } from '@/data/course/lessons'
import { motivate } from '@/data/course/motivation'
import { WEEKS } from '@/data/course/weeks'
import { skillName } from '@/data/skills'
import { addDays, parseLocal } from '@/lib/dates'
import { labKey, labProgress, type LabState } from '@/lib/course/labs'
import type { WeekState } from '@/lib/course/contract'

/**
 * Progress during the course (REPS_2_1_SPEC.md §9, §26): evidence that you are
 * becoming capable. One model, from the bottom up (day → week → course →
 * readiness), every number from the same contract. No single readiness
 * percentage. Time is supporting telemetry, folded away.
 */

const STATE_LABEL: Record<WeekState, string> = {
  upcoming: 'Upcoming',
  'on-track': WEEK_STATUS_LABEL['on-track'],
  recoverable: WEEK_STATUS_LABEL.recoverable,
  'off-track': WEEK_STATUS_LABEL['off-track'],
  complete: 'Complete'
}
const STATE_TAG: Record<WeekState, string> = {
  upcoming: 'tag-locked',
  'on-track': 'tag-pass',
  recoverable: 'tag-repair',
  'off-track': 'tag-repair',
  complete: 'tag-pass'
}
const FRESH_DAYS = 10
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** How each pass happened, strongest first: the colours carry meaning (cold → independent → helped). */
const EVIDENCE_KINDS = [
  { key: 'coldIndependent', label: 'Cold, independent', color: 'var(--cold)' },
  { key: 'retrieval', label: 'Retrieval', color: '#7466e4' },
  { key: 'independent', label: 'Independent', color: 'var(--accent)' },
  { key: 'selfCorrected', label: 'Self-corrected', color: '#6f9be8' },
  { key: 'assisted', label: 'Assisted', color: 'var(--flame-2)' },
  { key: 'reconstructed', label: 'Rebuilt after a solution', color: 'var(--repair)' }
] as const

/** The week's wins: what you can do now that you could not before. */
function MovedForward({ wins }: { wins: { key: string; kind: 'gate' | 'lab' | 'skill'; title: string; detail: string }[] }) {
  return (
    <section aria-labelledby="moved-h" data-testid="moved-forward">
      <h2 id="moved-h" className="section-title">
        What moved forward this week
      </h2>
      {wins.length ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {wins.map((w) => (
            <li key={w.key} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${w.kind === 'gate' ? 'tile-cold' : w.kind === 'lab' ? 'tile-flame' : 'tile-pass'}`}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-full bg-white ${w.kind === 'gate' ? 'text-cold' : w.kind === 'lab' ? 'text-flame' : 'text-green-ink'}`} aria-hidden="true">
                <IconCheck size={14} strokeWidth={2.6} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-ink">{w.title}</span>
                <span className="block text-[12.5px] text-muted">{w.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[14px] text-muted">Nothing new in the last seven days yet. Your first cleared checkpoint, finished build or newly solid skill will show here.</p>
      )}
    </section>
  )
}

function Tile({ title, children, testid }: { title: string; children: React.ReactNode; testid?: string }) {
  return (
    <div className="tile flex flex-col bg-surface" data-testid={testid}>
      <p className="text-[13px] font-semibold text-ink-2">{title}</p>
      {children}
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
    const days: { date: string; done: number; target: number; type: ReturnType<typeof dayType> }[] = []
    for (let d = COURSE_START; d <= today; d = addDays(d, 1)) {
      const t = dayType(d)
      days.push({ date: d, done: cd.credits[d] ?? 0, target: t === 'training' ? dailyTarget(courseWeekOf(d)) : 0, type: t })
      if (t === 'rest') restDays++
      if (t !== 'training') continue
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
    for (const u of blocked)
      for (const g of u.gates.filter((x) => x.failed))
        for (const s of g.gate.skills) if (!weak.has(s)) weak.set(s, `behind the ${g.gate.title.toLowerCase()} checkpoint`)
    const labs = LABS.map((lab) => ({ lab, p: labProgress(lab, repo.state<LabState>(labKey(lab.id)), attempts) }))
    // Supporting telemetry: minutes per course week (an attempt counts for at most 30 minutes).
    const minutes = WEEKS.filter((w) => w.number <= current).map((w) => {
      const dates = new Set(weekDates(w.number))
      return { w: w.number, m: Math.round(attempts.filter((a) => dates.has(a.date)).reduce((n, a) => n + Math.min(1800, a.durationSeconds ?? 0), 0) / 60) }
    })
    const gates = units.flatMap((u) => u.gates).filter((g) => g.available.length)
    // What moved forward in the last seven days: checkpoints cleared, builds finished, skills newly solid.
    const since = addDays(today, -6)
    const wins: { key: string; kind: 'gate' | 'lab' | 'skill'; title: string; detail: string }[] = [
      ...units.flatMap((u) =>
        u.gates.filter((g) => g.cleared && g.clearedOn && g.clearedOn >= since).map((g) => ({ key: `g:${g.gate.id}`, kind: 'gate' as const, title: `${g.gate.title} checkpoint cleared`, detail: `${u.unit.title} is proven` }))
      ),
      ...labs.filter((l) => l.p.done && l.p.doneOn && l.p.doneOn >= since).map((l) => ({ key: `l:${l.lab.id}`, kind: 'lab' as const, title: `${l.lab.title} built`, detail: 'designed, built, changed and reviewed' })),
      ...masteredFresh
        .filter((m) => m.lastPracticed && m.lastPracticed.slice(0, 10) >= since)
        .slice(0, 8)
        .map((m) => ({ key: `s:${m.skillId}`, kind: 'skill' as const, title: skillName(m.skillId), detail: m.status === 'fluent' ? 'fluent' : 'solid, and fresh' }))
    ]
    return {
      wins,
      weeks,
      days,
      trainingDays,
      daysComplete,
      restDays,
      units,
      ready,
      blocked,
      masteredFresh,
      masteredStale,
      developing,
      weak,
      labs,
      minutes,
      gatesCleared: gates.filter((g) => g.cleared).length,
      gatesTotal: gates.length
    }
  }, [cd, current, today, mastery, repo, attempts])

  const thisWeek = data.weeks.find((x) => x.w.number === current)?.k
  const weeksComplete = data.weeks.filter((x) => x.k.complete).length
  const swe = data.labs.filter((l) => !l.lab.aiFde && !l.lab.optional)
  const ai = data.labs.filter((l) => l.lab.aiFde)
  const ev = cd.readiness.evidence
  const evTotal = EVIDENCE_KINDS.reduce((n, k) => n + ev[k.key], 0)
  const recent = data.days.slice(-21)
  const maxDay = Math.max(10, ...recent.map((d) => Math.max(d.done, d.target)))
  const buildsDone = [...swe, ...ai].filter((l) => l.p.done).length

  return (
    <div className="flex flex-col gap-14" data-testid="course-progress">
      {/* WHAT YOU CAN DO: interview readiness by domain, with reasons */}
      <div className="deck relative -mt-24 p-5 sm:p-7">
        <ReadinessReport />
      </div>

      <MovedForward wins={data.wins} />

      {/* THE EVIDENCE: what you produced and how */}
      <div>
        <h2 id="evidence-h" className="section-title mb-1">The evidence</h2>
        <p className="mb-5 text-[13.5px] text-muted">What you produced, and how: each problem counted once, at its strongest.</p>
      <section aria-labelledby="evidence-h" className="rounded-[20px] bg-bg p-3 shadow-[0_0_0_1px_var(--hairline)] sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Tile title="Qualifying reps" testid="course-total">
            <p className="num mt-2 text-[34px] font-semibold leading-none tracking-tight">
              {cd.total}
              <span className="text-[14px] font-medium text-muted"> / {COURSE_TARGET}</span>
            </p>
            <p className="mt-1 text-[12px] text-muted">produced in the course, each one counted once</p>
            <div className="mt-auto flex h-[64px] items-end gap-[3px] pt-3" aria-label="The last three weeks, day by day" role="img">
              {recent.map((d) => (
                <span
                  key={d.date}
                  title={`${d.date}: ${d.done}${d.target ? ` of ${d.target}` : d.type === 'rest' ? ' (rest)' : ''}`}
                  className="flex-1 rounded-t-[3px]"
                  style={{
                    height: `${Math.max(5, (100 * d.done) / maxDay)}%`,
                    background: d.type === 'rest' ? 'var(--rest-soft)' : d.target && d.done >= d.target ? 'var(--flame)' : d.done ? 'var(--flame-2)' : 'var(--surface-3)'
                  }}
                />
              ))}
            </div>
            <div className="mt-1 flex gap-[3px] text-[9.5px] text-faint" aria-hidden="true">
              {recent.map((d) => (
                <span key={d.date} className="flex-1 text-center">
                  {DOW[parseLocal(d.date).getDay()]}
                </span>
              ))}
            </div>
          </Tile>

          <Tile title="How you got there" testid="evidence-mix">
            <p className="num mt-2 text-[34px] font-semibold leading-none tracking-tight">
              {ev.coldIndependent + ev.independent + ev.retrieval + ev.selfCorrected}
              <span className="text-[14px] font-medium text-muted"> on your own</span>
            </p>
            <p className="mt-1 text-[12px] text-muted">full problems, each at its strongest</p>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-surface-3" role="img" aria-label="Evidence by kind">
              {evTotal > 0 && EVIDENCE_KINDS.map((k) => (ev[k.key] ? <span key={k.key} style={{ width: `${(100 * ev[k.key]) / evTotal}%`, background: k.color }} /> : null))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11.5px] text-ink-2">
              {EVIDENCE_KINDS.map((k) => (
                <li key={k.key} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: k.color }} />
                  <span className="leading-tight">{k.label}</span>
                  <span className="num ml-auto font-semibold">{ev[k.key]}</span>
                </li>
              ))}
            </ul>
          </Tile>

          <Tile title="Consistency" testid="streak-stat">
            <div className="mt-2 flex items-center gap-3">
              <TrainingFlame state={cd.flame} size={44} testId="progress-flame" />
              <p className="num text-[34px] font-semibold leading-none tracking-tight">
                {cd.streak}
                <span className="text-[14px] font-medium text-muted"> day streak</span>
              </p>
            </div>
            <dl className="mt-auto flex flex-col gap-1.5 pt-4 text-[13px]">
              <div className="flex justify-between" data-testid="days-complete">
                <dt className="text-ink-2">Required days complete</dt>
                <dd className="num font-semibold">
                  {data.daysComplete} / {data.trainingDays}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Planned rest taken</dt>
                <dd className="num font-semibold">{data.restDays}</dd>
              </div>
              <p className="text-[11.5px] text-muted">Rest is planned. It never breaks a streak.</p>
            </dl>
          </Tile>

          <Tile title="On the road" testid="weeks-complete">
            <div className="mt-2 flex items-center gap-4">
              <Ring value={data.ready} max={Math.max(1, data.units.length)} size={74} stroke={8} color="var(--pass)">
                <span className="num text-[16px] font-semibold">{data.ready}</span>
              </Ring>
              <div className="text-[13px] leading-snug">
                <p className="font-semibold text-ink" data-testid="units-ready">
                  {data.ready} of {data.units.length} units cleared
                </p>
                <p className="text-muted">
                  Week {current} of 14 · {weeksComplete} complete
                </p>
              </div>
            </div>
            <dl className="mt-auto flex flex-col gap-1.5 pt-4 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-2">Checkpoints cleared</dt>
                <dd className="num font-semibold">
                  {data.gatesCleared} / {data.gatesTotal}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Builds completed</dt>
                <dd className="num font-semibold">
                  {buildsDone} / {swe.length + ai.length}
                </dd>
              </div>
              <div className="flex justify-between" data-testid="units-blocked">
                <dt className="text-ink-2">Units needing repair</dt>
                <dd className={`num font-semibold ${data.blocked.length ? 'text-repair' : ''}`}>{data.blocked.length}</dd>
              </div>
            </dl>
          </Tile>
        </div>

        {thisWeek && (
          <div
            className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl px-5 py-4 shadow-[inset_0_0_0_1px_var(--line)]"
            data-testid="week-output"
            data-status={thisWeek.status}
          >
            <p className="text-[15px] font-semibold">This week</p>
            <span className={`tag ${STATE_TAG[thisWeek.status]}`}>{STATE_LABEL[thisWeek.status]}</span>
            <p className="num text-[13.5px] text-ink-2">
              {thisWeek.output.done} / {thisWeek.output.target} problems · {thisWeek.labs.filter((l) => !l.optional && l.done).length} /{' '}
              {thisWeek.labs.filter((l) => !l.optional).length} builds · {thisWeek.gates.filter((g) => g.cleared).length} / {thisWeek.gates.length} checkpoints
              {thisWeek.targets.length ? ` · ${thisWeek.targets.filter((t) => t.solved).length} / ${thisWeek.targets.length} targets` : ''}
            </p>
            {thisWeek.overdue.length > 0 && <p className="w-full text-[13px] text-repair">Overdue: {thisWeek.overdue.join(' · ')}</p>}
          </div>
        )}
      </section>
      </div>

      {/* THE STORY: week by week */}
      <section aria-labelledby="weeks-h" data-testid="week-summaries">
        <h2 id="weeks-h" className="section-title">
          Week by week
        </h2>
        <p className="mt-1 text-[13.5px] text-muted">What each week asked for, and what you produced.</p>
        <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.weeks
            .slice()
            .reverse()
            .map(({ w, k }) => {
              const pct = Math.min(100, Math.round((100 * k.output.done) / Math.max(1, k.output.target)))
              const inProgress = w.number === current && !k.complete
              return (
                <li key={w.number} className="flex flex-col rounded-2xl bg-bg p-5 shadow-[0_0_0_1px_var(--hairline)]" data-week={w.number} data-status={k.status}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="num text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Week {w.number}</p>
                    <span className={`tag ${inProgress ? 'tag-flame' : STATE_TAG[k.status]}`}>{inProgress ? 'In progress' : STATE_LABEL[k.status]}</span>
                  </div>
                  <p className="font-display mt-1 text-[20px] font-semibold tracking-tight">{w.title}</p>
                  <div className="mt-3 flex items-end gap-3">
                    <p className="num text-[26px] font-semibold leading-none tracking-tight">{k.output.done}</p>
                    <p className="num pb-0.5 text-[13px] text-muted">/ {k.output.target} problems</p>
                    <p className="num ml-auto pb-0.5 text-[12.5px] text-muted">
                      {k.daysComplete}/{k.trainingDays} days
                    </p>
                  </div>
                  <span className="bar bar-flame mt-2 block h-1.5">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {k.labs.map((l) => (
                      <li key={l.id}>
                        <Link href={`/lab/${l.id}`} className={`tag !normal-case !tracking-normal ${l.done ? 'tag-pass' : 'tag-plain'}`}>
                          {l.done ? '✓ ' : ''}
                          {l.title}
                          {l.optional ? ' (optional)' : ''}
                        </Link>
                      </li>
                    ))}
                    {k.gates.map((g) => (
                      <li key={g.id}>
                        <Link href="/plan" className={`tag !normal-case !tracking-normal ${g.cleared ? 'tag-cold' : 'tag-plain'}`}>
                          {g.cleared ? '✓ ' : ''}
                          {g.title} checkpoint
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {k.complete ? (
                    <p className="mt-3 text-[13px] text-ink-2">{motivate('week-complete', { week: w.number, weekDone: k.output.done }).text}</p>
                  ) : (
                    w.number < current && (
                      <Link href="/" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-ink hover:underline">
                        Return to today&apos;s recovery plan <IconArrowRight size={12} />
                      </Link>
                    )
                  )}
                </li>
              )
            })}
        </ol>
      </section>

      {/* WEAK SKILLS: actionable only */}
      <section aria-labelledby="weak-h" data-testid="weak-skills">
        <h2 id="weak-h" className="section-title">
          What needs work
        </h2>
        {data.weak.size ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[...data.weak].map(([s, why]) => (
              <li key={s} className="flex items-center gap-3 rounded-xl bg-repair-soft px-4 py-3">
                <span className="text-repair" aria-hidden="true">
                  <IconRepair size={16} />
                </span>
                <span className="min-w-0 flex-1 text-[14px]">
                  <Link href={`/skills/${s}`} className="font-medium text-ink hover:underline">
                    {skillName(s)}
                  </Link>
                  <span className="text-muted"> · {why}</span>
                </span>
                <Link href="/" className="text-[12.5px] font-medium text-repair hover:underline">
                  Fix on Today
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-[14px] text-ink-2">
            <span className="check" data-on="true" aria-hidden="true">
              <IconCheck size={10} strokeWidth={3} />
            </span>
            Nothing is failing right now. Today&apos;s list brings back what is due.
          </p>
        )}
      </section>

      {/* MASTERY vs FRESHNESS */}
      <section aria-labelledby="mastery-h" data-testid="mastery-freshness">
        <h2 id="mastery-h" className="section-title">
          Mastery and freshness
        </h2>
        <p className="mt-1 max-w-[760px] text-[13.5px] text-muted">
          Mastered means produced well and often; fresh means practised in the last {FRESH_DAYS} days. A skill can be mastered and stale: spaced retrieval
          brings it back.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(
            [
              ['Mastered · fresh', data.masteredFresh, 'tile-pass', 'text-green-ink', 'Yours, and recently proven.'],
              ['Mastered · stale', data.masteredStale, 'tile-repair', 'text-repair', 'Yours, but due for a cold rep.'],
              ['Developing', data.developing, 'tile-learn', 'text-learn', 'In practice now.']
            ] as const
          ).map(([label, list, tile, tone, why]) => (
            <div key={label} className={`tile ${tile}`} data-group={label}>
              <div className="flex items-baseline justify-between">
                <p className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${tone}`}>{label}</p>
                <p className="num font-display text-[26px] font-semibold leading-none">{list.length}</p>
              </div>
              <p className="mt-1 text-[12px] text-muted">{why}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {list.slice(0, 18).map((m) => (
                  <li key={m.skillId}>
                    <Link href={`/skills/${m.skillId}`} className="chip bg-white/70">
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

      {/* BUILDING */}
      <section aria-labelledby="labs-h" data-testid="labs-progress">
        <h2 id="labs-h" className="section-title">
          What you have built
        </h2>
        <p className="mt-1 text-[13.5px] text-muted">Small, real programs: designed, built, changed and reviewed. Done or not done.</p>
        {(
          [
            ['Junior SWE builds', swe],
            ['Applied AI / FDE builds', ai]
          ] as const
        ).map(([label, list]) => (
          <div key={label} className="mt-5">
            <p className="label">
              {label} · {list.filter((l) => l.p.done).length} / {list.length}
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {list.map(({ lab, p }) => (
                <li key={lab.id}>
                  <Link
                    href={`/lab/${lab.id}`}
                    className={`flex h-full flex-col rounded-xl p-3 text-[12.5px] transition-colors ${
                      p.done ? 'bg-pass-soft' : lab.week <= current ? 'bg-bg shadow-[0_0_0_1px_var(--line)] hover:bg-surface' : 'bg-surface text-muted'
                    }`}
                  >
                    <span className="num text-[10.5px] font-semibold uppercase tracking-[0.08em] opacity-70">Week {lab.week}</span>
                    <span className={`mt-0.5 font-medium ${p.done ? 'text-green-ink' : lab.week <= current ? 'text-ink' : ''}`}>{lab.title}</span>
                    <span className="mt-auto pt-1 text-[11.5px]">{p.done ? '✓ Done' : lab.week <= current ? 'Not done' : 'Later'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* APPLIED ENGINEERING and SYSTEM DESIGN evidence */}
      <AppliedEvidence />

      {/* TIME: supporting telemetry */}
      <details className="group border-t border-line pt-6" data-testid="time-telemetry">
        <summary className="cursor-pointer text-[13.5px] font-medium text-muted">Time per week (supporting telemetry, not the score)</summary>
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
