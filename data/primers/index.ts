import type { Primer } from '@/data/primers/types'
import type { SkillId } from '@/lib/types'
import { HASHING_PRIMERS } from '@/data/primers/hashing'
import { PYTHON_PRIMERS } from '@/data/primers/python'
import { PATTERN_PRIMERS } from '@/data/primers/patterns'
import { MOVES } from '@/data/primers/moves'

/** Every primer, and the primer that covers each skill. */
export const PRIMERS: Primer[] = [...PYTHON_PRIMERS, ...HASHING_PRIMERS, ...PATTERN_PRIMERS]

export const PRIMER_BY_SKILL: Record<SkillId, Primer> = Object.fromEntries(PRIMERS.flatMap((p) => p.skills.map((s) => [s, p] as const)))

/** Unique primers for a rep's skills, in skill order. */
export function primersFor(skills: SkillId[]): Primer[] {
  const out: Primer[] = []
  for (const s of skills) {
    const p = PRIMER_BY_SKILL[s]
    if (p && !out.includes(p)) out.push(p)
  }
  return out
}

/** Every runnable program in the primers and moves: each example, recipe (`primer#n`) and move (`move:id`). Verified against real Python. */
export function primerPrograms(primers: Primer[]): { id: string; code: string; output: string }[] {
  return [
    ...primers.flatMap((p) => [{ id: p.id, code: p.example.code, output: p.example.output }, ...(p.recipes ?? []).map((r, i) => ({ id: `${p.id}#${i + 1}`, code: r.code, output: r.output }))]),
    ...MOVES.map((m) => ({ id: `move:${m.id}`, code: m.code, output: m.output })),
  ]
}
