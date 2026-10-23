/**
 * Interactive demonstrations (REPS_2_1_SPEC.md §12–15): the learner SEES what the
 * code does. A demo is a pure step generator plus a view. Generators are
 * deterministic (same input → same steps), so they are tested with node:test,
 * and the player can step forwards and backwards, reset, and re-run on new input.
 *
 * Every step carries the regions the spec asks for:
 * - state: what the view draws (array + pointers, window, nodes, stack, tree…);
 * - lines: the code line(s) executing (1-based, into `code`);
 * - label: the current step in a word or two (e.g. ENTER, SHRINK, SAVE, DOWN);
 * - why: the rule that makes this step happen, in one plain sentence;
 * - vars: the state variables, as the learner would print them;
 * - predict: optionally, a question asked BEFORE this step is revealed.
 */

export type VarValue = string | number | boolean | null

export interface Prediction {
  question: string
  choices: string[]
  /** Index into choices. */
  answer: number
}

export interface DemoStep<S> {
  state: S
  lines: number[]
  label: string
  why: string
  vars: Record<string, VarValue>
  predict?: Prediction
}

export interface DemoPreset<I> {
  label: string
  input: I
}

export interface DemoDefinition<I, S> {
  id: string
  title: string
  /** The concept guide it belongs to (data/concepts.ts id). */
  concept: string
  /** One sentence: what to watch. */
  summary: string
  /** The rule the whole demo illustrates (e.g. the invariant). Shown pinned. */
  rule: string
  /** Python (or pseudocode) shown with the executing line highlighted. */
  code: string[]
  defaultInput: I
  presets: DemoPreset<I>[]
  /** "Try another input": parse what the learner typed, or say what is wrong. */
  parseInput?: (text: string) => { input: I } | { error: string }
  /** How the current input is shown (and pre-filled in the input box). */
  formatInput: (input: I) => string
  /** Placeholder for the input box, e.g. "1 3 5 7, target 9". */
  inputHint?: string
  run: (input: I) => DemoStep<S>[]
}

/** Shared parsing helpers for "Try another input". */
export function parseInts(text: string, { min = 1, max = 12 }: { min?: number; max?: number } = {}): { values: number[] } | { error: string } {
  const parts = text.split(/[\s,]+/).filter(Boolean)
  if (parts.length < min) return { error: `Give at least ${min} number${min === 1 ? '' : 's'}.` }
  if (parts.length > max) return { error: `At most ${max} numbers keep it readable.` }
  const values = parts.map(Number)
  if (values.some((v) => !Number.isInteger(v) || Math.abs(v) > 999)) return { error: 'Whole numbers between -999 and 999 only.' }
  return { values }
}
