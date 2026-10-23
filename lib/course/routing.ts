import { GATE_BY_ID, GATE_OF_EXERCISE, type MasteryGate } from '@/data/course/gates'
import { UNITS, type LearningUnit } from '@/data/course/units'
import { gateClean, masteryEvidence } from '@/lib/course/credit'
import type { SkillMastery } from '@/lib/mastery'
import type { Attempt, Exercise } from '@/lib/types'

/**
 * Placement, gates and routing (REPS_2_MASTER_SPEC.md §11, §12, §43, §56).
 * Everything is derived from attempts: nothing is stored.
 *
 * - A unit is locked until every prerequisite unit is ready. The calendar never
 *   overrides that: dependency order may not slide.
 * - A unit with earlier evidence starts with its gate (placement). Passing it
 *   skips the teaching; failing it routes a focused path.
 * - A failed gate is diagnostic: 2–4 repair reps on the skills the failure
 *   touched, then a different variant. The exact failed rep is not next.
 */

export type UnitState = 'unseen' | 'placement' | 'learning' | 'practicing' | 'gate-blocked' | 'ready' | 'maintenance'
export type Route = 'full' | 'focused' | 'maintenance'

export interface GateStatus {
  gate: MasteryGate
  cleared: boolean
  clearedOn?: string
  /** Variants passed to the clean standard. */
  clean: string[]
  /** The latest gate attempt was not clean (and the gate is not cleared). */
  failed: boolean
  failedRep?: string
  failedAt?: string
  /** Repair reps still to do before the next variant. */
  repair: string[]
  /** The next variants to offer, in order, as many as are still needed. */
  next: string[]
  /** Pool reps that exist yet (content can arrive later). */
  available: string[]
  attempted: boolean
}

export interface UnitStatus {
  unit: LearningUnit
  state: UnitState
  route: Route
  locked: boolean
  blockedBy: string[]
  /** The path for this route, gate variants excluded. */
  path: Exercise[]
  done: number
  total: number
  gates: GateStatus[]
  /** Earlier production evidence on this unit's material. */
  priorEvidence: boolean
}

export interface CourseContext {
  attempts: Attempt[]
  mastery: Record<string, SkillMastery>
  exercises: Record<string, Exercise>
  /** Sections by id (October modules, packs and course content). */
  sections: Record<string, { exercises: Exercise[] }>
  today: string
}

const time = (a: Attempt) => a.completedAt ?? a.startedAt
const LESSON_LEVEL: Exercise['stage'][] = ['recognize', 'trace', 'recall', 'complete']
const REPAIR_STAGES: Exercise['stage'][] = ['microbuild', 'debug', 'combine', 'reconstruct', 'recall', 'complete']

function passedIds(attempts: Attempt[]): Set<string> {
  return new Set(attempts.filter((a) => a.passed && a.completedAt && !a.solutionViewed).map((a) => a.exerciseId))
}

export function unitReps(unit: LearningUnit, ctx: CourseContext): Exercise[] {
  return unit.sections.flatMap((id) => ctx.sections[id]?.exercises ?? []).filter((e) => !GATE_OF_EXERCISE[e.id])
}

/**
 * A gate's status from the attempts on its variants. Repairs come from the
 * unit's own reps on the skills the failed variant trains (2–4 of them).
 */
