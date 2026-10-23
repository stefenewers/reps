'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IconArrowRight, IconCheck, IconExternal, IconPlay } from '@/components/icons'
import { useReps } from '@/components/reps-provider'
import type { useTodayPlan } from '@/components/use-today-plan'
import { trainingKey, type useTraining } from '@/components/use-training'
import { conceptFor, type Concept } from '@/data/concepts'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { practiceSite } from '@/data/problem-urls'
import { shortDate } from '@/lib/dates'
import { createSession } from '@/lib/sessions'
import type { ItemKind, PlanItem } from '@/lib/today-plan'

type TodayPlanState = ReturnType<typeof useTodayPlan>
type Training = ReturnType<typeof useTraining>

const KIND: Record<ItemKind, string> = {
  warm: 'Warm-up',
  redo: 'Again, cold',
  learn: 'Learn',
  drill: 'Drill',
  combine: 'Combine',
  transfer: 'Unlabeled',
  prove: 'Prove',
  problem: 'LeetCode',
  resolve: 'Re-solve',
  cold: 'Cold rep',
  gate: 'Checkpoint',
  repair: 'Repair',
}
/** The block a kind belongs to in a training session (the chip on the rep page). */
const BLOCK: Record<ItemKind, string> = { warm: 'reactivate', redo: 'drill', learn: 'learn', drill: 'drill', combine: 'combine', transfer: 'prove', prove: 'prove', problem: 'prove', resolve: 'maintain', cold: 'maintain', gate: 'prove', repair: 'drill' }
const WHY: Record<ItemKind, string> = {
  warm: 'You already learned this. A quick rep warms it back up before today leans on it.',
  redo: 'This needed help last time. Write it again from blank.',
  learn: 'New here: read the idea, then type it.',
  drill: 'Understood, not yet automatic. Small productions until the mechanics stop costing attention.',
  combine: 'The pieces exist. This is where they are put together.',
  transfer: 'The pattern is not named for you here. Work out which of your moves applies.',
  prove: 'Cold, from a signature: the check that the pattern is yours.',
  problem: 'Every move it needs is one you have already written. Now assemble them.',
  resolve: 'Brought back before it fades.',
  cold: 'Brought back before it fades.',
  gate: 'A checkpoint: cold, no lesson panel, no solution. Passing it unlocks what comes next.',
  repair: 'The smallest piece the checkpoint showed was missing. Then a fresh checkpoint.',
}

/** The concepts today's work is about, most-used first. */
function focusOf(items: PlanItem[]): Concept[] {
  const count = new Map<string, { c: Concept; n: number }>()
  for (const i of items) {
    if (!i.exerciseId || i.kind === 'resolve' || i.kind === 'cold') continue
    const c = conceptFor(EXERCISE_BY_ID[i.exerciseId]?.skills ?? [])
    if (!c) continue
    const v = count.get(c.id) ?? { c, n: 0 }
    v.n++
    count.set(c.id, v)
  }
  return [...count.values()].sort((a, b) => b.n - a.n).slice(0, 2).map((v) => v.c)
}

