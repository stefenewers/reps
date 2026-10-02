import type { Attempt, DayModule, Exercise, Problem, RetrievalType, ReviewItem, SkillId } from '@/lib/types'
import type { SkillMastery } from '@/lib/mastery'

/**
 * Progression: what is done, what is next, what is unlocked, what is ready.
 * All deterministic, all zero tokens.
 */

export function passedSet(attempts: Attempt[]): Set<string> {
  return new Set(attempts.filter((a) => a.passed && a.completedAt).map((a) => a.exerciseId))
}

export function attemptedSet(attempts: Attempt[]): Set<string> {
  return new Set(attempts.filter((a) => a.completedAt || a.attemptsBeforePass > 0).map((a) => a.exerciseId))
}

export interface DayStats {
  date: string
  completed: number
  total: number
  percent: number
  sectionsCompleted: string[]
  minutesRemaining: number
  minutesTotal: number
  timeSpentSeconds: number
  complete: boolean
}

export function dayStats(day: DayModule, attempts: Attempt[]): DayStats {
  const passed = passedSet(attempts)
  const all = day.sections.flatMap((s) => s.exercises)
  const done = all.filter((e) => passed.has(e.id))
  const sectionsCompleted = day.sections.filter((s) => s.exercises.length && s.exercises.every((e) => passed.has(e.id))).map((s) => s.id)
  const minutesTotal = all.reduce((n, e) => n + e.minutes, 0)
  const minutesRemaining = all.filter((e) => !passed.has(e.id)).reduce((n, e) => n + e.minutes, 0)
  const timeSpentSeconds = attempts.filter((a) => a.date === day.date).reduce((n, a) => n + (a.durationSeconds ?? 0), 0)
  const percent = all.length ? Math.round((done.length / all.length) * 100) : 0
  return {
    date: day.date,
    completed: done.length,
    total: all.length,
    percent,
    sectionsCompleted,
    minutesRemaining,
    minutesTotal,
    timeSpentSeconds,
    complete: all.length > 0 && done.length === all.length,
  }
}

/** The first rep of the day that has not been passed, in order. */
export function nextExercise(day: DayModule, attempts: Attempt[]): Exercise | undefined {
  const passed = passedSet(attempts)
  return day.sections.flatMap((s) => s.exercises).find((e) => !passed.has(e.id))
}

/** The rep after `id` in the day's sequence. */
export function followingExercise(day: DayModule, id: string): Exercise | undefined {
  const all = day.sections.flatMap((s) => s.exercises)
  const i = all.findIndex((e) => e.id === id)
  return i >= 0 ? all[i + 1] : undefined
}

export const SECTION_UNLOCK_RATIO = 0.6

/**
 * A section unlocks when the previous one is at least 60% attempted. Inside a
 * section, a rep unlocks when every earlier rep has been attempted. Locks are
 * advisory: the UI lets you open a locked rep anyway.
 */
export function sectionUnlocked(day: DayModule, index: number, attempts: Attempt[]): boolean {
  if (index <= 0) return true
  const tried = attemptedSet(attempts)
  const prev = day.sections[index - 1]
  if (!prev.exercises.length) return sectionUnlocked(day, index - 1, attempts)
  const ratio = prev.exercises.filter((e) => tried.has(e.id)).length / prev.exercises.length
  return ratio >= SECTION_UNLOCK_RATIO && sectionUnlocked(day, index - 1, attempts)
}

export function exerciseUnlocked(day: DayModule, exerciseId: string, attempts: Attempt[]): boolean {
  const si = day.sections.findIndex((s) => s.exercises.some((e) => e.id === exerciseId))
  if (si < 0) return true
  if (!sectionUnlocked(day, si, attempts)) return false
  const tried = attemptedSet(attempts)
  const list = day.sections[si].exercises
  const i = list.findIndex((e) => e.id === exerciseId)
  return list.slice(0, i).every((e) => tried.has(e.id))
}

/** Skills a capstone needs that are still unseen. Empty means ready to attempt. */
export function missingPrerequisites(exercise: Exercise, mastery: Record<SkillId, SkillMastery>): SkillId[] {
  const needed = new Set([...exercise.skills, ...exercise.prerequisites])
  return [...needed].filter((s) => (mastery[s]?.status ?? 'unseen') === 'unseen')
}

