import { z } from 'zod'
import type { Attempt, DayModule, Exercise, ReviewItem, SkillId } from '@/lib/types'
import { computeSkillMastery, type SkillMastery } from '@/lib/mastery'
import { scheduleAfterAttempt } from '@/lib/schedule'
import { dayStats } from '@/lib/progress'
import type { DailyProgressRow, GeneratedRepRow, MasteryRow, StudyStateRow, Table } from '@/lib/storage/types'
import { TABLES } from '@/lib/storage/types'
import type { SyncEngine } from '@/lib/storage/sync'

/**
 * The one interface the study UI talks to. Components never see IndexedDB or
 * Supabase; they call these methods, which apply deterministic rules (mastery,
 * scheduling, daily progress) and hand rows to the sync engine.
 */

export interface RepositoryConfig {
  skillIds: SkillId[]
  dayFor: (date: string) => DayModule | undefined
  lastDay: string
  now?: () => Date
}

/** How long study_state writes (drafts, location) wait before going to Supabase. */
export const STATE_FLUSH_MS = 15_000

function masteryRow(m: SkillMastery, updatedAt: string): MasteryRow {
  return {
    id: m.skillId,
    skillId: m.skillId,
    score: m.score,
    status: m.status,
    attempts: m.attempts,
    correct: m.correct,
    failures: m.failures,
    consecutiveCorrect: m.consecutiveCorrect,
    coldCorrect: m.coldCorrect,
    hintsUsed: m.hintsUsed,
    solutionViews: m.solutionViews,
    lastPracticed: m.lastPracticed,
    updatedAt,
  }
}

/** Same content, ignoring updatedAt, so unchanged derived rows are never re-synced. */
function sameContent<T extends { updatedAt: string }>(a: T | undefined, b: T): boolean {
  if (!a) return false
  return JSON.stringify({ ...a, updatedAt: '' }) === JSON.stringify({ ...b, updatedAt: '' })
}

export class RepsRepository {
  /**
   * When a rep was last completed in this tab. Lets the UI tell a genuine
   * completion (animate) from hydration or remote sync (snap, no celebration).
   */
  lastLocalCompletionAt = 0

  constructor(
    readonly engine: SyncEngine,
    private config: RepositoryConfig,
  ) {}

  private now() {
    return this.config.now?.() ?? new Date()
  }

  // ── reads ──────────────────────────────────────────────────────────────────

  attempts(): Attempt[] {
    return this.engine.all('attempts')
  }
  reviews(): ReviewItem[] {
    return this.engine.all('review_queue')
  }
  masteryRows(): MasteryRow[] {
    return this.engine.all('skill_mastery')
  }
  dailyRows(): DailyProgressRow[] {
    return this.engine.all('daily_progress')
  }
  generated(): GeneratedRepRow[] {
    return this.engine.all('generated_reps')
  }
  state<V>(key: string): V | undefined {
    return this.engine.get('study_state', key)?.value as V | undefined
  }

  // ── attempts ───────────────────────────────────────────────────────────────

  /**
   * Save an attempt (in progress or finished). Finished attempts also update
   * the review queue, the skill mastery snapshot and daily progress.
   * Idempotent by attempt id, so retries never duplicate history.
   */
  recordAttempt(attempt: Attempt, exercise: Exercise): Promise<void> {
    const now = this.now()
    const iso = now.toISOString()
    const existing = this.engine.get('attempts', attempt.id)
    // Never turn a finished attempt back into an unfinished one.
    if (existing?.completedAt && !attempt.completedAt) return Promise.resolve()
    const row: Attempt = { ...attempt, updatedAt: iso }
    if (row.passed && row.completedAt && !existing?.completedAt) this.lastLocalCompletionAt = Date.now()
    const writes: Promise<void>[] = [this.engine.save('attempts', [row])]

    if (row.completedAt && !existing?.completedAt) {
      const updates = scheduleAfterAttempt(row, exercise, this.reviews(), now, { lastDay: this.config.lastDay })
      if (updates.length) writes.push(this.engine.save('review_queue', updates))
    }
    writes.push(this.refreshDerived(row.skills, [row.date]))
    return Promise.all(writes).then(() => undefined)
  }

  /** Recompute mastery and daily progress from attempt history; persist what changed. */
  refreshDerived(skills: SkillId[] = this.config.skillIds, dates?: string[]): Promise<void> {
    const iso = this.now().toISOString()
    const attempts = this.attempts()
    const mastery: MasteryRow[] = []
    for (const s of skills) {
      const m = computeSkillMastery(s, attempts)
      if (m.status === 'unseen') continue
      const row = masteryRow(m, iso)
      if (!sameContent(this.engine.get('skill_mastery', s), row)) mastery.push(row)
    }
    const daily: DailyProgressRow[] = []
    const allDates = dates ?? [...new Set(attempts.map((a) => a.date))]
    for (const d of allDates) {
      const day = this.config.dayFor(d)
      if (!day) continue
      const st = dayStats(day, attempts)
      const row: DailyProgressRow = {
        id: d,
        studyDate: d,
        completedReps: st.completed,
        totalReps: st.total,
        completionPercent: st.percent,
        sectionsCompleted: st.sectionsCompleted,
        completed: st.complete,
        timeSpentSeconds: st.timeSpentSeconds,
        updatedAt: iso,
      }
      if (!sameContent(this.engine.get('daily_progress', d), row)) daily.push(row)
    }
    return Promise.all([this.engine.save('skill_mastery', mastery), this.engine.save('daily_progress', daily)]).then(() => undefined)
  }

