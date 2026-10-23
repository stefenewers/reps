import { courseWeekOf } from '@/data/course/calendar'
import { masteryEvidence, type Evidence } from '@/lib/course/credit'
import type { UnitStatus } from '@/lib/course/routing'
import type { WeekStatus } from '@/lib/course/week-status'
import type { Attempt, Exercise } from '@/lib/types'

/**
 * February readiness (REPS_2_MASTER_SPEC.md §37–38, §17 Weeks 13–14). Never one
 * opaque percentage: each domain says where it stands and why, from units,
 * gates, cold evidence and freshness.
 */

export type DomainStatus = 'ready' | 'developing' | 'building' | 'not-started' | 'not-tested'
export type Track = 'on-track' | 'at-risk' | 'off-track'

export interface Domain {
  id: string
  title: string
  units: string[]
  status: DomainStatus
  /** Ready, but not practised for a while: mastered and stale are different things. */
  stale: boolean
  why: string
}

const DOMAINS: { id: string; title: string; units: string[] }[] = [
  { id: 'foundations', title: 'Programming foundations', units: ['w1-state-while', 'w1-loop-control', 'w1-running-state', 'w1-mutation-references', 'w1-integration'] },
  { id: 'decomposition', title: 'Problem decomposition', units: ['w2-contract', 'w2-manual', 'w2-testing', 'w2-improve', 'w2-solve-map'] },
  { id: 'hashing', title: 'Hashing', units: ['w2-hashing'] },
  { id: 'pointers', title: 'Pointers and running state', units: ['w3-two-pointers', 'w3-running-prefix'] },
  { id: 'windows', title: 'Sliding window', units: ['w4-windows'] },
  { id: 'stacks', title: 'Stacks', units: ['w4-stacks'] },
  { id: 'search', title: 'Binary search', units: ['w5-binary-search'] },
  { id: 'lists', title: 'Linked lists', units: ['w5-linked-lists', 'w6-fast-slow'] },
  { id: 'recursion', title: 'Recursion', units: ['w6-recursion'] },
  { id: 'trees', title: 'Trees', units: ['w7-trees', 'w7-bst'] },
  { id: 'graphs', title: 'Graphs', units: ['w8-queue-bfs', 'w8-grids', 'w8-graphs', 'w9-cycles'] },
  { id: 'heaps', title: 'Heaps and intervals', units: ['w9-heaps', 'w10-intervals'] },
  { id: 'backtracking', title: 'Backtracking', units: ['w11-backtracking'] },
  { id: 'dp', title: 'Basic DP and greedy', units: ['w11-dp', 'w12-dp-greedy'] },
  { id: 'matrix', title: 'Matrix and tries', units: ['w12-matrix-tries'] },
]

export const DOMAIN_IDS = DOMAINS.map((d) => d.id)

function domainOf(def: (typeof DOMAINS)[number], statuses: Map<string, UnitStatus>): Domain {
  const us = def.units.map((id) => statuses.get(id)).filter((u): u is UnitStatus => Boolean(u))
  const ready = us.filter((u) => u.state === 'ready' || u.state === 'maintenance')
  const touched = us.filter((u) => u.state !== 'unseen' && u.state !== 'placement')
  const blocked = us.filter((u) => u.state === 'gate-blocked')
  const stale = ready.length === us.length && us.some((u) => u.state === 'maintenance')
  if (us.length && ready.length === us.length) return { ...def, status: 'ready', stale, why: stale ? 'Every checkpoint cleared; not practised lately, so it comes back as retrieval.' : 'Every checkpoint cleared, cold.' }
  if (blocked.length) return { ...def, status: 'developing', stale: false, why: `Needs one clean checkpoint: ${blocked.map((u) => u.unit.title.toLowerCase()).join(', ')}.` }
  if (ready.length || touched.length) {
    const gatesLeft = us.flatMap((u) => u.gates.filter((g) => !g.cleared && g.available.length)).length
    return { ...def, status: 'developing', stale: false, why: gatesLeft ? `${gatesLeft} checkpoint${gatesLeft === 1 ? '' : 's'} still to clear.` : 'In progress.' }
  }
  return { ...def, status: 'not-started', stale: false, why: 'Not reached yet.' }
}

