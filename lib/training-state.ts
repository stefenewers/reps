import type { BuildingBlock } from '@/data/exercises/bridges/types'
import { readiness, type Target } from '@/lib/bridges'
import { daysBetween } from '@/lib/dates'
import type { SkillMastery } from '@/lib/mastery'
import type { Attempt, Exercise, SkillId, Stage } from '@/lib/types'

/**
 * Training state: what kind of practice would help most right now.
 *
 * It does not replace mastery. Mastery answers "what has been demonstrated,
 * historically?" and never decays. Training state answers "what should the
 * next rep be for?", and freshness answers "is this available today, or should
 * it be warmed up before it is relied on?". All three are derived from the
 * attempt history; none is stored.
 *
 *   learn    → little or no productive evidence: understand it, then type it
 *   drill    → understood but not automatic: many small productions
 *   combine  → the pieces exist; integrate them (ladder combines, bridges)
 *   prove    → every building block is in place: the target problem, a check
 *   maintain → already proven: keep it, with spaced retrieval
 */
export type TrainingState = 'learn' | 'drill' | 'combine' | 'prove' | 'maintain'

export const TRAINING_LABEL: Record<TrainingState | 'reactivate', string> = { reactivate: 'Reactivate', learn: 'Learn', drill: 'Drill', combine: 'Combine', prove: 'Prove', maintain: 'Maintain' }

/** Stages that only show recognition: reading, tracing, picking an option. */
const PASSIVE: Stage[] = ['recognize', 'trace']

/** What counts as meaningful production: a passed attempt where code was written, fixed, rebuilt or combined. */
export function isProductive(a: Pick<Attempt, 'passed' | 'completedAt' | 'stage'>): boolean {
  return a.passed && Boolean(a.completedAt) && !PASSIVE.includes(a.stage)
}

export interface SkillPractice {
  /** Local date of the last productive pass. */
  last: string | null
  /** Productive passes, ever. */
  productive: number
  /** Clean cold productive passes, ever: each one lengthens how long the skill stays fresh. */
  cleanCold: number
}

/** Per skill: when it was last produced, and how well it has survived cold. */
export function practiceBySkill(attempts: Attempt[]): Map<SkillId, SkillPractice> {
  const out = new Map<SkillId, SkillPractice>()
  for (const a of attempts) {
    if (!isProductive(a)) continue
    const clean = a.attemptsBeforePass === 0 && a.hintsUsed === 0 && !a.solutionViewed
    for (const s of a.skills) {
      const p = out.get(s) ?? { last: null, productive: 0, cleanCold: 0 }
      p.productive++
      if (!p.last || a.date > p.last) p.last = a.date
      if (clean && a.retrievalType === 'cold') p.cleanCold++
      out.set(s, p)
    }
  }
  return out
}

/** Days a skill stays fresh after its last productive pass: longer with every clean cold rep behind it. */
export const FRESH_DAYS = [3, 6, 12, 21, 30] as const

export type Freshness = 'unpracticed' | 'fresh' | 'stale'

/**
 * Freshness is about today, not about history. Opening the app, watching a
 * video or answering a multiple-choice question never refreshes a skill:
 * only producing it does.
 */
export function freshnessOf(p: SkillPractice | undefined, today: string): Freshness {
  if (!p?.last) return 'unpracticed'
  return daysBetween(p.last, today) <= FRESH_DAYS[Math.min(p.cleanCold, FRESH_DAYS.length - 1)] ? 'fresh' : 'stale'
}

/** The training state of one skill. (Combine and prove belong to targets and reps, not to a single skill.) */
export function skillTrainingState(m: SkillMastery | undefined, p: SkillPractice | undefined): Extract<TrainingState, 'learn' | 'drill' | 'maintain'> {
  if (!p?.productive || !m || m.recognitionOnly) return 'learn'
  const owned = (m.status === 'fluent' || m.status === 'competent') && m.coldCorrect > 0
  return owned ? 'maintain' : 'drill'
}

export interface TrainingContext {
  passed: Set<string>
  mastery: Record<SkillId, SkillMastery>
  practice: Map<SkillId, SkillPractice>
  today: string
  /** Strong evidence for a skill (lib/bridges `isStrong`). */
  strong: (skill: SkillId) => boolean
}

export interface TargetTraining {
  state: TrainingState
  /** Building blocks demonstrated, historically. */
  learned: number
  /** Of those, the ones that are also fresh: available today without warming up. */
  readyToday: number
  total: number
  /** Learned blocks whose skills have gone stale. */
  stale: BuildingBlock[]
  staleSkills: SkillId[]
  nextRep: string | null
}

/** A learned block is ready today when none of its skills is stale. */
export function blockIsFresh(block: BuildingBlock, ctx: Pick<TrainingContext, 'practice' | 'today'>): boolean {
  return block.skills.every((s) => freshnessOf(ctx.practice.get(s), ctx.today) !== 'stale')
}

