'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'

/** Reading is remembered as a recommendation, never a qualifying rep. */
export default function LearningComplete({ stateKey }: { stateKey: string }) {
  const { repo, today } = useReps()
  const done = Boolean(repo.state(stateKey))
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button type="button" className="btn" disabled={done} onClick={() => void repo.setState(stateKey, { completedOn: today })}>
        {done ? 'Learning step complete' : 'Mark learning step complete'}
      </button>
      <Link href="/" className="btn btn-ghost">
        Back to today
      </Link>
      <p className="w-full text-xs text-muted">Learning steps help you prepare. Only qualifying practice counts toward the rep target.</p>
    </div>
  )
}