export interface EvidenceSummary {
  coldIndependent: number
  selfCorrected: number
  assisted: number
  reconstructed: number
  /** Share of passes in the last 7 training days that needed hints or a reconstruction. */
  recentAssistance: number
}

/** Full-problem evidence: capstones, transfer reps, gate variants and Week 13 problems, classified. */
export function evidenceSummary(attempts: Attempt[], exercises: Record<string, Exercise>, today: string): EvidenceSummary {
  const full = (e?: Exercise) => Boolean(e && (e.repType === 'capstone' || e.transfer || e.gate || e.stage === 'pattern' || e.stage === 'interview'))
  const counts: Record<Evidence, number> = { 'cold-independent': 0, independent: 0, 'self-corrected': 0, assisted: 0, reconstructed: 0, retrieval: 0, revealed: 0, failed: 0 }
  const seen = new Set<string>()
  for (const a of attempts) {
    if (!a.passed || !a.completedAt || seen.has(a.exerciseId) || !full(exercises[a.exerciseId])) continue
    seen.add(a.exerciseId)
    counts[masteryEvidence(a, attempts)]++
  }
  const since = new Date(Date.parse(today) - 9 * 86_400_000).toISOString().slice(0, 10)
  const recent = attempts.filter((a) => a.passed && a.completedAt && a.date >= since)
  const helped = recent.filter((a) => a.hintsUsed > 0 || a.solutionViewed).length
  return {
    coldIndependent: counts['cold-independent'] + counts.independent + counts.retrieval,
    selfCorrected: counts['self-corrected'],
    assisted: counts.assisted,
    reconstructed: counts.reconstructed,
    recentAssistance: recent.length ? helped / recent.length : 0,
  }
}

export type TransferGrade = 'green' | 'yellow' | 'red'

/**
 * Week 13's verdict, from the transfer bank: the share of attempted transfer
 * problems solved cold (independently or by self-correction) and how many full
 * fresh problems were solved that way.
 */
export function transferGrade(attempts: Attempt[], exercises: Record<string, Exercise>, transferIds: string[]): { grade: TransferGrade; independent: number; attempted: number; freshFull: number } {
  const ids = new Set(transferIds)
  const byRep = new Map<string, Attempt[]>()
  for (const a of attempts) if (ids.has(a.exerciseId)) byRep.set(a.exerciseId, [...(byRep.get(a.exerciseId) ?? []), a])
  let independent = 0
  let freshFull = 0
  for (const [id, as] of byRep) {
    const first = as.find((a) => a.passed && a.completedAt)
    const e = first ? masteryEvidence(first, attempts) : 'failed'
    // A fast repeat of a known answer is not transfer.
    const ok = (e === 'cold-independent' || e === 'independent' || e === 'self-corrected') && !(first && memorizedRisk(first, attempts))
    if (ok) independent++
    if (ok && (exercises[id]?.stage === 'interview' || (exercises[id]?.minutes ?? 0) >= 15)) freshFull++
  }
  const attempted = byRep.size
  const rate = attempted ? independent / attempted : 0
  const grade: TransferGrade = attempted >= 10 && rate >= 0.7 && freshFull >= 8 ? 'green' : attempted >= 6 && rate >= 0.45 ? 'yellow' : 'red'
  return { grade, independent, attempted, freshFull }
}

/** Week 14: mocks are readiness-gated, never required by the calendar alone. */
export function mockPolicy(grade: TransferGrade): { mocksRequired: number; mocksAllowed: number; note: string } {
  if (grade === 'green') return { mocksRequired: 2, mocksAllowed: 2, note: 'Two mocks, each followed by diagnosis and repair.' }
  if (grade === 'yellow') return { mocksRequired: 0, mocksAllowed: 1, note: 'More transfer and timed singles; one mock at most until the first proves useful.' }
  return { mocksRequired: 0, mocksAllowed: 0, note: 'No mock theatre yet: cold transfer and repair first.' }
}

