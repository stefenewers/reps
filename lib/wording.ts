import type { Exercise } from '@/lib/types'

/**
 * Plain English for prompts (docs/authoring.md, "How a prompt reads").
 * Deterministic checks only: they catch the habits that made prompts hard to read,
 * not every bad sentence.
 */

export interface PromptExample {
  call: string
  expect: string
}

/** `f(args)` → `value` pairs written in a prompt, for functions the solution defines. */
export function promptExamples(e: Pick<Exercise, 'prompt' | 'solution'>): PromptExample[] {
  if (!e.solution) return []
  const defined = new Set([...e.solution.matchAll(/^def (\w+)\(/gm)].map((m) => m[1]))
  const out: PromptExample[] = []
  for (const m of e.prompt.matchAll(/`([A-Za-z_]\w*\([^`\n]*\))`\s*→\s*`([^`\n]+)`/g)) {
    const fn = m[1].slice(0, m[1].indexOf('('))
    if (defined.has(fn)) out.push({ call: m[1], expect: m[2] })
  }
  return out
}

/** The prose of a prompt: code blocks removed, inline code counted as one word. */
function prose(prompt: string): string {
  return prompt.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, 'CODE')
}

export function sentences(prompt: string): string[] {
  return prose(prompt)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export const MAX_WORDS = 32

/** Stages where the learner writes a function from a description: they get a normal and an edge example. */
const WRITES: Exercise['stage'][] = ['microbuild', 'reconstruct', 'combine', 'pattern', 'capstone']

/** Problems with a prompt's wording. Empty means it reads plainly. */
export function wordingProblems(e: Exercise): string[] {
  const problems: string[] = []
  const p = e.prompt
  // "Write `f(x)`: a list where ..." makes the reader work out the verb. Say "Return ...".
  if (/Write `[^`]+`\s*:/.test(p)) problems.push('task given as "Write `f()`: <noun phrase>"; say what to return as an instruction')
  for (const s of sentences(p)) {
    const words = s.split(/\s+/).length
    if (words > MAX_WORDS) problems.push(`sentence of ${words} words: "${s.slice(0, 60)}…"`)
  }
  // Riddles instead of hints.
  if (/something else can|you know what|guess what|think about it/i.test(p)) problems.push('hint written as a riddle; say the move plainly')
  // A rep that writes a test (`def test_…`) or finds a breaking input has no example to show: one would give the answer away.
  const writesTest = /^def (test_|breaking_input\()/m.test(e.solution ?? '')
  if (e.kind === 'code' && WRITES.includes(e.stage) && !writesTest && !e.starterCode?.includes('return') && promptExamples(e).length < 2 && /^def /m.test(e.solution ?? '')) {
    problems.push(`needs a normal and an edge example (found ${promptExamples(e).length})`)
  }
  return problems
}
