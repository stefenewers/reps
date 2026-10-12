import type { BuildingBlock } from '@/data/exercises/bridges/types'
import type { Target } from '@/lib/bridges'
import { PACK_BRIDGES } from '@/data/exercises/bridges'
import { MODULES } from '@/data/curriculum'
import { PROBLEMS } from '@/data/problems'
import { PLAN_90, PLAN_CAPSTONES, PLAN_UNITS, PLAN_WHEN_AHEAD } from '@/data/schedule-90'

/**
 * The prerequisite graph of every first-contact target in the 90-day plan.
 *
 * - A problem solved on LeetCode has an authored bridge (data/exercises/bridges):
 *   its building blocks, the existing ladder reps that already demonstrate some
 *   of them, and the bridge reps that teach the rest.
 * - A problem whose first solve is a Reps capstone is reached through its
 *   pattern ladder: each ladder section since the previous capstone is one of
 *   its building blocks, demonstrated by that section's code reps.
 */

const SECTION = new Map(MODULES.flatMap((m) => m.sections.map((s) => [s.id, s] as const)))
const CAPSTONE_LC = new Map(Object.entries(PLAN_CAPSTONES).map(([lc, id]) => [id, Number(lc)]))
const PLAN_REPS = new Set(PLAN_90.flatMap((d) => d.sections.flatMap((s) => s.reps)))
const TITLE = new Map(PROBLEMS.map((p) => [p.number, p.title]))

const uniq = <T,>(xs: T[]) => [...new Set(xs)]

/** A ladder section (or the part of it before a capstone) as one building block. */
function ladderBlock(label: string, reps: { id: string; kind: string; skills: string[] }[]): BuildingBlock | null {
  const code = reps.filter((e) => e.kind === 'code')
  if (!code.length) return null
  // What the plan still schedules is the evidence; a section finished before the plan counts as it stands.
  const scheduled = code.filter((e) => PLAN_REPS.has(e.id))
  const evidence = (scheduled.length ? scheduled : code).map((e) => e.id)
  const count = new Map<string, number>()
  for (const e of code) for (const s of e.skills) count.set(s, (count.get(s) ?? 0) + 1)
  const skills = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s)
  return { label, skills, evidence }
}

function capstoneTargets(): Target[] {
  const out: Target[] = []
  for (const u of PLAN_UNITS) {
    let since: BuildingBlock[] = []
    for (const sid of u.sections) {
      const s = SECTION.get(sid)
      if (!s) continue
      let before: typeof s.exercises = []
      let hadCapstone = false
      for (const e of s.exercises) {
        const lc = CAPSTONE_LC.get(e.id)
        if (lc === undefined) {
          before.push(e)
          continue
        }
        const lead = ladderBlock(hadCapstone ? `${s.title.toLowerCase()}: the next step` : s.title.toLowerCase() === (TITLE.get(lc) ?? '').toLowerCase() ? 'the lead-in reps' : s.title.toLowerCase(), before)
        const blocks = [...since, ...(lead ? [lead] : [])]
        out.push({
          lc,
          title: TITLE.get(lc) ?? e.title,
          unit: u.name,
          source: 'reps',
          exerciseId: e.id,
          section: null,
          mode: 'bridge-first',
          prerequisiteSkills: uniq(e.skills),
          // A capstone with nothing new before it leans on the blocks of the one before.
          blocks: blocks.length ? blocks : (out[out.length - 1]?.blocks.slice(-1) ?? []),
        })
        since = []
        before = []
        hadCapstone = true
      }
      // What follows a section's last capstone (explain reps, variants) belongs to no later target.
      if (!hadCapstone) {
        const b = ladderBlock(s.title.toLowerCase(), before)
        if (b) since.push(b)
      }
    }
  }
  return out
}

const bridged: Target[] = PACK_BRIDGES.map((b) => ({ lc: b.lc, title: b.title, unit: b.unit, source: 'leetcode', section: b.section, mode: b.mode, prerequisiteSkills: b.prerequisiteSkills, blocks: b.blocks }))

/**
 * Every target. First the plan's, in plan order: by unit, capstones where their
 * ladder reaches them, then the unit's LeetCode problems. Then the ones that
 * wait for when you are ahead, most valuable first: their bridges are authored
 * and available, they are just not inside the 90 days at the plan's pace.
 */
export const TARGETS: Target[] = (() => {
  const caps = capstoneTargets()
  const planned = PLAN_UNITS.flatMap((u) => [...caps.filter((t) => t.unit === u.name), ...u.leetcode.flatMap((lc) => bridged.filter((t) => t.lc === lc))])
  const ahead = PLAN_WHEN_AHEAD.flatMap((x) => bridged.filter((t) => t.lc === x.lc).map((t) => ({ ...t, whenAhead: true })))
  return [...planned, ...ahead]
})()

/** The targets inside the 90 days. */
export const PLAN_TARGETS: Target[] = TARGETS.filter((t) => !t.whenAhead)

export const TARGET_BY_LC = new Map(TARGETS.map((t) => [t.lc, t]))

/** The target a rep builds toward: the owner of the bridge it sits in, or the capstone its ladder section leads to. */
const TARGET_OF_REP = new Map<string, Target>()
for (const t of TARGETS) {
  for (const b of t.blocks) for (const id of b.reps ?? []) TARGET_OF_REP.set(id, t)
  if (t.exerciseId) TARGET_OF_REP.set(t.exerciseId, t)
}
for (const t of TARGETS) if (t.source === 'reps') for (const b of t.blocks) for (const id of b.evidence ?? []) if (!TARGET_OF_REP.has(id)) TARGET_OF_REP.set(id, t)

export function targetOfRep(exerciseId: string): Target | undefined {
  return TARGET_OF_REP.get(exerciseId)
}
