import { COURSE_START, courseWeekOf, dailyTarget, dayType, holidayOf, trainingDays, weekDates, weekTarget, type DayType } from '@/data/course/calendar'
import { addDays } from '@/lib/dates'

/**
 * The day, the week and the streak, from credits per date (lib/course/credit.ts).
 * Output is the accountability metric; hours are not. Planned rest never creates
 * debt and never breaks a streak.
 */

export interface CourseDay {
  date: string
  week: number
  type: DayType
  /** What is due today: the daily target on a training day, nothing on rest. */
  target: number
  /** Saturday: what would close the week, if anything. Never owed. */
  optionalTarget: number
  holiday?: string
}

export function courseDay(date: string, credits: Record<string, number> = {}): CourseDay {
  const week = courseWeekOf(date)
  const type = dayType(date)
  const holiday = holidayOf(date)?.label
  if (type === 'training') return { date, week, type, target: dailyTarget(week), optionalTarget: 0, holiday }
  if (type === 'recovery') {
    const short = Math.max(0, weekTarget(week) - weekDates(week).filter((d) => d < date).reduce((n, d) => n + (credits[d] ?? 0), 0))
    return { date, week, type, target: 0, optionalTarget: short, holiday }
  }
  return { date, week, type, target: 0, optionalTarget: 0, holiday }
}

export type WeekStatus = 'on-track' | 'recoverable' | 'off-track'

export interface WeekProgress {
  week: number
  done: number
  target: number
  /** What the week expected by the end of today (training days so far at the daily rate). */
  expectedByNow: number
  trainingDaysDone: number
  trainingDays: number
  /** Training days so far that hit the daily target. */
  daysComplete: number
  shortfall: number
  status: WeekStatus
  labsDone: number
  labsRequired: number
  gatesCleared: number
  gatesRequired: number
}

/**
 * Status of a week as of `today`:
 * - on track: output to date meets what the week expected, and nothing required is overdue;
 * - recoverable: the shortfall is small enough for a Saturday (at most one day's target);
 * - off track: more than that, or the week ended with required output unfinished.
 * Today counts only once it is done: an unfinished morning is not a shortfall.
 */
export function weekProgress(week: number, today: string, credits: Record<string, number>, extra: { labsDone?: number; labsRequired?: number; gatesCleared?: number; gatesRequired?: number } = {}): WeekProgress {
  const days = trainingDays(week)
  const rate = dailyTarget(week)
  const dates = weekDates(week)
  const done = dates.filter((d) => d <= today).reduce((n, d) => n + (credits[d] ?? 0), 0)
  const past = days.filter((d) => d < today)
  const todayDone = days.includes(today) && (credits[today] ?? 0) >= rate
  const expectedByNow = (past.length + (todayDone ? 1 : 0)) * rate
  const shortfall = Math.max(0, expectedByNow - done)
  const ended = today > dates[6]
  const target = weekTarget(week)
  let status: WeekStatus = 'on-track'
  if (ended) status = done >= target ? 'on-track' : target - done <= rate ? 'recoverable' : 'off-track'
  else if (shortfall > rate) status = 'off-track'
  else if (shortfall > 0) status = 'recoverable'
  const labsRequired = extra.labsRequired ?? 0
  const gatesRequired = extra.gatesRequired ?? 0
  // A finished week with a required build or checkpoint missing is not on track, whatever the count says.
  if (ended && status === 'on-track' && ((extra.labsDone ?? 0) < labsRequired || (extra.gatesCleared ?? 0) < gatesRequired)) status = 'recoverable'
  return {
    week,
    done,
    target,
    expectedByNow,
    trainingDaysDone: days.filter((d) => d <= today).length,
    trainingDays: days.length,
    daysComplete: days.filter((d) => d <= today && (credits[d] ?? 0) >= rate).length,
    shortfall,
    status,
    labsDone: extra.labsDone ?? 0,
    labsRequired,
    gatesCleared: extra.gatesCleared ?? 0,
    gatesRequired,
  }
}

/**
 * Consecutive required training days completed (target met), counting back from
 * today. Rest and recovery days are skipped: planned rest protects the streak.
 * Today counts once it is complete; an unfinished today does not break it.
 */
export function trainingStreak(today: string, credits: Record<string, number>): number {
  let streak = 0
  for (let d = today; d >= COURSE_START; d = addDays(d, -1)) {
    if (dayType(d) !== 'training') continue
    const met = (credits[d] ?? 0) >= dailyTarget(courseWeekOf(d))
    if (met) streak++
    else if (d === today) continue
    else break
  }
  return streak
}

/** Today's momentum, as the Training Flame. It is not mastery. */
export type Flame = 'unlit' | 'ember' | 'burning' | 'blaze'

export function flameFor(done: number, target: number): Flame {
  if (target <= 0) return done > 0 ? 'ember' : 'unlit'
  if (done >= target) return 'blaze'
  if (done >= Math.ceil(target / 2)) return 'burning'
  return done > 0 ? 'ember' : 'unlit'
}

export type Momentum = 'starting' | 'building' | 'strong' | 'on-fire'

/**
 * Momentum over the last two weeks of training days: required days completed,
 * plus gates and labs. Repeating trivial reps cannot raise it: credits count
 * once per rep per day, and a day only counts when its target is met.
 */
export function momentum(today: string, credits: Record<string, number>, extra: { gatesCleared?: number; labsDone?: number } = {}): Momentum {
  const days: string[] = []
  for (let d = today; d >= COURSE_START && days.length < 10; d = addDays(d, -1)) if (dayType(d) === 'training' && (d < today || (credits[d] ?? 0) >= dailyTarget(courseWeekOf(d)))) days.push(d)
  if (!days.length) return 'starting'
  const met = days.filter((d) => (credits[d] ?? 0) >= dailyTarget(courseWeekOf(d))).length
  const rate = met / days.length
  const bonus = Math.min(0.2, 0.05 * ((extra.gatesCleared ?? 0) + (extra.labsDone ?? 0)))
  const score = rate + bonus
  if (days.length >= 5 && score >= 0.95) return 'on-fire'
  if (score >= 0.75) return 'strong'
  if (score >= 0.4) return 'building'
  return 'starting'
}
