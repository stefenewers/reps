import { sections as visualRebuilds } from '@/data/exercises/course/visual-rebuilds'
import type { Section } from '@/lib/types'
import { sections as week1 } from '@/data/exercises/course/week1'
import { sections as week2 } from '@/data/exercises/course/week2'
import { sections as gatesLater } from '@/data/exercises/course/gates-w3w12'
import { sections as week13 } from '@/data/exercises/course/week13'
import { sections as labsW1W2 } from '@/data/exercises/course/labs-w1w2'
import { sections as labsW3W8 } from '@/data/exercises/course/labs-w3w8'
import { sections as labsW9W13 } from '@/data/exercises/course/labs-w9w13'
import { sections as labsApplied } from '@/data/exercises/course/labs-applied'

/**
 * Reps 2.0 course content: the sections the 14-week course needs that the
 * October modules did not have (Weeks 1–2 foundations, gate variants, the Week
 * 13 transfer bank, lab builds). Referenced by id from data/course/units.ts,
 * gates.ts and labs. Not part of the 90-day calendar, so it never changes the old plan.
 */
export const COURSE_SECTIONS: Section[] = [...week1, ...week2, ...gatesLater, ...week13, ...labsW1W2, ...labsW3W8, ...labsW9W13, ...labsApplied, ...visualRebuilds]
