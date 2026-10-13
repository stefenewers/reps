'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { IconArrowRight, IconCheck, IconExternal } from '@/components/icons'
import { useReps } from '@/components/reps-provider'
import { useTargets } from '@/components/use-targets'
import { trainingKey, type useTraining } from '@/components/use-training'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { PACE } from '@/data/schedule-90'
import { formatMinutes, shortDate } from '@/lib/dates'
import type { PaceCalendar } from '@/lib/pace-calendar'
import { passedSet } from '@/lib/progress'
import type { SessionBlock } from '@/lib/session-planner'
import { createSession } from '@/lib/sessions'
import { todayTarget, type Category, type ChecklistItem } from '@/lib/today-target'
import { phaseEmphasis } from '@/lib/training-state'
import type { DayModule } from '@/lib/types'

type Training = ReturnType<typeof useTraining>

/** Real minutes for a block of repeats: something already passed goes quicker than new work. */
const repeatMinutes = (b: SessionBlock) => Math.max(5, Math.round((b.minutes * 1.25) / 5) * 5)

const GROUP: Record<Category, { title: string; note: string }> = {
  target: { title: 'Target', note: 'What keeps you on the plan’s line today' },
  maintenance: { title: 'Maintenance', note: 'Keeps what you have. Not needed for pace' },
  bonus: { title: 'Bonus', note: 'Beyond today’s target' },
}

interface Props {
  day: DayModule
  pace: PaceCalendar
  training: Training
  /** Re-solves and redos due today. */
  resolves: { total: number; logged: number; next: string | null }
  /** Skill reviews due now. */
  coldDue: number
  startCold: () => void
  /** The next rep in the 90-day plan, whatever today holds. */
  roadmap: { label: string; href: string } | null
  planEnd: string
}

/**
 * The top of Today: today's target (what must be finished to stay on the
 * plan's line, how much is left, when you are done), one checklist that puts
 * target, maintenance and bonus in a single ordered list, and a compact pace
 * strip. Reads the pacing engine; schedules nothing.
 */
