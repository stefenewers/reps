import { COURSE_TARGET, COURSE_WEEKS, courseWeekOf, dailyTarget, trainingDays } from '@/data/course/calendar'
import { WEEK_BY_NUMBER } from '@/data/course/weeks'
import type { ProgramProgress } from '@/lib/progress'

/**
 * The header rail during the course: qualifying output against the 950-problem
 * course, one segment per training day sized by that day's target. Output, not
 * the old 90-day calendar (REPS_2_1_SPEC.md §9, §26).
 */
export function courseRail(credits: Record<string, number>, dayComplete?: (date: string) => boolean): ProgramProgress {
  const days = Array.from({ length: COURSE_WEEKS }, (_, i) => trainingDays(i + 1)).flat()
  let cursor = 0
  let completed = 0
  const out = days.map((date) => {
    const total = dailyTarget(courseWeekOf(date))
    const done = Math.min(total, credits[date] ?? 0)
    completed += credits[date] ?? 0
    const start = cursor / COURSE_TARGET
    cursor += total
    return { date, short: WEEK_BY_NUMBER[courseWeekOf(date)]?.short ?? '', total, completed: done, start, end: cursor / COURSE_TARGET, complete: dayComplete ? dayComplete(date) : done >= total }
  })
  // Saturday work counts toward the course too (it is real output); the rail just never exceeds the course.
  for (const [d, n] of Object.entries(credits)) if (!days.includes(d)) completed += n
  completed = Math.min(COURSE_TARGET, completed)
  return { completed, total: COURSE_TARGET, fraction: completed / COURSE_TARGET, days: out }
}
