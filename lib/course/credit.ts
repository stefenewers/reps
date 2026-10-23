import type { SolveEntry } from '@/lib/solve-log'
import type { Attempt, Exercise } from '@/lib/types'

/**
 * What counts (REPS_2_MASTER_SPEC.md §13, §55). The one place that decides it:
 * no page invents its own rule.
 *
 * Daily credit (the visible target) is literal qualifying production:
 * - a rep passed, once per rep per day, without the solution shown in that attempt;
 * - assistance (hints, an open concept guide) lowers the evidence, not the credit;
 * - a later attempt after a revealed solution counts (a reconstruction), as training;
 * - an outside problem solved and logged (unaided or with hints) counts once;
 * - reading, watching, failing, copying, recognising (multiple choice) and labs do not.
 *
 * Mastery evidence classifies how a pass happened, so assistance never
 * masquerades as independence.
 */

export type Evidence =
  /** Passed cold, first try, no help. The strongest signal. */
  | 'cold-independent'
  /** Passed without help on a non-cold rep (first exposure, drill). */
  | 'independent'
  /** Passed without help after failed runs: found and fixed the mistake. */
  | 'self-corrected'
  /** Passed with hints or an opened concept/lesson panel. */
  | 'assisted'
  /** Passed in a later attempt after seeing the solution: training, not independence. */
  | 'reconstructed'
  /** Passed again, cold, after an earlier clean pass: retrieval. */
  | 'retrieval'
  /** The solution was shown in this attempt. No credit. */
  | 'revealed'
  | 'failed'

/** Kinds that are active production. Recognition (multiple choice) is not. */
const PRODUCTION: Exercise['kind'][] = ['code', 'output', 'reorder', 'explain']

const time = (a: Attempt) => a.completedAt ?? a.startedAt

/** Earlier attempts on the same rep, before this one. */
function earlier(a: Attempt, history: Attempt[]): Attempt[] {
  return history.filter((h) => h.exerciseId === a.exerciseId && h.id !== a.id && time(h) < time(a))
}

const passedAttempt = (a: Attempt) => a.passed && Boolean(a.completedAt)
const clean = (a: Attempt) => passedAttempt(a) && a.hintsUsed === 0 && !a.solutionViewed

export function masteryEvidence(a: Attempt, history: Attempt[]): Evidence {
  if (!passedAttempt(a)) return 'failed'
  if (a.solutionViewed) return 'revealed'
  const before = earlier(a, history)
  // Seen the solution before, and not yet passed clean since: this pass rebuilds what was shown.
  const lastReveal = before.filter((h) => h.solutionViewed).map(time).sort().pop()
  if (lastReveal && !before.some((h) => clean(h) && time(h) > lastReveal)) return 'reconstructed'
  if (a.hintsUsed > 0) return 'assisted'
  if (a.retrievalType === 'cold' && before.some(clean)) return 'retrieval'
  if (a.attemptsBeforePass > 0) return 'self-corrected'
  return a.retrievalType === 'cold' ? 'cold-independent' : 'independent'
}

/** Whether this attempt can earn daily credit at all (before the once-a-day rule). */
export function qualifies(a: Attempt, exercise: Exercise | undefined): boolean {
  if (!exercise || exercise.lab) return false
  if (!PRODUCTION.includes(exercise.kind)) return false
  return passedAttempt(a) && !a.solutionViewed
}

/** Clean cold evidence: cold, passed, no help, not a reconstruction of a revealed solution. */
export function coldEvidence(a: Attempt, history: Attempt[]): boolean {
  if (a.retrievalType !== 'cold') return false
  const e = masteryEvidence(a, history)
  return e === 'cold-independent' || e === 'retrieval' || e === 'self-corrected'
}

/** The clean standard a gate requires: no hints, no solution, not a reconstruction; at most two failed runs. */
export function gateClean(a: Attempt, history: Attempt[]): boolean {
  const e = masteryEvidence(a, history)
  return (e === 'cold-independent' || e === 'independent' || e === 'retrieval' || e === 'self-corrected') && a.attemptsBeforePass <= 2
}

export interface CreditItem {
  key: string
  date: string
  source: 'rep' | 'outside'
  exerciseId?: string
  lc?: number
  evidence: Evidence | 'outside-unaided' | 'outside-hinted'
}

/**
 * Qualifying work done on a date: each rep at most once (its first qualifying
 * pass that day), each logged outside problem once.
 */
export function dailyCredits(date: string, attempts: Attempt[], entries: SolveEntry[], exercises: Record<string, Exercise>): CreditItem[] {
  const out: CreditItem[] = []
  const seen = new Set<string>()
  const day = attempts.filter((a) => a.date === date).sort((x, y) => time(x).localeCompare(time(y)))
  for (const a of day) {
    if (seen.has(a.exerciseId) || !qualifies(a, exercises[a.exerciseId])) continue
    seen.add(a.exerciseId)
    out.push({ key: a.exerciseId, date, source: 'rep', exerciseId: a.exerciseId, evidence: masteryEvidence(a, attempts) })
  }
  for (const e of entries) {
    if (e.date !== date || !e.lc || e.result === 'failed' || seen.has(e.id)) continue
    seen.add(e.id)
    out.push({ key: e.id, date, source: 'outside', lc: e.lc, evidence: e.result === 'unaided' ? 'outside-unaided' : 'outside-hinted' })
  }
  return out
}

/** Credits per date over a range, for weekly totals and streaks. */
export function creditsByDate(dates: string[], attempts: Attempt[], entries: SolveEntry[], exercises: Record<string, Exercise>): Record<string, number> {
  return Object.fromEntries(dates.map((d) => [d, dailyCredits(d, attempts, entries, exercises).length]))
}
