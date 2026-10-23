'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { IconArrowRight, IconCheck, IconExternal } from '@/components/icons'
import { useReps } from '@/components/reps-provider'
import TrainingFlame from '@/components/course/training-flame'
import WeekStrip from '@/components/course/week-strip'
import type { useCourseDay } from '@/components/use-course-day'
import type { useTodayPlan } from '@/components/use-today-plan'
import { trainingKey, type useTraining } from '@/components/use-training'
import { conceptFor, CONCEPT_BY_ID } from '@/data/concepts'
import { LESSON_BY_ID, WORKED_EXAMPLE_BY_ID } from '@/data/course/lessons'
import { milestoneReached, todayLine } from '@/data/course/motivation'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { practiceSite } from '@/data/problem-urls'
import { createSession } from '@/lib/sessions'
import type { ItemKind, PlanItem } from '@/lib/today-plan'

type CourseDayState = ReturnType<typeof useCourseDay>
type Plan = ReturnType<typeof useTodayPlan>
type Training = ReturnType<typeof useTraining>

/** Today's path, grouped into the blocks of a training session. */
const GROUP: Record<ItemKind, 'reactivate' | 'learn' | 'drill' | 'combine' | 'prove' | 'retrieve'> = {
  warm: 'reactivate',
  redo: 'reactivate',
  learn: 'learn',
  drill: 'drill',
  repair: 'drill',
  combine: 'combine',
  transfer: 'prove',
  prove: 'prove',
  gate: 'prove',
  problem: 'prove',
  resolve: 'retrieve',
  cold: 'retrieve',
}
const GROUP_LABEL = { reactivate: 'Reactivate', learn: 'Learn', drill: 'Drill', combine: 'Combine', prove: 'Prove', retrieve: 'Retrieve' } as const
const GROUP_TONE = { reactivate: 'text-repair', learn: 'text-learn', drill: 'text-ink', combine: 'text-ink', prove: 'text-cold', retrieve: 'text-pass' } as const
const KIND: Record<ItemKind, string> = { warm: 'Warm-up', redo: 'Again, cold', learn: 'Learn', drill: 'Drill', combine: 'Combine', transfer: 'Unlabeled', prove: 'Prove', problem: 'Problem', resolve: 'Re-solve', cold: 'Cold rep', gate: 'Checkpoint', repair: 'Repair' }
/** The block a kind belongs to on the rep page. */
const BLOCK: Record<ItemKind, string> = { warm: 'reactivate', redo: 'drill', learn: 'learn', drill: 'drill', repair: 'drill', combine: 'combine', transfer: 'prove', prove: 'prove', gate: 'prove', problem: 'prove', resolve: 'maintain', cold: 'maintain' }
const WHY: Record<ItemKind, string> = {
  warm: 'You already learned this. A quick rep warms it back up before today leans on it.',
  redo: 'This needed help last time. Write it again from blank.',
  learn: 'New here: read the idea, then type it.',
  drill: 'Small productions until the mechanics stop costing attention.',
  repair: 'The smallest piece the checkpoint showed was missing. Then a fresh checkpoint.',
  combine: 'The pieces exist. This is where they are put together.',
  transfer: 'The pattern is not named for you here. Work out which of your moves applies.',
  prove: 'Cold, from a signature: the check that the pattern is yours.',
  gate: 'A checkpoint: cold, no lesson panel, no solution. Passing it unlocks what comes next.',
  problem: 'Every move it needs is one you have already written. Now assemble them.',
  resolve: 'Brought back before it fades.',
  cold: 'Brought back before it fades.',
}