export default function TodayTarget({ day, pace, training, resolves, coldDue, startCold, roadmap, planEnd }: Props) {
  const { repo, attempts, today } = useReps()
  const { byLc } = useTargets()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const { plan, pending, session, nextInSession } = training

  // Once today's session is under way its own blocks are what is shown: the list does not shift under you.
  const blocks: SessionBlock[] = useMemo(
    () => (session?.training ? session.training.blocks.map((b) => ({ ...b, kind: b.kind as SessionBlock['kind'], minutes: b.minutes ?? 0 })) : plan.blocks.filter((b) => b.kind !== 'maintain' && !b.lc)),
    [session, plan.blocks],
  )

  const t = useMemo(() => {
    const passed = passedSet(attempts)
    const passedToday = new Set(attempts.filter((a) => a.passed && a.completedAt && a.date === today).map((a) => a.exerciseId))
    const queue = new Map(pace.queue.map((q) => [q.key, q]))
    const rest = !day.planDay || day.phase === 'off'
    return todayTarget({
      today,
      rest,
      status: pace.status,
      finish: pace.finish,
      finishDelta: pace.finishDelta,
      planEnd,
      // Today's stretch of the canonical queue: what was passed today plus what today's pace still reaches.
      reps: day.sections
        .filter((s) => !s.optional)
        .flatMap((s) => s.exercises.map((e) => ({ id: e.id, minutes: queue.get(e.id)?.minutes ?? e.minutes * PACE.repsFactor, done: passed.has(e.id), baseline: queue.get(e.id)?.baseline ?? today, section: s.title }))),
      problems: (day.leetcode ?? [])
        .filter((x) => x.type === 'new')
        .map((x) => ({ lc: x.lc, title: x.title, minutes: queue.get(`lc:${x.lc}`)?.minutes ?? 40, done: byLc.get(x.lc)?.first != null, baseline: queue.get(`lc:${x.lc}`)?.baseline ?? today })),
      prep: pending
        ? []
        : blocks
            .filter((b) => b.extra && b.reps.length)
            .map((b) => ({
              key: b.kind === 'reactivate' ? ('warm' as const) : ('redo' as const),
              label: b.kind === 'reactivate' ? 'Warm up' : 'Again, cold',
              detail: b.kind === 'reactivate' ? b.title : `${b.reps.length} rep${b.reps.length === 1 ? '' : 's'} that needed help last session`,
              total: b.reps.length,
              done: b.reps.filter((id) => passedToday.has(id)).length,
              minutes: repeatMinutes(b),
            })),
      resolves,
      cold: { due: coldDue, cap: phaseEmphasis(day.planDay).maintain, doneToday: new Set(attempts.filter((a) => a.passed && a.completedAt && a.date === today && a.sessionKind === 'review').map((a) => a.exerciseId)).size },
      ahead: roadmap?.label ?? null,
    })
  }, [attempts, today, pace, day, byLc, blocks, pending, resolves, coldDue, roadmap, planEnd])

  // The session: prep and the plan's reps, typed in the Reps editor, in order.
  const ids = [...new Set(plan.blocks.filter((b) => !(pending && b.kind === 'reactivate') && b.kind !== 'maintain').flatMap((b) => b.reps))]
  const start = async () => {
    if (busy || !ids.length) return
    setBusy(true)
    const mine = plan.blocks.filter((b) => !(pending && b.kind === 'reactivate') && b.kind !== 'maintain')
    const extras = mine.filter((b) => b.extra).flatMap((b) => b.reps)
    // Repeats start from the bare starter: code saved the first time through would give the answer away.
    for (const id of extras) {
      try {
        window.localStorage.removeItem(`reps-draft:${id}`)
      } catch {
        /* the synced draft below is cleared either way */
      }
      await repo.saveDraft(id, EXERCISE_BY_ID[id]?.starterCode ?? '')
    }
    const s = await createSession(repo, 'day', "Today's training", ids, undefined, { training: { blocks: mine.filter((b) => b.reps.length).map((b) => ({ kind: b.kind, title: b.title, why: b.why, reps: b.reps, minutes: b.minutes, extra: b.extra })), extras } })
    await repo.setState(trainingKey(today), { sessionId: s.id })
    router.push(`/rep/${ids[0]}?s=${s.id}`)
  }

  // The one next action, from the first item that is not done.
  const next = t.next
  const inEditor = next && (next.prep || next.key === 'plan')
  const sessionRep = session ? nextInSession : (ids[0] ?? null)
  const nextRep = inEditor ? sessionRep : null
  const problem = next?.key === 'problem' ? (day.leetcode ?? []).find((x) => x.type === 'new' && byLc.get(x.lc)?.first == null) : undefined
  const nextTitle = pending
    ? 'Finish the reactivation session above'
    : nextRep
      ? (EXERCISE_BY_ID[nextRep]?.title ?? next!.label)
      : inEditor && roadmap
        ? roadmap.label
        : next?.key === 'problem'
          ? next.label
          : next?.key === 'resolves'
            ? resolves.next
              ? `Re-solve ${resolves.next} on LeetCode`
              : 'LeetCode re-solves'
            : next?.key === 'cold'
              ? `${next.total - next.done} cold rep${next.total - next.done === 1 ? '' : 's'}`
              : null

  const cta = pending ? null : nextRep ? (
    session ? (
      <Link href={`/rep/${nextRep}?s=${session.id}`} className="btn btn-accent btn-lg" data-testid="training-start">
        Continue <IconArrowRight size={15} />
      </Link>
    ) : (
      <button type="button" className="btn btn-accent btn-lg" onClick={start} disabled={busy} data-testid="training-start">
        {t.target.repsDone ? 'Continue' : 'Start'} <IconArrowRight size={15} />
      </button>
    )
  ) : inEditor && roadmap ? (
    <Link href={roadmap.href} className="btn btn-accent btn-lg" data-testid="training-start">
      Continue <IconArrowRight size={15} />
    </Link>
  ) : problem ? (
    <a href={byLc.get(problem.lc)?.url} target="_blank" rel="noreferrer" className="btn btn-accent btn-lg" data-testid="training-start">
      Open LC {problem.lc} on LeetCode <IconExternal size={14} />
    </a>
  ) : next?.key === 'resolves' ? (
    <a href="#leetcode" className={`btn btn-lg ${t.day === 'target' ? 'btn-accent' : ''}`} data-testid="training-start">
      Do maintenance: re-solves <IconArrowRight size={15} />
    </a>
  ) : next?.key === 'cold' ? (
    <button type="button" className="btn btn-lg" onClick={startCold} data-testid="training-start">
      Do maintenance: cold reps <IconArrowRight size={15} />
    </button>
  ) : t.day === 'complete' && roadmap ? (
    <Link href={roadmap.href} className="btn btn-lg" data-testid="keep-going">
      Keep going (bonus) <IconArrowRight size={15} />
    </Link>
  ) : null

  const reached = t.day === 'maintenance' || t.day === 'complete'
  const tone = t.start.state === 'behind' ? 'text-amber' : 'text-ink'
  const counts = [t.target.repsTotal ? `${t.target.repsDone} of ${t.target.repsTotal} target reps complete` : '', t.target.problemsTotal ? `${t.target.problemsDone} of ${t.target.problemsTotal} target problem${t.target.problemsTotal === 1 ? '' : 's'} solved` : ''].filter(Boolean)

  if (t.day === 'rest')
    return (
      <section aria-labelledby="target-h" className="mt-9 rounded-[20px] bg-bg p-6 shadow-[0_0_0_1px_var(--hairline),var(--shadow-md)] sm:p-8" data-testid="today-target" data-day="rest">
        <p className="eyebrow text-ink-2">Today</p>
        <h2 id="target-h" className="mt-2 text-[26px] font-semibold tracking-tight">
          {t.headline}
        </h2>
        <p className="mt-1.5 text-[14px] text-muted">{t.message}</p>
      </section>
    )

  return (
    <>
      {/* 1. Today's target */}
      <section aria-labelledby="target-h" className="mt-9 rounded-[20px] bg-bg p-6 shadow-[0_0_0_1px_var(--hairline),0_2px_4px_rgba(28,24,12,0.04),0_18px_40px_-16px_rgba(28,24,12,0.18)] sm:p-8" data-testid="today-target" data-day={t.day}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="eyebrow flex items-center gap-2 text-ink-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" /> Today&apos;s target
          </p>
          <p className={`num text-[12.5px] font-medium ${tone}`} data-testid="starting-today">
            Starting today: {t.start.label}
          </p>
        </div>

        <h2 id="target-h" className="mt-2 text-[26px] font-semibold leading-tight tracking-tight" data-testid="target-title">
          {reached ? (
            <span className="inline-flex items-center gap-2">
              <IconCheck size={20} strokeWidth={2.6} className="text-pass" /> {t.headline}
            </span>
          ) : (
            <>
              {day.title}
              {plan.target && !day.title.includes(plan.target.title) && <span className="text-muted"> → {plan.target.title}</span>}
            </>
          )}
        </h2>
        {!reached && <p className="mt-1.5 max-w-[640px] text-[14px] leading-relaxed text-ink-2">{plan.goal}</p>}

        <div className="mt-5 flex items-center gap-4">
          <span className="num text-[30px] font-semibold leading-none tracking-tight" aria-hidden="true">
            {t.target.percent}%
          </span>
          <span className="bar block h-2 flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={t.target.percent} aria-label={`Today's target: ${t.target.percent}% complete`} data-testid="target-progress">
            <span style={{ width: `${t.target.percent}%`, background: 'var(--accent)' }} />
          </span>
        </div>
        <p className="num mt-2.5 text-[14px] text-ink-2" data-testid="target-remaining">
          {reached ? (
            t.day === 'maintenance' ? (
              <>Required work: complete · Maintenance: {t.maintenance.summary} · about {formatMinutes(t.maintenance.minutesLeft)}</>
            ) : (
              <>Required work: complete · Maintenance: complete</>
            )
          ) : (
            <>
              {counts.join(' · ')} · <span className="font-medium text-ink">about {formatMinutes(t.target.minutesLeft)} of target work remaining</span>
            </>
          )}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {nextTitle && (
              <p className="text-[14px] text-ink-2" data-testid="next-up">
                <span className="text-muted">{t.day === 'target' ? 'Next:' : 'Next, if you want it:'}</span> <span className="font-medium text-ink">{nextTitle}</span>
                {next && !pending && <span className="text-muted"> · {next.prep ? `${next.label} (prep)` : GROUP[next.category].title.toLowerCase()}</span>}
              </p>
            )}
            <p className="mt-1 max-w-[640px] text-[12.5px] leading-relaxed text-muted" data-testid="target-message">
              {t.message}
            </p>
          </div>
          <div className="shrink-0">{cta}</div>
        </div>
      </section>

      {/* 2. One checklist: target, maintenance, bonus */}
      <section aria-labelledby="checklist-h" className="panel mt-4 p-6" data-testid="today-checklist">
        <h2 id="checklist-h" className="h2">
          Today
        </h2>
        {(['target', 'maintenance', 'bonus'] as Category[]).map((cat) => {
          const rows = t.items.filter((i) => i.category === cat)
          if (!rows.length) return null
          return (
            <div key={cat} className="mt-4" data-group={cat}>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="label">{GROUP[cat].title}</span>
                <span className="text-[12px] text-faint">{GROUP[cat].note}</span>
              </p>
              <ul className="mt-1 flex flex-col">
                {rows.map((i) => (
                  <Row key={i.key + i.label} item={i} />
                ))}
              </ul>
            </div>
          )
        })}
        {t.items.some((i) => i.prep) && <p className="mt-3 text-[12px] leading-relaxed text-faint">Prep is recommended first. It warms up what today’s target leans on, and is not counted toward the target.</p>}
        <p className="num mt-4 flex items-baseline justify-between pt-3 text-[13.5px]" style={{ boxShadow: '0 -1px 0 var(--line)' }}>
          <span className="font-medium text-ink">Target remaining</span>
          <span className="font-medium text-ink">{t.target.minutesLeft ? `about ${formatMinutes(t.target.minutesLeft)}` : 'none'}</span>
        </p>
      </section>

      {/* 3. Compact pace */}
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-bg px-5 py-4 shadow-[0_0_0_1px_var(--line)] sm:grid-cols-4" data-testid="pace-strip" data-pace={t.start.state}>
        <Cell label="Starting today" value={t.start.label} tone={tone} />
        <Cell label="Target remaining" value={t.target.minutesLeft ? `about ${formatMinutes(t.target.minutesLeft)}` : 'none'} />
        <div>
          <dt className="text-[12px] text-muted">Forecast finish</dt>
          <dd className="num mt-0.5 text-[14.5px] font-medium text-ink">
            <Link href="/plan" className="hover:underline" title="See the forecast">
              {pace.finish ? shortDate(pace.finish) : '—'}
            </Link>
            {pace.finishDelta !== 0 && <span className="ml-1.5 text-[12px] font-normal text-muted">{pace.finishDelta > 0 ? `${pace.finishDelta}d late` : `${-pace.finishDelta}d early`}</span>}
          </dd>
        </div>
        <Cell label="Maintenance" value={t.maintenance.left ? `${t.maintenance.summary} due` : 'nothing due'} />
      </dl>
      {roadmap && (
        <p className="mt-2 px-2 text-[12.5px] text-muted">
          Where you are in the 90-day plan:{' '}
          <Link href={roadmap.href} className="text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink" data-testid="start-today">
            {roadmap.label}
          </Link>
        </p>
      )}
    </>
  )
}