export function gateStatus(gate: MasteryGate, ctx: CourseContext): GateStatus {
  const available = gate.pool.filter((id) => ctx.exercises[id])
  const tries = ctx.attempts.filter((a) => gate.pool.includes(a.exerciseId) && (a.completedAt || a.attemptsBeforePass > 0)).sort((x, y) => time(x).localeCompare(time(y)))
  const clean: string[] = []
  let clearedOn: string | undefined
  for (const a of tries) {
    if (gateClean(a, ctx.attempts) && !clean.includes(a.exerciseId)) {
      clean.push(a.exerciseId)
      if (clean.length >= gate.need && !clearedOn) clearedOn = a.date
    }
  }
  const cleared = clean.length >= Math.min(gate.need, Math.max(1, available.length)) && clean.length > 0
  const last = tries[tries.length - 1]
  const failed = !cleared && Boolean(last) && !gateClean(last, ctx.attempts)
  let repair: string[] = []
  if (failed && last) {
    const broken = new Set((ctx.exercises[last.exerciseId]?.skills ?? []).filter((s) => gate.skills.includes(s)))
    const unit = UNITS.find((u) => u.id === gate.unitId)
    const pool = unit ? [...unitReps(unit, ctx), ...(unit.optional ?? []).flatMap((id) => ctx.sections[id]?.exercises ?? [])] : []
    const fresh = (id: string) => ctx.attempts.some((a) => a.exerciseId === id && a.passed && a.completedAt && !a.solutionViewed && time(a) > time(last))
    const candidates = pool.filter((e) => REPAIR_STAGES.includes(e.stage) && e.kind === 'code' && e.skills.some((s) => broken.has(s) || (!broken.size && gate.skills.includes(s))))
    // The smallest broken skill first: shorter, easier reps before combined ones.
    const ranked = [...candidates].sort((a, b) => a.difficulty - b.difficulty || a.minutes - b.minutes).slice(0, 3)
    repair = ranked.filter((e) => !fresh(e.id)).map((e) => e.id)
  }
  // The next variants: never-tried first, then the least recently tried, never the one that just failed (unless it is the only one left).
  const lastTry = new Map<string, string>()
  for (const a of tries) lastTry.set(a.exerciseId, time(a))
  const remaining = available.filter((id) => !clean.includes(id))
  const ordered = [...remaining].sort((a, b) => (lastTry.get(a) ?? '').localeCompare(lastTry.get(b) ?? '') || available.indexOf(a) - available.indexOf(b))
  const notLastFailed = ordered.filter((id) => !(failed && id === last?.exerciseId))
  const queue = notLastFailed.length ? notLastFailed : ordered
  const still = Math.max(0, gate.need - clean.length)
  return {
    gate,
    cleared,
    clearedOn,
    clean,
    failed,
    failedRep: failed ? last?.exerciseId : undefined,
    failedAt: failed && last ? time(last) : undefined,
    repair,
    next: cleared ? [] : queue.slice(0, still),
    available,
    attempted: tries.length > 0,
  }
}

/** Earlier production evidence: a good share of the path already passed, or the unit's skills already practised. */
function priorEvidence(unit: LearningUnit, path: Exercise[], passed: Set<string>, ctx: CourseContext): boolean {
  if (path.length && path.filter((e) => passed.has(e.id)).length / path.length >= 0.4) return true
  const skills = unit.retrievalSkills.map((s) => ctx.mastery[s]).filter(Boolean)
  return skills.length > 0 && skills.every((m) => m.attempts >= 3 && m.score >= 45 && !m.recognitionOnly)
}

/** Every unit's status, in teaching order. */
export function courseStatus(ctx: CourseContext): UnitStatus[] {
  const passed = passedIds(ctx.attempts)
  const out: UnitStatus[] = []
  const byId = new Map<string, UnitStatus>()
  for (const unit of UNITS) {
    const full = unitReps(unit, ctx)
    const gates = unit.gateIds.map((id) => GATE_BY_ID[id]).filter(Boolean).map((g) => gateStatus(g, ctx))
    const liveGates = gates.filter((g) => g.available.length > 0)
    const prior = priorEvidence(unit, full, passed, ctx)
    const anyGateFailed = liveGates.some((g) => g.failed)
    const gatesCleared = liveGates.length > 0 && liveGates.every((g) => g.cleared)
    const pathDone = full.every((e) => passed.has(e.id))
    const blockedBy = unit.prerequisites.filter((p) => {
      const s = byId.get(p)
      return !s || (s.state !== 'ready' && s.state !== 'maintenance')
    })
    // A unit with no gate is ready once its path is done (a unit with nothing in it yet has nothing to wait for).
    const ready = liveGates.length ? gatesCleared : pathDone
    const route: Route = ready ? 'maintenance' : prior || anyGateFailed ? 'focused' : 'full'
    // A focused route skips the lesson-level reps (tracing, recognising) when there is production evidence already.
    const path = route === 'focused' ? full.filter((e) => !LESSON_LEVEL.includes(e.stage) || passed.has(e.id)) : full
    const done = path.filter((e) => passed.has(e.id)).length
    const touched = ctx.attempts.some((a) => full.some((e) => e.id === a.exerciseId) || unit.gateIds.some((g) => GATE_BY_ID[g]?.pool.includes(a.exerciseId)))
    const lastActive = ctx.attempts.filter((a) => full.some((e) => e.id === a.exerciseId) || unit.gateIds.some((g) => GATE_BY_ID[g]?.pool.includes(a.exerciseId))).map((a) => a.date).sort().pop()
    let state: UnitState
    if (ready) state = lastActive && daysBefore(lastActive, ctx.today) > 14 ? 'maintenance' : 'ready'
    else if (anyGateFailed) state = 'gate-blocked'
    else if (prior && liveGates.length && !liveGates.some((g) => g.attempted)) state = 'placement'
    else if (!touched) state = 'unseen'
    else state = done / Math.max(1, path.length) < 0.5 ? 'learning' : 'practicing'
    const s: UnitStatus = { unit, state, route, locked: blockedBy.length > 0, blockedBy, path, done, total: path.length, gates, priorEvidence: prior }
    out.push(s)
    byId.set(unit.id, s)
  }
  return out
}

