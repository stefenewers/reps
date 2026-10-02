'use client'

import { accessToken } from '@/lib/supabase'
import type { RepsRepository } from '@/lib/storage/repository'
import type { GeneratedRepRow } from '@/lib/storage/types'
import type { Exercise, SkillId } from '@/lib/types'
import type { SkillMastery } from '@/lib/mastery'
import { cacheKey, findCachedRep } from '@/lib/coach/cache'
import { recentSignatures } from '@/lib/coach/dedupe'
import { verifyGeneratedRep } from '@/lib/coach/verify'
import { toExercise, type Diagnosis, type GenerateRequest, type Plan } from '@/lib/coach/schemas'
import { getRunner } from '@/lib/python/runner'
import { newId } from '@/lib/sessions'

/**
 * Browser side of the adaptive coach. Every call here is explicitly requested
 * by the learner. Nothing runs on page load.
 */

export class CoachError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message)
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = await accessToken()
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new CoachError(data.error ?? `Request failed (${res.status})`, res.status)
  return data as T
}

/** Compact context: only what the model needs, never the whole history. */
export function compactMastery(skills: SkillId[], mastery: Record<SkillId, SkillMastery>): Record<string, number> {
  return Object.fromEntries(skills.map((s) => [s, mastery[s]?.score ?? 0]))
}

export function recentMistakes(repo: RepsRepository, skills: SkillId[], limit = 4): string[] {
  const want = new Set(skills)
  return repo
    .attempts()
    .filter((a) => a.mistakeNote && a.skills.some((s) => want.has(s)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
    .map((a) => a.mistakeNote!.slice(0, 150))
}

export function signaturesFor(repo: RepsRepository, skills: SkillId[], extra: { signature: string; skills: string[] }[] = []): string[] {
  const fromGenerated = repo.generated().map((g) => ({ signature: g.signature, skills: g.skills, at: g.usedAt ?? g.createdAt }))
  const fromAttempts = repo.attempts().flatMap((a) => {
    const g = repo.generated().find((x) => x.payload.id === a.exerciseId)
    return g ? [] : []
  })
  const now = new Date().toISOString()
  return recentSignatures([...fromGenerated, ...fromAttempts, ...extra.map((e) => ({ ...e, at: now }))], skills)
}

export interface AnotherRepOptions {
  skills: SkillId[]
  type: GenerateRequest['type']
  difficulty: number
  format?: GenerateRequest['format']
  hidePattern?: boolean
  basedOn?: Exercise
  count?: number
}

export interface AnotherRepResult {
  exercise: Exercise
  source: 'local' | 'remote' | 'generated'
}

/**
 * Another rep on the same skills: cache first (local, then Supabase), then the
 * model. A generated rep is verified by running it; one regeneration is
 * allowed, then we give up gracefully rather than show a broken rep.
 */
export async function getAnotherRep(repo: RepsRepository, mastery: Record<SkillId, SkillMastery>, o: AnotherRepOptions): Promise<AnotherRepResult> {
  const difficulty = Math.min(5, Math.max(1, Math.round(o.difficulty)))
  const key = cacheKey(o.skills, difficulty, o.type)
  const exclude = signaturesFor(repo, o.skills, o.basedOn ? [{ signature: o.basedOn.signature, skills: o.basedOn.skills }] : [])

  const cached = await findCachedRep(repo, key, exclude)
  if (cached) {
    await repo.markGeneratedUsed(cached.row.id)
    return { exercise: cached.row.payload, source: cached.source }
  }

  const runner = getRunner()
  const run = (code: string, tests: Parameters<typeof runner.run>[1]) => runner.run(code, tests, 6000)
  const request: GenerateRequest = {
    skills: o.skills,
    mastery: compactMastery(o.skills, mastery),
    recentMistakes: recentMistakes(repo, o.skills),
    recentSignatures: exclude,
    desiredDifficulty: difficulty,
    type: o.type,
    format: o.format ?? 'any',
    count: o.count ?? 1,
    hidePattern: o.hidePattern ?? false,
    basedOn: o.basedOn ? `${o.basedOn.title}: ${o.basedOn.prompt.slice(0, 400)}` : undefined,
  }

  let failure: string | undefined
  for (let round = 0; round < 2; round++) {
    void runner.ensure()
    const { reps } = await post<{ reps: unknown[] }>('/api/coach/generate', failure ? { ...request, count: 1, previousFailure: failure } : request)
    const rows: GeneratedRepRow[] = []
    for (const raw of reps) {
      const v = await verifyGeneratedRep(raw, run, o.skills)
      if (!v.ok || !v.rep) {
        failure = v.reason
        if (v.reason?.startsWith('python unavailable')) throw new CoachError('Python could not load to check the generated rep.')
        continue
      }
      const createdAt = new Date().toISOString()
      const id = newId()
      rows.push({
        id,
        cacheKey: key,
        signature: v.rep.signature,
        type: v.rep.type,
        difficulty: v.rep.difficulty,
        skills: v.rep.skills,
        payload: toExercise(v.rep, `gen-${id}`, key, createdAt),
        validated: true,
        createdAt,
        updatedAt: createdAt,
      })
    }
    if (rows.length) {
      const [use, ...spare] = rows
      const usedAt = new Date().toISOString()
      // The first is used now; spares stay unused in the pool for next time.
      await repo.saveGenerated([{ ...use, usedAt, updatedAt: usedAt }, ...spare])
      return { exercise: use.payload, source: 'generated' }
    }
  }
  throw new CoachError('Another rep could not be generated this time. Try again, or take a curriculum rep on the same skills.')
}

export function requestHint(body: { title: string; prompt: string; skills: string[]; code: string; level: number; previousHints: string[]; failure?: string }) {
  return post<{ hint: string }>('/api/coach/hint', body)
}

export function requestDiagnosis(body: unknown) {
  return post<Diagnosis>('/api/coach/diagnose', body)
}

export function requestFollowUp(body: { title: string; prompt: string; code: string }) {
  return post<{ questions: string[] }>('/api/coach/interview', { mode: 'followup', ...body })
}

export function requestInterviewReview(body: unknown) {
  return post<{ summary: string; strengths: string[]; improvements: string[]; nextReps: string[] }>('/api/coach/interview', { mode: 'review', ...(body as object) })
}

export function requestExplanationCheck(body: { title: string; prompt: string; rubric: string[]; explanation: string }) {
  return post<{ met: boolean[]; feedback: string }>('/api/coach/verify', body)
}

export function requestPlan(body: { request: string; weakest: string[] }) {
  return post<Plan>('/api/coach/plan', body)
}
