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
  /** Internal load (never shown): a small rep 1, a capstone 3, a new LeetCode problem 3. */
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
  /** Today's target, in reps: things you actually do. */
  capacity: number
  items: PlanItem[]
  /** Reps done today: each rep or logged problem is one, however heavy. */
  repsDone: number
  complete: boolean
  /** Due work that did not fit today, and the next plan work: offered once the training is done. */
  optional: Candidate[]
}

/** The most of the day each kind may take, as a share of the day's reps. The plan gets the rest. */
export const SHARE = { prep: 0.2, maintenance: 0.2 }
/** In the foundation weeks, at most this share of the day's reps is warm-up, maintenance or proving; the rest is learn, drill, combine. */
export const FOUNDATION_CHECKS = 0.3
/** The internal load (heavier reps weigh more) may run this far over the rep count. It never shows; it keeps a day from getting too heavy. */
export const LOAD_HEADROOM = 1.3

const CORE: ItemKind[] = ['learn', 'drill', 'combine']
export const isCore = (k: ItemKind) => CORE.includes(k)
export const loadLimit = (reps: number) => Math.round(reps * LOAD_HEADROOM)

/** Internal load: how heavy a rep is. A small rep 1, a capstone or a new LeetCode problem 3. Never shown as points. */
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

/**
 * Today's reps: exactly `capacity` things to do. Heavier reps weigh more in an
 * internal load, which only decides what fits: a heavy rep that would make the
 * day too heavy waits (it stays first in the queue for the next session) and a
 * lighter rep takes its place, so the day can always be finished. In the
 * foundation weeks learning comes first: at most 30% of the reps are warm-ups,
 * maintenance or proving.
 */
export function prescribe(input: TodayInput): TodayPlan {
  const { capacity: N } = input
  const items: PlanItem[] = []
  const taken = new Set<string>()
  const maxLoad = loadLimit(N)
  const foundation = input.phase === 'foundation'

  // What was already done today counts first: it is today's training, whichever list it came from.
  const doneKeys = new Map(input.doneToday.map((d) => [d.key, d]))
  const all = [...input.prep, ...input.plan, ...input.resolves, ...input.cold]
  const done = new Map(all.filter((c) => doneKeys.has(c.key)).map((c) => [c.key, { ...c, units: doneKeys.get(c.key)!.units }]))
  for (const d of input.doneToday) if (!done.has(d.key)) done.set(d.key, { key: d.key, kind: d.kind ?? 'drill', title: d.title ?? d.key, units: d.units })
  const repsDone = done.size
  const doneOf = (kinds: ItemKind[]) => [...done.values()].filter((c) => kinds.includes(c.kind)).length

  let count = repsDone
  let load = [...done.values()].reduce((n, c) => n + c.units, 0)
  const checksMax = foundation ? Math.floor(N * FOUNDATION_CHECKS) : N
  let checks = [...done.values()].filter((c) => !isCore(c.kind)).length
  const open = (c: Candidate) => !taken.has(c.key) && !done.has(c.key)
  // A heavy rep fits only if every slot after it can still be filled with a light one.
  const fits = (c: Candidate) => count < N && (c.units <= 1 || load + c.units + (N - count - 1) <= maxLoad) && (isCore(c.kind) || checks < checksMax)
  const take = (c: Candidate) => {
    taken.add(c.key)
    count++
    load += c.units
    if (!isCore(c.kind)) checks++
  }

  // The plan, in queue order. A new LeetCode problem is only prescribed once the foundation weeks are over and
  // its building blocks are in place; before that it waits (offered as optional).
  const plan = input.plan.filter((c) => open(c) && !(c.kind === 'problem' && (foundation || !c.ready)))
  // The reps the plan would reach today: a check among them is due now, not some day.
  const window = new Set(plan.slice(0, Math.max(0, N - repsDone)).map((c) => c.key))

  const prepLeft = { n: Math.max(0, Math.floor(N * SHARE.prep) - doneOf(['warm', 'redo'])) }
  const maintLeft = { n: Math.max(0, Math.floor(N * SHARE.maintenance) - doneOf(['resolve', 'cold'])) }
  const tryShare = (c: Candidate | undefined, share: { n: number }) => {
    if (c && share.n > 0 && open(c) && fits(c)) {
      take(c)
      share.n--
    }
  }
  const maintenance = [...input.resolves, ...input.cold]
  // Checks first, in priority order: one warm-up, the plan's own checks that fall in today's reach, one maintenance item, then the rest.
  tryShare(input.prep.find(open), prepLeft)
  for (const c of plan) if (window.has(c.key) && !isCore(c.kind) && open(c) && fits(c)) take(c)
  tryShare(maintenance.find(open), maintLeft)
  for (const c of input.prep) tryShare(c, prepLeft)
  for (const c of maintenance) tryShare(c, maintLeft)
  // Then the plan fills the day, in queue order; what does not fit waits.
  for (const c of plan) if (open(c) && fits(c)) take(c)

  // Display order: what was done first, then warm-up and redo, the plan, then maintenance.
  const seen = new Set<string>()
  const byList = (list: Candidate[]) => list.filter((c) => taken.has(c.key) && !seen.has(c.key) && seen.add(c.key))
  const rest = [...byList(input.prep), ...byList(input.plan), ...byList(input.resolves), ...byList(input.cold)]
  for (const c of done.values()) items.push({ ...c, done: true })
  for (const c of rest) items.push({ ...c, done: false })

  // The next plan reps lead (keep going), then what was left of maintenance and prep.
  const left = (xs: Candidate[]) => xs.filter(open)
  const nextPlan = left(input.plan)
  const lead = [nextPlan.find((c) => c.exerciseId), nextPlan.find((c) => !c.exerciseId)].filter((c): c is Candidate => Boolean(c))
  const optional = [...lead, ...left(input.resolves), ...left(input.prep), ...left(input.cold), ...nextPlan.filter((c) => !lead.includes(c))].slice(0, 6)
  return { capacity: N, items, repsDone, complete: repsDone >= N, optional }
}

/** The internal load of a rep, from what it is: a capstone 3, an unlabeled transfer problem 2, a long combining rep 2, anything else 1. */
export function repUnits(e: { repType: string; stage: string; minutes: number; transfer?: boolean } | undefined): number {
  if (!e) return 1
  if (e.repType === 'capstone') return 3
  if (e.transfer) return 2
  if ((e.stage === 'combine' || e.stage === 'pattern') && e.minutes >= 6) return 2
  return 1
}
