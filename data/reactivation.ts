import type { Attempt } from '@/lib/types'

/**
 * A one-time reactivation session (Oct 12, 2026): after several days away, warm
 * the fundamentals back up before resuming the plan. Existing reps only, from
 * the bottom upward, mostly the Dictionary Ladder: write, debug, combine.
 * Repeating reps already passed is the point: it is retrieval practice, and the
 * attempts are recorded as new cold reps without touching the earlier passes.
 *
 * This is deliberately not a general "back after a break" system.
 */
export const REACTIVATION = {
  /** Also the key it is stored under in the synced study state. */
  id: '2026-10-12',
  from: '2026-10-12',
  stages: [
    { name: 'Python recall', reps: ['o2-append-line', 'o2-countdown', 'o2-enum-fill', 'o2-count-evens'] },
    { name: 'Dictionary recall', reps: ['o2-dl-add-line', 'o2-dl-price-or', 'o2-dl-sell', 'o2-dl-sum-values', 'o2-dl-dbg-values'] },
    { name: 'Frequency maps', reps: ['o2-dl-letter-count', 'o2-dl-dbg-reset', 'o2-dl-lc-majority'] },
    { name: 'Index maps', reps: ['o2-dl-first-index', 'o2-dl-dbg-direction', 'o2-dl-lookup-positions'] },
    { name: 'Complement bridge', reps: ['o2-comp-write', 'o2-comp-set-code', 'o2-ts-find-pair'] },
    // The integration rep: enumerate, a dict, the complement, membership and an index lookup, in the Reps editor.
    { name: 'Put it together', reps: ['o2-dl-lc-two-sum'] },
  ],
} as const

export const REACTIVATION_REPS: string[] = REACTIVATION.stages.flatMap((s) => [...s.reps])
export const REACTIVATION_FINAL = REACTIVATION_REPS[REACTIVATION_REPS.length - 1]
export const REACTIVATION_KEY = `reactivation:${REACTIVATION.id}`

export interface ReactivationState {
  sessionId: string
  startedAt: string
}

export interface ReactivationStatus {
  state: 'offer' | 'in-progress' | 'done'
  /** Reps passed since the session began. */
  done: number
  total: number
  /** Where to pick up: the first rep not yet passed in this session. */
  next: string | null
  stage: string | null
  /** The last rep was passed, but with the solution open or more than one hint: one clean pass still to go. */
  finalNeedsCleanPass: boolean
  /** The local date it was finished. */
  finishedOn: string | null
}

/** Where the session stands, from the attempts made since it began. Earlier passes of the same reps do not count. */
export function reactivationStatus(saved: ReactivationState | undefined, attempts: Attempt[]): ReactivationStatus {
  const total = REACTIVATION_REPS.length
  if (!saved?.sessionId) return { state: 'offer', done: 0, total, next: REACTIVATION_REPS[0], stage: REACTIVATION.stages[0].name, finalNeedsCleanPass: false, finishedOn: null }
  const since = attempts.filter((a) => a.passed && a.completedAt && a.completedAt >= saved.startedAt)
  const passed = new Set(since.map((a) => a.exerciseId))
  // "Reasonably cleanly": no solution, at most one hint.
  const clean = since.filter((a) => a.exerciseId === REACTIVATION_FINAL && !a.solutionViewed && a.hintsUsed <= 1).sort((a, b) => a.completedAt!.localeCompare(b.completedAt!))[0]
  const done = REACTIVATION_REPS.filter((id) => passed.has(id)).length
  if (clean) return { state: 'done', done, total, next: null, stage: null, finalNeedsCleanPass: false, finishedOn: clean.date }
  const next = REACTIVATION_REPS.find((id) => !passed.has(id)) ?? REACTIVATION_FINAL
  return { state: 'in-progress', done, total, next, stage: REACTIVATION.stages.find((s) => (s.reps as readonly string[]).includes(next))?.name ?? null, finalNeedsCleanPass: passed.has(REACTIVATION_FINAL), finishedOn: null }
}
