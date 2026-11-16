'use client'

import { IconCheck, IconLock } from '@/components/icons'
import { HARD_CUTOFF, OFFER_GOAL, PREP_START, SPRINT_UNITS } from '@/data/course/sprint'
import type { UnitStatus } from '@/lib/course/routing'
import { shortDate } from '@/lib/dates'

/**
 * The road from Nov 16 (data/course/sprint.ts): weeks 1–3 done, the ten must-know units in sprint order, then
 * Prep, interviews in January and an offer by Jan 31. Shared by Today's strip and the Road page.
 */

export type NodeState = 'complete' | 'active' | 'ready' | 'locked' | 'upcoming'

export interface RoadNode {
  key: string
  label: string
  title: string
  state: NodeState
  /** Sprint units: the unit, for its card. */
  unit?: UnitStatus
  /** Reps (path) and checkpoint passes still to do. */
  left?: number
}

export const SHORT: Record<string, string> = {
  'w4-windows': 'Windows',
  'w4-stacks': 'Stacks',
  'w9-heaps': 'Heaps',
  'w10-intervals': 'Intervals',
  's-design-class': 'Classes',
  'w5-binary-search': 'Search',
  'w5-linked-lists': 'Lists',
  's-queue-basics': 'Queues',
  'w8-grids': 'Grids',
  's-course-schedule': 'Schedule'
}

const isReady = (s?: UnitStatus) => s?.state === 'ready' || s?.state === 'maintenance'

/** The sprint units' remaining required work: path reps not passed plus checkpoint passes still needed. */
export function unitLeft(s: UnitStatus): number {
  if (isReady(s)) return 0
  return Math.max(0, s.total - s.done) + s.gates.reduce((n, g) => n + (g.cleared ? 0 : Math.max(0, Math.min(g.gate.need, g.available.length) - g.clean.length)), 0)
}

export function sprintRoad(statuses: UnitStatus[], today: string): { nodes: RoadNode[]; left: number; done: number } {
  const units = SPRINT_UNITS.map((id) => statuses.find((s) => s.unit.id === id)).filter((s): s is UnitStatus => Boolean(s))
  const firstOpen = units.find((s) => !isReady(s))
  const early = statuses.filter((s) => s.unit.week <= 3 && !s.unit.sprintOnly)
  const nodes: RoadNode[] = [
    { key: 'weeks-1-3', label: 'Weeks 1–3', title: 'Foundations, problem solving, pointers', state: early.every(isReady) ? 'complete' : 'active' },
    ...units.map((s): RoadNode => ({
      key: s.unit.id,
      label: SHORT[s.unit.id] ?? s.unit.title,
      title: s.unit.title,
      unit: s,
      left: unitLeft(s),
      state: isReady(s) ? 'complete' : s === firstOpen ? 'active' : s.locked ? 'locked' : 'ready'
    })),
    { key: 'prep', label: 'Prep', title: `Interview practice from ${shortDate(PREP_START)}`, state: today >= PREP_START ? 'active' : 'upcoming' },
    { key: 'interviews', label: 'Interviews', title: 'Interviews in January', state: 'upcoming' },
    { key: 'offer', label: `Offer · ${shortDate(OFFER_GOAL)}`, title: `An offer by ${shortDate(OFFER_GOAL)}; ${shortDate(HARD_CUTOFF)} is the hard cutoff`, state: 'upcoming' }
  ]
  return { nodes, left: units.reduce((n, s) => n + unitLeft(s), 0), done: units.filter(isReady).length }
}

const DOT: Record<NodeState, string> = {
  complete: 'bg-pass text-white',
  active: 'bg-white text-[#b9500b] shadow-[0_0_0_3px_var(--flame),0_0_0_7px_rgba(234,106,16,0.25)]',
  ready: 'bg-shell-3 text-shell-ink',
  locked: 'bg-shell-2 text-shell-faint',
  upcoming: 'bg-shell-2 text-shell-faint'
}

/** The trail itself (on the dark shell), one dot per step. */
export function SprintTrail({ nodes }: { nodes: RoadNode[] }) {
  return (
    <ol className="mt-5 grid grid-cols-7 gap-y-4 sm:grid-cols-[repeat(14,minmax(0,1fr))]" aria-label="The road to an offer" data-testid="sprint-trail">
      {nodes.map((n, i) => (
        <li key={n.key} className="relative flex flex-col items-center" data-node={n.key} data-state={n.state}>
          {i > 0 && (
            <span
              aria-hidden="true"
              className={`absolute top-[15px] right-1/2 h-[2px] w-full ${i === 7 ? 'max-sm:hidden ' : ''}${n.state === 'complete' || n.state === 'active' ? 'bg-flame-2' : 'border-t-2 border-dashed border-shell-3'}`}
            />
          )}
          <span className={`num relative z-10 grid size-8 place-items-center rounded-full text-[11px] font-bold ${DOT[n.state]}`} title={`${n.title}${n.left ? ` · ${n.left} left` : ''}`}>
            {n.state === 'complete' ? <IconCheck size={13} strokeWidth={3} /> : n.state === 'locked' ? <IconLock size={12} /> : n.unit ? SPRINT_UNITS.indexOf(n.unit.unit.id as never) + 1 : '•'}
          </span>
          <span className={`mt-1.5 max-w-[78px] text-center text-[10.5px] leading-tight ${n.state === 'active' ? 'text-shell-ink' : n.state === 'complete' ? 'text-shell-muted' : 'text-shell-faint'}`}>
            {n.label}
          </span>
          <span className="sr-only">
            {n.title}: {n.state}
            {n.left ? `, ${n.left} left` : ''}
          </span>
        </li>
      ))}
    </ol>
  )
}