export default function TodayTraining({ plan, training, lcUrl, forecast }: { plan: TodayPlanState; training: Training; lcUrl: (lc: number) => string | undefined; forecast: { finish: string | null; planEnd: string } }) {
  const { repo, today } = useReps()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const cap = plan.capacityInfo
  const left = plan.items.filter((i) => !i.done)
  const next = left[0]
  const focus = focusOf(plan.items)
  const session = training.session
  const pct = Math.min(100, Math.round((100 * plan.repsDone) / plan.capacity))

  // A session over today's reps that are typed in the editor, in order, with what each is for.
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

  const cta = plan.complete ? null : next?.exerciseId ? (
    inSession(next.exerciseId) ? (
      <Link href={hrefFor(next)!} className="btn btn-accent btn-lg" data-testid="training-start">
        Continue <IconArrowRight size={15} />
      </Link>
    ) : (
      <button type="button" className="btn btn-accent btn-lg" onClick={start} disabled={busy} data-testid="training-start">
        {plan.repsDone ? 'Continue' : 'Start'} <IconArrowRight size={15} />
      </button>
    )
  ) : next?.lc ? (
    <a href={hrefFor(next)} {...(next.kind === 'problem' ? { target: '_blank', rel: 'noreferrer' } : {})} className="btn btn-accent btn-lg" data-testid="training-start">
      {next.kind === 'problem' ? `Practice LC ${next.lc} on ${practiceSite(next.lc)}` : 'Go to the re-solves'} {next.kind === 'problem' ? <IconExternal size={14} /> : <IconArrowRight size={15} />}
    </a>
  ) : null

  const more = plan.optional.find((o) => o.exerciseId)
  const bonus = plan.optional.find((o) => !o.exerciseId && o.lc)
  return (
    <section aria-labelledby="training-h" className="mt-9 rounded-[20px] bg-bg p-6 shadow-[0_0_0_1px_var(--hairline),0_2px_4px_rgba(28,24,12,0.04),0_18px_40px_-16px_rgba(28,24,12,0.18)] sm:p-8" data-testid="today-training" data-complete={plan.complete ? 'true' : 'false'}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="eyebrow flex items-center gap-2 text-ink-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" /> Today&apos;s training
        </p>
        <p className="num text-[12.5px] text-muted" data-testid="training-week">
          Week {cap.week} · {cap.stage.title}
        </p>
      </div>

      {plan.complete ? (
        <div className="mt-2" data-testid="training-complete">
          <h2 id="training-h" className="flex items-center gap-2 text-[28px] font-semibold leading-tight tracking-tight">
            <IconCheck size={22} strokeWidth={2.6} className="text-pass" /> Training complete
          </h2>
          <p className="num mt-1 text-[15px] text-ink-2">
            {plan.repsDone} / {plan.capacity} · You did enough today.
          </p>
        </div>
      ) : (
        <div className="mt-2">
          <h2 id="training-h" className="num text-[30px] font-semibold leading-tight tracking-tight" data-testid="training-load">
            {plan.capacity} reps
          </h2>
          <p className="mt-1 max-w-[620px] text-[14px] leading-relaxed text-ink-2">
            <span className="font-medium text-ink">Today&apos;s goal: </span>
            {cap.stage.goal}
          </p>
        </div>
      )}

      {focus.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-surface px-4 py-3" data-testid="training-focus">
          <span className="label">Focus</span>
          <span className="text-[14px] font-medium text-ink">{focus.map((c) => c.title).join(' + ')}</span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            <Link href={`/learn/${focus[0].id}`} className="btn btn-sm" data-testid="review-concept">
              Review concept
            </Link>
            {focus[0].videos[0] && (
              <a href={focus[0].videos[0].url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title={`${focus[0].videos[0].title} · ${focus[0].videos[0].channel}`}>
                <IconPlay size={10} /> Watch · {focus[0].videos[0].duration}
              </a>
            )}
          </span>
        </div>
      )}

      <div className="mt-5 flex items-center gap-4">
        <span className="num text-[15px] font-semibold text-ink" aria-hidden="true">
          {plan.repsDone} / {plan.capacity}
        </span>
        <span className="bar block h-2 flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={plan.capacity} aria-valuenow={Math.min(plan.repsDone, plan.capacity)} aria-label={`Today's training: ${Math.min(plan.repsDone, plan.capacity)} of ${plan.capacity} reps done`} data-testid="training-progress">
          <span style={{ width: `${pct}%`, background: 'var(--accent)' }} />
        </span>
        {cta && <span className="shrink-0">{cta}</span>}
      </div>

      <ol className="mt-5 flex flex-col" data-testid="training-items">
        {plan.items.map((i, k) => {
          const now = !i.done && i === next
          const href = hrefFor(i)
          return (
            <li key={i.key} className={`grid grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl px-2 py-2 ${now ? 'bg-surface' : ''}`} data-kind={i.kind} data-state={i.done ? 'done' : now ? 'now' : 'todo'} aria-current={now ? 'step' : undefined}>
              <span aria-hidden="true" className={`num grid size-[22px] place-items-center rounded-full text-[11.5px] ${i.done ? 'bg-ink text-white' : now ? 'bg-accent text-white' : 'text-muted shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
                {i.done ? <IconCheck size={11} strokeWidth={2.6} /> : k + 1}
              </span>
              <p className={`min-w-0 truncate text-[14px] ${i.done ? 'text-muted' : 'text-ink'}`}>
                <span className="sr-only">{i.done ? 'Done: ' : now ? 'Next: ' : 'To do: '}</span>
                {href && !i.done ? (
                  <a href={href} {...(i.kind === 'problem' ? { target: '_blank', rel: 'noreferrer' } : {})} className="hover:underline">
                    {i.title}
                  </a>
                ) : (
                  i.title
                )}
              </p>
              <span className="whitespace-nowrap text-right text-[12px] text-muted">
                {KIND[i.kind]}
              </span>
            </li>
          )
        })}
      </ol>

      {plan.complete && (
        <div className="mt-5 rounded-xl px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--line)]" data-testid="training-optional">
          <p className="label mb-2">Optional</p>
          <div className="flex flex-wrap gap-2">
            {more && (
              <Link href={`/rep/${more.exerciseId}`} className="btn btn-sm" data-testid="keep-going">
                Keep going: {more.title}
              </Link>
            )}
            {bonus?.lc && (
              <a href={bonus.kind === 'resolve' ? '#leetcode' : lcUrl(bonus.lc)} className="btn btn-sm">
                1 bonus challenge: {bonus.title}
              </a>
            )}
            {focus[0] && (
              <Link href={`/learn/${focus[0].id}`} className="btn btn-ghost btn-sm">
                Review a concept
              </Link>
            )}
          </div>
        </div>
      )}

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-2 pt-4 text-[12.5px] sm:grid-cols-3" style={{ boxShadow: '0 -1px 0 var(--line)' }} data-testid="training-strip">
        <div>
          <dt className="text-muted">Training load</dt>
          <dd className="num mt-0.5 font-medium text-ink">{plan.capacity} reps a day · {cap.stage.range} this stage</dd>
        </div>
        <div>
          <dt className="text-muted">Program forecast</dt>
          <dd className="num mt-0.5 font-medium text-ink">
            <Link href="/plan" className="hover:underline">
              {forecast.finish ? shortDate(forecast.finish) : '—'}
            </Link>
            <span className="ml-1.5 font-normal text-muted">at this load (goal {shortDate(forecast.planEnd)})</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Load review</dt>
          <dd className="mt-0.5 text-ink-2">Every Monday, from how last week went</dd>
        </div>
      </dl>
      <p className="mt-2 text-[12px] leading-relaxed text-faint" data-testid="training-reason">
        {cap.reason}
      </p>
    </section>
  )
}
