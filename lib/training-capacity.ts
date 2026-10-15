import { addDays, daysBetween, parseLocal } from '@/lib/dates'

/**
 * Training capacity: how much to train today. Progressive overload, as in a gym.
 *
 * The 90-day queue says what remains in the program. Capacity says how much of
 * it today asks for. It starts small (10 reps a day), and each week it is
 * reviewed: it goes up a step only when last week's load was handled (enough
 * days done, the reps completed, without leaning on solutions), and it never
 * jumps. Missing days never add to it. Deterministic, from the record of what
 * was done.
 */

/** The daily loads, in reps (weighted: a capstone counts as several). */
export const LOADS = [10, 12, 15, 18, 20, 22, 25] as const

export type CapacityPhase = 'foundation' | 'build' | 'transfer' | 'interview'

export interface RampStage {
  phase: CapacityPhase
  title: string
  weeks: [number, number]
  /** The highest load (index into LOADS) this stage allows. */
  ceiling: number
  range: string
  goal: string
}

/** The default ramp. The load only reaches a stage's ceiling if the weeks before were handled. */
export const RAMP: RampStage[] = [
  { phase: 'foundation', title: 'Building the habit', weeks: [1, 1], ceiling: 0, range: '10 reps', goal: 'Understand each idea and get the core moves into your fingers.' },
  { phase: 'foundation', title: 'Building the habit', weeks: [2, 2], ceiling: 2, range: '12–15 reps', goal: 'The same kind of work, a little more of it. Still strongly guided.' },
  { phase: 'build', title: 'Drill and combine', weeks: [3, 4], ceiling: 3, range: '15–18 reps', goal: 'More combining moves and small unlabeled problems.' },
  { phase: 'transfer', title: 'Transfer', weeks: [5, 8], ceiling: 4, range: '18–20 reps', goal: 'Capstones and LeetCode problems become a normal part of the day.' },
  { phase: 'interview', title: 'Interview execution', weeks: [9, 99], ceiling: 6, range: '20–25 reps', goal: 'Harder, colder, timed: new Mediums, follow-ups, mocks. Not more micro-questions.' },
]

export function weekOf(date: string, planStart: string): number {
  return Math.max(1, Math.floor(daysBetween(planStart, date) / 7) + 1)
}

export function stageFor(week: number): RampStage {
  return RAMP.find((s) => week >= s.weeks[0] && week <= s.weeks[1]) ?? RAMP[RAMP.length - 1]
}

/** What one day of training looked like, from the record. */
export interface DayRecord {
  /** Weighted reps done (passed) that day. */
  units: number
  /** Minutes spent in reps that day. */
  minutes: number
  /** Reps passed with the solution open or two or more hints. */
  assisted: number
  /** Reps passed. */
  passed: number
  coldPassed: number
  coldTotal: number
  /** A mock interview was done: a full day's training on its own. */
  mock?: boolean
}

export interface WeekReview {
  week: number
  load: number
  studyDays: number
  /** Days the full load was done. */
  completedDays: number
  /** Share of the load done on the days you trained. */
  completion: number
  /** Share of passed reps that leaned on the solution or several hints. */
  assistance: number
  coldRate: number | null
  avgMinutes: number
  /** Handled: the load may go up a step. Strong: it may go up two (within the stage's ceiling). */
  ready: boolean
  strong: boolean
  reason: string
}

const READY = { completedDays: 4, completion: 0.8, assistance: 0.35, coldRate: 0.6, maxMinutes: 180 }
const STRONG = { completedDays: 5, completion: 0.95, assistance: 0.15, coldRate: 0.8 }

