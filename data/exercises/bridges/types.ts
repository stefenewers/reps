import type { Section, SkillId } from '@/lib/types'
import type { Brief } from '@/data/briefs'
import type { Primer } from '@/data/primers/types'

/**
 * A pack is one author's slice of the bridge curriculum: the sections it adds
 * (pattern ladders, mastery checks and problem bridges), the prerequisite graph
 * of each target problem, and the briefs and primers that go with them.
 */

/** A section, plus the authored topic module (by its date) it belongs to. */
export interface PackSection extends Section {
  module: string
}

/**
 * One building block of a target problem: a move you can name and demonstrate.
 * - `reps`: the bridge reps (authored for this problem) that teach it.
 * - `evidence`: existing reps from a pattern ladder that already demonstrate it.
 * A block is ready when every rep it lists has been passed. A block made only
 * of `evidence` is also ready when every one of its `skills` is strong.
 */
export interface BuildingBlock {
  label: string
  skills: SkillId[]
  reps?: string[]
  evidence?: string[]
}

export interface ProblemBridge {
  /** The LeetCode number of the target. */
  lc: number
  title: string
  /** The plan unit it belongs to, e.g. "Hashing". */
  unit: string
  /** The authored bridge section, placed immediately before the target. */
  section: string
  /**
   * bridge-first: do the bridge, then attempt.
   * study-first: the walkthrough is part of the sequence before the first full solve.
   * attempt-first: the moves are already laddered; attempt, then study if needed.
   */
  mode: 'bridge-first' | 'study-first' | 'attempt-first'
  prerequisiteSkills: SkillId[]
  /** In the order they are built. */
  blocks: BuildingBlock[]
}

export interface Pack {
  sections: PackSection[]
  bridges: ProblemBridge[]
  /** New pattern ladders and mastery checks, by plan unit name. */
  units?: Record<string, { ladder?: string[]; check?: string }>
  briefs: Record<string, Brief>
  primers: Primer[]
}
