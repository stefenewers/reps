import type { Pack, PackSection, ProblemBridge } from '@/data/exercises/bridges/types'
import type { Brief } from '@/data/briefs'
import type { Primer } from '@/data/primers/types'
import { pack as hashingPointers } from '@/data/exercises/bridges/hashing-pointers'
import { pack as windowsSearch } from '@/data/exercises/bridges/windows-search'
import { pack as listsTries } from '@/data/exercises/bridges/lists-tries'
import { pack as trees } from '@/data/exercises/bridges/trees'
import { pack as graphsIntervals } from '@/data/exercises/bridges/graphs-intervals'
import { pack as backtrackingMatrix } from '@/data/exercises/bridges/backtracking-matrix'
import { pack as dp } from '@/data/exercises/bridges/dp'

/**
 * The bridge curriculum, added for the 90-day plan: the pattern ladders and
 * mastery checks that were missing, and for every LeetCode target the short
 * ladder of reps that teaches the moves its pattern ladder does not.
 */
export const PACKS: Pack[] = [hashingPointers, windowsSearch, listsTries, trees, graphsIntervals, backtrackingMatrix, dp]

export const PACK_SECTIONS: PackSection[] = PACKS.flatMap((p) => p.sections)
export const PACK_BRIDGES: ProblemBridge[] = PACKS.flatMap((p) => p.bridges)
export const PACK_BRIEFS: Record<string, Brief> = Object.assign({}, ...PACKS.map((p) => p.briefs))
export const PACK_PRIMERS: Primer[] = PACKS.flatMap((p) => p.primers)

/** New ladders and mastery checks, by plan unit name. */
export const PACK_UNITS: Record<string, { ladder?: string[]; check?: string }> = {}
for (const p of PACKS) for (const [name, u] of Object.entries(p.units ?? {})) PACK_UNITS[name] = { ...PACK_UNITS[name], ...u }
