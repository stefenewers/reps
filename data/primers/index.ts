import type { Primer } from '@/data/primers/types'
import type { SkillId } from '@/lib/types'
import { HASHING_PRIMERS } from '@/data/primers/hashing'
import { PYTHON_PRIMERS } from '@/data/primers/python'
import { PATTERN_PRIMERS } from '@/data/primers/patterns'

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