/**
 * Where a target problem stands.
 * - already solved once → maintain
 * - every block learned → prove (its `stale` blocks are warmed up first)
 * - otherwise by the first block still missing: a ladder block whose skills
 *   have never been produced is learn; a ladder block is drill; a bridge block
 *   (the pieces exist, the combination does not) is combine.
 */
export function targetTraining(target: Pick<Target, 'blocks'>, solved: boolean, ctx: TrainingContext): TargetTraining {
  const r = readiness(target, ctx.passed, ctx.strong)
  const learnedBlocks = target.blocks.filter((_, i) => r.blocks[i].ready)
  const stale = learnedBlocks.filter((b) => !blockIsFresh(b, ctx))
  const staleSkills = [...new Set(stale.flatMap((b) => b.skills.filter((s) => freshnessOf(ctx.practice.get(s), ctx.today) === 'stale')))]
  const base = { learned: r.readyCount, readyToday: learnedBlocks.length - stale.length, total: r.total, stale, staleSkills, nextRep: r.nextRep }
  if (solved) return { ...base, state: 'maintain' }
  if (r.ready) return { ...base, state: 'prove' }
  const missing = target.blocks[r.blocks.findIndex((b) => !b.ready)]
  if (missing.reps?.length) return { ...base, state: 'combine' }
  const unseen = missing.skills.some((s) => skillTrainingState(ctx.mastery[s], ctx.practice.get(s)) === 'learn')
  return { ...base, state: unseen ? 'learn' : 'drill' }
}

/**
 * What a rep is for. A mastery check, a cold rep or a capstone proves; a bridge
 * rep or a combining rep combines; a trace or a guided rep on something never
 * produced teaches; everything else is a drill.
 */
export function repPurpose(e: Pick<Exercise, 'kind' | 'stage' | 'repType' | 'skills'>, where: { sectionId?: string; gate?: boolean }, ctx: Pick<TrainingContext, 'mastery' | 'practice'>): TrainingState {
  if (where.gate || e.repType === 'capstone' || e.repType === 'cold' || e.stage === 'retrieval' || e.repType === 'interview') return 'prove'
  if (where.sectionId?.startsWith('br-') || e.stage === 'combine' || e.stage === 'pattern' || e.repType === 'combine' || e.repType === 'pattern') return 'combine'
  const unseen = e.skills.some((s) => skillTrainingState(ctx.mastery[s], ctx.practice.get(s)) === 'learn')
  if (unseen && (e.kind === 'choice' || e.kind === 'output' || e.stage === 'complete' || PASSIVE.includes(e.stage))) return 'learn'
  return unseen && e.kind !== 'code' ? 'learn' : 'drill'
}

/**
 * First exposure: the skills of this rep that have never been produced. A rep that teaches (not a check, a
 * capstone, a cold rep or an unlabeled transfer problem) shows its concept BEFORE the question for these:
 * nobody should be judged on an idea Reps has not explained yet. Once a skill has been produced, the
 * teaching is no longer shown automatically; it stays one tap away behind Basics.
 */
export function firstExposure(e: Pick<Exercise, 'skills' | 'stage' | 'repType' | 'transfer' | 'cleanPass'>, practice: Map<SkillId, SkillPractice>): SkillId[] {
  if (e.repType === 'capstone' || e.repType === 'cold' || e.repType === 'interview' || e.stage === 'retrieval' || e.stage === 'capstone' || e.transfer || e.cleanPass) return []
  return e.skills.filter((s) => !(practice.get(s)?.productive ?? 0))
}

/**
 * How much scaffolding a rep carries, by what it is for. This is the rule the workspace and the
 * generated reps both follow: teaching shrinks as the skill is learned, and proving shows none.
 */
export const SCAFFOLDING: Record<TrainingState, { teach: boolean; brief: boolean; namesTechnique: boolean; summary: string }> = {
  learn: { teach: true, brief: true, namesTechnique: true, summary: 'Concept, mental model and a tiny example first; then a small production rep with every input defined.' },
  drill: { teach: false, brief: false, namesTechnique: true, summary: 'Short prompt, unambiguous contract. Repeated production, tracing, debugging and reconstruction.' },
  combine: { teach: false, brief: false, namesTechnique: true, summary: 'Two to four known moves together. Clear inputs, output, constraints and edge behaviour; less and less algorithmic instruction.' },
  prove: { teach: false, brief: false, namesTechnique: false, summary: 'A clean, interview-quality problem. The technique is not named: recognising it is the test.' },
  maintain: { teach: false, brief: false, namesTechnique: false, summary: 'Cold retrieval. Terse on purpose.' },
}

/**
 * The 90 days shift their weight: build first, then transfer, then execute.
 * The planner uses this for how much reactivation and maintenance a session
 * carries; learn and drill never disappear, they become repair loops.
 */
