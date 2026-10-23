'use client'

import { useEffect, useState } from 'react'
import type { EarnedEvent } from '@/lib/course/events'

const STORAGE_KEY = 'reps-earned-events:v1'
/** At most one earned message per visit. A dismissed event stays remembered. */
export default function EarnedMoment({ events }: { events: EarnedEvent[] }) {
  const [moment, setMoment] = useState<EarnedEvent | null>(null)
  useEffect(() => {
    if (moment) return
    try {
      const seen = new Set<string>(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]'))
      const next = events.find((e) => !seen.has(e.id))
      if (!next) return
      // Importing history should not produce a backlog of old celebration cards.
      for (const e of events) seen.add(e.id)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-time external storage event
      setMoment(next)
    } catch {
      /* unavailable storage: no repeatable celebrations */
    }
  }, [events, moment])
  if (!moment) return null
  return (
    <aside
      className={`celebrate-in mt-5 flex items-start justify-between gap-4 rounded-xl p-4 ${moment.message.tone === 'celebrate' ? 'bg-flame-soft' : 'bg-learn-soft'}`}
      role="status"
      data-testid="earned-moment"
    >
      <p className="text-sm leading-relaxed text-ink">{moment.message.text}</p>
      <button type="button" aria-label="Dismiss celebration" className="text-sm text-muted hover:text-ink" onClick={() => setMoment(null)}>
        ×
      </button>
    </aside>
  )
}
