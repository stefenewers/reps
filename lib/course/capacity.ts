import { WEEK_BY_NUMBER } from '@/data/course/weeks'
import { dailyTarget } from '@/data/course/calendar'
import { courseDay } from '@/lib/course/week-status'
import type { CapacityPhase, DailyCapacity } from '@/lib/training-capacity'

/**
 * The course contract replaces the earned 10 → 25 ramp (REPS_2_MASTER_SPEC.md §14):
 * 10 a day in week 1, 12 in week 2, 15 from week 3. After 15 the work gets harder,
 * more independent and more interview-like; the count does not grow.
 */
export function phaseOfWeek(week: number): CapacityPhase {
  if (week <= 2) return 'foundation'
  if (week <= 8) return 'build'
  if (week <= 12) return 'transfer'
  return 'interview'
}

export function courseCapacity(date: string, credits: Record<string, number>): DailyCapacity {
  const day = courseDay(date, credits)
  const week = WEEK_BY_NUMBER[day.week] ?? WEEK_BY_NUMBER[14]
  const rate = dailyTarget(day.week)
  const reason =
    day.type === 'rest'
      ? `${day.holiday ? `${day.holiday}. ` : ''}Rest day. Nothing is due. Your plan is intact.`
      : day.type === 'recovery'
        ? day.optionalTarget
          ? `Saturday is optional. ${day.optionalTarget} more would close week ${day.week}; nothing is owed.`
          : `Saturday is optional. Week ${day.week} is already covered.`
        : day.week === 1
          ? 'Week 1 is 10 a day: enough to learn each idea and repeat it, small enough to finish.'
          : day.week === 2
            ? 'Week 2 is 12 a day. From week 3 it is 15, and after that the work gets harder, not longer.'
            : '15 a day, as planned. From here the work gets harder and more independent, not longer.'
  return {
    week: day.week,
    level: rate === 10 ? 0 : rate === 12 ? 1 : 2,
    requiredReps: day.type === 'training' ? rate : day.optionalTarget,
    phase: phaseOfWeek(day.week),
    stage: { phase: phaseOfWeek(day.week), title: week.title, weeks: [week.number, week.number], ceiling: 2, range: `${rate} a day`, goal: week.purpose },
    reason,
    review: null,
    course: day,
  }
}
