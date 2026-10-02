import type { DayModule, Exercise } from '@/lib/types'
import { day as oct02 } from '@/data/exercises/oct02'
import { day as oct03 } from '@/data/exercises/oct03'
import { day as oct04 } from '@/data/exercises/oct04'
import { day as oct05 } from '@/data/exercises/oct05'
import { day as oct06 } from '@/data/exercises/oct06'
import { day as oct07 } from '@/data/exercises/oct07'
import { day as oct08 } from '@/data/exercises/oct08'
import { day as oct09 } from '@/data/exercises/oct09'
import { day as oct10 } from '@/data/exercises/oct10'
import { day as oct11 } from '@/data/exercises/oct11'
import { MOCK_EXERCISES } from '@/data/mocks'

/** The ten-day plan, October 2 through October 11. */
export const DAYS: DayModule[] = [oct02, oct03, oct04, oct05, oct06, oct07, oct08, oct09, oct10, oct11]

export const INTERVIEW_DATE = '2026-10-12'
export const FIRST_DAY = DAYS[0].date
export const LAST_DAY = DAYS[DAYS.length - 1].date

export const DAY_BY_DATE: Record<string, DayModule> = Object.fromEntries(DAYS.map((d) => [d.date, d]))

/** Every curriculum exercise, in plan order. */
export const ALL_EXERCISES: Exercise[] = [...DAYS.flatMap((d) => d.sections.flatMap((s) => s.exercises)), ...MOCK_EXERCISES]

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(ALL_EXERCISES.map((e) => [e.id, e]))

/** The day an exercise belongs to (mock problems belong to the last day). */
export const DAY_OF_EXERCISE: Record<string, string> = Object.fromEntries(
  DAYS.flatMap((d) => d.sections.flatMap((s) => s.exercises.map((e) => [e.id, d.date] as const))),
)

export function dayExercises(day: DayModule): Exercise[] {
  return day.sections.flatMap((s) => s.exercises)
}
