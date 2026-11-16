import type { Fade, Lab } from '@/data/course/types'
import { DESIGN_MIN_CHARS, labProgress, type LabState } from '@/lib/course/labs'
import type { Attempt } from '@/lib/types'

/**
 * Structured, fading scaffolding for labs (data/course/types.ts LabScaffold).
 *
 * Per-step progress lives in study state under `scaffold:<labId>` (a new key; `lab:<id>` is never reused).
 * A step unlocks when the one before it passed its checkpoint. A revealed reference marks the step
 * 'revealed': it never counts as own work, and the next lab goes back to full scaffolding.
 *
 * The fade level is derived, never stored, from the scaffolded labs already finished, in finishing order:
 * - full: worked example, every step, every hint. The first two scaffolded labs, and the lab after any reveal.
 * - partial: no worked example, step titles only, hints on request.
 * - minimal: requirements, design questions and the explain-back. After two partial labs finished with no reveal.
 * Labs without a scaffold (the six done before the Sprint) do not count.
 */

export const scaffoldKey = (labId: string) => `scaffold:${labId}`

export type StepState = 'passed' | 'revealed'

export interface ScaffoldState {
  /** Step index → passed its checkpoint, or the reference was revealed. */
  steps: Record<number, StepState>
  /** Step index → the learner ran its checkpoint at least once (a reveal needs an attempt first). */
  tried?: Record<number, boolean>
  /** Step index → hints shown so far (the ladder is one at a time). */
  hints?: Record<number, number>
  /** Explain-back answers by prompt index. */
  explain?: Record<number, string>
  /** Step index → local date the reference was revealed. */
  revealedOn?: Record<number, string>
}

export interface ScaffoldProgress {
  /** The first step not yet passed or revealed (steps.length when all are). */
  current: number
  passed: number
  revealed: number[]
  explainDone: boolean
  /** The latest reveal's date: the lab's build and change count as own work only when passed after it. */
  revealedOn?: string
}

export function scaffoldProgress(lab: Lab, state: ScaffoldState | undefined): ScaffoldProgress {
  const steps = lab.scaffold?.steps ?? []
  const s = state?.steps ?? {}
  let current = 0
  while (current < steps.length && s[current]) current++
  const revealed = steps.map((_, i) => i).filter((i) => s[i] === 'revealed')
  const explainDone = (lab.scaffold?.explainBack ?? []).every((_, i) => (state?.explain?.[i] ?? '').trim().length >= DESIGN_MIN_CHARS)
  const revealedOn = revealed.map((i) => state?.revealedOn?.[i]).filter((d): d is string => Boolean(d)).sort().at(-1)
  return { current, passed: steps.filter((_, i) => s[i] === 'passed').length, revealed, explainDone, revealedOn }
}

/** A step is open when every earlier step is passed or revealed. */
export const stepUnlocked = (index: number, state: ScaffoldState | undefined) => Array.from({ length: index }, (_, i) => i).every((i) => Boolean(state?.steps?.[i]))

/** The next lab's fade from the finished scaffolded labs, in order (each with whether any step was revealed). */
export function nextFade(history: { revealed: boolean }[]): Fade {
  const fades = fadeSequence(history)
  return fadeAfter(history, fades)
}

/** The fade each finished lab was done at, in order. */
export function fadeSequence(history: { revealed: boolean }[]): Fade[] {
  const out: Fade[] = []
  history.forEach((_, i) => out.push(fadeAfter(history.slice(0, i), out.slice(0, i))))
  return out
}

function fadeAfter(history: { revealed: boolean }[], fades: Fade[]): Fade {
  const n = history.length
  if (n < 2) return 'full'
  if (history[n - 1].revealed) return 'full'
  if (fades[n - 1] === 'minimal') return 'minimal'
  if (fades[n - 1] === 'partial' && fades[n - 2] === 'partial' && !history[n - 2].revealed) return 'minimal'
  return 'partial'
}

/** The fade for one lab: its own (if finished) or the next one (if not). A lab can pin its fade. */
export function fadeFor(
  lab: Lab,
  labs: Lab[],
  labStates: Record<string, LabState | undefined>,
  scaffolds: Record<string, ScaffoldState | undefined>,
  attempts: Attempt[]
): Fade {
  if (lab.fade) return lab.fade
  const finished = labs
    .filter((l) => l.scaffold)
    .map((l, i) => ({ l, i, p: labProgress(l, labStates[l.id], attempts) }))
    .filter((x) => x.p.done)
    .sort((a, b) => (a.p.doneOn ?? '').localeCompare(b.p.doneOn ?? '') || a.i - b.i)
  const history = finished.map((x) => ({ id: x.l.id, revealed: scaffoldProgress(x.l, scaffolds[x.l.id]).revealed.length > 0 }))
  const at = history.findIndex((h) => h.id === lab.id)
  if (at >= 0) return fadeSequence(history)[at]
  return nextFade(history)
}