export function phaseEmphasis(planDay: number | undefined): { emphasis: (TrainingState | 'interview')[]; reactivate: number; maintain: number } {
  if (!planDay || planDay <= 30) return { emphasis: ['learn', 'drill', 'combine'], reactivate: 6, maintain: 3 }
  if (planDay <= 60) return { emphasis: ['combine', 'prove', 'maintain'], reactivate: 4, maintain: 4 }
  return { emphasis: ['prove', 'maintain', 'interview'], reactivate: 3, maintain: 5 }
}

// ── remediation ──────────────────────────────────────────────────────────────

export type RepairCategory = 'syntax' | 'python_api' | 'data_structure_operation' | 'pattern' | 'state_tracking' | 'boundary' | 'edge_case' | 'implementation'

export const REPAIR_LABEL: Record<RepairCategory, string> = {
  syntax: 'Python syntax',
  python_api: 'a Python operation',
  data_structure_operation: 'a data-structure operation',
  pattern: 'how the moves combine',
  state_tracking: 'tracking state through the loop',
  boundary: 'a boundary',
  edge_case: 'an edge case',
  implementation: 'the implementation',
}

export interface Failure {
  /** Python error names or messages from the failed runs, newest last. */
  errors: string[]
  /** Visible tests failed, hidden tests failed. */
  visibleFailed: number
  hiddenFailed: number
  /** A category already diagnosed (by the coach), if any. */
  diagnosed?: string
}

/**
 * The smallest likely thing that broke, from what the run reported. Coarse on
 * purpose: it only has to decide how far back to step.
 */
export function classifyFailure(e: Pick<Exercise, 'stage' | 'repType' | 'skills'>, f: Failure): RepairCategory {
  const known: Record<string, RepairCategory> = { 'python-syntax': 'syntax', 'python-api-recall': 'python_api', 'data-structure-usage': 'data_structure_operation', algorithm: 'pattern', 'state-management': 'state_tracking', 'edge-case': 'edge_case', syntax: 'syntax', api: 'python_api', python_api: 'python_api', data_structure: 'data_structure_operation', pattern: 'pattern', state: 'state_tracking', boundary: 'boundary', off_by_one: 'boundary', edge_case: 'edge_case', logic: 'implementation' }
  if (f.diagnosed && known[f.diagnosed]) return known[f.diagnosed]
  const last = f.errors[f.errors.length - 1] ?? ''
  if (/SyntaxError|IndentationError|TabError/.test(last)) return 'syntax'
  if (/NameError|AttributeError|TypeError|UnboundLocalError/.test(last)) return 'python_api'
  if (/KeyError/.test(last)) return 'data_structure_operation'
  if (/IndexError|RecursionError|StopIteration/.test(last)) return 'boundary'
  // It runs and the examples pass: what is left is a case the examples did not show.
  if (!last && f.visibleFailed === 0 && f.hiddenFailed > 0) return 'edge_case'
  if (e.stage === 'combine' || e.stage === 'pattern' || e.stage === 'capstone' || e.repType === 'capstone') return 'pattern'
  if (e.skills.includes('state_tracking') || e.skills.includes('accumulator') || e.skills.includes('window_state')) return 'state_tracking'
  return 'implementation'
}

/** How far back a category steps: how many small reps, and of what kind. `stay` repairs in place. */
export const REPAIR_SHAPE: Record<RepairCategory, { reps: number; from: 'primitive' | 'skill' | 'block' | 'debug' | 'stay' }> = {
  syntax: { reps: 3, from: 'primitive' },
  python_api: { reps: 3, from: 'skill' },
  data_structure_operation: { reps: 3, from: 'skill' },
  pattern: { reps: 3, from: 'block' },
  state_tracking: { reps: 2, from: 'skill' },
  boundary: { reps: 2, from: 'debug' },
  edge_case: { reps: 2, from: 'debug' },
  implementation: { reps: 0, from: 'stay' },
}

/** A pass that leaned on the solution or on two or more hints. */
export const passedWithHelp = (a: Attempt) => a.passed && Boolean(a.completedAt) && (a.solutionViewed || a.hintsUsed >= 2)

/**
 * A rep that needed help on two different days is not a recall problem, it is a
 * learning gap: next time it opens with the concept first, as on first exposure.
 */
export function needsRelearn(exerciseId: string, attempts: Attempt[]): boolean {
  const days = new Set(attempts.filter((a) => a.exerciseId === exerciseId && passedWithHelp(a)).map((a) => a.date))
  if (days.size < 2) return false
  // Once it has been passed cleanly after the second assisted day, the gap is closed.
  const lastHelped = [...days].sort().pop()!
  return !attempts.some((a) => a.exerciseId === exerciseId && a.date > lastHelped && a.passed && a.completedAt && !a.solutionViewed && a.hintsUsed === 0)
}
