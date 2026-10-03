import type { SkillId } from '@/lib/types'

/**
 * A concept primer: the basics behind a rep, never its answer. Opened only on
 * request (the Basics button in a rep). Short enough to read in ~90 seconds.
 *
 * - what: what it is and why it exists (markdown-lite, 1–3 sentences)
 * - model: the mental model in one sentence
 * - syntax: the handful of lines you will actually type, each with a note
 * - example: a small runnable program and exactly what it prints (verified
 *   against real Python by `npm run verify:content`)
 * - gotchas: the 2–4 mistakes that actually happen
 * - recipes (optional): task-first — "when you want to X" — each shown inside a
 *   small working function, because one-liners rarely live on their own.
 *   Each is a runnable program with its exact output (also verified).
 *
 * Examples use their own little scenarios and must not solve any rep.
 */
export interface Primer {
  id: string
  title: string
  skills: SkillId[]
  what: string
  model: string
  syntax: { code: string; note: string }[]
  example: { code: string; output: string }
  gotchas: string[]
  recipes?: Recipe[]
}

/** One task, shown the way it actually appears inside a function. */
export interface Recipe {
  /** Finishes "When you want to…", e.g. "add or change an entry". */
  when: string
  code: string
  output: string
  /** One or two sentences: why it's written this way. */
  note: string
}