  /** Days can be completed through reps from other days, so refresh every curriculum day. */
  refreshAllDaily(dates: string[]): Promise<void> {
    return this.refreshDerived([], dates)
  }

  // ── reviews ────────────────────────────────────────────────────────────────

  saveReviews(items: ReviewItem[]): Promise<void> {
    return this.engine.save('review_queue', items)
  }

  // ── study state (drafts, location, mocks, sessions) ────────────────────────

  setState(key: string, value: unknown, opts: { flushDelayMs?: number } = {}): Promise<void> {
    const row: StudyStateRow = { id: key, value, updatedAt: this.now().toISOString() }
    return this.engine.save('study_state', [row], { flushDelayMs: opts.flushDelayMs ?? STATE_FLUSH_MS })
  }

  draft(exerciseId: string): string | undefined {
    return this.state<{ code: string }>(`draft:${exerciseId}`)?.code
  }

  saveDraft(exerciseId: string, code: string): Promise<void> {
    if (this.draft(exerciseId) === code) return Promise.resolve()
    return this.setState(`draft:${exerciseId}`, { code })
  }

  // ── generated reps ─────────────────────────────────────────────────────────

  saveGenerated(rows: GeneratedRepRow[]): Promise<void> {
    return this.engine.save('generated_reps', rows, { flushDelayMs: 0 })
  }

  markGeneratedUsed(id: string): Promise<void> {
    const row = this.engine.get('generated_reps', id)
    if (!row || row.usedAt) return Promise.resolve()
    const iso = this.now().toISOString()
    return this.engine.save('generated_reps', [{ ...row, usedAt: iso, updatedAt: iso }])
  }

  // ── export / import ────────────────────────────────────────────────────────

  exportData(): ExportBundle {
    const bundle = { app: 'reps', version: 1, exportedAt: this.now().toISOString() } as ExportBundle
    for (const t of TABLES) (bundle as unknown as Record<Table, unknown[]>)[t] = this.engine.all(t)
    return bundle
  }

  /** Validate, then merge without duplicating: attempts by id, everything else newest-wins. */
  async importData(input: unknown): Promise<{ added: Record<Table, number> }> {
    const bundle = exportSchema.parse(input)
    const added = Object.fromEntries(TABLES.map((t) => [t, 0])) as Record<Table, number>
    const writes: Promise<void>[] = []

    const attempts = (bundle.attempts as Attempt[]).filter((a) => {
      const cur = this.engine.get('attempts', a.id)
      return !cur || (!cur.completedAt && a.completedAt)
    })
    added.attempts = attempts.length
    writes.push(this.engine.save('attempts', attempts))

    for (const t of ['review_queue', 'generated_reps', 'study_state'] as const) {
      const rows = (bundle[t] as { id: string; updatedAt: string }[]).filter((r) => {
        const cur = this.engine.get(t, r.id) as { updatedAt: string } | undefined
        return !cur || cur.updatedAt < r.updatedAt
      })
      added[t] = rows.length
      writes.push(this.engine.save(t, rows as never))
    }
    await Promise.all(writes)
    // Mastery and daily progress are derived: recompute from the merged history.
    await this.refreshDerived(this.config.skillIds, [...new Set(this.attempts().map((a) => a.date))])
    added.skill_mastery = bundle.skill_mastery.length
    added.daily_progress = bundle.daily_progress.length
    return { added }
  }
}

// ── export schema ────────────────────────────────────────────────────────────

const attemptSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  skills: z.array(z.string()),
  stage: z.string(),
  mode: z.enum(['learn', 'practice', 'interview']),
  code: z.string().optional(),
  answer: z.string().optional(),
  passed: z.boolean(),
  attemptsBeforePass: z.number().int().min(0),
  hintsUsed: z.number().int().min(0),
  solutionViewed: z.boolean(),
  runtimeErrors: z.array(z.string()),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  durationSeconds: z.number().optional(),
  confidence: z.number().int().min(1).max(5).optional(),
  mistakeType: z.string().optional(),
  mistakeNote: z.string().optional(),
  retrievalType: z.enum(['first-exposure', 'immediate-reconstruction', 'cold']),
  sessionKind: z.string().optional(),
  updatedAt: z.string(),
})

const keyed = z.object({ id: z.string().min(1), updatedAt: z.string() }).passthrough()

export const exportSchema = z.object({
  app: z.literal('reps'),
  version: z.literal(1),
  exportedAt: z.string(),
  attempts: z.array(attemptSchema),
  skill_mastery: z.array(keyed).default([]),
  daily_progress: z.array(keyed).default([]),
  review_queue: z.array(
    keyed.extend({ reviewType: z.enum(['skill', 'exercise']), dueAt: z.string(), step: z.number(), status: z.enum(['pending', 'done']) }),
  ),
  generated_reps: z.array(keyed.extend({ cacheKey: z.string(), signature: z.string(), payload: z.record(z.string(), z.unknown()) })).default([]),
  study_state: z.array(keyed).default([]),
})

export type ExportBundle = z.infer<typeof exportSchema>
