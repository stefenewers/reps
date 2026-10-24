'use client'

import Link from 'next/link'
import { IconArrowRight, IconCheck } from '@/components/icons'
import { LEARN_ACTION, LEARN_LABEL, useTodayLearning } from '@/components/course/use-today-learning'
import { PreviewToday, useReps } from '@/components/reps-provider'
import { COURSE_START } from '@/data/course/calendar'

const ASK = { lesson: 'Finished reading?', demo: 'Watched it move?', example: 'Followed every step?' } as const
const WHY = {
  lesson: 'Next, see the idea change state.',
  demo: 'Now rebuild the idea yourself, one goal at a time.',
  example: 'You have seen it. Now produce it.'
} as const

/** Where today's learning goes next, once this step is done: the coach's hand-off. */
function NextStep({ stateKey }: { stateKey: string }) {
  const { today, realToday } = useReps()
  const { items, next } = useTodayLearning()
  const preview = Boolean(realToday && realToday < today)
  // Only today's own material hands off; a lesson read for reference just goes back.
  if (!items.some((i) => i.key === stateKey)) return null
  if (next)
    return (
      <div className="flex flex-wrap items-center gap-3" data-testid="learn-next">
        <p className="text-[13.5px] text-ink-2">
          Next: <span className="font-semibold text-ink">{LEARN_LABEL[next.kind]}</span> · {next.title}
        </p>
        <Link href={next.href} className="btn btn-accent">
          {LEARN_ACTION[next.kind]} <IconArrowRight size={13} />
        </Link>
      </div>
    )
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="learn-next">
      <p className="text-[13.5px] text-ink-2">{preview ? 'Today’s learning is done. The reps open Monday, October 26.' : 'Today’s learning is done. You have seen it; now produce it.'}</p>
      {!preview && (
        <Link href="/?go=reps" className="btn btn-accent">
          Start your reps <IconArrowRight size={13} />
        </Link>
      )}
    </div>
  )
}

/** Reading, watching and following are remembered as preparation, never as qualifying reps. */
export default function LearningComplete({ stateKey, kind = 'lesson' }: { stateKey: string; kind?: 'lesson' | 'demo' | 'example' }) {
  const { repo, today } = useReps()
  const done = Boolean(repo.state(stateKey))
  return (
    <div
      className={`mt-12 flex flex-col gap-4 rounded-2xl p-5 sm:p-6 ${done ? 'bg-pass-soft' : 'bg-bg shadow-[0_0_0_1px_var(--hairline)]'}`}
      data-done={done ? 'true' : 'false'}
      data-testid="learning-complete"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          aria-hidden="true"
          className={`grid size-11 shrink-0 place-items-center rounded-full ${done ? 'stamp-in bg-pass text-white' : 'text-faint shadow-[inset_0_0_0_2px_var(--line-strong)]'}`}
        >
          <IconCheck size={18} strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">{done ? `${LEARN_LABEL[kind]} complete.` : ASK[kind]}</p>
          <p className="mt-0.5 text-[13px] text-muted">{done ? WHY[kind] : 'Learning prepares you for the reps. It is not counted toward the rep target.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`btn ${done ? '' : 'btn-accent'}`} disabled={done} onClick={() => void repo.setState(stateKey, { completedOn: today })}>
            {done ? 'Learning step complete' : 'Mark learning step complete'}
          </button>
          <Link href="/" className="btn btn-ghost">
            Back to today
          </Link>
        </div>
      </div>
      {done &&
        (today < COURSE_START ? (
          <PreviewToday date={COURSE_START}>
            <NextStep stateKey={stateKey} />
          </PreviewToday>
        ) : (
          <NextStep stateKey={stateKey} />
        ))}
    </div>
  )
}
