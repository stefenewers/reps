import { trainingDays } from '@/data/course/calendar'
import { GATE_BY_ID } from '@/data/course/gates'
import { LABS } from '@/data/course/lessons'
import { UNITS } from '@/data/course/units'
import { WEEKS } from '@/data/course/weeks'

/**
 * The course's day-by-day plan (REPS_2_1_SPEC.md §5, §7): for every training
 * day, which units are taught and which checkpoints, labs and target problems
 * are due. This is what makes a day's contract explicit: "done for today" means
 * the rep target AND everything due that day.
 *
 * Curated per week in CURATED (from the spec's daily themes and the arithmetic
 * of each week's required path). A week without a curated plan falls back to
 * a derived one: units spread over the days in order, every checkpoint and
 * target on the last training day, labs mid-week and at the end.
 */

export interface DayPlan {
  date: string
  week: number
  /** The unit(s) being taught that day, in order. */
  focusUnits: string[]
  gatesDue: string[]
  labsDue: string[]
  targetsDue: number[]
  /** One line: what the day is about. */
  theme: string
}

export interface WeekPlan {
  week: number
  days: DayPlan[]
}

/** Curated weeks (filled from the Phase A curation). */
const CURATED: Record<number, Omit<DayPlan, 'week'>[]> = {}

function derived(week: number): DayPlan[] {
  const days = trainingDays(week)
  const units = UNITS.filter((u) => u.week === week)
  const labs = LABS.filter((l) => l.week === week && !l.optional)
  const last = days.length - 1
  return days.map((date, i) => {
    // Units in order, spread evenly over the days.
    const focusUnits = units.filter((_, k) => Math.min(last, Math.floor((k * days.length) / Math.max(1, units.length))) === i).map((u) => u.id)
    const carry = focusUnits.length ? focusUnits : [units[Math.min(units.length - 1, Math.floor((i * units.length) / days.length))]?.id].filter(Boolean)
    return {
      date,
      week,
      focusUnits: carry as string[],
      gatesDue: i === last ? units.flatMap((u) => u.gateIds).filter((g) => GATE_BY_ID[g]) : [],
      labsDue: labs.filter((_, k) => (labs.length === 1 ? last : k === 0 ? Math.max(0, Math.floor(last / 2)) : last) === i).map((l) => l.id),
      targetsDue: i === last ? units.flatMap((u) => u.targets) : [],
      theme: (carry as string[]).map((id) => UNITS.find((u) => u.id === id)?.title ?? id).join(' + '),
    }
  })
}

export const SCHEDULE: WeekPlan[] = WEEKS.map((w) => ({
  week: w.number,
  days: CURATED[w.number] ? CURATED[w.number].map((d) => ({ ...d, week: w.number })) : derived(w.number),
}))

export const DAY_PLAN: Record<string, DayPlan> = Object.fromEntries(SCHEDULE.flatMap((w) => w.days.map((d) => [d.date, d])))

/** When each checkpoint, lab and target is due (the first scheduled day). */
export const GATE_DUE: Record<string, string> = Object.fromEntries(SCHEDULE.flatMap((w) => w.days.flatMap((d) => d.gatesDue.map((g) => [g, d.date] as const))))
export const LAB_DUE: Record<string, string> = Object.fromEntries(SCHEDULE.flatMap((w) => w.days.flatMap((d) => d.labsDue.map((l) => [l, d.date] as const))))
export const TARGET_DUE: Record<number, string> = Object.fromEntries(SCHEDULE.flatMap((w) => w.days.flatMap((d) => d.targetsDue.map((lc) => [lc, d.date] as const))))
