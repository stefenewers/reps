import type { SupabaseClient } from '@supabase/supabase-js'
import type { Attempt, ReviewItem } from '@/lib/types'
import type { DailyProgressRow, GeneratedRepRow, MasteryRow, RemoteStore, Row, StudyStateRow, Table } from '@/lib/storage/types'

/**
 * Supabase as the durable store (the existing stefenewers.com project, tables
 * prefixed `reps_`). Each table maps camelCase rows to the
 * snake_case columns in supabase/migrations. `user_id` is never sent: the
 * database fills it from auth.uid() and RLS restricts rows to that user.
 */

type DbRow = Record<string, unknown>

const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v)
const u = <T>(v: T | null | undefined): T | undefined => (v === null || v === undefined ? undefined : v)

interface Mapper<T> {
  /** Column(s) forming the conflict target with user_id. */
  key: string
  toDb(row: T): DbRow
  fromDb(row: DbRow): T
}

const attempts: Mapper<Attempt> = {
  key: 'id',
  toDb: (a) => ({
    id: a.id,
    exercise_id: a.exerciseId,
    study_date: a.date,
    skills: a.skills,
    stage: a.stage,
    mode: a.mode,
    code: n(a.code),
    answer: n(a.answer),
    passed: a.passed,
    attempts_before_pass: a.attemptsBeforePass,
    hints_used: a.hintsUsed,
    solution_viewed: a.solutionViewed,
    runtime_errors: a.runtimeErrors,
    duration_seconds: n(a.durationSeconds),
    confidence: n(a.confidence),
    mistake_type: n(a.mistakeType),
    mistake_note: n(a.mistakeNote),
    retrieval_type: a.retrievalType,
    session_kind: n(a.sessionKind),
    started_at: a.startedAt,
    completed_at: n(a.completedAt),
  }),
  fromDb: (r) => ({
    id: r.id as string,
    exerciseId: r.exercise_id as string,
    date: r.study_date as string,
    skills: (r.skills as string[]) ?? [],
    stage: r.stage as Attempt['stage'],
    mode: r.mode as Attempt['mode'],
    code: u(r.code as string | null),
    answer: u(r.answer as string | null),
    passed: Boolean(r.passed),
    attemptsBeforePass: Number(r.attempts_before_pass ?? 0),
    hintsUsed: Number(r.hints_used ?? 0),
    solutionViewed: Boolean(r.solution_viewed),
    runtimeErrors: (r.runtime_errors as string[]) ?? [],
    durationSeconds: u(r.duration_seconds as number | null),
    confidence: u(r.confidence as Attempt['confidence'] | null),
    mistakeType: u(r.mistake_type as string | null),
    mistakeNote: u(r.mistake_note as string | null),
    retrievalType: r.retrieval_type as Attempt['retrievalType'],
    sessionKind: u(r.session_kind as Attempt['sessionKind'] | null),
    startedAt: r.started_at as string,
    completedAt: u(r.completed_at as string | null),
    updatedAt: r.updated_at as string,
  }),
}

const mastery: Mapper<MasteryRow> = {
  key: 'skill_id',
  toDb: (m) => ({
    skill_id: m.skillId,
    mastery_score: m.score,
    status: m.status,
    attempts: m.attempts,
    correct_attempts: m.correct,
    incorrect_attempts: m.failures,
    consecutive_correct: m.consecutiveCorrect,
    cold_correct: m.coldCorrect,
    hints_used: m.hintsUsed,
    solution_views: m.solutionViews,
    last_practiced_at: n(m.lastPracticed),
  }),
  fromDb: (r) => ({
    id: r.skill_id as string,
    skillId: r.skill_id as string,
    score: Number(r.mastery_score),
    status: r.status as MasteryRow['status'],
    attempts: Number(r.attempts),
    correct: Number(r.correct_attempts),
    failures: Number(r.incorrect_attempts),
    consecutiveCorrect: Number(r.consecutive_correct),
    coldCorrect: Number(r.cold_correct),
    hintsUsed: Number(r.hints_used),
    solutionViews: Number(r.solution_views),
    lastPracticed: u(r.last_practiced_at as string | null),
    updatedAt: r.updated_at as string,
  }),
}

const daily: Mapper<DailyProgressRow> = {
  key: 'study_date',
  toDb: (d) => ({
    study_date: d.studyDate,
    completed_reps: d.completedReps,
    total_reps: d.totalReps,
    completion_percent: d.completionPercent,
    sections_completed: d.sectionsCompleted,
    completed: d.completed,
    time_spent_seconds: d.timeSpentSeconds,
  }),
  fromDb: (r) => ({
    id: r.study_date as string,
    studyDate: r.study_date as string,
    completedReps: Number(r.completed_reps),
    totalReps: Number(r.total_reps),
    completionPercent: Number(r.completion_percent),
    sectionsCompleted: (r.sections_completed as string[]) ?? [],
    completed: Boolean(r.completed),
    timeSpentSeconds: Number(r.time_spent_seconds ?? 0),
    updatedAt: r.updated_at as string,
  }),
}