export function reviewWeek(week: number, load: number, days: DayRecord[]): WeekReview {
  const trained = days.filter((d) => d.units > 0 || d.mock)
  const done = (d: DayRecord) => d.mock || d.units >= load
  const completedDays = trained.filter(done).length
  const completion = trained.length ? trained.reduce((n, d) => n + (d.mock ? 1 : Math.min(d.units, load) / load), 0) / trained.length : 0
  const passed = trained.reduce((n, d) => n + d.passed, 0)
  const assistance = passed ? trained.reduce((n, d) => n + d.assisted, 0) / passed : 0
  const coldTotal = trained.reduce((n, d) => n + d.coldTotal, 0)
  const coldRate = coldTotal >= 3 ? trained.reduce((n, d) => n + d.coldPassed, 0) / coldTotal : null
  const avgMinutes = trained.length ? trained.reduce((n, d) => n + d.minutes, 0) / trained.length : 0
  const misses: string[] = []
  if (completedDays < READY.completedDays) misses.push(`${completedDays} of ${READY.completedDays} days at the full load`)
  if (trained.length && completion < READY.completion) misses.push(`${Math.round(completion * 100)}% of the load done on the days you trained`)
  if (assistance > READY.assistance) misses.push(`${Math.round(assistance * 100)}% of reps passed with the solution or several hints`)
  if (coldRate !== null && coldRate < READY.coldRate) misses.push(`${Math.round(coldRate * 100)}% of cold reps passed`)
  if (avgMinutes > READY.maxMinutes) misses.push(`about ${Math.round(avgMinutes)} minutes a day, which is a lot for this load`)
  const ready = misses.length === 0
  const strong = ready && completedDays >= STRONG.completedDays && completion >= STRONG.completion && assistance <= STRONG.assistance && (coldRate === null || coldRate >= STRONG.coldRate)
  const reason = ready
    ? strong
      ? `Week ${week} at ${load} reps was handled cleanly: ${completedDays} full days, little help needed.`
      : `Week ${week} at ${load} reps was handled: ${completedDays} full days.`
    : trained.length === 0
      ? `Week ${week} at ${load} reps: no training days logged. The load stays at ${load} until a week at it is handled.`
      : `Week ${week} at ${load} reps: ${misses.join('; ')}. Holding the load for another week. That is how overload works, not falling behind.`
  return { week, load, studyDays: trained.length, completedDays, completion, assistance, coldRate, avgMinutes, ready, strong, reason }
}

export interface DailyCapacity {
  week: number
  /** Index into LOADS. */
  level: number
  /** The day's prescription, in weighted reps. */
  requiredReps: number
  phase: CapacityPhase
  stage: RampStage
  reason: string
  /** Last week's review, once there is one. */
  review: WeekReview | null
}

/**
 * Today's capacity. Week 1 is 10 reps. At the start of every later week, the week
 * before is reviewed: handled → up one step, handled cleanly → up two, otherwise
 * held. Never above the stage's ceiling, never more than two steps in a week (one after the first month).
 * Days off (Sundays and the plan's days off) are not counted against anything.
 */
export function capacityFor(date: string, planStart: string, record: (date: string) => DayRecord | undefined, isStudyDay: (date: string) => boolean): DailyCapacity {
  const week = weekOf(date, planStart)
  let level = 0
  let review: WeekReview | null = null
  for (let w = 1; w < week; w++) {
    const days: DayRecord[] = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(planStart, (w - 1) * 7 + i)
      if (!isStudyDay(d)) continue
      days.push(record(d) ?? { units: 0, minutes: 0, assisted: 0, passed: 0, coldPassed: 0, coldTotal: 0 })
    }
    review = reviewWeek(w, LOADS[level], days)
    // Two steps only while the loads are small (the first month); after that, one step a week at most.
    const step = review.strong && stageFor(w + 1).weeks[0] <= 4 ? 2 : 1
    if (review.ready) level = Math.min(level + step, Math.max(level, stageFor(w + 1).ceiling))
  }
  const stage = stageFor(week)
  const reason =
    week === 1
      ? 'Week 1 starts at 10 reps a day: enough to learn and repeat, small enough to finish every day.'
      : review!.ready
        ? `${review!.reason} ${LOADS[level] > review!.load ? `Up to ${LOADS[level]} reps this week.` : `Staying at ${LOADS[level]} reps: that is this stage's top.`}`
        : review!.reason
  return { week, level, requiredReps: LOADS[level], phase: stage.phase, stage, reason, review }
}

/**
 * The load the forecast assumes for a future date: today's level, rising one step
 * a week up to each stage's ceiling (as if every week is handled).
 */
export function projectedLoad(date: string, today: DailyCapacity, planStart: string): number {
  const week = weekOf(date, planStart)
  let level = today.level
  for (let w = today.week + 1; w <= week; w++) level = Math.min(level + 1, Math.max(level, stageFor(w).ceiling))
  return LOADS[level]
}

export const isSunday = (date: string) => parseLocal(date).getDay() === 0
