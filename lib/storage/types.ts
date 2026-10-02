import type { Attempt, Exercise, ReviewItem, SkillId } from '@/lib/types'
import type { MasteryStatus } from '@/lib/mastery'

/**
 * Persistence model.
 *
 *   UI ── optimistic in-memory state
 *        └─ local cache (IndexedDB): instant reloads, offline, pending-write outbox
 *            └─ remote (Supabase): durable source of truth across devices
 *
 * Every synced row has a string `id` (unique per user) and an `updatedAt`.
 */

export interface MasteryRow {
  id: SkillId
  skillId: SkillId
  score: number
  status: MasteryStatus
  attempts: number
  correct: number
  failures: number
  consecutiveCorrect: number
  coldCorrect: number
  hintsUsed: number
  solutionViews: number
  lastPracticed?: string
  updatedAt: string
}

export interface DailyProgressRow {
  id: string // study date
  studyDate: string
  completedReps: number
  totalReps: number
  completionPercent: number
  sectionsCompleted: string[]
  completed: boolean
  timeSpentSeconds: number
  updatedAt: string
}

export interface GeneratedRepRow {
  id: string
  /** skills|difficulty|type, see lib/coach/cache.ts */
  cacheKey: string
  signature: string
  type: string
  difficulty: number
  skills: SkillId[]
  payload: Exercise
  validated: boolean
  createdAt: string
  usedAt?: string
  updatedAt: string
}

/** Small keyed working state: code drafts, current location, mock results, sessions. */
export interface StudyStateRow {
  id: string
  value: unknown
  updatedAt: string
}

export interface TableRows {
  attempts: Attempt
  skill_mastery: MasteryRow
  daily_progress: DailyProgressRow
  review_queue: ReviewItem
  generated_reps: GeneratedRepRow
  study_state: StudyStateRow
}

export type Table = keyof TableRows
export type Row<T extends Table = Table> = TableRows[T]

export const TABLES: Table[] = ['attempts', 'skill_mastery', 'daily_progress', 'review_queue', 'generated_reps', 'study_state']

/** A pending remote write. Coalesced by `key` so only the latest version is sent. */
export interface OutboxOp {
  key: string // `${table}:${id}`
  table: Table
  row: Row
  queuedAt: string
  tries: number
}

/** Fast local cache + outbox. IndexedDB in the browser, memory in tests. */
export interface LocalStore {
  getAll<T extends Table>(table: T): Promise<Row<T>[]>
  putMany<T extends Table>(table: T, rows: Row<T>[]): Promise<void>
  enqueue(ops: OutboxOp[]): Promise<void>
  outbox(): Promise<OutboxOp[]>
  /** Remove ops only if they were not re-queued since (same queuedAt). */
  ack(ops: Pick<OutboxOp, 'key' | 'queuedAt'>[]): Promise<void>
  getMeta<V>(key: string): Promise<V | undefined>
  setMeta<V>(key: string, value: V): Promise<void>
  clear(): Promise<void>
}

/** Durable store. Supabase in the app, a fake in tests. */
export interface RemoteStore {
  /** Configured and signed in. */
  ready(): Promise<boolean>
  upsert<T extends Table>(table: T, rows: Row<T>[]): Promise<void>
  /** Rows changed at or after `since` (server time), with the new cursor. */
  pull<T extends Table>(table: T, since?: string): Promise<{ rows: Row<T>[]; cursor?: string }>
  /** An unused, validated generated rep for this key whose signature is not excluded. */
  findGenerated(cacheKey: string, excludeSignatures: string[]): Promise<GeneratedRepRow | null>
}

export type SyncStatus = 'local-only' | 'signed-out' | 'syncing' | 'saved' | 'offline'