function Cell({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className={`num mt-0.5 text-[14.5px] font-medium ${tone}`}>{value}</dd>
    </div>
  )
}

/** One checklist row. Its state is in the text as well as the mark: done, in progress, to do. */
function Row({ item: i }: { item: ChecklistItem }) {
  const partial = i.state !== 'done' && i.done > 0
  const word = i.state === 'done' ? 'Done' : partial ? 'In progress' : i.state === 'now' ? 'Next' : i.category === 'bonus' ? 'Optional' : 'To do'
  return (
    <li className={`grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-2 ${i.state === 'now' ? 'bg-surface' : ''}`} data-key={i.key} data-category={i.category} data-state={i.state} aria-current={i.state === 'now' ? 'step' : undefined}>
      <span aria-hidden="true" className={`grid size-[20px] place-items-center rounded-full text-[11px] ${i.state === 'done' ? 'bg-ink text-white' : i.state === 'now' ? 'bg-accent text-white' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
        {i.state === 'done' ? <IconCheck size={11} strokeWidth={2.6} /> : partial ? '◐' : ''}
      </span>
      <p className={`min-w-0 text-[14.5px] ${i.state === 'done' ? 'text-muted' : 'text-ink'}`}>
        <span className="sr-only">{word}: </span>
        <span className="font-medium">{i.label}</span>
        {i.prep && <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 py-px text-[11px] font-medium text-ink-2">prep</span>}
        <span className={`hidden sm:inline ${i.state === 'done' ? '' : 'text-muted'}`}> · {i.detail}</span>
      </p>
      <span className="num whitespace-nowrap text-right text-[12.5px] text-muted">
        {i.total > 1 && <span className={i.state === 'done' ? '' : 'text-ink-2'}>{i.done} / {i.total}</span>}
        {i.total > 1 && ' · '}
        {i.state === 'done' ? 'done' : i.minutesLeft ? `~${formatMinutes(i.minutesLeft)}${i.done ? ' left' : ''}` : word.toLowerCase()}
      </span>
    </li>
  )
}
