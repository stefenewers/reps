import { courseWeekOf } from '@/data/course/calendar'
import { GATE_OF_EXERCISE } from '@/data/course/gates'
import type { Lab } from '@/data/course/types'
import { bestEvidence, dailyCredits, masteryEvidence, outsideCredit, type Evidence, type OutsideEvidence } from '@/lib/course/credit'
import type { UnitStatus } from '@/lib/course/routing'
import type { SolveEntry } from '@/lib/solve-log'
import type { Attempt, Exercise } from '@/lib/types'

/**
 * February readiness (REPS_2_MASTER_SPEC.md §37–38; REPS_2_1_SPEC.md §11, §18, §26).
 * Never one opaque percentage: each dimension says where it stands and why, and
 * every number comes from the levels below it (credits, gates, labs, week
 * contracts). Evidence is classified exactly, and a rep's strongest evidence
 * counts, so later independent work upgrades earlier assisted work.
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

/** Core DSA detail: the sub-domains under "Core DSA". */
const CORE: { id: string; title: string; units: string[] }[] = [
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
const FOUNDATIONS = ['w1-state-while', 'w1-loop-control', 'w1-running-state', 'w1-mutation-references', 'w1-integration']
const PROBLEM_SOLVING = ['w2-contract', 'w2-manual', 'w2-testing', 'w2-improve', 'w2-solve-map']

export const DOMAIN_IDS = CORE.map((d) => d.id)

function unitsDomain(def: { id: string; title: string; units: string[] }, statuses: Map<string, UnitStatus>): Domain {
  const us = def.units.map((id) => statuses.get(id)).filter((u): u is UnitStatus => Boolean(u))
  const ready = us.filter((u) => u.state === 'ready' || u.state === 'maintenance')
  const touched = us.filter((u) => u.state !== 'unseen' && u.state !== 'placement')
  const blocked = us.filter((u) => u.state === 'gate-blocked')
  const stale = us.length > 0 && ready.length === us.length && us.some((u) => u.state === 'maintenance')
  const gated = us.some((u) => u.gates.some((g) => g.available.length))
  if (us.length && ready.length === us.length)
    return { ...def, status: 'ready', stale, why: stale ? 'Cleared, but not practised for over two weeks: it comes back as retrieval.' : gated ? 'Every checkpoint cleared cold.' : 'Every required rep passed.' }
  if (blocked.length) return { ...def, status: 'developing', stale: false, why: `A checkpoint needs repair, then a fresh attempt: ${blocked.map((u) => u.unit.title.toLowerCase()).join(', ')}.` }
  if (ready.length || touched.length) {
    const left = us.flatMap((u) => u.gates.filter((g) => !g.cleared && g.available.length)).length
    return { ...def, status: 'developing', stale: false, why: left ? `${left} checkpoint${left === 1 ? '' : 's'} still to clear.` : 'Required reps in progress.' }
  }
  return { ...def, status: 'not-started', stale: false, why: 'Not reached yet.' }
}

/** Evidence counts, by kind, from each rep's strongest pass, plus outside problems. */
export interface EvidenceSummary {
  independent: number
  coldIndependent: number
  selfCorrected: number
  retrieval: number
  assisted: number
  reconstructed: number
  outsideUnaided: number
  outsideCold: number
  outsideHinted: number
  outsideRebuilt: number
  /** Share of the last 10 days' qualifying work that leaned on help (hints, a shown solution rebuilt, a hinted outside solve). */
  recentAssistance: number
}

/** Full problems: capstones, unlabeled transfer, pattern/interview reps and every checkpoint variant. */
export function isFullProblem(e?: Exercise): boolean {
  return Boolean(e && (e.repType === 'capstone' || e.transfer || e.gate || GATE_OF_EXERCISE[e.id] || e.stage === 'pattern' || e.stage === 'interview'))
}

export function evidenceSummary(attempts: Attempt[], entries: SolveEntry[], exercises: Record<string, Exercise>, today: string): EvidenceSummary {
  const counts: Record<Evidence, number> = { 'cold-independent': 0, independent: 0, 'self-corrected': 0, assisted: 0, reconstructed: 0, retrieval: 0, revealed: 0, failed: 0 }
  const reps = new Set(attempts.filter((a) => isFullProblem(exercises[a.exerciseId])).map((a) => a.exerciseId))
  for (const id of reps) {
    const best = bestEvidence(id, attempts)
    if (best) counts[best]++
  }
  // Outside problems: each problem's strongest evidence.
  const RANK: Record<OutsideEvidence, number> = { 'outside-reconstructed': 1, 'outside-hinted': 2, 'outside-unaided': 3, 'outside-cold': 4 }
  const outside = new Map<number, OutsideEvidence>()
  for (const e of entries) {
    const c = outsideCredit(e, entries)
    if (!c || !e.lc) continue
    const prev = outside.get(e.lc)
    if (!prev || RANK[c.evidence] > RANK[prev]) outside.set(e.lc, c.evidence)
  }
  const o = (k: OutsideEvidence) => [...outside.values()].filter((v) => v === k).length
  // Recent assistance, from what actually counted in the last 10 days.
  let total = 0
  let helped = 0
  for (let i = 0; i < 10; i++) {
    const d = new Date(Date.parse(`${today}T12:00:00Z`) - i * 86_400_000).toISOString().slice(0, 10)
    for (const c of dailyCredits(d, attempts, entries, exercises)) {
      total++
      if (c.evidence === 'assisted' || c.evidence === 'reconstructed' || c.evidence === 'outside-hinted' || c.evidence === 'outside-reconstructed') helped++
    }
  }
  return {
    independent: counts.independent,
    coldIndependent: counts['cold-independent'],
    selfCorrected: counts['self-corrected'],
    retrieval: counts.retrieval,
    assisted: counts.assisted,
    reconstructed: counts.reconstructed,
    outsideUnaided: o('outside-unaided'),
    outsideCold: o('outside-cold'),
    outsideHinted: o('outside-hinted'),
    outsideRebuilt: o('outside-reconstructed'),
    recentAssistance: total ? helped / total : 0,
  }
}

export type TransferGrade = 'green' | 'yellow' | 'red'

const time = (a: Attempt) => a.completedAt ?? a.startedAt

/** How long an attempt took, in seconds: the recorded duration, or the time between start and finish. */
function seconds(a: Attempt): number | null {
  if (a.durationSeconds) return a.durationSeconds
  if (a.completedAt && a.startedAt) return Math.max(0, (Date.parse(a.completedAt) - Date.parse(a.startedAt)) / 1000)
  return null
}

/**
 * Memorized risk: a known problem passed again fast and first time, when it had
 * already been solved on an earlier day. It may be recall of the answer rather
 * than transfer. Not a failure; it just does not count as transfer evidence.
 */
export function memorizedRisk(a: Attempt, attempts: Attempt[]): boolean {
  if (!a.passed || a.attemptsBeforePass > 0) return false
  const solvedBefore = attempts.some((b) => b.exerciseId === a.exerciseId && b.passed && b.date < a.date)
  const s = seconds(a)
  return solvedBefore && s !== null && s < 180
}

/**
 * Week 13's verdict, from the transfer bank: the share of attempted transfer
 * problems whose FIRST pass (in time order) was independent or self-corrected,
 * and how many full fresh problems were solved that way.
 */
export function transferGrade(attempts: Attempt[], exercises: Record<string, Exercise>, transferIds: string[]): { grade: TransferGrade; independent: number; attempted: number; freshFull: number } {
  const ids = new Set(transferIds)
  const byRep = new Map<string, Attempt[]>()
  for (const a of [...attempts].sort((x, y) => time(x).localeCompare(time(y)))) if (ids.has(a.exerciseId)) byRep.set(a.exerciseId, [...(byRep.get(a.exerciseId) ?? []), a])
  let independent = 0
  let freshFull = 0
  for (const [id, as] of byRep) {
    const first = as.find((a) => a.passed && a.completedAt)
    const e = first ? masteryEvidence(first, as) : 'failed'
    const ok = (e === 'cold-independent' || e === 'independent' || e === 'self-corrected') && !(first && memorizedRisk(first, as))
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

export interface LabEvidence {
  lab: Lab
  done: boolean
  /** Due on or before today (by the schedule). */
  due: boolean
  buildPassed: boolean
  changePassed: boolean
  designDone: boolean
}

export interface Readiness {
  track: Track
  /** The seven dimensions of REPS_2_1_SPEC.md §18, in order. */
  dimensions: Domain[]
  /** Core DSA detail. */
  core: Domain[]
  evidence: EvidenceSummary
  why: string[]
}

export interface ReadinessInput {
  statuses: UnitStatus[]
  /** Status of every finished course week (from the week contract), oldest first. */
  finishedWeeks: ('complete' | 'on-track' | 'recoverable' | 'off-track' | 'upcoming')[]
  /** The current week's status (from the week contract). */
  currentWeek?: 'complete' | 'on-track' | 'recoverable' | 'off-track' | 'upcoming'
  evidence: EvidenceSummary
  labs: LabEvidence[]
  transfer?: { grade: TransferGrade; attempted: number; independent: number }
  mocksDone: number
  today: string
}

function labDomain(id: string, title: string, labs: LabEvidence[], what: string): Domain {
  const due = labs.filter((l) => l.due)
  const done = labs.filter((l) => l.done)
  if (!labs.length) return { id, title, units: [], status: 'not-started', stale: false, why: 'No builds yet.' }
  if (!due.length) return { id, title, units: [], status: done.length ? 'developing' : 'not-started', stale: false, why: done.length ? `${done.length} built early.` : `First ${what} build comes later in the course.` }
  const dueDone = due.filter((l) => l.done).length
  if (dueDone === due.length) return { id, title, units: [], status: due.length === labs.length ? 'ready' : 'developing', stale: false, why: `${dueDone} of ${due.length} ${what} builds due so far are done, each with a change request and a written design.` }
  return { id, title, units: [], status: dueDone ? 'developing' : 'building', stale: false, why: `${dueDone} of ${due.length} ${what} builds due so far are done.` }
}

/**
 * The overall read, from the levels below it:
 * - on track: the current and last weeks are on track or complete, no checkpoint stuck, help kept in proportion;
 * - at risk: a recoverable week, one stuck checkpoint, or help creeping up;
 * - off track: a week finished off track or the current one is, several stuck checkpoints, or help dominating.
 */
export function readiness(input: ReadinessInput): Readiness {
  const byId = new Map(input.statuses.map((s) => [s.unit.id, s]))
  const core = CORE.map((d) => unitsDomain(d, byId))
  const foundations = unitsDomain({ id: 'foundations', title: 'Programming foundations', units: FOUNDATIONS }, byId)
  const problemSolving = unitsDomain({ id: 'problem-solving', title: 'Problem solving', units: PROBLEM_SOLVING }, byId)
  const coreReady = core.filter((d) => d.status === 'ready').length
  const coreStarted = core.filter((d) => d.status !== 'not-started').length
  const coreDomain: Domain = {
    id: 'core-dsa',
    title: 'Core DSA',
    units: core.flatMap((d) => d.units),
    status: coreReady === core.length ? 'ready' : coreStarted ? 'developing' : 'not-started',
    stale: core.some((d) => d.stale),
    why: coreStarted ? `${coreReady} of ${core.length} topics cleared cold.` : 'Starts in Week 2 (hashing) and Week 3 (pointers).',
  }
  const t = input.transfer
  const transferDomain: Domain = {
    id: 'transfer',
    title: 'Independent transfer',
    units: ['w13-transfer'],
    status: !t || t.attempted === 0 ? 'not-tested' : t.grade === 'green' ? 'ready' : t.grade === 'yellow' ? 'developing' : 'building',
    stale: false,
    why: !t || t.attempted === 0 ? 'Tested in Week 13, on unlabeled problems.' : `${t.independent} of ${t.attempted} unlabeled problems solved independently (${t.grade}).`,
  }
  const swe = labDomain('building', 'Software building', input.labs.filter((l) => !l.lab.aiFde && !l.lab.optional), 'software')
  const ai = labDomain('ai-fde', 'Applied Engineering (AI builds)', input.labs.filter((l) => l.lab.aiFde), 'AI')
  const interview: Domain = {
    id: 'interview',
    title: 'Interview execution',
    units: ['w14-interview'],
    status: input.mocksDone >= 2 ? 'ready' : input.mocksDone === 1 ? 'developing' : 'not-tested',
    stale: false,
    why: input.mocksDone ? `${input.mocksDone} mock${input.mocksDone === 1 ? '' : 's'} done.` : 'Mocks open in Week 14, once transfer evidence says they will be useful.',
  }
  const dimensions = [foundations, problemSolving, coreDomain, transferDomain, swe, ai, interview]

  const week = courseWeekOf(input.today)
  const frontier = input.statuses.find((s) => s.state !== 'ready' && s.state !== 'maintenance')
  const behindWeeks = frontier ? Math.max(0, week - frontier.unit.week) : 0
  const blocked = input.statuses.filter((s) => s.state === 'gate-blocked').length
  const last = input.finishedWeeks[input.finishedWeeks.length - 1]
  const cold = input.evidence.coldIndependent + input.evidence.retrieval + input.evidence.selfCorrected + input.evidence.outsideCold
  const why: string[] = []
  let track: Track = 'on-track'
  if (last === 'off-track' || input.currentWeek === 'off-track' || behindWeeks >= 2 || blocked >= 3 || input.evidence.recentAssistance > 0.6) track = 'off-track'
  else if (last === 'recoverable' || input.currentWeek === 'recoverable' || behindWeeks === 1 || blocked >= 1 || input.evidence.recentAssistance > 0.4 || (week >= 4 && cold === 0)) track = 'at-risk'
  if (input.currentWeek === 'off-track') why.push('This week is off track: required work is behind.')
  else if (input.currentWeek === 'recoverable') why.push('This week is a little short: recoverable.')
  if (last && last !== 'complete' && last !== 'on-track') why.push(`Last week finished ${last === 'off-track' ? 'off track' : 'short'}.`)
  if (behindWeeks) why.push(`The course is ${behindWeeks} week${behindWeeks === 1 ? '' : 's'} behind the calendar.`)
  if (blocked) why.push(`${blocked} unit${blocked === 1 ? '' : 's'} waiting on a repaired checkpoint.`)
  if (input.evidence.recentAssistance > 0.4) why.push(`${Math.round(input.evidence.recentAssistance * 100)}% of the last 10 days' work leaned on help.`)
  if (week >= 4 && cold === 0) why.push('No cold evidence yet: checkpoints and re-solves supply it.')
  if (!why.length) why.push('This week and last are on track, checkpoints are clearing, and help is in proportion.')
  return { track, dimensions, core, evidence: input.evidence, why }
}

export type FinalDecision = 'ready' | 'ready-with-gaps' | 'not-yet-ready'

/**
 * Feb 1: an interview-start checkpoint, decided on several kinds of evidence at
 * once. Applied AI/FDE never blocks a general SWE result.
 */
export function finalDecision(r: Readiness, grade: TransferGrade, mocksDone: number): FinalDecision {
  const dim = (id: string) => r.dimensions.find((d) => d.id === id)
  const basics = dim('foundations')?.status === 'ready' && dim('problem-solving')?.status === 'ready'
  const coreGaps = r.core.filter((d) => d.status !== 'ready').length
  if (grade === 'green' && mocksDone >= 1 && basics && coreGaps <= 1) return 'ready'
  if (grade !== 'red' && basics && coreGaps <= 4) return 'ready-with-gaps'
  return 'not-yet-ready'
}