const reviews: Mapper<ReviewItem> = {
  key: 'id',
  toDb: (r) => ({
    id: r.id,
    review_type: r.reviewType,
    skill_id: n(r.skillId),
    exercise_id: n(r.exerciseId),
    due_at: r.dueAt,
    step: r.step,
    reason: r.reason,
    status: r.status,
    created_at: r.createdAt,
    completed_at: n(r.completedAt),
  }),
  fromDb: (r) => ({
    id: r.id as string,
    reviewType: r.review_type as ReviewItem['reviewType'],
    skillId: u(r.skill_id as string | null),
    exerciseId: u(r.exercise_id as string | null),
    dueAt: r.due_at as string,
    step: Number(r.step),
    reason: r.reason as ReviewItem['reason'],
    status: r.status as ReviewItem['status'],
    createdAt: r.created_at as string,
    completedAt: u(r.completed_at as string | null),
    updatedAt: r.updated_at as string,
  }),
}

const generated: Mapper<GeneratedRepRow> = {
  key: 'id',
  toDb: (g) => ({
    id: g.id,
    cache_key: g.cacheKey,
    signature: g.signature,
    type: g.type,
    difficulty: g.difficulty,
    skills: g.skills,
    payload: g.payload,
    validated: g.validated,
    created_at: g.createdAt,
    used_at: n(g.usedAt),
  }),
  fromDb: (r) => ({
    id: r.id as string,
    cacheKey: r.cache_key as string,
    signature: r.signature as string,
    type: r.type as string,
    difficulty: Number(r.difficulty),
    skills: (r.skills as string[]) ?? [],
    payload: r.payload as GeneratedRepRow['payload'],
    validated: Boolean(r.validated),
    createdAt: r.created_at as string,
    usedAt: u(r.used_at as string | null),
    updatedAt: r.updated_at as string,
  }),
}

const studyState: Mapper<StudyStateRow> = {
  key: 'key',
  toDb: (s) => ({ key: s.id, value: s.value }),
  fromDb: (r) => ({ id: r.key as string, value: r.value, updatedAt: r.updated_at as string }),
}

export const MAPPERS: { [T in Table]: Mapper<Row<T>> } = {
  attempts,
  skill_mastery: mastery,
  daily_progress: daily,
  review_queue: reviews,
  generated_reps: generated,
  study_state: studyState,
}

/** Reps lives inside the shared stefenewers.com project; every table is namespaced. */
export function remoteTable(table: Table): string {
  return `reps_${table}`
}

const PAGE = 1000
/** Re-read a small overlap so rows committed out of order are not missed. */
const CURSOR_OVERLAP_MS = 60_000

export class SupabaseRemoteStore implements RemoteStore {
  constructor(private sb: SupabaseClient) {}

  async ready(): Promise<boolean> {
    const { data } = await this.sb.auth.getSession()
    return Boolean(data.session)
  }

  async upsert<T extends Table>(table: T, rows: Row<T>[]): Promise<void> {
    if (!rows.length) return
    const m = MAPPERS[table] as Mapper<Row<T>>
    const { error } = await this.sb.from(remoteTable(table)).upsert(rows.map(m.toDb), { onConflict: `user_id,${m.key}`, defaultToNull: false })
    if (error) throw new Error(`${table}: ${error.message}`)
  }

  async pull<T extends Table>(table: T, since?: string): Promise<{ rows: Row<T>[]; cursor?: string }> {
    const m = MAPPERS[table] as Mapper<Row<T>>
    const out: Row<T>[] = []
    let cursor = since
    const from = since ? new Date(new Date(since).getTime() - CURSOR_OVERLAP_MS).toISOString() : undefined
    for (let page = 0; ; page++) {
      let q = this.sb.from(remoteTable(table)).select('*').order('updated_at', { ascending: true }).range(page * PAGE, page * PAGE + PAGE - 1)
      if (from) q = q.gte('updated_at', from)
      const { data, error } = await q
      if (error) throw new Error(`${table}: ${error.message}`)
      for (const r of data ?? []) {
        out.push(m.fromDb(r))
        const ts = r.updated_at as string
        if (!cursor || ts > cursor) cursor = ts
      }
      if (!data || data.length < PAGE) break
    }
    return { rows: out, cursor }
  }

  async findGenerated(cacheKey: string, excludeSignatures: string[]): Promise<GeneratedRepRow | null> {
    const { data, error } = await this.sb
      .from(remoteTable('generated_reps'))
      .select('*')
      .eq('cache_key', cacheKey)
      .eq('validated', true)
      .is('used_at', null)
      .order('created_at', { ascending: true })
      .limit(10)
    if (error) throw new Error(`generated_reps: ${error.message}`)
    const exclude = new Set(excludeSignatures)
    const hit = (data ?? []).map(generated.fromDb).find((g) => !exclude.has(g.signature))
    return hit ?? null
  }
}
