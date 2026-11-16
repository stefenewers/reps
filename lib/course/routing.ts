import { COURSE_START } from '@/data/course/calendar'
import { GATE_BY_ID, GATE_OF_EXERCISE, type MasteryGate } from '@/data/course/gates'
import { BIG_TECH_PACK, SPRINT_LABS, SPRINT_PATHS, SPRINT_PREREQS, SPRINT_START, SPRINT_UNITS, isBigTech, isSprintUnit } from '@/data/course/sprint'
import { UNITS, type LearningUnit } from '@/data/course/units'
import { gateClean, masteryEvidence, validAttempt } from '@/lib/course/credit'
import type { SkillMastery } from '@/lib/mastery'
import type { Attempt, Exercise } from '@/lib/types'

/**
 * Placement, gates and routing (REPS_2_MASTER_SPEC.md §11, §12, §43, §56;
 * REPS_2_1_SPEC.md §8). Everything is derived from attempts: nothing is stored.
 *
 * - A unit's REQUIRED PATH is curated (data/course/units.ts `path`): small enough
 *   that the week's required work fits its target. Everything else in the unit's
 *   sections is repair inventory and optional practice, never required.
 * - A unit is locked until every prerequisite unit is ready. The calendar never
 *   overrides that: dependency order may not slide.
 * - A unit with earlier evidence starts with its gate (placement). Passing it
 *   skips the teaching, however many variants that takes; failing any variant
 *   routes repair, then the path's unpassed reps.
 * - A failed gate is diagnostic: 2–4 repair reps on the skills the failure
 *   touched, then a different variant. The exact failed rep is not next.
 * - A unit with a gate is ready when the gate is cleared; without one, when its
 *   path is passed. (There is no hidden filtering that could make a unit unfinishable.)
 */

export type UnitState = 'unseen' | 'placement' | 'learning' | 'practicing' | 'gate-blocked' | 'ready' | 'maintenance'
export type Route = 'full' | 'placement' | 'maintenance'

