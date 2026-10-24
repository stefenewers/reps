'use client'

import { useEffect, useState, type ReactNode } from 'react'
import TrainingFlame from '@/components/course/training-flame'
import { IconCheck, IconFlag, IconLock, IconRepair, IconSpark, IconTarget } from '@/components/icons'
import type { MotivationEvent } from '@/data/course/motivation'
import type { EarnedEvent } from '@/lib/course/events'

const STORAGE_KEY = 'reps-earned-events:v1'

/**
 * Each kind of earned moment has its own shape, so a cleared checkpoint never
 * looks like a finished day. Short, one at a time, never blocking the work;
 * motion is off under reduced motion (globals.css).
 */
const KIND: Partial<Record<MotivationEvent, { label: string; tone: string; motion: string; badge: (e: EarnedEvent) => ReactNode }>> = {
  'gate-cleared': {
    label: 'Checkpoint cleared · next unit unlocked',
    tone: 'bg-cold-soft text-cold',
    motion: 'unlock-glow',
    badge: () => (
      <span className="relative grid size-11 place-items-center rounded-full bg-cold text-white">
        <IconLock size={16} />
        <span className="stamp-in absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-pass text-white ring-2 ring-white">
          <IconCheck size={10} strokeWidth={3} />
        </span>
      </span>
    )
  },
  'repair-success': {
    label: 'Repaired',
    tone: 'bg-repair-soft text-repair',
    motion: 'stamp-in',
    badge: () => (
      <span className="grid size-11 place-items-center rounded-full bg-white text-repair shadow-[inset_0_0_0_2px_var(--repair)]">
        <IconRepair size={18} />
      </span>
    )
  },
  'day-complete': {
    label: 'Day complete',
    tone: 'bg-flame-soft text-[#b9500b]',
    motion: 'celebrate-in',
    badge: () => <TrainingFlame state="blaze" size={44} ignite testId="moment-flame" />
  },
  'week-complete': {
    label: 'Week complete',
    tone: 'bg-flame-soft text-[#b9500b]',
    motion: 'stamp-in',
    badge: () => (
      <span className="grid size-11 place-items-center rounded-full bg-flame text-white">
        <IconFlag size={18} />
      </span>
    )
  },
  milestone: {
    label: 'Milestone',
    tone: 'bg-flame-soft text-[#b9500b]',
    motion: 'stamp-in',
    badge: (e) => (
      <span className="num font-display grid size-11 place-items-center rounded-full bg-white text-[15px] font-bold shadow-[inset_0_0_0_2px_var(--flame)]">
        {e.id.startsWith('output:') ? e.id.slice(7) : '1'}
      </span>
    )
  },
  'transfer-breakthrough': {
    label: 'New evidence',
    tone: 'bg-cold-soft text-cold',
    motion: 'celebrate-in',
    badge: () => (
      <span className="grid size-11 place-items-center rounded-full bg-white text-cold shadow-[inset_0_0_0_2px_var(--cold)]">
        <IconSpark size={18} />
      </span>
    )
  },
  trajectory: {
    label: 'Getting stronger',
    tone: 'bg-learn-soft text-learn',
    motion: 'celebrate-in',
    badge: () => (
      <span className="grid size-11 place-items-center rounded-full bg-white text-learn shadow-[inset_0_0_0_2px_var(--learn)]">
        <IconTarget size={18} />
      </span>
    )
  },
  ready: {
    label: 'Ready',
    tone: 'bg-pass-soft text-green-ink',
    motion: 'stamp-in',
    badge: () => (
      <span className="grid size-11 place-items-center rounded-full bg-pass text-white">
        <IconCheck size={18} strokeWidth={3} />
      </span>
    )
  }
}
const FALLBACK = KIND.trajectory!

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
  const kind = KIND[moment.message.event] ?? FALLBACK
  return (
    <aside
      className={`celebrate-in mb-3 flex items-center gap-4 rounded-2xl px-4 py-3.5 ${kind.tone.split(' ')[0]}`}
      role="status"
      data-testid="earned-moment"
      data-kind={moment.message.event}
    >
      <span className={`shrink-0 rounded-full ${kind.motion}`}>{kind.badge(moment)}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${kind.tone.split(' ').slice(1).join(' ')}`}>{kind.label}</p>
        <p className="mt-0.5 text-[14px] leading-relaxed text-ink">{moment.message.text}</p>
      </div>
      <button type="button" aria-label="Dismiss celebration" className="icon-btn shrink-0 text-muted hover:text-ink" onClick={() => setMoment(null)}>
        ×
      </button>
    </aside>
  )
}
