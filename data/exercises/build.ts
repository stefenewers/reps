import type { Example, Exercise, RepStyle, RepType, Stage, TestCase } from '@/lib/types'
import { SKILL_BY_ID } from '@/data/skills'

/**
 * Small builders so curriculum files read like a list of reps rather than
 * a wall of object literals. Each fills sensible defaults by kind.
 */

interface Base {
  id: string
  title: string
  skills: string[]
  prompt: string
  stage?: Stage
  repType?: RepType
  difficulty?: 1 | 2 | 3 | 4 | 5
  prerequisites?: string[]
  hints?: string[]
  note?: string
  explanation?: string
  signature?: string
  minutes?: number
  important?: boolean
  examples?: Example[]
  complexity?: { time: string; space: string }
  style?: RepStyle
}

function prereqsFor(skills: string[]): string[] {
  const own = new Set(skills)
  const out = new Set<string>()
  for (const id of skills) for (const p of SKILL_BY_ID[id]?.prerequisites ?? []) if (!own.has(p)) out.add(p)
  return [...out]
}

function base(b: Base, defaults: { stage: Stage; repType: RepType; difficulty: 1 | 2 | 3 | 4 | 5; minutes: number; important?: boolean }) {
  return {
    id: b.id,
    title: b.title,
    skills: b.skills,
    prompt: b.prompt,
    stage: b.stage ?? defaults.stage,
    repType: b.repType ?? defaults.repType,
    difficulty: b.difficulty ?? defaults.difficulty,
    prerequisites: b.prerequisites ?? prereqsFor(b.skills),
    hints: b.hints,
    note: b.note,
    explanation: b.explanation,
    signature: b.signature ?? b.id,
    minutes: b.minutes ?? defaults.minutes,
    review: { important: b.important ?? defaults.important ?? false },
    examples: b.examples,
    complexity: b.complexity,
    ...(b.style ? { style: b.style } : {}),
  }
}

/** Recognize: pick the right option. */
export function choice(b: Base & { code?: string; options: string[]; answer: number }): Exercise {
  return { ...base(b, { stage: 'recognize', repType: 'foundation', difficulty: 1, minutes: 1 }), kind: 'choice', code: b.code, options: b.options, answer: b.answer }
}

/** Trace: predict exactly what the code prints. */
export function output(b: Base & { code: string; expectedOutput: string }): Exercise {
  return { ...base(b, { stage: 'trace', repType: 'foundation', difficulty: 1, minutes: 1.5 }), kind: 'output', code: b.code, expectedOutput: b.expectedOutput }
}

/** Write or complete code, checked by tests. Blanks in starter code are written `____`. */
export function code(b: Base & { starterCode?: string; solution: string; tests: TestCase[] }): Exercise {
  return {
    ...base(b, { stage: 'microbuild', repType: 'foundation', difficulty: 2, minutes: 3 }),
    kind: 'code',
    starterCode: b.starterCode,
    solution: b.solution,
    tests: b.tests,
  }
}

/**
 * Write from a signature (or a blank editor). The default production rep.
 * starterCode is usually just the def line plus `pass`.
 */
export function write(b: Base & { starterCode?: string; solution: string; tests: TestCase[] }): Exercise {
  return code({ ...b, style: b.style ?? 'from-signature' })
}

/**
 * Debug Rep: broken code is preloaded; make the tests pass. The prompt says what
 * the code is supposed to do, never where the bug is. Use for syntax slips,
 * wrong API usage (`.get` without a default), wrong dict direction, inverted
 * conditions, off-by-one boundaries, pointer mix-ups, missing base cases,
 * marking visited too late.
 */
export function debug(b: Base & { brokenCode: string; solution: string; tests: TestCase[] }): Exercise {
  const { brokenCode, ...rest } = b
  return code({ ...rest, starterCode: brokenCode, stage: b.stage ?? 'debug', style: 'debug', minutes: b.minutes ?? 3, difficulty: b.difficulty ?? 2 })
}

/** Fill in the blank: a code exercise whose starter has `____` gaps. */
export function fill(b: Base & { starterCode: string; solution: string; tests: TestCase[] }): Exercise {
  return code({ ...b, stage: b.stage ?? 'complete', minutes: b.minutes ?? 2, difficulty: b.difficulty ?? 1 })
}

/** Reorder: lines given in the correct order; shown shuffled. Tests run on the assembled code. */
export function reorder(b: Base & { lines: string[]; tests: TestCase[] }): Exercise {
  return {
    ...base(b, { stage: 'reconstruct', repType: 'foundation', difficulty: 2, minutes: 2 }),
    kind: 'reorder',
    lines: b.lines,
    solution: b.lines.join('\n'),
    tests: b.tests,
  }
}

/** Canonical capstone, mirrors a LeetCode problem in Reps' own words. */
export function capstone(b: Base & { problemId: string; starterCode: string; solution: string; tests: TestCase[] }): Exercise {
  return {
    ...base(b, { stage: 'capstone', repType: 'capstone', difficulty: 3, minutes: 20, important: true }),
    kind: 'code',
    problemId: b.problemId,
    starterCode: b.starterCode,
    solution: b.solution,
    tests: b.tests,
  }
}

/** Interview explanation: write it out, self-check against a rubric. */
export function explain(b: Base & { code?: string; rubric: string[] }): Exercise {
  return { ...base(b, { stage: 'interview', repType: 'interview', difficulty: 2, minutes: 4 }), kind: 'explain', code: b.code, rubric: b.rubric }
}

/** Helpers for tests. */
export const t = {
  eq: (call: string, expected: string, extra: Partial<TestCase> = {}): TestCase => ({ call, expected, ...extra }),
  hidden: (call: string, expected: string, extra: Partial<TestCase> = {}): TestCase => ({ call, expected, hidden: true, ...extra }),
  out: (stdout: string): TestCase => ({ stdout, name: 'printed output' }),
  check: (name: string, check: string, hidden = false): TestCase => ({ name, check, hidden }),
}
