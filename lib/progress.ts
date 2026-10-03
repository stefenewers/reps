import type { Attempt, DayModule, Exercise, Problem, RetrievalType, ReviewItem, Section, SkillId } from '@/lib/types'
import type { SkillMastery } from '@/lib/mastery'
import { EXERCISE_BY_ID } from '@/data/curriculum'

/** Extras (`optional` sections) never count toward a day, a stage or the program. */
function req(day: DayModule) {
  return day.sections.filter((s) => !s.optional)
}

/**
 * Progression: what is done, what is next, what is unlocked, what is ready.
 * All deterministic, all zero tokens.
 */

/** Reps that count as done. In a mastery check (`cleanPass`), a pass with the solution open does not count. */
export function passedSet(attempts: Attempt[]): Set<string> {
  return new Set(attempts.filter((a) => a.passed && a.completedAt && !(a.solutionViewed && EXERCISE_BY_ID[a.exerciseId]?.cleanPass)).map((a) => a.exerciseId))
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
  const all = req(day).flatMap((s) => s.exercises)
  const done = all.filter((e) => passed.has(e.id))
  const sectionsCompleted = req(day).filter((s) => s.exercises.length && s.exercises.every((e) => passed.has(e.id))).map((s) => s.id)
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
  return req(day).flatMap((s) => s.exercises).find((e) => !passed.has(e.id))
}

/** The rep after `id` in the day's sequence: required reps lead to required reps, extras to extras. */
export function followingExercise(day: DayModule, id: string): Exercise | undefined {
  const required = req(day).flatMap((s) => s.exercises)
  const extras = day.sections.filter((s) => s.optional).flatMap((s) => s.exercises)
  for (const list of [required, extras]) {
    const i = list.findIndex((e) => e.id === id)
    if (i >= 0) return list[i + 1]
  }
  return undefined
}

export const SECTION_UNLOCK_RATIO = 0.6

/**
 * A section unlocks when the previous one is at least 60% attempted. Inside a
 * section, a rep unlocks when every earlier rep has been attempted. Those locks
 * are advisory: the UI lets you open a locked rep anyway. A mastery check
 * (`gate`) is not: everything after it stays locked until each of its reps is
 * passed without the solution.
 */
export function sectionUnlocked(day: DayModule, index: number, attempts: Attempt[]): boolean {
  if (index <= 0 || day.sections[index]?.optional) return true
  const tried = attemptedSet(attempts)
  const prev = day.sections[index - 1]
  if (!prev.exercises.length || prev.optional) return sectionUnlocked(day, index - 1, attempts)
  const ratio = prev.exercises.filter((e) => tried.has(e.id)).length / prev.exercises.length
  return ratio >= SECTION_UNLOCK_RATIO && gatesCleared(day, index, attempts) && sectionUnlocked(day, index - 1, attempts)
}

/** The first uncleared mastery check before section `index` in this day, if any. */
export function blockingGate(day: DayModule, index: number, attempts: Attempt[]): Section | undefined {
  const passed = passedSet(attempts)
  return day.sections.slice(0, Math.max(0, index)).find((s) => s.gate && !s.optional && !s.exercises.every((e) => passed.has(e.id)))
}

function gatesCleared(day: DayModule, index: number, attempts: Attempt[]) {
  return !blockingGate(day, index, attempts)
}

/** Hard lock: a rep that sits behind an uncleared mastery check. */
export function lockedByGate(day: DayModule, exerciseId: string, attempts: Attempt[]): Section | undefined {
  const si = day.sections.findIndex((s) => s.exercises.some((e) => e.id === exerciseId))
  if (si < 0 || day.sections[si].optional) return undefined
  return blockingGate(day, si, attempts)
}

