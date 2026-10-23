import type { SolveEntry } from '@/lib/solve-log'
import type { Attempt, Exercise } from '@/lib/types'

/**
 * What counts (REPS_2_MASTER_SPEC.md §13, §55; REPS_2_1_SPEC.md §10, §11). The
 * one place that decides it: no page invents its own rule.
 *
 * Daily credit (the visible target) is literal qualifying production:
 * - a rep passed, once per rep per day, without the solution shown in that attempt;
 * - assistance (hints, an open concept guide) lowers the evidence, not the credit;
 * - a rep whose solution was shown earns nothing again that day (rebuilding it
 *   straight away is training); on a later day a pass counts, as a reconstruction;
 * - an outside problem counts once per problem per day when it was solved
 *   unaided or with a small hint; seeing the solution earns nothing until it is
 *   rebuilt from blank on a later day;
 * - reading, watching, failing, copying, recognising (multiple choice),
 *   self-graded explanations and labs do not.
 *
 * Mastery evidence classifies how a pass happened, so assistance never
 * masquerades as independence, and a rep's best evidence can be upgraded by a
 * later, stronger pass.
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
  /** Passed after the solution had been shown: training, not independence. */
  | 'reconstructed'
  /** Passed again, cold, after an earlier independent pass on a different day: retrieval. */
  | 'retrieval'
  /** The solution was shown in this attempt. No credit. */
  | 'revealed'
  | 'failed'

/** Evidence from an outside (LeetCode / NeetCode) problem. */
export type OutsideEvidence =
  /** Solved unaided, first time. */
  | 'outside-unaided'
  /** Solved unaided on a spaced re-solve or a redo: the strongest outside signal. */
  | 'outside-cold'
  /** Finished after a small hint. Counts, as assisted. */
  | 'outside-hinted'
  /** Rebuilt from blank on a later day after seeing the solution. */
  | 'outside-reconstructed'

/** Strength order for upgrading a rep's best evidence (higher is stronger). */
export const EVIDENCE_RANK: Record<Evidence, number> = {
  failed: 0,
  revealed: 0,
  reconstructed: 1,
  assisted: 2,
  'self-corrected': 3,
  independent: 4,
  retrieval: 5,
  'cold-independent': 6,
}

/** Kinds that are active production. Recognition (multiple choice) and self-graded explanations are not. */
const PRODUCTION: Exercise['kind'][] = ['code', 'output', 'reorder']

const time = (a: Attempt) => a.completedAt ?? a.startedAt

/** Earlier attempts on the same rep, before this one. */
function earlier(a: Attempt, history: Attempt[]): Attempt[] {
  return history.filter((h) => h.exerciseId === a.exerciseId && h.id !== a.id && time(h) < time(a))
}

const passedAttempt = (a: Attempt) => a.passed && Boolean(a.completedAt)
const clean = (a: Attempt) => passedAttempt(a) && a.hintsUsed === 0 && !a.solutionViewed

/** The date of the last attempt (before this one) that showed the solution, if any. */
function lastRevealDate(a: Attempt, before: Attempt[]): string | null {
  const shown = before.filter((h) => h.solutionViewed)
  if (!shown.length) return null
  return shown.map((h) => h.date).sort().pop()!
}

export function masteryEvidence(a: Attempt, history: Attempt[]): Evidence {
  if (!passedAttempt(a)) return 'failed'
  if (a.solutionViewed) return 'revealed'
  const before = earlier(a, history)
  // Seen the solution before: this pass rebuilds what was shown, until a clean pass on a LATER day than the
  // reveal proves it independently. A same-day "run it back" never clears a reveal.
  const reveal = lastRevealDate(a, before)
  if (reveal && (a.date <= reveal || !before.some((h) => clean(h) && h.date > reveal))) return 'reconstructed'
  if (a.hintsUsed > 0) return 'assisted'
  // Retrieval: cold, after an earlier independent pass on a different day (and after any reveal).
  if (a.retrievalType === 'cold' && before.some((h) => clean(h) && h.date < a.date && (!reveal || h.date > reveal))) return 'retrieval'
  if (a.attemptsBeforePass > 0) return 'self-corrected'
  return a.retrievalType === 'cold' ? 'cold-independent' : 'independent'
}

/** Why an attempt does or does not earn daily credit. */
export type CreditReason = 'counts' | 'not-passed' | 'solution-shown' | 'rebuilt-same-day' | 'not-production' | 'lab' | 'unknown-rep'