export interface Readiness {
  track: Track
  domains: Domain[]
  transfer: DomainStatus
  interview: DomainStatus
  evidence: EvidenceSummary
  why: string[]
}

/**
 * The overall read:
 * - on track: curriculum position not materially behind, weekly output met or recoverable, gates clearing, assistance acceptable;
 * - at risk: a recoverable shortfall, one or two blocked prerequisites, or not enough cold evidence;
 * - off track: required output unfinished entering the next week, several gates blocked, or assistance preventing independence.
 */
export function readiness(statuses: UnitStatus[], weekStatuses: WeekStatus[], evidence: EvidenceSummary, today: string, extra: { transferGrade?: TransferGrade; mocksDone?: number } = {}): Readiness {
  const byId = new Map(statuses.map((s) => [s.unit.id, s]))
  const domains = DOMAINS.map((d) => domainOf(d, byId))
  const week = courseWeekOf(today)
  const frontier = statuses.find((s) => s.state !== 'ready' && s.state !== 'maintenance')
  const behindWeeks = frontier ? Math.max(0, week - frontier.unit.week) : 0
  const blocked = statuses.filter((s) => s.state === 'gate-blocked').length
  const lastFinishedWeek = weekStatuses.length ? weekStatuses[weekStatuses.length - 1] : undefined
  const why: string[] = []
  let track: Track = 'on-track'
  if (behindWeeks >= 2 || blocked >= 3 || lastFinishedWeek === 'off-track' || evidence.recentAssistance > 0.6) track = 'off-track'
  else if (behindWeeks === 1 || blocked >= 1 || lastFinishedWeek === 'recoverable' || evidence.recentAssistance > 0.4) track = 'at-risk'
  if (behindWeeks) why.push(`The course is ${behindWeeks} week${behindWeeks === 1 ? '' : 's'} behind the calendar.`)
  if (blocked) why.push(`${blocked} checkpoint${blocked === 1 ? '' : 's'} not yet cleared.`)
  if (lastFinishedWeek && lastFinishedWeek !== 'on-track') why.push(`Last week finished ${lastFinishedWeek === 'off-track' ? 'off track' : 'short but recoverable'}.`)
  if (evidence.recentAssistance > 0.4) why.push(`${Math.round(evidence.recentAssistance * 100)}% of recent passes needed help.`)
  if (!why.length) why.push('Output, checkpoints and independence are where the plan needs them.')
  const transfer: DomainStatus = extra.transferGrade ? (extra.transferGrade === 'green' ? 'ready' : 'developing') : week >= 13 ? 'building' : 'not-tested'
  const interview: DomainStatus = (extra.mocksDone ?? 0) > 0 ? 'developing' : 'not-tested'
  return { track, domains, transfer, interview, evidence, why }
}

export type FinalDecision = 'ready' | 'ready-with-gaps' | 'not-yet-ready'

/** Feb 1: an interview-start checkpoint, decided on several kinds of evidence at once. */
export function finalDecision(r: Readiness, grade: TransferGrade, mocksDone: number): FinalDecision {
  const notReady = r.domains.filter((d) => d.status !== 'ready').length
  if (grade === 'green' && notReady <= 1 && mocksDone >= 1) return 'ready'
  if (grade !== 'red' && notReady <= 4) return 'ready-with-gaps'
  return 'not-yet-ready'
}

/**
 * Memorized risk: a known problem passed again fast and first time, when it had
 * already been solved on an earlier day. It may be recall of the answer rather
 * than transfer. Not a failure; it just does not count as transfer evidence.
 */
export function memorizedRisk(a: Attempt, attempts: Attempt[]): boolean {
  if (!a.passed || a.attemptsBeforePass > 0) return false
  const solvedBefore = attempts.some((b) => b.exerciseId === a.exerciseId && b.passed && b.date < a.date)
  return solvedBefore && (a.durationSeconds ?? 9999) < 180
}
