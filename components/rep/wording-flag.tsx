'use client'

import { useState } from 'react'
import { useReps } from '@/components/reps-provider'

/** Saved per rep in study state (synced), so the prompts that confused you become the fix list. */
export const wordingKey = (exerciseId: string) => `wording:${exerciseId}`

export interface WordingFlag {
  flaggedAt: string
  note?: string
}

/** One tap: "the wording was unclear". Optional note. Never in the way of the rep. */
export default function WordingFlagButton({ exerciseId }: { exerciseId: string }) {
  const { repo } = useReps()
  // Saved state arrives after the page loads (local store, then sync); what was just tapped wins.
  const [local, setLocal] = useState<WordingFlag | undefined>()
  const flag = local ?? repo.state<WordingFlag>(wordingKey(exerciseId))
  const [draft, setDraft] = useState<string | undefined>()
  const note = draft ?? flag?.note ?? ''
  const setNote = setDraft
  const save = (next: WordingFlag) => {
    setLocal(next)
    void repo.setState(wordingKey(exerciseId), next)
  }

  if (!flag)
    return (
      <button type="button" className="text-[12px] text-faint underline-offset-4 hover:text-muted hover:underline" onClick={() => save({ flaggedAt: new Date().toISOString() })} data-testid="wording-flag">
        Wording unclear?
      </button>
    )
  return (
    <form
      className="flex flex-wrap items-center gap-2 text-[12px] text-muted"
      data-testid="wording-flagged"
      onSubmit={(e) => {
        e.preventDefault()
        save({ ...flag, note: note.trim() || undefined })
      }}
    >
      <span>Flagged: this prompt gets reworded.</span>
      <input className="input !h-7 !w-[220px] !text-[12px]" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => save({ ...flag, note: note.trim() || undefined })} placeholder="What tripped you up? (optional)" aria-label="What was unclear" />
    </form>
  )
}
