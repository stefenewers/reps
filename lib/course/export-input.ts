import { SECTION_BY_ID } from '@/data/course'
import { doubleDaysFrom } from '@/data/course/calendar'
import { LABS } from '@/data/course/lessons'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { SKILLS } from '@/data/skills'
import type { ContractInput } from '@/lib/course/contract'
import { labKey, type LabState } from '@/lib/course/labs'
import { computeAllMastery } from '@/lib/mastery'
import { SOLVE_PREFIX, type SolveEntry } from '@/lib/solve-log'
import type { Attempt, Exercise, ReviewItem } from '@/lib/types'

/**
 * Read-only: turn an export bundle (RepsRepository.exportData() format) into the
 * same inputs the app derives from storage, so scripts and tests can run the
 * course engine on real progress. Nothing here writes anything.
 */
export interface ExportLike {
  attempts: Attempt[]
  skill_mastery?: { id: string; [k: string]: unknown }[]
  review_queue: ReviewItem[]
  generated_reps?: { id: string; payload: Record<string, unknown> }[]
  study_state?: { id: string; value: unknown; updatedAt?: string }[]
}

export interface ExportInput extends ContractInput {
  review: ReviewItem[]
  state: (key: string) => unknown
  stateKeys: string[]
}

/** Generated reps are not in EXERCISE_BY_ID; their payload is an Exercise. Merge them so a `gen-*` attempt resolves and is never dropped. */
export function exercisesWithGenerated(bundle: Pick<ExportLike, 'generated_reps'>): Record<string, Exercise> {
  const out: Record<string, Exercise> = { ...EXERCISE_BY_ID }
  for (const g of bundle.generated_reps ?? []) {
    const p = g.payload as unknown as Exercise
    if (p && typeof p.id === 'string' && !out[p.id]) out[p.id] = p
  }
  return out
}

export function exportInput(bundle: ExportLike): ExportInput {
  const states = new Map((bundle.study_state ?? []).map((r) => [r.id, r.value]))
  const entries = [...states]
    .filter(([k]) => k.startsWith(SOLVE_PREFIX))
    .map(([, v]) => v as SolveEntry)
    .filter((e) => e && typeof e.date === 'string')
  const labStates = Object.fromEntries(LABS.map((l) => [l.id, states.get(labKey(l.id)) as LabState | undefined]))
  return {
    attempts: bundle.attempts,
    entries,
    mastery: computeAllMastery(
      SKILLS.map((s) => s.id),
      bundle.attempts
    ),
    labStates,
    exercises: exercisesWithGenerated(bundle),
    sections: SECTION_BY_ID,
    review: bundle.review_queue,
    doubleDays: doubleDaysFrom([...states].filter(([k]) => k.startsWith('double:')).map(([, v]) => v as { date?: string; on?: boolean })),
    state: (k) => states.get(k),
    stateKeys: [...states.keys()]
  }
}