export function exerciseUnlocked(day: DayModule, exerciseId: string, attempts: Attempt[]): boolean {
  const si = day.sections.findIndex((s) => s.exercises.some((e) => e.id === exerciseId))
  if (si < 0 || day.sections[si].optional) return true
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
    const ex = req(day).flatMap((s) => s.exercises).find((e) => e.problemId === pid && e.repType === 'capstone')
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

// ── whole-program progress ───────────────────────────────────────────────────

export interface ProgramDay {
  date: string
  short: string
  total: number
  completed: number
  /** Where this day's segment starts and ends on the rail, as fractions of the whole curriculum. */
  start: number
  end: number
  complete: boolean
}

export interface ProgramProgress {
  completed: number
  total: number
  fraction: number
  days: ProgramDay[]
}

/**
 * How far through the whole Oct 2 – Oct 11 curriculum. The denominator is the
 * fixed set of canonical day exercises; generated reps, repeated attempts and
 * session wrappers never change it. A canonical rep counts once, wherever it
 * was completed (consistent with each day's own progress).
 */
export function programProgress(days: DayModule[], attempts: Attempt[]): ProgramProgress {
  const passed = passedSet(attempts)
  const total = days.reduce((n, d) => n + req(d).reduce((m, s) => m + s.exercises.length, 0), 0)
  let cursor = 0
  let completed = 0
  const out: ProgramDay[] = days.map((d) => {
    const list = req(d).flatMap((s) => s.exercises)
    const done = list.filter((e) => passed.has(e.id)).length
    completed += done
    const start = total ? cursor / total : 0
    cursor += list.length
    return { date: d.date, short: d.short, total: list.length, completed: done, start, end: total ? cursor / total : 0, complete: list.length > 0 && done === list.length }
  })
  return { completed, total, fraction: total ? completed / total : 0, days: out }
}

// ── road to ready: topic stages ──────────────────────────────────────────────

export type StageStatus = 'complete' | 'current' | 'partial' | 'upcoming'

/** The stage copy lives in data/program.ts; only what progress needs is typed here. */
export interface StageDefinition {
  dayDate: string
  title: string
  shortTitle: string
  requiresMocks?: boolean
}

export interface StageProgress<S extends StageDefinition = StageDefinition> {
  stage: S
  index: number
  day: DayModule
  completed: number
  total: number
  fraction: number
  status: StageStatus
  /** First section with an unfinished rep, and the ones after it. */
  currentSection?: string
  nextSections: string[]
  capstones: string[]
  mocks?: { completed: number; total: number }
}

/** Mock interviews finished (a completed result per distinct mock), never just opened. */
export function mockProgress(results: { mockId: string; completedAt?: string }[], mockIds: string[]): { completed: number; total: number } {
  const done = new Set(results.filter((r) => r.completedAt && mockIds.includes(r.mockId)).map((r) => r.mockId))
  return { completed: done.size, total: mockIds.length }
}

/**
 * Where you actually are, from canonical completion, never from the calendar.
 * The current stage is the earliest one that isn't complete; later stages you
 * have touched show as partial but never count as finished out of order.
 */
export function programStageProgress<S extends StageDefinition>(
  stages: S[],
  days: DayModule[],
  attempts: Attempt[],
  mocks: { completed: number; total: number },
): StageProgress<S>[] {
  const passed = passedSet(attempts)
  const byDate = new Map(days.map((d) => [d.date, d]))
  let currentFound = false
  return stages.map((stage, index) => {
    const day = byDate.get(stage.dayDate)!
    const list = req(day).flatMap((s) => s.exercises)
    const completed = list.filter((e) => passed.has(e.id)).length
    const total = list.length
    const repsDone = total > 0 && completed === total
    const mocksDone = !stage.requiresMocks || mocks.completed >= mocks.total
    let status: StageStatus
    if (repsDone && mocksDone) status = 'complete'
    else if (!currentFound) {
      status = 'current'
      currentFound = true
    } else status = completed > 0 ? 'partial' : 'upcoming'
    const sections = req(day)
    const firstOpen = sections.findIndex((s) => s.exercises.some((e) => !passed.has(e.id)))
    return {
      stage,
      index,
      day,
      completed,
      total,
      fraction: total ? completed / total : 0,
      status,
      currentSection: firstOpen >= 0 ? sections[firstOpen].title : undefined,
      nextSections: firstOpen >= 0 ? sections.slice(firstOpen + 1).map((s) => s.title) : [],
      capstones: day.capstones,
      mocks: stage.requiresMocks ? mocks : undefined,
    }
  })
}

/** The stage you are in, or undefined when the whole program is complete. */
export function currentProgramStage<S extends StageDefinition>(list: StageProgress<S>[]): StageProgress<S> | undefined {
  return list.find((s) => s.status === 'current')
}

/** Every stage not yet complete, in order (the current one first). */
export function remainingProgramStages<S extends StageDefinition>(list: StageProgress<S>[]): StageProgress<S>[] {
  return list.filter((s) => s.status !== 'complete')
}
