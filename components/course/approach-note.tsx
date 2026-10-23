'use client'

import { useState } from 'react'
import { useReps } from '@/components/reps-provider'

/** Week 13: before the attempt, a line on the approach; after it, whether it changed (REPS_2_MASTER_SPEC.md §45). */
export interface ApproachNote {
  initial: string
  changed?: boolean
  at: string
}
export const approachKey = (exerciseId: string) => `approach:${exerciseId}`

export default function ApproachNoteField({ exerciseId, passed }: { exerciseId: string; passed: boolean }) {
  const { repo } = useReps()
  const [local, setLocal] = useState<ApproachNote | undefined>()
  const note = local ?? repo.state<ApproachNote>(approachKey(exerciseId))
  const save = (next: ApproachNote) => {
    setLocal(next)
    void repo.setState(approachKey(exerciseId), next)
  }
  return (
    <div className="rounded-xl px-4 py-3 shadow-[inset_0_0_0_1px_var(--line)]" data-testid="approach-note">
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-medium text-ink">Your approach, before you code: what structure, and why?</span>
        <input className="input !text-[13.5px]" value={note?.initial ?? ''} onChange={(e) => save({ initial: e.target.value, changed: note?.changed, at: new Date().toISOString() })} placeholder="One line is enough" disabled={passed && Boolean(note?.initial)} />
      </label>
      {passed && note?.initial && (
        <label className="mt-2 flex items-center gap-2 text-[13px] text-ink-2">
          <input type="checkbox" checked={Boolean(note.changed)} onChange={(e) => save({ ...note, changed: e.target.checked })} />
          My approach changed while solving it
        </label>
      )}
    </div>
  )
}
