import type { Section } from '@/lib/types'

/**
 * Reps 2.0 course content: the sections the 14-week course needs that the
 * October modules did not have (Weeks 1–2 foundations, gates, the Week 13
 * transfer bank). Referenced by id from data/course/units.ts and gates.ts.
 * Not part of the 90-day calendar, so it never changes the old plan.
 */
export const COURSE_SECTIONS: Section[] = []
