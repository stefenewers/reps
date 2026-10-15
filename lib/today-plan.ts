import type { CapacityPhase } from '@/lib/training-capacity'

/**
 * Today's prescription: exactly the day's capacity, filled from the work that is
 * due, and nothing stacked on top of it.
 *
 * Everything competes for the same slots: a warm-up of what you are about to
 * lean on, the reps that needed help last time, the next reps of the plan, a new
 * problem when you are ready for one, re-solves and cold reps that are due. Each
 * gets at most its share, the plan gets the rest. What does not fit is not lost:
 * it stays in the queue (or stays due) for tomorrow, and after today's training
 * is complete it is offered as optional.
 *
 * The queue answers "what remains in the program?". This answers "how much do I
 * train today?". Missed days never add to it.
 */

export type ItemKind = 'warm' | 'redo' | 'learn' | 'drill' | 'combine' | 'transfer' | 'prove' | 'problem' | 'resolve' | 'cold'

export interface Candidate {
  /** An exercise id, or `lc:<number>:<type>` for a LeetCode problem. */
  key: string
  kind: ItemKind
  title: string
  /** Capacity it takes: a small rep 1, a capstone 3, a new LeetCode problem 3. */
  units: number
  exerciseId?: string
  lc?: number
  /** A new LeetCode problem whose building blocks are in place. */
  ready?: boolean
}

export interface PlanItem extends Candidate {
  done: boolean
}

export interface TodayInput {
  capacity: number
  phase: CapacityPhase
  /** Everything passed or logged today, with the capacity it took. */
  doneToday: { key: string; units: number; kind?: ItemKind; title?: string }[]
  prep: Candidate[]
  /** The plan's next work, in queue order: reps and new LeetCode problems. */
  plan: Candidate[]
  resolves: Candidate[]
  cold: Candidate[]
}

export interface TodayPlan {
  capacity: number
  items: PlanItem[]
  unitsDone: number
  complete: boolean
  /** Due work that did not fit today, and the next plan work: offered once the training is done. */
  optional: Candidate[]
}

/** The most of the day each kind may take, as a share of the capacity. The plan gets the rest. */
export const SHARE = { prep: 0.2, maintenance: 0.2 }

export function units(c: Pick<Candidate, 'kind'> & { capstone?: boolean; combineHeavy?: boolean }): number {
  switch (c.kind) {
    case 'problem':
      return 3
    case 'resolve':
      return 2
    case 'transfer':
      return 2
    case 'prove':
      return c.capstone ? 3 : 1
    case 'combine':
      return c.combineHeavy ? 2 : 1
    default:
      return 1
  }
}

export function prescribe(input: TodayInput): TodayPlan {
  const { capacity } = input
  const items: PlanItem[] = []
  const taken = new Set<string>()
  let used = 0

  // What was already done today counts first: it is today's training, whichever list it came from.
  const doneKeys = new Map(input.doneToday.map((d) => [d.key, d]))
  const all = [...input.prep, ...input.plan, ...input.resolves, ...input.cold]
  const done = new Map(all.filter((c) => doneKeys.has(c.key)).map((c) => [c.key, { ...c, units: doneKeys.get(c.key)!.units }]))
  for (const d of input.doneToday) if (!done.has(d.key)) done.set(d.key, { key: d.key, kind: d.kind ?? 'drill', title: d.title ?? d.key, units: d.units })
  const unitsDone = [...done.values()].reduce((n, c) => n + c.units, 0)
  used = unitsDone

  const room = (n: number) => used + n <= capacity
  const take = (c: Candidate) => {
    taken.add(c.key)
    used += c.units
  }
  const fill = (list: Candidate[], budget: number) => {
    let spent = 0
    for (const c of list) {
      if (taken.has(c.key) || done.has(c.key)) continue
      if (spent + c.units > budget || !room(c.units)) continue
      take(c)
      spent += c.units
    }
  }
  const prepBudget = Math.floor(capacity * SHARE.prep)
  const maintenanceBudget = Math.floor(capacity * SHARE.maintenance)
  // Units already spent today in a category count against its share.
  const spentOn = (kinds: ItemKind[]) => [...done.values()].filter((c) => kinds.includes(c.kind)).reduce((n, c) => n + c.units, 0)
  fill(input.prep, Math.max(0, prepBudget - spentOn(['warm', 'redo'])))
  fill([...input.resolves, ...input.cold], Math.max(0, maintenanceBudget - spentOn(['resolve', 'cold'])))
  // The plan, in queue order. A new LeetCode problem is only prescribed once the foundation weeks are over and
  // its building blocks are in place; before that it waits (offered as optional), and the reps after it carry on.
  for (const c of input.plan) {
    if (used >= capacity) break
    if (taken.has(c.key) || done.has(c.key)) continue
    if (c.kind === 'problem' && (input.phase === 'foundation' || !c.ready)) continue
    if (!room(c.units)) {
      if (c.kind === 'problem') continue
      break
    }
    take(c)
  }

  // Display order: what was done first, then warm-up and redo, the plan, then maintenance.
  const seen = new Set<string>()
  const byList = (list: Candidate[]) => list.filter((c) => taken.has(c.key) && !seen.has(c.key) && seen.add(c.key))
  const rest = [...byList(input.prep), ...byList(input.plan), ...byList(input.resolves), ...byList(input.cold)]
  for (const c of done.values()) items.push({ ...c, done: true })
  for (const c of rest) items.push({ ...c, done: false })

  // The next plan reps lead (keep going), then what was left of maintenance and prep.
  const open = (xs: Candidate[]) => xs.filter((c) => !taken.has(c.key) && !done.has(c.key))
  const nextPlan = open(input.plan)
  const lead = [nextPlan.find((c) => c.exerciseId), nextPlan.find((c) => !c.exerciseId)].filter((c): c is Candidate => Boolean(c))
  const optional = [...lead, ...open(input.resolves), ...open(input.prep), ...open(input.cold), ...nextPlan.filter((c) => !lead.includes(c))].slice(0, 6)
  return { capacity, items, unitsDone, complete: unitsDone >= capacity, optional }
}

/** The capacity a rep takes, from what it is: a capstone 3, an unlabeled transfer problem 2, a long combining rep 2, anything else 1. */
export function repUnits(e: { repType: string; stage: string; minutes: number; transfer?: boolean } | undefined): number {
  if (!e) return 1
  if (e.repType === 'capstone') return 3
  if (e.transfer) return 2
  if ((e.stage === 'combine' || e.stage === 'pattern') && e.minutes >= 6) return 2
  return 1
}