export interface GateStatus {
  gate: MasteryGate
  cleared: boolean
  clearedOn?: string
  /** Variants passed to the clean standard. */
  clean: string[]
  /** The latest gate attempt was not clean (and the gate is not cleared). */
  failed: boolean
  /** Some attempt on it was not clean, even if a later one was. */
  everFailed: boolean
  failedRep?: string
  failedAt?: string
  /** The local date of that failure. */
  failedOn?: string
  /** Repair reps still to do before the next variant. */
  repair: string[]
  /** Every repair rep chosen for the last failure (done or not). */
  repairPlan: string[]
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
  /** The unit's required path (curated), gate variants excluded. */
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

/** Before the Sprint: the course's units exactly as defined (no sprint-only units). */
const PRE_SPRINT_UNITS = UNITS.filter((u) => !u.sprintOnly)
/** From SPRINT_START: every unit, with the sprint's prerequisites, paths and labs laid over units.ts (which is untouched). */
const SPRINT_OVERLAY_UNITS = UNITS.map((u) =>
  SPRINT_PREREQS[u.id] || SPRINT_PATHS[u.id] || SPRINT_LABS[u.id]
    ? { ...u, prerequisites: SPRINT_PREREQS[u.id] ?? u.prerequisites, path: SPRINT_PATHS[u.id] ?? u.path, labIds: SPRINT_LABS[u.id] ?? u.labIds }
    : u
)
const SPRINT_RANK = new Map<string, number>(SPRINT_UNITS.map((id, i) => [id, i]))

/** The units in force on a date (computation order: prerequisites first). Dates before SPRINT_START see units.ts unchanged. */
export function unitsOn(today: string): LearningUnit[] {
  return today >= SPRINT_START ? SPRINT_OVERLAY_UNITS : PRE_SPRINT_UNITS
}

/** From SPRINT_START the teaching order is: weeks 1–3, then the sprint list in its order, then everything else (big-tech pack, DP, transfer). */
function sprintOrder(statuses: UnitStatus[]): UnitStatus[] {
  const group = (s: UnitStatus) => (s.unit.week <= 3 && !s.unit.sprintOnly ? 0 : SPRINT_RANK.has(s.unit.id) ? 1 : 2)
  return statuses
    .map((s, i) => ({ s, i }))
    .sort((a, b) => group(a.s) - group(b.s) || (SPRINT_RANK.get(a.s.unit.id) ?? 0) - (SPRINT_RANK.get(b.s.unit.id) ?? 0) || a.i - b.i)
    .map((x) => x.s)
}
const LESSON_LEVEL: Exercise['stage'][] = ['recognize', 'trace', 'recall', 'complete']
const REPAIR_STAGES: Exercise['stage'][] = ['microbuild', 'debug', 'combine', 'reconstruct', 'recall', 'complete']

/** Attempts grouped by rep, once per computation (routing runs for past days too, so it has to be cheap). */
function byExercise(attempts: Attempt[]): Map<string, Attempt[]> {
  const m = new Map<string, Attempt[]>()
  for (const a of attempts) {
    const xs = m.get(a.exerciseId)
    if (xs) xs.push(a)
    else m.set(a.exerciseId, [a])
  }
  return m
}

function passedIds(attempts: Attempt[]): Set<string> {
  return new Set(attempts.filter((a) => a.passed && a.completedAt && !a.solutionViewed).map((a) => a.exerciseId))
}

/** Every rep of a unit's sections except gate variants: path plus inventory (used by audits and repair). */
export function unitReps(unit: LearningUnit, ctx: Pick<CourseContext, 'sections'>): Exercise[] {
  return unit.sections.flatMap((id) => ctx.sections[id]?.exercises ?? []).filter((e) => !GATE_OF_EXERCISE[e.id])
}

/** The unit's REQUIRED PATH, in order: the curated `path` ids. */
export function unitPath(unit: LearningUnit, ctx: Pick<CourseContext, 'sections' | 'exercises'>): Exercise[] {
  if (unit.path) return unit.path.map((id) => ctx.exercises[id]).filter((e): e is Exercise => Boolean(e))
  return unitReps(unit, ctx)
}

/** Repair inventory: the unit's other reps (sections and optional sections), never required. */
export function unitInventory(unit: LearningUnit, ctx: Pick<CourseContext, 'sections' | 'exercises'>): Exercise[] {
  const path = new Set(unitPath(unit, ctx).map((e) => e.id))
  return [...unit.sections, ...(unit.optional ?? [])]
    .flatMap((id) => ctx.sections[id]?.exercises ?? [])
    .filter((e) => !GATE_OF_EXERCISE[e.id] && !path.has(e.id) && !unit.deferred?.includes(e.id))
}

/**
 * A gate's status from the attempts on its variants. Repairs come from the
 * unit's own reps (path and inventory) on the skills the failed variant trains.
 */
export function gateStatus(gate: MasteryGate, ctx: CourseContext, index: Map<string, Attempt[]> = byExercise(ctx.attempts)): GateStatus {
  const available = gate.pool.filter((id) => ctx.exercises[id])
  const tries = gate.pool
    .flatMap((id) => index.get(id) ?? [])
    .filter((a) => a.completedAt || a.attemptsBeforePass > 0)
    .sort((x, y) => time(x).localeCompare(time(y)))
  const clean: string[] = []
  let clearedOn: string | undefined
  for (const a of tries) {
    if (gateClean(a, index.get(a.exerciseId) ?? []) && !clean.includes(a.exerciseId)) {
      clean.push(a.exerciseId)
      if (clean.length >= Math.min(gate.need, Math.max(1, available.length)) && !clearedOn) clearedOn = a.date
    }
  }
  const cleared = Boolean(clearedOn)
  const last = tries[tries.length - 1]
  const failed = !cleared && Boolean(last) && !gateClean(last, index.get(last.exerciseId) ?? [])
  const everFailed = tries.some((a) => !gateClean(a, index.get(a.exerciseId) ?? []))
  let repair: string[] = []
  let repairPlan: string[] = []
  if (failed && last) {
    const broken = new Set((ctx.exercises[last.exerciseId]?.skills ?? []).filter((s) => gate.skills.includes(s)))
    const unit = unitsOn(ctx.today).find((u) => u.id === gate.unitId)
    const pool = unit ? [...unitPath(unit, ctx), ...unitInventory(unit, ctx)] : []
    const fresh = (id: string) => (index.get(id) ?? []).some((a) => a.passed && a.completedAt && !a.solutionViewed && time(a) > time(last))
    const candidates = pool.filter(
      (e) => REPAIR_STAGES.includes(e.stage) && e.kind === 'code' && e.skills.some((s) => broken.has(s) || (!broken.size && gate.skills.includes(s)))
    )
    // The smallest broken skill first: shorter, easier reps before combined ones. At least two, at most three.
    const ranked = [...new Map(candidates.map((e) => [e.id, e])).values()].sort((a, b) => a.difficulty - b.difficulty || a.minutes - b.minutes).slice(0, 3)
    repairPlan = ranked.map((e) => e.id)
    repair = ranked.filter((e) => !fresh(e.id)).map((e) => e.id)
  }
  // The next variants: never-tried first, then the least recently tried, never the one that just failed (unless it is the only one left).
  const lastTry = new Map<string, string>()
  for (const a of tries) lastTry.set(a.exerciseId, time(a))
  const remaining = available.filter((id) => !clean.includes(id))
  const ordered = [...remaining].sort((a, b) => (lastTry.get(a) ?? '').localeCompare(lastTry.get(b) ?? '') || available.indexOf(a) - available.indexOf(b))
  const notLastFailed = ordered.filter((id) => !(failed && id === last?.exerciseId))
  const queue = notLastFailed.length ? notLastFailed : ordered
  const still = Math.max(0, Math.min(gate.need, available.length) - clean.length)
  return {
    gate,
    cleared,
    clearedOn,
    clean,
    failed,
    everFailed,
    failedRep: failed ? last?.exerciseId : undefined,
    failedAt: failed && last ? time(last) : undefined,
    failedOn: failed && last ? last.date : undefined,
    repair,
    repairPlan,
    next: cleared ? [] : queue.slice(0, still),
    available,
    attempted: tries.length > 0
  }
}

/** Earlier production evidence: a good share of the path already passed, or the unit's skills already practised. */
function priorEvidence(unit: LearningUnit, path: Exercise[], passed: Set<string>, ctx: CourseContext): boolean {
  if (path.length && path.filter((e) => passed.has(e.id)).length / path.length >= 0.4) return true
  const skills = unit.retrievalSkills.map((s) => ctx.mastery[s]).filter((m) => m && m.lastPracticed && m.lastPracticed.slice(0, 10) < COURSE_START)
  return skills.length > 0 && skills.every((m) => m.attempts >= 3 && m.score >= 45 && !m.recognitionOnly)
}

/** Every unit's status, in teaching order. */
export function courseStatus(ctx: CourseContext): UnitStatus[] {
  ctx = { ...ctx, attempts: ctx.attempts.filter((a) => validAttempt(a) && a.date <= ctx.today) }
  const passed = passedIds(ctx.attempts)
  const index = byExercise(ctx.attempts)
  const out: UnitStatus[] = []
  const byId = new Map<string, UnitStatus>()
  for (const unit of unitsOn(ctx.today)) {
    const path = unitPath(unit, ctx)
    const gates = unit.gateIds
      .map((id) => GATE_BY_ID[id])
      .filter(Boolean)
      .map((g) => gateStatus(g, ctx, index))
    const liveGates = gates.filter((g) => g.available.length > 0)
    const prior = priorEvidence(unit, path, passedIds(ctx.attempts.filter((a) => a.date < COURSE_START)), ctx)
    const anyGateFailed = liveGates.some((g) => g.failed)
    const gatesCleared = liveGates.length > 0 && liveGates.every((g) => g.cleared)
    const pathDone = path.every((e) => passed.has(e.id))
    const blockedBy = unit.prerequisites.filter((p) => {
      const s = byId.get(p)
      return !s || (s.state !== 'ready' && s.state !== 'maintenance')
    })
    const ready = blockedBy.length === 0 && (liveGates.length ? gatesCleared : pathDone)
    // Placement holds while its variants are passed clean (one of two passed is still placement); a slip routes the full path.
    const placement = !ready && prior && liveGates.length > 0 && !liveGates.some((g) => g.everFailed)
    const route: Route = ready ? 'maintenance' : placement ? 'placement' : 'full'
    const done = path.filter((e) => passed.has(e.id)).length
    const ids = new Set([...path.map((e) => e.id), ...unit.gateIds.flatMap((g) => GATE_BY_ID[g]?.pool ?? [])])
    let lastActive = ''
    for (const id of ids) for (const a of index.get(id) ?? []) if (a.date > lastActive) lastActive = a.date
    let state: UnitState
    if (ready) state = lastActive && daysBefore(lastActive, ctx.today) > 14 ? 'maintenance' : 'ready'
    else if (anyGateFailed) state = 'gate-blocked'
    else if (placement) state = 'placement'
    else if (!lastActive) state = 'unseen'
    else state = done / Math.max(1, path.length) < 0.5 ? 'learning' : 'practicing'
    const s: UnitStatus = { unit, state, route, locked: blockedBy.length > 0, blockedBy, path, done, total: path.length, gates, priorEvidence: prior }
    out.push(s)
    byId.set(unit.id, s)
  }
  return ctx.today >= SPRINT_START ? sprintOrder(out) : out
}

/**
 * The units to teach when the course is behind the calendar: every unit from an
 * earlier week, or scheduled on an earlier day (`scheduledBefore`), that still has
 * path reps to learn, in teaching order. A unit whose path is done and only waits
 * on its (cold) checkpoint has nothing left to teach.
 */
/** The big-tech pack, for callers that label it. */
export const BIG_TECH_UNITS: readonly string[] = BIG_TECH_PACK

export function catchUpUnits(statuses: UnitStatus[], week: number, scheduledBefore: Set<string> = new Set()): LearningUnit[] {
  return statuses
    .filter(
      (s) =>
        !s.locked &&
        (s.unit.week < week || scheduledBefore.has(s.unit.id)) &&
        s.state !== 'ready' &&
        s.state !== 'maintenance' &&
        s.route !== 'placement' &&
        s.done < s.total
    )
    .map((s) => s.unit)
}

function daysBefore(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

export type QueuePurpose = 'learn' | 'guided' | 'drill' | 'combine' | 'transfer' | 'retrieve' | 'gate' | 'repair' | 'capstone' | 'problem' | 'extra'

export interface CourseQueueItem {
  key: string
  unitId: string
  purpose: QueuePurpose
  exerciseId?: string
  lc?: number
  gateId?: string
  /** Required by the course (path, gate, repair, required target). Extras are optional practice. */
  required: boolean
}

/** What a path rep is for. Only true gate variants are checkpoints. */
export function purposeOf(e: Exercise): QueuePurpose {
  if (GATE_OF_EXERCISE[e.id]) return 'gate'
  if (e.repType === 'capstone') return 'capstone'
  if (e.transfer || e.stage === 'pattern' || e.stage === 'interview') return 'transfer'
  if (LESSON_LEVEL.includes(e.stage)) return 'learn'
  if (e.stage === 'combine' || e.stage === 'reconstruct') return 'combine'
  if (e.repType === 'cold' || e.stage === 'retrieval') return 'retrieve'
  return 'drill'
}

/**
 * The course queue: what the course asks for next, in order, required work
 * first, then optional practice (extras) for days when the required work runs
 * out. Units more than a week past the earliest unfinished unit wait, so working
 * ahead never skips foundations. Locked units contribute nothing.
 * `solvedLc` are LeetCode numbers already solved (credited outside, or the capstone passed).
 */
export function courseQueue(statuses: UnitStatus[], ctx: CourseContext, solvedLc: Set<number>): CourseQueueItem[] {
  const passed = passedIds(ctx.attempts)
  const frontier = statuses.find((s) => s.state !== 'ready' && s.state !== 'maintenance')
  const horizon = (frontier?.unit.week ?? 14) + 1
  // From SPRINT_START the horizon is the sprint list: its units may be required; the big-tech pack only offers extras; the rest waits.
  const sprint = ctx.today >= SPRINT_START
  const out: CourseQueueItem[] = []
  const extras: CourseQueueItem[] = []
  for (const s of statuses) {
    if (s.locked) continue
    const ready = s.state === 'ready' || s.state === 'maintenance'
    if (sprint ? !ready && !isSprintUnit(s.unit.id) && !isBigTech(s.unit.id) : s.unit.week > horizon) continue
    const { unit } = s
    if (sprint && isBigTech(unit.id) && !ready) {
      for (const e of [...s.path, ...unitInventory(unit, ctx)])
        if (!passed.has(e.id) && e.kind !== 'choice' && e.kind !== 'explain') extras.push({ key: e.id, unitId: unit.id, purpose: 'extra', exerciseId: e.id, required: false })
      continue
    }
    if (s.state === 'placement') {
      for (const g of s.gates)
        for (const id of g.next) out.push({ key: id, unitId: unit.id, purpose: 'gate', exerciseId: id, gateId: g.gate.id, required: true })
    } else if (s.state !== 'ready' && s.state !== 'maintenance') {
      for (const g of s.gates)
        for (const id of g.repair) out.push({ key: id, unitId: unit.id, purpose: 'repair', exerciseId: id, gateId: g.gate.id, required: true })
      for (const e of s.path) if (!passed.has(e.id)) out.push({ key: e.id, unitId: unit.id, purpose: purposeOf(e), exerciseId: e.id, required: true })
      // Gates once the path is done; a failed gate's next variant only after its repairs.
      if (s.path.every((e) => passed.has(e.id)))
        for (const g of s.gates)
          if (!g.repair.length)
            for (const id of g.next) out.push({ key: id, unitId: unit.id, purpose: 'gate', exerciseId: id, gateId: g.gate.id, required: true })
    }
    // Required targets: once the unit is ready. Readiness targets and inventory are optional practice.
    const open = s.state === 'ready' || s.state === 'maintenance'
    if (open) for (const lc of unit.targets) if (!solvedLc.has(lc)) out.push({ key: `lc:${lc}:new`, unitId: unit.id, purpose: 'problem', lc, required: true })
    if (open)
      for (const lc of unit.readinessTargets ?? [])
        if (!solvedLc.has(lc)) extras.push({ key: `lc:${lc}:new`, unitId: unit.id, purpose: 'problem', lc, required: false })
    if (!s.locked)
      for (const e of unitInventory(unit, ctx))
        if (!passed.has(e.id) && e.kind !== 'choice' && e.kind !== 'explain')
          extras.push({ key: e.id, unitId: unit.id, purpose: 'extra', exerciseId: e.id, required: false })
  }
  // A rep can sit in two units (shared sections): keep the first. Required work always comes before extras.
  const seen = new Set<string>()
  return [...out, ...extras].filter((x) => !seen.has(x.key) && seen.add(x.key))
}

/** How a pass on a gate variant counts, for the gate card. */
export function gateEvidence(a: Attempt, attempts: Attempt[]) {
  return masteryEvidence(a, attempts)
}