export default function CourseToday({ plan, training, cd, lcUrl }: { plan: Plan; training: Training; cd: CourseDayState; lcUrl: (lc: number) => string | undefined }) {
  const { repo, today } = useReps()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [stopped, setStopped] = useState(false)
  const { day, week, progress } = cd
  const target = day.type === 'training' ? day.target : day.optionalTarget
  const done = cd.doneToday
  const complete = day.type === 'training' && done >= target
  const left = plan.items.filter((i) => !i.done)
  const next = left[0]
  const session = training.session
  const pct = target ? Math.min(100, Math.round((100 * done) / target)) : 0
  const line = todayLine({ dayType: day.type, repsDone: done, repsTarget: target, week: day.week, shortfall: day.optionalTarget, holiday: day.holiday, assistedCount: cd.assistedToday, seed: today })

  // Celebrate once, the first time today's target is met on this device (remembered after this view).
  const celebrateKey = `reps-celebrated:${today}`
  const celebrate = useMemo(() => {
    if (!complete) return false
    try {
      return !window.localStorage.getItem(celebrateKey)
    } catch {
      return false
    }
  }, [complete, celebrateKey])
  useEffect(() => {
    if (!celebrate) return
    try {
      window.localStorage.setItem(celebrateKey, '1')
    } catch {
      /* storage blocked: nothing to remember */
    }
  }, [celebrate, celebrateKey])
  const milestone = milestoneReached(cd.total - done, cd.total)

  // The unit in focus and what teaches it.
  const unit = cd.course.current?.unit
  const focusConcepts = [...new Set(left.concat(plan.items).flatMap((i) => (i.exerciseId ? [conceptFor(EXERCISE_BY_ID[i.exerciseId]?.skills ?? [])?.id] : [])).filter(Boolean))].slice(0, 2) as string[]
  const lessons = (unit?.lessonIds ?? []).map((id) => LESSON_BY_ID[id] ?? CONCEPT_BY_ID[id]).filter(Boolean)
  const examples = (unit?.workedExampleIds ?? []).map((id) => WORKED_EXAMPLE_BY_ID[id]).filter(Boolean)
  // Week 13 shows no labels: no lesson suggestions, no concepts, before an attempt.
  const learnFirst = !week.unlabeled && Boolean(unit) && cd.course.current!.route === 'full' && cd.course.current!.done === 0 && (lessons.length > 0 || examples.length > 0)

  const start = async () => {
    const reps = left.filter((i) => i.exerciseId)
    if (busy || !reps.length) return
    setBusy(true)
    const extras = reps.filter((i) => i.kind === 'warm' || i.kind === 'redo' || i.kind === 'cold').map((i) => i.exerciseId!)
    for (const id of extras) {
      try {
        window.localStorage.removeItem(`reps-draft:${id}`)
      } catch {
        /* the synced draft below is cleared either way */
      }
      await repo.saveDraft(id, EXERCISE_BY_ID[id]?.starterCode ?? '')
    }
    const blocks: { kind: string; title: string; why: string; reps: string[]; extra?: boolean }[] = []
    for (const i of reps) {
      const last = blocks[blocks.length - 1]
      if (last && last.kind === BLOCK[i.kind] && last.why === WHY[i.kind]) last.reps.push(i.exerciseId!)
      else blocks.push({ kind: BLOCK[i.kind], title: KIND[i.kind], why: WHY[i.kind], reps: [i.exerciseId!], extra: extras.includes(i.exerciseId!) })
    }
    const s = await createSession(repo, 'day', "Today's training", reps.map((i) => i.exerciseId!), undefined, { training: { blocks, extras } })
    await repo.setState(trainingKey(today), { sessionId: s.id })
    router.push(`/rep/${reps[0].exerciseId}?s=${s.id}`)
  }
  const inSession = (id?: string) => Boolean(id && session?.exerciseIds.includes(id))
  const hrefFor = (i: PlanItem) => (i.exerciseId ? `/rep/${i.exerciseId}${inSession(i.exerciseId) ? `?s=${session!.id}` : ''}` : i.lc ? (i.kind === 'resolve' ? '#leetcode' : lcUrl(i.lc)) : undefined)

  // ── Rest day ──────────────────────────────────────────────────────────────
  if (day.type === 'rest')
    return (
      <section aria-labelledby="today-h" className="mt-8 rounded-[20px] bg-rest-soft p-6 shadow-[0_0_0_1px_var(--hairline)] sm:p-8" data-testid="course-today" data-day="rest">
        <p className="eyebrow text-rest">{day.holiday ?? 'Sunday'} · Week {day.week}</p>
        <h2 id="today-h" className="mt-2 text-[30px] font-semibold leading-tight tracking-tight" data-testid="rest-title">
          Rest day
        </h2>
        <p className="mt-2 max-w-[560px] text-[15.5px] leading-relaxed text-ink-2" data-testid="motivation">
          {line.text}
        </p>
        <p className="mt-3 text-[13px] text-muted">{cd.streak ? `🔥 ${cd.streak}-day streak · rest day, streak protected` : 'Rest protects nothing and costs nothing. Tomorrow starts fresh.'}</p>
        <div className="mt-6 max-w-[420px]">
          <WeekStrip week={day.week} today={today} credits={cd.credits} />
        </div>
      </section>
    )

  return (
    <section aria-labelledby="today-h" className="mt-8 overflow-hidden rounded-[20px] bg-bg shadow-[0_0_0_1px_var(--hairline),0_2px_4px_rgba(28,24,12,0.04),0_18px_40px_-16px_rgba(28,24,12,0.18)]" data-testid="course-today" data-day={day.type} data-complete={complete ? 'true' : 'false'}>
      <div className={`p-6 sm:p-8 ${complete ? 'bg-[linear-gradient(180deg,var(--flame-soft),transparent_70%)]' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="eyebrow flex items-center gap-2 text-ink-2">
            <span data-testid="streak" className={cd.streak ? 'text-flame' : 'text-muted'}>
              {cd.streak ? `🔥 ${cd.streak} training day${cd.streak === 1 ? '' : 's'} in a row` : 'Streak starts with today'}
            </span>
          </p>
          <p className="num text-[12.5px] text-muted" data-testid="course-week">
            Week {week.number} · {week.title}
          </p>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <TrainingFlame state={cd.flame} size={complete ? 64 : 56} ignite={celebrate} />
          <div className="min-w-0 flex-1">
            {complete ? (
              <div data-testid="day-complete">
                <h2 id="today-h" className="celebrate-in text-[30px] font-semibold leading-tight tracking-tight">
                  Day complete
                </h2>
                <p className="num mt-0.5 text-[16px] font-medium text-ink-2">
                  {done} / {target} · You did enough.
                </p>
              </div>
            ) : (
              <div>
                <p className="eyebrow text-muted">{day.type === 'recovery' ? 'Saturday · optional' : 'Today'}</p>
                <h2 id="today-h" className="num text-[32px] font-semibold leading-tight tracking-tight" data-testid="day-target">
                  {day.type === 'recovery' ? (target ? `${target} reps would close the week` : 'Nothing owed') : `${target} reps`}
                </h2>
              </div>
            )}
            {unit && !complete && (
              <p className="mt-1 text-[14px] text-ink-2" data-testid="unit-focus">
                <span className="font-medium text-ink">{unit.title}</span> · {unit.purpose}
              </p>
            )}
          </div>
        </div>

        {target > 0 && (
          <div className="mt-5 flex items-center gap-4">
            <span className="num text-[15px] font-semibold text-ink" aria-hidden="true">
              {done} / {target}
            </span>
            <span className="bar bar-flame block h-2.5 flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(done, target)} aria-label={`Today: ${Math.min(done, target)} of ${target} reps`} data-testid="day-progress">
              <span style={{ width: `${pct}%` }} />
            </span>
          </div>
        )}

        <p className={`mt-4 max-w-[680px] text-[15px] leading-relaxed ${line.tone === 'celebrate' ? 'font-medium text-ink' : 'text-ink-2'}`} data-testid="motivation" data-tone={line.tone}>
          {line.text}
        </p>
        {milestone && complete && (
          <p className="celebrate-in mt-2 inline-flex items-center gap-1.5 rounded-full bg-flame-soft px-3 py-1 text-[13px] font-medium text-flame" data-testid="milestone">
            🔥 {milestone} qualifying problems
          </p>
        )}

        {!complete && next && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {next.exerciseId ? (
              inSession(next.exerciseId) ? (
                <Link href={hrefFor(next)!} className="btn btn-accent btn-lg" data-testid="training-start">
                  Continue <IconArrowRight size={15} />
                </Link>
              ) : (
                <button type="button" className="btn btn-accent btn-lg" onClick={start} disabled={busy} data-testid="training-start">
                  {done ? 'Continue' : 'Start'} <IconArrowRight size={15} />
                </button>
              )
            ) : next.lc ? (
              <a href={hrefFor(next)} {...(next.kind === 'problem' ? { target: '_blank', rel: 'noreferrer' } : {})} className="btn btn-accent btn-lg" data-testid="training-start">
                {next.kind === 'problem' ? `Practice LC ${next.lc} on ${practiceSite(next.lc)}` : 'Go to the re-solves'} <IconExternal size={14} />
              </a>
            ) : null}
            <span className="text-[13px] text-muted">Next: {next.title}</span>
          </div>
        )}
      </div>

      {/* Learn first: a new unit begins with its lesson and worked example. They are not counted; the reps are. */}
      {learnFirst && !complete && (
        <div className="border-t border-line bg-learn-soft px-6 py-5 sm:px-8" data-testid="learn-first">
          <p className="eyebrow text-learn">Learn first · not counted, and that is fine</p>
          <p className="mt-1 text-[14px] text-ink-2">A new unit starts with the idea, then a worked example, then the reps.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lessons.map((l) => (
              <Link key={l.id} href={`/learn/${l.id}`} className="btn btn-sm">
                Lesson: {l.title}
              </Link>
            ))}
            {examples.map((w) => (
              <Link key={w.id} href={`/example/${w.id}`} className="btn btn-sm">
                Worked example: {w.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Today's path, in blocks. */}
      {!complete && plan.items.length > 0 && (
        <div className="border-t border-line px-6 py-5 sm:px-8">
          <ul className="flex flex-wrap gap-2" aria-label="Today's blocks" data-testid="today-blocks">
            {(Object.keys(GROUP_LABEL) as (keyof typeof GROUP_LABEL)[]).map((g) => {
              const items = plan.items.filter((i) => GROUP[i.kind] === g)
              if (!items.length) return null
              const d = items.filter((i) => i.done).length
              return (
                <li key={g} className="flex items-baseline gap-1.5 rounded-lg bg-surface px-3 py-1.5" data-group={g}>
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${GROUP_TONE[g]}`}>{GROUP_LABEL[g]}</span>
                  <span className="num text-[14px] font-semibold text-ink">
                    {d}/{items.length}
                  </span>
                </li>
              )
            })}
          </ul>
          <ol className="mt-4 flex flex-col" data-testid="training-items">
            {plan.items.map((i, k) => {
              const now = !i.done && i === next
              const href = hrefFor(i)
              return (
                <li key={i.key} className={`grid grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-2 transition-colors ${now ? 'bg-surface' : ''}`} data-kind={i.kind} data-state={i.done ? 'done' : now ? 'now' : 'todo'} aria-current={now ? 'step' : undefined}>
                  <span aria-hidden="true" className={`num grid size-[22px] place-items-center rounded-full text-[11.5px] ${i.done ? 'bg-pass text-white' : now ? 'bg-flame text-white' : 'text-muted shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
                    {i.done ? <IconCheck size={11} strokeWidth={2.6} /> : k + 1}
                  </span>
                  <p className={`min-w-0 truncate text-[14px] ${i.done ? 'text-muted line-through decoration-line-strong' : 'text-ink'}`}>
                    <span className="sr-only">{i.done ? 'Done: ' : now ? 'Next: ' : 'To do: '}</span>
                    {href && !i.done ? (
                      <a href={href} {...(i.kind === 'problem' ? { target: '_blank', rel: 'noreferrer' } : {})} className="hover:underline">
                        {i.title}
                      </a>
                    ) : (
                      i.title
                    )}
                  </p>
                  <span className={`whitespace-nowrap text-right text-[12px] ${i.kind === 'gate' ? 'font-medium text-cold' : i.kind === 'repair' ? 'text-repair' : i.kind === 'learn' ? 'text-learn' : 'text-muted'}`}>{KIND[i.kind]}</span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {/* Day complete: the week, tomorrow, and a real choice to stop. */}
      {complete && (
        <div className="border-t border-line px-6 py-5 sm:px-8" data-testid="complete-panel">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="label">Week {week.number}</dt>
              <dd className="num mt-0.5 text-[16px] font-semibold text-ink">
                {progress.done} / {progress.target}
              </dd>
              <dd className="text-[12.5px] text-muted">
                {cd.gatesCleared} of {cd.weekGates.length} checkpoints cleared
              </dd>
            </div>
            <div>
              <dt className="label">Tomorrow</dt>
              <dd className="mt-0.5 text-[14px] text-ink-2">{plan.optional.find((o) => o.exerciseId)?.title ?? unit?.title ?? 'The next unit'}</dd>
            </div>
            <div>
              <dt className="label">Streak</dt>
              <dd className="mt-0.5 text-[14px] text-ink-2">{cd.streak ? `🔥 ${cd.streak} training day${cd.streak === 1 ? '' : 's'}` : '—'}</dd>
            </div>
          </dl>
          {stopped ? (
            <p className="celebrate-in mt-5 text-[14px] font-medium text-ink" data-testid="stopped">
              Good. See you tomorrow.
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2" data-testid="training-optional">
              <button type="button" className="btn btn-accent btn-sm" onClick={() => setStopped(true)} data-testid="stop-today">
                Stop for today
              </button>
              {focusConcepts[0] && !week.unlabeled && (
                <Link href={`/learn/${focusConcepts[0]}`} className="btn btn-sm">
                  Review a concept
                </Link>
              )}
              {plan.optional.find((o) => o.exerciseId) && (
                <Link href={`/rep/${plan.optional.find((o) => o.exerciseId)!.exerciseId}`} className="btn btn-ghost btn-sm" data-testid="keep-going">
                  Bonus: {plan.optional.find((o) => o.exerciseId)!.title}
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
