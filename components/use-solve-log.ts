'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { DAYS } from '@/data/curriculum'
import { SOLVE_PREFIX, solveKey, type SolveEntry } from '@/lib/solve-log'
import type { LeetcodeItem } from '@/lib/types'

/** One record per LeetCode number in the plan: title, link, walkthrough. */
const LC_META = new Map<number, LeetcodeItem>()
for (const d of DAYS) for (const x of d.leetcode ?? []) if (!LC_META.has(x.lc)) LC_META.set(x.lc, x)
export const lcMeta = (lc: number) => LC_META.get(lc)

/** The synced solve log: entries, and how to write or remove one. */
export function useSolveLog() {
  const { repo, version, today } = useReps()
  const entries = useMemo(
    () => repo.statesWithPrefix<SolveEntry>(SOLVE_PREFIX).sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at)),
    // `version` changes whenever the synced state does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [repo, version],
  )
  const save = (e: Omit<SolveEntry, 'at'>) => repo.setState(solveKey(e.id), { ...e, at: new Date().toISOString() })
  const remove = (id: string) => repo.setState(solveKey(id), {})
  return { entries, save, remove, today }
}