/** Readiness for a canonical problem: mean of min(1, score / 70) across its skills. */
export function problemReadiness(problem: Problem, mastery: Record<SkillId, SkillMastery>): number {
  if (!problem.skills.length) return 0
  const sum = problem.skills.reduce((n, s) => n + Math.min(1, (mastery[s]?.score ?? 0) / 70), 0)
  return Math.round((sum / problem.skills.length) * 100)
}

export function weakestSkills(mastery: Record<SkillId, SkillMastery>, limit = 5): SkillMastery[] {
  return Object.values(mastery)
    .filter((m) => m.status !== 'unseen')
    .sort((a, b) => {
      const aw = a.status === 'weak' ? 0 : 1
      const bw = b.status === 'weak' ? 0 : 1
      if (aw !== bw) return aw - bw
      return a.score - b.score
    })
    .slice(0, limit)
}

/**
 * How this attempt should be classified for retrieval tracking.
 * - Run it back → immediate reconstruction.
 * - Cold reps, review sessions, or anything last touched 12+ hours ago → cold.
 */
export function retrievalTypeFor(exercise: Exercise, attempts: Attempt[], opts: { runItBack?: boolean; review?: boolean; now?: Date }): RetrievalType {
  if (opts.runItBack) return 'immediate-reconstruction'
  if (exercise.repType === 'cold' || exercise.stage === 'retrieval' || opts.review) return 'cold'
  const now = opts.now ?? new Date()
  const prior = attempts.filter((a) => a.exerciseId === exercise.id && (a.completedAt || a.attemptsBeforePass > 0))
  if (!prior.length) return 'first-exposure'
  const last = prior.map((a) => a.completedAt ?? a.startedAt).sort().pop()!
  return now.getTime() - new Date(last).getTime() >= 12 * 3_600_000 ? 'cold' : 'first-exposure'
}

export interface CapstoneLine {
  problemId: string
  exerciseId: string
  title: string
  status: 'clean' | 'assisted' | 'incomplete'
  hints: number
  solutionViewed: boolean
}

export interface DaySummary {
  strong: SkillId[]
  needsReps: SkillId[]
  capstones: CapstoneLine[]
  tomorrowReviews: number
  completed: number
  total: number
}

/** End-of-day review. Deterministic, costs nothing. */
export function daySummary(
  day: DayModule,
  attempts: Attempt[],
  mastery: Record<SkillId, SkillMastery>,
  reviews: ReviewItem[],
  problemTitle: (id: string) => string,
  tomorrowEndIso: string,
): DaySummary {
  const todays = attempts.filter((a) => a.date === day.date)
  const practiced = new Set(todays.flatMap((a) => a.skills))
  const ranked = [...practiced].map((s) => mastery[s]).filter(Boolean)
  const strong = ranked.filter((m) => m.status === 'competent' || m.status === 'fluent').sort((a, b) => b.score - a.score).map((m) => m.skillId)
  const needsReps = ranked.filter((m) => !(m.status === 'competent' || m.status === 'fluent')).sort((a, b) => a.score - b.score).map((m) => m.skillId)

  const capstones: CapstoneLine[] = day.capstones.map((pid) => {
    const ex = day.sections.flatMap((s) => s.exercises).find((e) => e.problemId === pid && e.repType === 'capstone')
    const exId = ex?.id ?? `cap-${pid}`
    const passes = attempts.filter((a) => a.exerciseId === exId && a.passed && a.completedAt)
    const best = passes.sort((a, b) => a.hintsUsed + (a.solutionViewed ? 10 : 0) - (b.hintsUsed + (b.solutionViewed ? 10 : 0)))[0]
    return {
      problemId: pid,
      exerciseId: exId,
      title: problemTitle(pid),
      status: !best ? 'incomplete' : best.hintsUsed === 0 && !best.solutionViewed ? 'clean' : 'assisted',
      hints: best?.hintsUsed ?? 0,
      solutionViewed: best?.solutionViewed ?? false,
    }
  })

  const stats = dayStats(day, attempts)
  return {
    strong,
    needsReps,
    capstones,
    tomorrowReviews: reviews.filter((r) => r.status === 'pending' && r.dueAt <= tomorrowEndIso).length,
    completed: stats.completed,
    total: stats.total,
  }
}
