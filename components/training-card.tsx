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

/** "reactivate → drill → combine → prove Two Sum": the shape of the session in one line. */
function path(blocks: SessionBlock[]): string {
  const steps: string[] = []
  for (const b of blocks) {
    const step = b.kind === 'prove' ? `prove ${b.title}` : TRAINING_LABEL[b.kind].toLowerCase()
    if (steps[steps.length - 1] !== step) steps.push(step)
  }
  return steps.slice(0, 6).join(' → ')
}

/**
 * Today's training prescription: the goal, where the last session left off,
 * and the ordered blocks (reactivate, learn, drill, combine, prove, maintain).
 * The queue underneath is the roadmap; this is what to do with today.
 */
export default function TrainingCard({ training }: { training: Training }) {
  const { repo, today } = useReps()
  const { byLc } = useTargets()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const { plan, pending, session, doneInSession, nextInSession, last } = training
  if (!plan.blocks.length) return null

  // What a session started now would hold: everything typed in the Reps editor, in block order (the one-time reactivation runs from its own card).
  const blocks = plan.blocks.filter((b) => !(pending && b.kind === 'reactivate'))
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

  // Once today's session is under way, its own blocks are what Today shows (with progress): the prescription does not
  // shift under you. Problems on LeetCode and re-solves, which are done outside the editor, still come from the live plan.
  const shown: SessionBlock[] = session?.training
    ? [...session.training.blocks.map((b) => ({ ...b, kind: b.kind as SessionBlock['kind'], minutes: b.minutes ?? 0 })), ...plan.blocks.filter((b) => b.lc || (b.kind === 'maintain' && !session.training!.blocks.some((x) => x.kind === 'maintain'))).map((b) => (b.lc ? b : { ...b, reps: [] }))]
    : plan.blocks
  const t = plan.target && plan.training ? { ...plan.target, ...plan.training, state: byLc.get(plan.target.lc) } : null
  const total = session?.exerciseIds.length ?? 0
  const done = session ? session.exerciseIds.filter((id) => doneInSession.has(id)).length : 0
  const finished = Boolean(session) && !nextInSession

  return (
    <section aria-labelledby="training-h" className="mt-9 rounded-[20px] bg-bg p-6 shadow-[0_0_0_1px_var(--hairline),0_2px_4px_rgba(28,24,12,0.04),0_18px_40px_-16px_rgba(28,24,12,0.18)] sm:p-8" data-testid="training">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-2 text-ink-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" /> Today&apos;s training
          </p>
          <h2 id="training-h" className="mt-2 max-w-[620px] text-[24px] font-semibold leading-snug tracking-tight" data-testid="training-goal">
            {plan.goal}
          </h2>
          <p className="mt-2 max-w-[620px] text-[13.5px] leading-relaxed text-muted" data-testid="training-briefing">
            {last ? `Last session (${shortDate(last.date)}) you were working on ${last.on.join(' and ') || 'the plan'}.` : 'This is your first session.'}{' '}
            {blocks.length > 0 && `Today: ${path(shown)}.`}
            {t && t.state?.first === null && t.learned < t.total && ` If those come back cleanly, you continue toward ${t.title}.`}
          </p>
        </div>
        {pending ? (
          <p className="shrink-0 self-start rounded-xl bg-surface px-3.5 py-2.5 text-[12.5px] text-muted lg:max-w-[220px]">Starts with the reactivation above. The rest follows it.</p>
        ) : session && nextInSession ? (
          <Link href={`/rep/${nextInSession}?s=${session.id}`} className="btn btn-accent btn-lg shrink-0 self-start" data-testid="training-start">
            Continue training <IconArrowRight size={15} />
          </Link>
        ) : finished ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-surface px-3.5 py-2.5 text-[13px] font-medium text-ink">
            <IconCheck size={13} strokeWidth={2.4} className="text-pass" /> Session done
          </span>
        ) : ids.length ? (
          <button type="button" className="btn btn-accent btn-lg shrink-0 self-start" onClick={start} disabled={busy} data-testid="training-start">
            Start training <IconArrowRight size={15} />
          </button>
        ) : null}
      </div>

      <ol className="mt-6 flex flex-col divide-y divide-line" data-testid="training-blocks">
        {shown.map((b, i) => {
          const repsDone = b.reps.filter((id) => (session ? doneInSession.has(id) : false)).length
          const complete = b.reps.length > 0 && repsDone === b.reps.length
          const first = b.reps.find((id) => !doneInSession.has(id)) ?? b.reps[0]
          return (
            <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 py-3 sm:grid-cols-[92px_minmax(0,1fr)_auto]" data-kind={b.kind}>
              <span className={`eyebrow col-span-2 mt-0.5 sm:col-span-1 ${b.kind === 'prove' ? 'text-accent' : complete ? 'text-muted' : 'text-ink'}`}>{TRAINING_LABEL[b.kind]}</span>
              <div className="min-w-0">
                <p className={`text-[14.5px] font-medium ${complete ? 'text-muted' : 'text-ink'}`}>
                  {b.lc ? (
                    <a href={byLc.get(b.lc)?.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                      <span className="num text-muted">LC {b.lc}</span> {b.title} <IconExternal size={11} className="text-muted" />
                    </a>
                  ) : session && first && !(pending && b.kind === 'reactivate') ? (
                    <Link href={`/rep/${first}?s=${session.id}`} className="hover:underline">
                      {b.title}
                    </Link>
                  ) : (
                    b.title
                  )}
                  {b.onlyIf && <span className="ml-2 font-normal text-muted">{b.onlyIf}</span>}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{b.why}</p>
              </div>
              <span className="num mt-0.5 whitespace-nowrap text-right text-[12.5px] text-muted">
                {complete ? (
                  <span className="inline-flex items-center gap-1 text-ink-2">
                    <IconCheck size={11} strokeWidth={2.4} className="text-pass" /> done
                  </span>
                ) : (
                  <>
                    {b.reps.length > 0 && `${session && repsDone ? `${repsDone}/` : ''}${b.reps.length} rep${b.reps.length === 1 ? '' : 's'} · `}~{formatMinutes(real(b))}
                  </>
                )}
              </span>
            </li>
          )
        })}
      </ol>

      {t && t.state && t.state.first === null && (
        <p className="mt-4 rounded-xl bg-surface px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted" data-testid="training-target">
          <span className="font-medium text-ink">
            {t.title}: learned {t.learned} of {t.total} building blocks
          </span>
          {t.learned > 0 && (
            <>
              {' '}
              · <span className={t.readyToday < t.learned ? 'font-medium text-ink' : ''}>ready today {t.readyToday} of {t.learned}</span>
            </>
          )}
          {t.staleSkills.length > 0 && ` · you already learned ${t.staleSkills.slice(0, 3).map(skillName).join(', ')}; ${t.staleSkills.length === 1 ? 'it is' : 'they are'} being warmed back up.`}
          {session && total > 0 && !finished && <span className="num"> · session {done} of {total}</span>}
        </p>
      )}
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
