import { addDays, parseLocal } from '@/lib/dates'

/**
 * Reps 2.0: the 14-week course to the February 1 interview-start checkpoint
 * (REPS_2_MASTER_SPEC.md §15–16). Static. Everything about a learner is derived
 * from attempts and study state; nothing here changes per person.
 */

export const COURSE_START = '2026-10-26'
export const COURSE_END = '2027-01-31'
export const INTERVIEW_CHECKPOINT = '2027-02-01'
export const COURSE_WEEKS = 14

export interface PlannedOffDay {
  date: string
  label: string
  /** Planned rest never creates debt. */
  debt: false
}

/** Holidays on top of Sundays. Planned rest: nothing is due, the plan is intact. */
export const HOLIDAYS: PlannedOffDay[] = [
  { date: '2026-12-25', label: 'Christmas Day', debt: false },
  { date: '2026-12-26', label: 'Boxing Day', debt: false },
  { date: '2026-12-31', label: 'New Year’s Eve', debt: false },
  { date: '2027-01-01', label: 'New Year’s Day', debt: false },
  { date: '2027-01-18', label: 'MLK Day', debt: false },
]
const HOLIDAY = new Map(HOLIDAYS.map((h) => [h.date, h]))

/**
 * A day in the course:
 * - training: Monday to Friday, not a holiday. The daily target is due.
 * - recovery: Saturday. Optional: it can close a short week, it is never owed.
 * - rest: Sunday or a holiday. Nothing is due.
 */
export type DayType = 'training' | 'recovery' | 'rest'

export function dayType(date: string): DayType {
  if (HOLIDAY.has(date)) return 'rest'
  const dow = parseLocal(date).getDay()
  if (dow === 0) return 'rest'
  if (dow === 6) return 'recovery'
  return 'training'
}

export function holidayOf(date: string): PlannedOffDay | undefined {
  return HOLIDAY.get(date)
}

export const inCourse = (date: string) => date >= COURSE_START && date <= COURSE_END

/** Week 1–14 for a date in the course; 0 before it starts, 15 after it ends. */
export function courseWeekOf(date: string): number {
  if (date < COURSE_START) return 0
  const days = Math.round((parseLocal(date).getTime() - parseLocal(COURSE_START).getTime()) / 86_400_000)
  return Math.min(COURSE_WEEKS + 1, Math.floor(days / 7) + 1)
}

export function weekStart(n: number): string {
  return addDays(COURSE_START, (n - 1) * 7)
}

export function weekDates(n: number): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart(n), i))
}

/** The required training days of a week. */
export function trainingDays(n: number): string[] {
  return weekDates(n).filter((d) => dayType(d) === 'training')
}

/** The daily contract: 10 in week 1, 12 in week 2, then 15. After 15, harder work, not more of it. */
export function dailyTarget(week: number): number {
  if (week <= 1) return 10
  if (week === 2) return 12
  return 15
}

/** Qualifying problems a week requires: its training days at the daily target. */
export function weekTarget(n: number): number {
  return trainingDays(n).length * dailyTarget(n)
}

/** The planned maximum across the course (950, adjusted for holidays). */
export const COURSE_TARGET = Array.from({ length: COURSE_WEEKS }, (_, i) => weekTarget(i + 1)).reduce((a, b) => a + b, 0)
