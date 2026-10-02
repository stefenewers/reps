import type { GeneratedRepRow } from '@/lib/storage/types'
import type { RepsRepository } from '@/lib/storage/repository'
import { isDuplicate } from '@/lib/coach/dedupe'

/**
 * The generated-rep pool. Before paying for a generation:
 *   1. local cache   2. Supabase pool   3. only then the model.
 */

export function cacheKey(skills: string[], difficulty: number, type: string): string {
  return `${[...new Set(skills)].sort().join(',')}|${Math.round(difficulty)}|${type}`
}

export function findLocal(rows: GeneratedRepRow[], key: string, exclude: string[]): GeneratedRepRow | undefined {
  return rows
    .filter((g) => g.cacheKey === key && g.validated && !g.usedAt && !isDuplicate(g.signature, exclude))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
}

export async function findCachedRep(repo: RepsRepository, key: string, exclude: string[]): Promise<{ row: GeneratedRepRow; source: 'local' | 'remote' } | null> {
  const local = findLocal(repo.generated(), key, exclude)
  if (local) return { row: local, source: 'local' }
  const remote = repo.engine.remoteStore()
  try {
    if (remote && (await remote.ready())) {
      const hit = await remote.findGenerated(key, exclude)
      if (hit && !isDuplicate(hit.signature, exclude)) {
        await repo.engine.adopt('generated_reps', [hit])
        return { row: hit, source: 'remote' }
      }
    }
  } catch {
    /* offline: fall through to generation */
  }
  return null
}