function daysBefore(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

export type QueuePurpose = 'learn' | 'guided' | 'drill' | 'combine' | 'transfer' | 'gate' | 'repair' | 'capstone' | 'problem'

export interface CourseQueueItem {
  key: string
  unitId: string
  purpose: QueuePurpose
  exerciseId?: string
  lc?: number
  gateId?: string
}

function purposeOf(e: Exercise): QueuePurpose {
  if (e.repType === 'capstone') return 'capstone'
  if (e.transfer || e.stage === 'pattern') return 'transfer'
  if (LESSON_LEVEL.includes(e.stage)) return 'learn'
  if (e.stage === 'combine' || e.stage === 'reconstruct') return 'combine'
  if (e.repType === 'cold' || e.stage === 'retrieval') return 'gate'
  return 'drill'
}

/**
 * The course queue: what the course asks for next, in order. Units outside the
 * window (more than a week past the earliest unfinished unit) wait, so working
 * ahead never skips foundations. Locked units contribute nothing.
 * `solvedLc` are LeetCode numbers already solved (logged as new, or the capstone passed).
 */
export function courseQueue(statuses: UnitStatus[], ctx: CourseContext, solvedLc: Set<number>): CourseQueueItem[] {
  const passed = passedIds(ctx.attempts)
  const frontier = statuses.find((s) => s.state !== 'ready' && s.state !== 'maintenance')
  const horizon = (frontier?.unit.week ?? 14) + 1
  const out: CourseQueueItem[] = []
  for (const s of statuses) {
    if (s.unit.week > horizon || s.locked) continue
    const { unit } = s
    if (s.state === 'placement') {
      for (const g of s.gates) for (const id of g.next) out.push({ key: id, unitId: unit.id, purpose: 'gate', exerciseId: id, gateId: g.gate.id })
      continue
    }
    if (s.state !== 'ready' && s.state !== 'maintenance') {
      for (const g of s.gates) for (const id of g.repair) out.push({ key: id, unitId: unit.id, purpose: 'repair', exerciseId: id, gateId: g.gate.id })
      for (const e of s.path) if (!passed.has(e.id)) out.push({ key: e.id, unitId: unit.id, purpose: purposeOf(e), exerciseId: e.id })
      // Gates once the path is done; a failed gate's next variant only after its repairs.
      if (s.path.every((e) => passed.has(e.id)))
        for (const g of s.gates) if (!g.repair.length) for (const id of g.next) out.push({ key: id, unitId: unit.id, purpose: 'gate', exerciseId: id, gateId: g.gate.id })
    }
    // Targets: after the unit is ready (or its path is done, for units without gates).
    const open = s.state === 'ready' || s.state === 'maintenance' || (!s.gates.length && s.path.every((e) => passed.has(e.id)))
    if (open) for (const lc of [...unit.targets, ...(unit.readinessTargets ?? [])]) if (!solvedLc.has(lc)) out.push({ key: `lc:${lc}:new`, unitId: unit.id, purpose: 'problem', lc })
  }
  // A rep can sit in two units (shared sections): keep the first.
  const seen = new Set<string>()
  return out.filter((x) => !seen.has(x.key) && seen.add(x.key))
}

/** How a pass on a gate variant counts, for the gate card. */
export function gateEvidence(a: Attempt, attempts: Attempt[]) {
  return masteryEvidence(a, attempts)
}
