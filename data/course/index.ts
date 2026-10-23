import { EXERCISE_BY_ID, MODULES } from '@/data/curriculum'
import { COURSE_SECTIONS } from '@/data/exercises/course'
import { UNITS, type LearningUnit } from '@/data/course/units'
import type { Exercise, Section } from '@/lib/types'

export * from '@/data/course/calendar'
export * from '@/data/course/units'
export * from '@/data/course/weeks'

/** Every section the course can reference: the October modules (with their bridge packs) and the course's own. */
export const SECTION_BY_ID: Record<string, Section> = Object.fromEntries([...MODULES.flatMap((m) => m.sections), ...COURSE_SECTIONS].map((s) => [s.id, s]))

/** A unit's required path, in order: the reps of its sections. Missing sections are skipped (and reported by the audit). */
export function unitPath(unit: LearningUnit): Exercise[] {
  return unit.path ? unit.path.map((id) => EXERCISE_BY_ID[id]).filter(Boolean) : unit.sections.flatMap((id) => SECTION_BY_ID[id]?.exercises ?? [])
}

export function unitOptional(unit: LearningUnit): Exercise[] {
  return (unit.optional ?? []).flatMap((id) => SECTION_BY_ID[id]?.exercises ?? [])
}

/** The unit a rep belongs to (by its section), if any. */
export const UNIT_OF_EXERCISE: Record<string, string> = Object.fromEntries(
  UNITS.flatMap((u) =>
    [...u.sections, ...(u.optional ?? []), ...(u.retrieval ?? []), ...(u.stretch ?? [])].flatMap((id) =>
      (SECTION_BY_ID[id]?.exercises ?? []).map((e) => [e.id, u.id] as const)
    )
  )
)

/** Units in teaching order. */
export const COURSE_ORDER = UNITS.map((u) => u.id)
