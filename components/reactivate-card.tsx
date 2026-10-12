'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { IconArrowRight, IconCheck } from '@/components/icons'
import { useReps } from '@/components/reps-provider'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { REACTIVATION, REACTIVATION_KEY, REACTIVATION_REPS, reactivationStatus, type ReactivationState } from '@/data/reactivation'
import { createSession } from '@/lib/sessions'

/**
 * Today, above the normal queue: after days away, a short session that warms
 * the fundamentals back up before the plan resumes. `resume` is where the plan
 * picks up afterwards.
 */
export default function ReactivateCard({ resume }: { resume: { label: string; href: string } | null }) {
  const { repo, attempts, today } = useReps()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  if (today < REACTIVATION.from || today > REACTIVATION.until) return null
  const saved = repo.state<ReactivationState>(REACTIVATION_KEY)
  const status = reactivationStatus(saved, attempts)
  // Once finished, the confirmation stays for the rest of that day, then the card is gone for good.
  if (status.state === 'done' && status.finishedOn !== today) return null

  const start = async () => {
    if (busy) return
    setBusy(true)
    // Start each rep from its bare starter: code saved from the first time through would give the answer away.
    for (const id of REACTIVATION_REPS) {
      try {
        window.localStorage.removeItem(`reps-draft:${id}`)
      } catch {
        /* storage unavailable: the synced draft below is cleared either way */
      }
      await repo.saveDraft(id, EXERCISE_BY_ID[id].starterCode ?? '')
    }
    // A review session: every attempt is recorded as a cold rep, alongside the earlier passes.
    const s = await createSession(repo, 'review', 'Reactivation', REACTIVATION_REPS)
    await repo.setState(REACTIVATION_KEY, { sessionId: s.id, startedAt: new Date().toISOString() } satisfies ReactivationState)
    router.push(`/rep/${REACTIVATION_REPS[0]}?s=${s.id}`)
  }

  if (status.state === 'done')
    return (
      <section aria-labelledby="react-h" className="mt-9 rounded-[20px] bg-bg p-6 shadow-[0_0_0_1px_var(--hairline),var(--shadow-md)] sm:p-7" data-testid="reactivate" data-state="done">
        <p className="eyebrow flex items-center gap-2 text-ink-2">
          <IconCheck size={13} strokeWidth={2.4} className="text-pass" /> Reactivation
        </p>
        <h2 id="react-h" className="mt-2 text-[24px] font-semibold tracking-tight">
          Reactivated. Resume the plan.
        </h2>
        {resume && (
          <p className="mt-2 text-[14px] text-muted">
            Next:{' '}
            <Link href={resume.href} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              {resume.label}
            </Link>
          </p>
        )}
      </section>
    )

  const going = status.state === 'in-progress'
  return (
    <section aria-labelledby="react-h" className="mt-9 rounded-[20px] bg-ink p-6 text-white shadow-[var(--shadow-md)] sm:p-7" data-testid="reactivate" data-state={status.state}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow text-white/70">Reactivate</p>
          <h2 id="react-h" className="mt-2 max-w-[560px] text-[22px] font-semibold leading-snug tracking-tight">
            You&apos;ve been away from coding practice. Warm the fundamentals back up before continuing.
          </h2>
          <p className="num mt-2 text-[13.5px] text-white/70">
            {going
              ? status.finalNeedsCleanPass
                ? 'One thing left: the last rep again, without the solution.'
                : `${status.done} of ${status.total} done · now: ${status.stage}`
              : `~60–90 min · ${status.total} reps · Python → dictionaries → hashing`}
          </p>
        </div>
        {going && saved ? (
          <Link href={`/rep/${status.next}?s=${saved.sessionId}`} className="btn btn-accent btn-lg shrink-0 self-start lg:self-auto" data-testid="reactivate-start">
            Continue reactivation <IconArrowRight size={15} />
          </Link>
        ) : (
          <button type="button" className="btn btn-accent btn-lg shrink-0 self-start lg:self-auto" onClick={start} disabled={busy} data-testid="reactivate-start">
            Start reactivation <IconArrowRight size={15} />
          </button>
        )}
      </div>
      {going && (
        <div className="mt-5 flex gap-1" aria-hidden="true">
          {REACTIVATION_REPS.map((id, i) => (
            <span key={id} className={`h-[5px] flex-1 rounded-full ${i < status.done ? 'bg-white' : 'bg-white/20'}`} />
          ))}
        </div>
      )}
      {resume && (
        <p className="mt-5 text-[13px] text-white/70" style={{ boxShadow: '0 -1px 0 rgba(255,255,255,0.14)', paddingTop: 14 }}>
          <span className="font-medium text-white">After this</span> · Resume: {resume.label}
        </p>
      )}
    </section>
  )
}
