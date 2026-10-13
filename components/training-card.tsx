'use client'

import Link from 'next/link'
import type { useTraining } from '@/components/use-training'
import { skillName } from '@/data/skills'
import { TRAINING_LABEL } from '@/lib/training-state'

type Training = ReturnType<typeof useTraining>

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
