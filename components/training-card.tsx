'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IconArrowRight, IconCheck, IconExternal } from '@/components/icons'
import { useReps } from '@/components/reps-provider'
import { useTargets } from '@/components/use-targets'
import { trainingKey, type useTraining } from '@/components/use-training'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { PACE } from '@/data/schedule-90'
import { skillName } from '@/data/skills'
import { formatMinutes, shortDate } from '@/lib/dates'
import type { SessionBlock } from '@/lib/session-planner'
import { createSession } from '@/lib/sessions'
import { TRAINING_LABEL } from '@/lib/training-state'

type Training = ReturnType<typeof useTraining>

/** Real minutes: new work at the plan's pace; a repeat of something already passed goes quicker. */
const real = (b: SessionBlock) => {
  const m = b.reps.reduce((n, id) => {
    const e = EXERCISE_BY_ID[id]
    // A capstone reached through its ladder costs what the problem does, not its authored minutes at the rep pace.
    return n + (e?.repType === 'capstone' ? 30 : (e?.minutes ?? 0) * (b.extra ? 1.25 : PACE.repsFactor))
  }, (b.lc ? 30 : 0) + (b.resolves ?? 0) * 15)
  return Math.max(5, Math.round(m / 5) * 5)
}

interface Step {
  key: 'warm' | 'redo' | 'plan' | 'problem' | 'leetcode'
  label: string
  detail: string
  /** Shown only while this is the step you are on. */
  why: string
  reps: string[]
  minutes: number
  done: boolean
  /** A step done outside the editor (LeetCode): where its link goes. */
  href?: string
  external?: boolean
  onlyIf?: string
}

/**
 * Today, as a short flat list of steps in the order they are done:
 * warm up → again, cold → today's plan → the problem → LeetCode re-solves.
 * The plan's reps are one step, whatever mix of drilling, combining and
 * proving they are: each rep says what it is for when you are on it.
 */
function stepsFrom(blocks: SessionBlock[], done: (id: string) => boolean, leetcode: { total: number; logged: number }, pending: boolean, url: (lc: number) => string | undefined, solved: (lc: number) => boolean): Step[] {
  const steps: Step[] = []
  const all = (reps: string[]) => reps.length > 0 && reps.every(done)
  for (const b of blocks) {
    if (b.kind === 'maintain') continue
    if (b.kind === 'reactivate') steps.push({ key: 'warm', label: pending ? 'Reactivation session' : 'Warm up', detail: b.title, why: b.why, reps: pending ? [] : b.reps, minutes: real(b), done: !pending && all(b.reps) })
    else if (b.extra) steps.push({ key: 'redo', label: 'Again, cold', detail: `${b.reps.length} rep${b.reps.length === 1 ? '' : 's'} that needed help last session`, why: b.why, reps: b.reps, minutes: real(b), done: all(b.reps) })
    else if (b.lc) steps.push({ key: 'problem', label: `Attempt LC ${b.lc}`, detail: b.title, why: b.why, reps: [], minutes: real(b), done: solved(b.lc), href: url(b.lc), external: true, onlyIf: b.onlyIf })
    else {
      const last = steps[steps.length - 1]
      if (last?.key === 'plan') {
        last.reps.push(...b.reps)
        last.minutes += real(b)
        last.done = all(last.reps)
        const titles = [...new Set([...last.detail.split(' → '), ...b.title.split(' → ')])]
        last.detail = titles.length > 2 ? `${titles[0]} → ${titles[titles.length - 1]}` : titles.join(' → ')
      } else steps.push({ key: 'plan', label: "Today's plan", detail: b.title, why: 'The next reps of the plan, in order. Each one says what it is for when you open it.', reps: [...b.reps], minutes: real(b), done: all(b.reps) })
    }
  }
  if (leetcode.total)
    steps.push({
      key: 'leetcode',
      label: 'LeetCode re-solves',
      detail: `${leetcode.total} problem${leetcode.total === 1 ? '' : 's'} you have solved before, cold`,
      why: 'Solve each on LeetCode from a blank editor, then log how it went in the list below.',
      reps: [],
      minutes: leetcode.total * 15,
      done: leetcode.logged >= leetcode.total,
      href: '#leetcode',
    })
  return steps
}

/**
 * The top of Today: the one thing to do next, and today's steps in order.
 * Everything else on the page is reference.
 */
