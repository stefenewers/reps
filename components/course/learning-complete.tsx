'use client'

import Link from 'next/link'
import { IconCheck } from '@/components/icons'
import { useReps } from '@/components/reps-provider'

/** Reading is remembered as a recommendation, never a qualifying rep. */
export default function LearningComplete({ stateKey }: { stateKey: string }) {
  const { repo, today } = useReps()
  const done = Boolean(repo.state(stateKey))
  return (
    <div
      className={`mt-12 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:p-6 ${done ? 'bg-pass-soft' : 'bg-bg shadow-[0_0_0_1px_var(--hairline)]'}`}
      data-done={done ? 'true' : 'false'}
    >
      <span
        aria-hidden="true"
        className={`grid size-11 shrink-0 place-items-center rounded-full ${done ? 'stamp-in bg-pass text-white' : 'text-faint shadow-[inset_0_0_0_2px_var(--line-strong)]'}`}
      >
        <IconCheck size={18} strokeWidth={2.6} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">{done ? 'This learning step is done.' : 'Finished reading?'}</p>
        <p className="mt-0.5 text-[13px] text-muted">Learning steps help you prepare. Only qualifying practice counts toward the rep target.</p>
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
  )
}
