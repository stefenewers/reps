import { lessons as week1, workedExamples as week1Examples } from '@/data/course/content/week1'
import { lessons as week2, workedExamples as week2Examples } from '@/data/course/content/week2'
import { labs as labsW1W2 } from '@/data/course/content/labs-w1w2'
import { labs as labsW3W8 } from '@/data/course/content/labs-w3w8'
import { labs as labsW9W13 } from '@/data/course/content/labs-w9w13'
import { labs as labsApplied } from '@/data/course/content/labs-applied'
import { visualWorkedExamples } from '@/data/course/content/visual-examples'
import { APPLIED_LESSONS } from '@/data/course/applied'
import type { Lab, Lesson, WorkedExample } from '@/data/course/types'

/** Course lessons: Weeks 1–2 foundations, and the Applied Engineering / system design thread (data/course/applied.ts). Later DSA weeks teach through the concept guides (data/concepts.ts). */
export const LESSONS: Lesson[] = [...week1, ...week2, ...APPLIED_LESSONS]
export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]))

export const WORKED_EXAMPLES: WorkedExample[] = [...week1Examples, ...week2Examples, ...visualWorkedExamples]
export const WORKED_EXAMPLE_BY_ID: Record<string, WorkedExample> = Object.fromEntries(WORKED_EXAMPLES.map((w) => [w.id, w]))

export const LABS: Lab[] = [...labsW1W2, ...labsW3W8, ...labsW9W13, ...labsApplied]
export const LAB_BY_ID: Record<string, Lab> = Object.fromEntries(LABS.map((l) => [l.id, l]))