export default function TrainingCard({ training, roadmap, leetcode }: { training: Training; roadmap: { label: string; href: string } | null; leetcode: { total: number; logged: number; next: string | null } }) {
  const { repo, today } = useReps()
  const { byLc } = useTargets()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const { plan, pending, session, doneInSession, nextInSession, last } = training

  // What a session started now would hold: the reps typed in the Reps editor, in step order. The one-time reactivation
  // runs from its own card; optional cold reps stay under "More".
  const blocks = plan.blocks.filter((b) => !(pending && b.kind === 'reactivate') && b.kind !== 'maintain')
  const ids = [...new Set(blocks.flatMap((b) => b.reps))]
  const start = async () => {
    if (busy || !ids.length) return
    setBusy(true)
    const extras = blocks.filter((b) => b.extra).flatMap((b) => b.reps)
    // Repeats start from the bare starter: code saved the first time through would give the answer away.
    for (const id of extras) {
      try {
        window.localStorage.removeItem(`reps-draft:${id}`)
      } catch {
        /* the synced draft below is cleared either way */
      }
      await repo.saveDraft(id, EXERCISE_BY_ID[id]?.starterCode ?? '')
    }
    const s = await createSession(repo, 'day', "Today's training", ids, undefined, { training: { blocks: blocks.filter((b) => b.reps.length).map((b) => ({ kind: b.kind, title: b.title, why: b.why, reps: b.reps, minutes: b.minutes, extra: b.extra })), extras } })
    await repo.setState(trainingKey(today), { sessionId: s.id })
    router.push(`/rep/${ids[0]}?s=${s.id}`)
  }

  // Once today's session is under way, its own blocks are what Today shows: the list does not shift under you.
  const shown: SessionBlock[] = session?.training
    ? [...session.training.blocks.map((b) => ({ ...b, kind: b.kind as SessionBlock['kind'], minutes: b.minutes ?? 0 })), ...plan.blocks.filter((b) => b.lc)]
    : plan.blocks
  const steps = stepsFrom(shown, (id) => Boolean(session) && doneInSession.has(id), leetcode, pending, (lc) => byLc.get(lc)?.url, (lc) => byLc.get(lc)?.first !== null && byLc.get(lc)?.first !== undefined)
  const at = steps.findIndex((s) => !s.done)
  const now = at >= 0 ? steps[at] : null
  const nextRep = session ? nextInSession : (ids[0] ?? null)
  const repHref = nextRep ? (session ? `/rep/${nextRep}?s=${session.id}` : null) : null
  const inStep = now && nextRep ? now.reps.indexOf(nextRep) : -1

  // The one thing to do next, in words.
  const next = pending
    ? { title: 'Finish the reactivation session above', sub: 'The rest of today follows it.' }
    : nextRep && now && now.reps.length
      ? { title: EXERCISE_BY_ID[nextRep]?.title ?? 'Next rep', sub: `Step ${at + 1} of ${steps.length} · ${now.label}${inStep >= 0 ? ` · rep ${inStep + 1} of ${now.reps.length}` : ''}` }
      : now?.key === 'problem'
        ? { title: `${now.label} · ${now.detail}`, sub: `Step ${at + 1} of ${steps.length} · on LeetCode${now.onlyIf ? ` · ${now.onlyIf}` : ''}. Log how it went in the list below.` }
        : now?.key === 'leetcode'
          ? { title: leetcode.next ? `Re-solve ${leetcode.next} on LeetCode` : 'Your LeetCode re-solves', sub: `Step ${at + 1} of ${steps.length} · ${leetcode.total - leetcode.logged} left · cold, about 15 minutes each. Log each one in the list below.` }
          : { title: steps.length ? 'Done for today.' : 'Nothing is scheduled today.', sub: steps.length ? 'Every step is finished. Stop here, or keep going with the plan.' : 'Rest is part of the plan.' }

  return (
    <section aria-labelledby="training-h" className="mt-9 rounded-[20px] bg-bg p-6 shadow-[0_0_0_1px_var(--hairline),0_2px_4px_rgba(28,24,12,0.04),0_18px_40px_-16px_rgba(28,24,12,0.18)] sm:p-8" data-testid="training">
      <p className="eyebrow flex items-center gap-2 text-ink-2">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" /> Next up
      </p>
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 id="training-h" className="text-[26px] font-semibold leading-tight tracking-tight" data-testid="next-up">
            {next.title}
          </h2>
          <p className="num mt-1.5 text-[14px] text-ink-2" data-testid="next-up-step">
            {next.sub}
          </p>
        </div>
        {pending ? null : repHref ? (
          <Link href={repHref} className="btn btn-accent btn-lg shrink-0 self-start lg:self-auto" data-testid="training-start">
            Continue <IconArrowRight size={15} />
          </Link>
        ) : nextRep ? (
          <button type="button" className="btn btn-accent btn-lg shrink-0 self-start lg:self-auto" onClick={start} disabled={busy} data-testid="training-start">
            Start <IconArrowRight size={15} />
          </button>
        ) : now?.href ? (
          <a href={now.href} {...(now.external ? { target: '_blank', rel: 'noreferrer' } : {})} className="btn btn-accent btn-lg shrink-0 self-start lg:self-auto" data-testid="training-start">
            {now.external ? 'Open on LeetCode' : 'Go to the list'} {now.external ? <IconExternal size={14} /> : <IconArrowRight size={15} />}
          </a>
        ) : !now && roadmap ? (
          <Link href={roadmap.href} className="btn btn-lg shrink-0 self-start lg:self-auto">
            Keep going <IconArrowRight size={15} />
          </Link>
        ) : null}
      </div>

      {steps.length > 0 && (
        <>
          <p className="label mb-1 mt-7">Today, in order</p>
          <ol className="flex flex-col" data-testid="training-steps">
            {steps.map((s, i) => {
              const current = i === at && !pending
              const repsDone = s.reps.filter((id) => Boolean(session) && doneInSession.has(id)).length
              return (
                <li key={`${s.key}-${i}`} className={`grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-3 rounded-xl px-2 py-2.5 ${current ? 'bg-surface' : ''}`} data-step={s.key} data-state={s.done ? 'done' : current ? 'now' : 'later'}>
                  <span aria-hidden="true" className={`num mt-px grid size-[22px] place-items-center rounded-full text-[12px] font-medium ${s.done ? 'bg-ink text-white' : current ? 'bg-accent text-white' : 'text-muted shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
                    {s.done ? <IconCheck size={11} strokeWidth={2.6} /> : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[14.5px] ${s.done ? 'text-muted' : 'text-ink'}`}>
                      <span className="font-medium">{s.label}</span>
                      <span className={s.done ? '' : 'text-ink-2'}> · {s.detail}</span>
                      <span className="sr-only">{s.done ? ' (done)' : current ? ' (you are here)' : ''}</span>
                    </p>
                    {current && <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{s.onlyIf ? `${s.why} Open it ${s.onlyIf}.` : s.why}</p>}
                  </div>
                  <span className="num mt-0.5 whitespace-nowrap text-right text-[12.5px] text-muted">
                    {s.done ? 'done' : `${s.reps.length ? `${repsDone ? `${repsDone}/` : ''}${s.reps.length} rep${s.reps.length === 1 ? '' : 's'} · ` : ''}~${formatMinutes(s.minutes)}`}
                  </span>
                </li>
              )
            })}
          </ol>
        </>
      )}

      <div className="mt-5 flex flex-col gap-1.5 pt-4 text-[12.5px] leading-relaxed text-muted" style={{ boxShadow: '0 -1px 0 var(--line)' }}>
        <p data-testid="training-goal">
          <span className="font-medium text-ink-2">Goal today:</span> {plan.goal}
        </p>
        <p data-testid="training-briefing">{last ? `Last session (${shortDate(last.date)}) you were working on ${last.on.join(' and ') || 'the plan'}.` : 'This is your first session.'}</p>
        {roadmap && (
          <p>
            <span className="font-medium text-ink-2">Where you are in the 90-day plan:</span>{' '}
            <Link href={roadmap.href} className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink" data-testid="start-today">
              {roadmap.label}
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}

/** What changed because of today's training, by skill, and what comes next. */
export function SessionReviewCard({ training }: { training: Training }) {
  const { review, plan } = training
  if (!review.reps) return null
  const left = plan.blocks.filter((b) => b.reps.length || b.lc).filter((b) => !b.reps.length || b.reps.some((id) => !training.doneInSession.has(id)))
  const groups: [string, string[]][] = [
    ['Came back clean', review.clean],
    ['Improved today', review.improved],
    ['Still developing', review.developing],
  ]
  return (
    <section aria-labelledby="review-h" className="panel mt-4 p-6" data-testid="session-review">
      <h2 id="review-h" className="h2">
        Session review
      </h2>
      <p className="mt-1 text-[13.5px] text-muted">What changed because you trained today, from {review.reps} rep{review.reps === 1 ? '' : 's'} passed.</p>
      <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map(([label, skills]) => (
          <div key={label} data-testid={`review-${label.split(' ')[0].toLowerCase()}`}>
            <p className="label mb-1.5">{label}</p>
            {skills.length ? (
              <ul className="flex flex-col gap-1 text-[13.5px] text-ink-2">
                {skills.slice(0, 5).map((s) => (
                  <li key={s}>
                    <Link href={`/skills/${s}`} className="hover:underline">
                      {skillName(s)}
                    </Link>
                  </li>
                ))}
                {skills.length > 5 && <li className="text-muted">and {skills.length - 5} more</li>}
              </ul>
            ) : (
              <p className="text-[13px] text-faint">Nothing yet</p>
            )}
          </div>
        ))}
        <div data-testid="review-next">
          <p className="label mb-1.5">Next</p>
          {left.length ? (
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              {left
                .slice(0, 4)
                .map((b) => (b.kind === 'prove' ? `prove ${b.title}` : `${TRAINING_LABEL[b.kind].toLowerCase()}${b.kind === 'maintain' || b.kind === 'reactivate' ? '' : ` ${b.title.split(' → ')[0].toLowerCase()}`}`))
                .join(' → ')}
            </p>
          ) : (
            <p className="text-[13.5px] leading-relaxed text-ink-2">Today&apos;s prescription is done. The roadmap below has what comes next.</p>
          )}
        </div>
      </div>
    </section>
  )
}