export function creditReason(a: Attempt, exercise: Exercise | undefined, history: Attempt[] = []): CreditReason {
  if (!exercise) return 'unknown-rep'
  if (exercise.lab) return 'lab'
  if (!PRODUCTION.includes(exercise.kind)) return 'not-production'
  if (!passedAttempt(a)) return 'not-passed'
  if (a.solutionViewed) return 'solution-shown'
  // Rebuilding a rep straight after its solution was shown (same day) is training, not a qualifying rep.
  if (earlier(a, history).some((h) => h.solutionViewed && h.date === a.date)) return 'rebuilt-same-day'
  return 'counts'
}

/** Whether this attempt can earn daily credit at all (before the once-a-day rule). */
export function qualifies(a: Attempt, exercise: Exercise | undefined, history: Attempt[] = []): boolean {
  return creditReason(a, exercise, history) === 'counts'
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

/** The strongest evidence any pass of a rep has produced (later, stronger passes upgrade earlier, weaker ones). */
export function bestEvidence(exerciseId: string, attempts: Attempt[]): Evidence | null {
  let best: Evidence | null = null
  for (const a of attempts) {
    if (a.exerciseId !== exerciseId || !passedAttempt(a)) continue
    const e = masteryEvidence(a, attempts)
    if (e === 'revealed') continue
    if (!best || EVIDENCE_RANK[e] > EVIDENCE_RANK[best]) best = e
  }
  return best
}

const isResolve = (k: SolveEntry['kind']) => k === 'review1' || k === 'review2' || k === 'review3' || k === 'redo'

/**
 * The credit an outside problem entry earns, and on which date:
 * - unaided: on its date (a re-solve or redo is cold evidence);
 * - hinted (a small hint, finished yourself): on its date, as assisted;
 * - solution seen: nothing on its date; rebuilt from blank on a LATER day: on that day, as a reconstruction;
 * - failed: nothing.
 */
export function outsideCredit(e: SolveEntry): { date: string; evidence: OutsideEvidence } | null {
  if (!e.lc) return null
  if (e.result === 'unaided') return { date: e.date, evidence: isResolve(e.kind) ? 'outside-cold' : 'outside-unaided' }
  if (e.result === 'hinted') return { date: e.date, evidence: 'outside-hinted' }
  if (e.result === 'solution' && e.rebuiltOn && e.rebuiltOn > e.date) return { date: e.rebuiltOn, evidence: 'outside-reconstructed' }
  return null
}

export interface CreditItem {
  key: string
  date: string
  source: 'rep' | 'outside'
  exerciseId?: string
  lc?: number
  evidence: Evidence | OutsideEvidence
}

/**
 * Qualifying work done on a date: each rep at most once (its first qualifying
 * pass that day), each outside problem at most once (whatever entries were logged for it).
 */
export function dailyCredits(date: string, attempts: Attempt[], entries: SolveEntry[], exercises: Record<string, Exercise>): CreditItem[] {
  const out: CreditItem[] = []
  const seen = new Set<string>()
  const day = attempts.filter((a) => a.date === date).sort((x, y) => time(x).localeCompare(time(y)))
  for (const a of day) {
    if (seen.has(a.exerciseId) || !qualifies(a, exercises[a.exerciseId], attempts)) continue
    seen.add(a.exerciseId)
    out.push({ key: a.exerciseId, date, source: 'rep', exerciseId: a.exerciseId, evidence: masteryEvidence(a, attempts) })
  }
  // Outside problems: one credit per problem per day, the strongest evidence among that day's entries.
  const best = new Map<number, OutsideEvidence>()
  const RANK: Record<OutsideEvidence, number> = { 'outside-reconstructed': 1, 'outside-hinted': 2, 'outside-unaided': 3, 'outside-cold': 4 }
  for (const e of entries) {
    const c = outsideCredit(e)
    if (!c || c.date !== date) continue
    const prev = best.get(e.lc!)
    if (!prev || RANK[c.evidence] > RANK[prev]) best.set(e.lc!, c.evidence)
  }
  for (const [lc, evidence] of [...best.entries()].sort((a, b) => a[0] - b[0])) out.push({ key: `lc:${lc}`, date, source: 'outside', lc, evidence })
  return out
}

/** Credits per date over a range, for weekly totals and streaks. */
export function creditsByDate(dates: string[], attempts: Attempt[], entries: SolveEntry[], exercises: Record<string, Exercise>): Record<string, number> {
  return Object.fromEntries(dates.map((d) => [d, dailyCredits(d, attempts, entries, exercises).length]))
}
