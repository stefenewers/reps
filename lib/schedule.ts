import type { Attempt, Exercise, ReviewItem, Stage } from '@/lib/types'
import { attemptQuality } from '@/lib/mastery'
import { addDays, localDate, parseLocal } from '@/lib/dates'

/**
 * Deterministic spaced retrieval, compressed into the ten-day window.
 *
 * - A skill is scheduled the first time it is produced (not merely recognised):
 *   next day.
 * - Each clean cold rep advances it: +1 day, +3 days, then once more before the
 *   final day. After that it is done.
 * - A shaky pass (hints, solution, many retries) brings it back later the same day.
 * - A failure brings it back within the hour.
 * - Nothing important is ever scheduled past the last study day.
 * - Capstones and other important exercises get their own cold re-solve item.
 */

export const STEP_DAYS = [1, 3, 5]
const RECOGNITION: Stage[] = ['recognize', 'trace']
const MORNING_HOUR = 7

export interface ScheduleOptions {
  lastDay: string // YYYY-MM-DD, nothing scheduled after this morning
}

function atMorning(date: string): string {
  const d = parseLocal(date)
  d.setHours(MORNING_HOUR, 0, 0, 0)
  return d.toISOString()
}

function plusHours(now: Date, h: number): string {
  return new Date(now.getTime() + h * 3_600_000).toISOString()
}

function capDue(iso: string, opts: ScheduleOptions): string {
  const cap = atMorning(opts.lastDay)
  return iso > cap ? cap : iso
}

export function nextDue(step: number, now: Date, opts: ScheduleOptions): string | null {
  if (step >= STEP_DAYS.length) return null
  const today = localDate(now)
  const target = atMorning(addDays(today, STEP_DAYS[step]))
  // Before the final day, the last step lands on the final day at the latest.
  if (today < opts.lastDay) return capDue(target, opts)
  return null
}

/**
 * Apply one finished attempt to the queue. Returns the items to upsert.
 * `existing` is the current queue (any status).
 */
export function scheduleAfterAttempt(attempt: Attempt, exercise: Exercise, existing: ReviewItem[], now: Date, opts: ScheduleOptions): ReviewItem[] {
  const byId = new Map(existing.map((r) => [r.id, r]))
  const out: ReviewItem[] = []
  const iso = now.toISOString()
  const quality = attemptQuality(attempt)
  const productive = !RECOGNITION.includes(attempt.stage)
  const isCold = attempt.retrievalType === 'cold'

  const targets: { id: string; reviewType: ReviewItem['reviewType']; skillId?: string; exerciseId?: string }[] = exercise.skills.map((s) => ({
    id: `skill:${s}`,
    reviewType: 'skill',
    skillId: s,
  }))
  if (exercise.review.important) targets.push({ id: `ex:${exercise.id}`, reviewType: 'exercise', exerciseId: exercise.id })

  for (const t of targets) {
    const prev = byId.get(t.id)
    const pending = prev?.status === 'pending' ? prev : undefined
    const base: ReviewItem = {
      ...t,
      dueAt: iso,
      step: prev?.step ?? 0,
      reason: 'scheduled',
      status: 'pending',
      createdAt: prev?.createdAt ?? iso,
      updatedAt: iso,
    }

    if (!attempt.passed) {
      // Failure: bring it back soon, regardless of prior progress.
      out.push({ ...base, dueAt: plusHours(now, 1), reason: 'failed', step: Math.max(0, base.step - (isCold ? 1 : 0)), completedAt: undefined })
      continue
    }

    if (quality < 0.7) {
      // Shaky pass: later today, unless something sooner is already pending.
      const later = plusHours(now, 3)
      const due = pending && pending.dueAt < later ? pending.dueAt : later
      out.push({ ...base, dueAt: capDue(due, opts), reason: 'shaky', completedAt: undefined })
      continue
    }

    if (isCold && pending && pending.dueAt <= iso) {
      // A clean cold review of something that was due: advance.
      const step = base.step + 1
      const due = nextDue(step, now, opts)
      out.push(due ? { ...base, step, dueAt: due } : { ...base, step, status: 'done', completedAt: iso, dueAt: pending.dueAt })
      continue
    }

    if (!prev && (productive || t.reviewType === 'exercise')) {
      // First production: schedule the first spaced review.
      const due = nextDue(0, now, opts)
      if (due) out.push({ ...base, dueAt: due })
      continue
    }

    if (prev?.status === 'done' && productive && isCold) continue
    // Otherwise (practice while already scheduled) leave it be.
  }
  return out
}

export function dueReviews(queue: ReviewItem[], now: Date = new Date()): ReviewItem[] {
  const iso = now.toISOString()
  return queue.filter((r) => r.status === 'pending' && r.dueAt <= iso).sort((a, b) => a.dueAt.localeCompare(b.dueAt))
}

export function reviewsDueBy(queue: ReviewItem[], endIso: string): ReviewItem[] {
  return queue.filter((r) => r.status === 'pending' && r.dueAt <= endIso)
}

const PRODUCTION_KINDS: Exercise['kind'][] = ['code', 'reorder', 'output']

/**
 * Pick exercises for a review session, deterministically.
 * For each due skill: prefer a production rep on that skill from a day up to
 * today, least recently attempted, not touched in the last 12 hours.
 */
export function buildReviewSession(due: ReviewItem[], exercises: Exercise[], exerciseDay: Record<string, string>, attempts: Attempt[], today: string, now: Date, limit = 12): string[] {
  const lastTouched = new Map<string, string>()
  for (const a of attempts) {
    const t = a.completedAt ?? a.startedAt
    if ((lastTouched.get(a.exerciseId) ?? '') < t) lastTouched.set(a.exerciseId, t)
  }
  const cutoff = new Date(now.getTime() - 12 * 3_600_000).toISOString()
  const chosen: string[] = []
  const covered = new Set<string>()

  for (const item of due) {
    if (chosen.length >= limit) break
    if (item.reviewType === 'exercise' && item.exerciseId) {
      if (!chosen.includes(item.exerciseId)) chosen.push(item.exerciseId)
      continue
    }
    const skill = item.skillId!
    if (covered.has(skill)) continue
    const pool = exercises.filter(
      (e) => e.skills.includes(skill) && PRODUCTION_KINDS.includes(e.kind) && (exerciseDay[e.id] ?? today) <= today && !chosen.includes(e.id) && e.repType !== 'capstone',
    )
    const ranked = pool
      .map((e) => ({ e, last: lastTouched.get(e.id) ?? '' }))
      .sort((x, y) => {
        const xr = x.last > cutoff ? 1 : 0
        const yr = y.last > cutoff ? 1 : 0
        if (xr !== yr) return xr - yr
        // Prefer code over output, harder over easier.
        const xk = x.e.kind === 'code' ? 0 : 1
        const yk = y.e.kind === 'code' ? 0 : 1
        if (xk !== yk) return xk - yk
        if (x.last !== y.last) return x.last.localeCompare(y.last)
        return y.e.difficulty - x.e.difficulty
      })
    const pick = ranked[0]?.e
    if (!pick) continue
    chosen.push(pick.id)
    for (const s of pick.skills) covered.add(s)
  }
  return chosen
}
