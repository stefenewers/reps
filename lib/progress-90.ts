import type { Attempt, DayModule, SkillId } from '@/lib/types'
import { computeSkillMastery } from '@/lib/mastery'
import { passedSet } from '@/lib/progress'
import { unaidedRate, type SolveEntry } from '@/lib/solve-log'
import { mockSummary, type MockLogEntry } from '@/lib/mock-log'
import { blocksFor } from '@/data/program-90day'

/**
 * The numbers behind the Progress page. All deterministic, all derived from
 * attempts in Reps, the solve log and the mock log.
 */

export interface PlanUnit {
  name: string
  short: string
  sections: string[]
  check: string | null
  leetcode: number[]
}

/** Minutes of practice per local date: time in Reps reps plus minutes logged on LeetCode solves. */
export function activityByDate(attempts: Attempt[], solves: SolveEntry[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const a of attempts) if (a.durationSeconds) out[a.date] = (out[a.date] ?? 0) + a.durationSeconds / 60
  for (const s of solves) out[s.date] = (out[s.date] ?? 0) + (s.minutes ?? 0)
  return out
}

/** Dates with any practice at all (a logged solve counts even without minutes). */
export function activeDates(attempts: Attempt[], solves: SolveEntry[]): Set<string> {
  return new Set([...attempts.filter((a) => a.completedAt || a.attemptsBeforePass > 0).map((a) => a.date), ...solves.map((s) => s.date)])
}

/**
 * Working days in a row with practice, counting back from today. Off days
 * neither break nor extend it, and today only counts once you have started.
 */
export function streak(active: Set<string>, today: string, planDays: DayModule[]): number {
  const working = planDays.filter((d) => d.phase !== 'off' && d.date <= today).map((d) => d.date).reverse()
  let n = 0
  for (const [i, date] of working.entries()) {
    if (active.has(date)) n++
    else if (i === 0 && date === today) continue
    else break
  }
  return n
}

/** Per plan week: minutes practiced against minutes the blocks plan. */
export function weeklyTime(activity: Record<string, number>, planDays: DayModule[]): { week: number; actual: number; planned: number; from: string; to: string }[] {
  const weeks = new Map<number, { week: number; actual: number; planned: number; from: string; to: string }>()
  for (const d of planDays) {
    const w = weeks.get(d.planWeek!) ?? { week: d.planWeek!, actual: 0, planned: 0, from: d.date, to: d.date }
    w.actual += activity[d.date] ?? 0
    w.planned += blocksFor(d).reduce((n, b) => n + b.minutes, 0)
    w.to = d.date
    weeks.set(w.week, w)
  }
  return [...weeks.values()].map((w) => ({ ...w, actual: Math.round(w.actual) }))
}

/** How far through each pattern: its plan reps passed, and whether its ladder and check are fully cleared. */
export function unitReadiness(units: PlanUnit[], planDays: DayModule[], attempts: Attempt[]): { name: string; done: number; total: number; cleared: boolean; start: string | null }[] {
  const passed = passedSet(attempts)
  return units.map((u) => {
    const ids = new Set(u.sections.concat(u.check ? [u.check] : []))
    const days = planDays.filter((d) => d.sections.some((s) => !s.optional && ids.has(s.id)))
    const reps = days.flatMap((d) => d.sections.filter((s) => !s.optional && ids.has(s.id)).flatMap((s) => s.exercises))
    const done = reps.filter((e) => passed.has(e.id)).length
    // A pattern with no ladder (tries, matrix) is cleared when its problems are; that is tracked in the solve log.
    return { name: u.name, done, total: reps.length, cleared: reps.length > 0 && done === reps.length, start: days[0]?.date ?? null }
  })
}

/** LeetCode problems solved at least once: logged on LeetCode, or their capstone passed in Reps. */
export function problemsSolved(solves: SolveEntry[], attempts: Attempt[], capstoneNumber: Record<string, number>, through?: string): number {
  const lc = new Set<number>()
  for (const s of solves) if (s.lc && (!through || s.date <= through)) lc.add(s.lc)
  for (const a of attempts) if (a.passed && a.completedAt && capstoneNumber[a.exerciseId] && (!through || a.date <= through)) lc.add(capstoneNumber[a.exerciseId])
  return lc.size
}

export interface CheckpointStatus {
  label: string
  date: string
  reached: boolean
  rows: { name: string; actual: string; target: string; met: boolean }[]
}

/** Each checkpoint: where you stand against its targets (as of that date once it has passed, as of today before). */
export function checkpointStatus(
  checkpoints: readonly { date: string; label: string; patterns: number; problems: number; unaided: number; mocks: number }[],
  today: string,
  input: { units: PlanUnit[]; planDays: DayModule[]; attempts: Attempt[]; solves: SolveEntry[]; mocks: MockLogEntry[]; inAppMocks: string[]; capstoneNumber: Record<string, number> },
): CheckpointStatus[] {
  return checkpoints.map((c) => {
    const reached = today >= c.date
    const through = reached ? c.date : today
    const att = input.attempts.filter((a) => a.date <= through)
    const patterns = unitReadiness(input.units, input.planDays, att).filter((u) => u.cleared).length
    const problems = problemsSolved(input.solves, input.attempts, input.capstoneNumber, through)
    const rate = unaidedRate(input.solves, through)
    const mocks = mockSummary(input.mocks, through).count + input.inAppMocks.filter((d) => d <= through).length
    return {
      label: c.label,
      date: c.date,
      reached,
      rows: [
        { name: 'Patterns cleared', actual: String(patterns), target: String(c.patterns), met: patterns >= c.patterns },
        { name: 'Problems done', actual: String(problems), target: String(c.problems), met: problems >= c.problems },
        { name: 'Re-solves unaided', actual: rate.rate === null ? '—' : `${Math.round(rate.rate * 100)}%`, target: `${Math.round(c.unaided * 100)}%`, met: rate.rate !== null && rate.rate >= c.unaided },
        { name: 'Mocks logged', actual: String(mocks), target: String(c.mocks), met: mocks >= c.mocks },
      ],
    }
  })
}

/** The weakest practiced skills, with their score a week ago, so you can see whether reps are moving them. */
export function weakSkillsOverTime(skillIds: SkillId[], attempts: Attempt[], today: string, weekAgo: string, limit = 6): { skillId: SkillId; now: number; before: number | null; attempts: number }[] {
  const earlier = attempts.filter((a) => a.date <= weekAgo)
  return skillIds
    .map((id) => ({ id, m: computeSkillMastery(id, attempts) }))
    .filter((x) => x.m.status !== 'unseen')
    .sort((a, b) => a.m.score - b.m.score)
    .slice(0, limit)
    .map(({ id, m }) => {
      const b = computeSkillMastery(id, earlier)
      return { skillId: id, now: m.score, before: b.status === 'unseen' ? null : b.score, attempts: m.attempts }
    })
}
