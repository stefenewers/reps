import type { BuildingBlock } from '@/data/exercises/bridges/types'
import type { SkillMastery } from '@/lib/mastery'
import type { SkillId } from '@/lib/types'

/**
 * Problem readiness.
 *
 * A LeetCode problem is the final integration test of a prerequisite graph.
 * Each target lists its building blocks: named moves, each demonstrated by
 * reps. Readiness is whether every block has been demonstrated. It is kept
 * separate from pattern mastery on purpose: you can be strong at hashing and
 * still be one move short of Product of Array Except Self.
 *
 * Everything here is deterministic and derived from attempts.
 */

export interface Target {
  /** The LeetCode number. */
  lc: number
  title: string
  /** The plan unit (pattern) it belongs to. */
  unit: string
  /** Solved on LeetCode, or as a Reps capstone (whose re-solves are then on LeetCode). */
  source: 'leetcode' | 'reps'
  /** For a Reps capstone: its exercise id. */
  exerciseId?: string
  /** The authored bridge section placed just before the target, if it has one. */
  section: string | null
  mode: 'bridge-first' | 'study-first' | 'attempt-first'
  prerequisiteSkills: SkillId[]
  blocks: BuildingBlock[]
  /** Not inside the 90 days at the plan's pace: its bridge is ready for when you are ahead. */
  whenAhead?: boolean
}

export interface BlockState {
  label: string
  skills: SkillId[]
  ready: boolean
  /** How it became ready: by passing its reps, or (evidence-only blocks) by strong mastery of its skills. */
  via: 'reps' | 'mastery' | null
  /** The reps still to pass, in order. Empty when ready. */
  left: string[]
  /** Whether the block is taught by this problem's own bridge (as opposed to the pattern ladder). */
  bridge: boolean
}

export interface Readiness {
  blocks: BlockState[]
  ready: boolean
  readyCount: number
  total: number
  /** The next rep that moves this problem toward ready. */
  nextRep: string | null
  repsLeft: number
}

/** Strong evidence for a skill: fluent, or competent with a clean cold rep behind it. */
export function isStrong(m: SkillMastery | undefined): boolean {
  return Boolean(m && (m.status === 'fluent' || (m.status === 'competent' && m.coldCorrect > 0)))
}

/**
 * A block is ready when every rep it lists has been passed. Reps authored for
 * the bridge must actually be done. Evidence from the pattern ladder can also
 * be stood in for by strong mastery of the block's skills, so proven
 * fundamentals are not demanded twice.
 */
export function blockState(block: BuildingBlock, passed: Set<string>, strong: (skill: SkillId) => boolean): BlockState {
  const repsLeft = (block.reps ?? []).filter((id) => !passed.has(id))
  const evidenceLeft = (block.evidence ?? []).filter((id) => !passed.has(id))
  const byMastery = evidenceLeft.length > 0 && block.skills.length > 0 && block.skills.every(strong)
  const left = [...(byMastery ? [] : evidenceLeft), ...repsLeft]
  return { label: block.label, skills: block.skills, ready: left.length === 0, via: left.length ? null : byMastery ? 'mastery' : 'reps', left, bridge: Boolean(block.reps?.length) }
}

export function readiness(target: Pick<Target, 'blocks'>, passed: Set<string>, strong: (skill: SkillId) => boolean = () => false): Readiness {
  const blocks = target.blocks.map((b) => blockState(b, passed, strong))
  const left = blocks.flatMap((b) => b.left)
  const readyCount = blocks.filter((b) => b.ready).length
  return { blocks, ready: readyCount === blocks.length, readyCount, total: blocks.length, nextRep: left[0] ?? null, repsLeft: new Set(left).size }
}

/**
 * After a failed attempt: the smallest thing to go back down to. The first
 * block that is not ready, else the block you say broke, else the last block
 * (where the moves are combined). Returns that block's reps, to redo cold.
 */
export function repairReps(target: Pick<Target, 'blocks'>, passed: Set<string>, brokenBlock?: number): { block: number; reps: string[] } {
  const firstMissing = target.blocks.findIndex((b) => [...(b.reps ?? []), ...(b.evidence ?? [])].some((id) => !passed.has(id)))
  const block = brokenBlock ?? (firstMissing >= 0 ? firstMissing : target.blocks.length - 1)
  const b = target.blocks[block]
  return { block, reps: b ? (b.reps?.length ? b.reps : (b.evidence ?? [])) : [] }
}

/** Which target each bridge rep belongs to. */
export function bridgeOwner(targets: Target[]): Map<string, Target> {
  return new Map(targets.flatMap((t) => t.blocks.flatMap((b) => (b.reps ?? []).map((id) => [id, t] as const))))
}

/**
 * Dependency cycles between targets: A depends on B when A cites one of B's
 * bridge reps as evidence. Returns each cycle as a list of LeetCode numbers.
 */
export function bridgeCycles(targets: Target[]): number[][] {
  const owner = bridgeOwner(targets)
  const deps = new Map(targets.map((t) => [t.lc, [...new Set(t.blocks.flatMap((b) => b.evidence ?? []).map((id) => owner.get(id)?.lc).filter((lc): lc is number => lc !== undefined && lc !== t.lc))]]))
  const cycles: number[][] = []
  const state = new Map<number, 'visiting' | 'done'>()
  const walk = (lc: number, path: number[]) => {
    if (state.get(lc) === 'done') return
    if (state.get(lc) === 'visiting') return void cycles.push([...path.slice(path.indexOf(lc)), lc])
    state.set(lc, 'visiting')
    for (const d of deps.get(lc) ?? []) walk(d, [...path, lc])
    state.set(lc, 'done')
  }
  for (const t of targets) walk(t.lc, [])
  return cycles
}

export type FirstSolve = 'unaided' | 'aided' | null

/**
 * Target conversion: of the targets attempted after their building blocks were
 * in place, how many were solved without help the first time. This is the
 * measure of whether the ladders work.
 */
export function conversion(targets: Target[], firstSolve: (t: Target) => FirstSolve): { converted: number; attempted: number; rate: number | null } {
  const results = targets.map(firstSolve).filter((r): r is 'unaided' | 'aided' => r !== null)
  const converted = results.filter((r) => r === 'unaided').length
  return { converted, attempted: results.length, rate: results.length ? converted / results.length : null }
}
