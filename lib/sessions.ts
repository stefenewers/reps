import type { Attempt, Exercise, Session, SessionKind, SkillId } from '@/lib/types'
import type { RepsRepository } from '@/lib/storage/repository'
import type { SkillMastery } from '@/lib/mastery'
import { EXERCISE_BY_ID, DAY_OF_EXERCISE, ALL_EXERCISES } from '@/data/curriculum'
import { SKILL_BY_ID } from '@/data/skills'

/**
 * Sessions are short ordered queues of reps outside the day sequence: review,
 * repair, challenge, weakest skills. Stored in study_state so they survive a
 * reload and follow you across devices.
 */

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export async function createSession(repo: RepsRepository, kind: SessionKind, title: string, exerciseIds: string[], returnTo?: string): Promise<Session> {
  const s: Session = { id: newId().slice(0, 8), kind, title, exerciseIds, createdAt: new Date().toISOString(), returnTo }
  await repo.setState(`session:${s.id}`, s, { flushDelayMs: 2000 })
  return s
}

export function getSession(repo: RepsRepository, id: string | null | undefined): Session | undefined {
  return id ? repo.state<Session>(`session:${id}`) : undefined
}

/** Curriculum exercise or a generated rep from the pool. */
export function findExercise(repo: RepsRepository, id: string): Exercise | undefined {
  return EXERCISE_BY_ID[id] ?? repo.generated().find((g) => g.payload.id === id)?.payload
}

const STAGE_ORDER: Exercise['stage'][] = ['recognize', 'trace', 'complete', 'recall', 'microbuild', 'reconstruct', 'combine', 'pattern', 'retrieval', 'capstone', 'interview']

/** Depth in the prerequisite graph: primitives first. */
export function skillDepth(id: SkillId, seen = new Set<SkillId>()): number {
  if (seen.has(id)) return 0
  seen.add(id)
  const pre = SKILL_BY_ID[id]?.prerequisites ?? []
  return pre.length ? 1 + Math.max(...pre.map((p) => skillDepth(p, seen))) : 0
}

/**
 * Repair Reps: a tiny, deterministic sequence that rebuilds the missing
 * primitives before retrying a capstone. For each target skill (primitives
 * first, weakest first) pick one small production rep, then one that combines
 * it, never a capstone.
 */
export function buildRepairSet(skills: SkillId[], mastery: Record<SkillId, SkillMastery>, attempts: Attempt[], today: string, limit = 5): string[] {
  const recent = new Set(attempts.filter((a) => a.passed && Date.now() - new Date(a.completedAt ?? a.startedAt).getTime() < 30 * 60_000).map((a) => a.exerciseId))
  const ordered = [...new Set(skills)].filter((s) => SKILL_BY_ID[s]).sort((a, b) => skillDepth(a) - skillDepth(b) || (mastery[a]?.score ?? 0) - (mastery[b]?.score ?? 0))
  const picked: string[] = []
  const usable = (e: Exercise) => e.repType !== 'capstone' && e.kind !== 'explain' && e.kind !== 'choice' && (DAY_OF_EXERCISE[e.id] ?? today) <= today && !recent.has(e.id) && !picked.includes(e.id)

  for (const s of ordered) {
    const pool = ALL_EXERCISES.filter((e) => e.skills.includes(s) && usable(e)).sort(
      (a, b) => a.skills.length - b.skills.length || STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
    )
    const first = pool.find((e) => e.kind === 'code' || e.kind === 'output')
    if (first) picked.push(first.id)
    if (picked.length >= limit) break
  }
  // Finish with one combining rep across the targets, if there is room.
  if (picked.length < limit && ordered.length > 1) {
    const combo = ALL_EXERCISES.filter((e) => usable(e) && e.kind === 'code' && ordered.filter((s) => e.skills.includes(s)).length >= 2).sort(
      (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
    )[0]
    if (combo) picked.push(combo.id)
  }
  return picked.slice(0, limit)
}

/** Reps on the weakest skills: one production rep per skill, least recent first. */
export function buildSkillSession(skills: SkillId[], attempts: Attempt[], today: string, limit = 10): string[] {
  const last = new Map<string, string>()
  for (const a of attempts) {
    const t = a.completedAt ?? a.startedAt
    if ((last.get(a.exerciseId) ?? '') < t) last.set(a.exerciseId, t)
  }
  const out: string[] = []
  let round = 0
  while (out.length < limit && round < 4) {
    let added = false
    for (const s of skills) {
      if (out.length >= limit) break
      const pool = ALL_EXERCISES.filter(
        (e) => e.skills.includes(s) && e.repType !== 'capstone' && e.kind !== 'explain' && (DAY_OF_EXERCISE[e.id] ?? today) <= today && !out.includes(e.id),
      ).sort((a, b) => (last.get(a.id) ?? '').localeCompare(last.get(b.id) ?? '') || STAGE_ORDER.indexOf(b.stage) - STAGE_ORDER.indexOf(a.stage))
      if (pool[0]) {
        out.push(pool[0].id)
        added = true
      }
    }
    if (!added) break
    round++
  }
  return out
}
