import type { TestCase } from '@/lib/types'

/**
 * Reps 2.0 teaching objects (REPS_2_MASTER_SPEC.md §9–10). Static content; a
 * learner's history stays in attempts and study state.
 */

/** Learn: first-principles explanation. Concept guides (data/concepts.ts) are lessons too. */
export interface Lesson {
  id: string
  title: string
  /** What it is, in a sentence or two. */
  concept: string
  /** The picture to hold in your head. */
  mentalModel: string
  whyItMatters: string
  /** In order. Markdown bodies; `code` blocks are Python and must run. */
  sections: { heading: string; body: string; code?: string; output?: string }[]
  /** The usual ways it goes wrong. */
  mistakes: string[]
  resources?: { title: string; url: string; note?: string }[]
  /** Applied Engineering / FDE or junior system design (docs/applied-engineering.md). Absent: the SWE spine. */
  thread?: 'applied' | 'design'
  /** A reading estimate for planning the day (not a target). */
  minutes?: number
  /**
   * Think-then-reveal checks: the learner writes an answer, then compares it with the model answer.
   * Self-checked understanding, never a qualifying rep and never counted toward the day.
   */
  checks?: LessonCheck[]
}

export interface LessonCheck {
  /** The question: classify, choose and justify, find the missing check, predict, explain a tradeoff. */
  prompt: string
  /** What a good answer contains. */
  answer: string
  /** Optional choices, used sparingly; the learner still explains. */
  options?: string[]
}

/** A complete solution organised by subgoals, then rebuilt from a blank editor. */
export interface WorkedExample {
  id: string
  title: string
  unitId: string
  /** The task, as the learner would read it. */
  problem: string
  manualReasoning?: string[]
  demoId?: string
  subgoals: { title: string; explanation: string; code?: string }[]
  /** The full solution, shown at the end. */
  solution: string
  /** The rep that rebuilds it with the example hidden. */
  reconstructionExerciseId: string
}

/** A 20–60 minute build that is not LeetCode. Done or not done; never counted as daily reps. */
export interface Lab {
  id: string
  title: string
  week: number
  unitId: string
  /** The situation, in two or three sentences. */
  brief: string
  requirements: string[]
  /** Answered in writing before building: inputs, outputs, state, components, data flow… */
  designQuestions: string[]
  /** The build: a lab exercise with acceptance tests. */
  buildExerciseId: string
  changeRequest: { title: string; description: string; exerciseId: string }
  /** What to check before calling it done. */
  review: string[]
  /** Applied Engineering lane (AI builds; learner-facing label "Applied Engineering"). */
  aiFde?: boolean
  /** Not required (a holiday week's second build). */
  optional?: boolean
  /**
   * Step-by-step scaffolding for a self-taught learner (sprint labs and Prep builds). Optional:
   * labs without it keep the design / build / change / review flow unchanged.
   */
  scaffold?: LabScaffold
  /** Pin a fade level for this lab. Normally absent: the fade is derived from finished labs (lib/course/scaffold.ts), never stored. */
  fade?: Fade
}

export type Fade = 'full' | 'partial' | 'minimal'

export interface LabScaffoldStep {
  title: string
  instruction: string
  /** Must pass before the next step unlocks. Tests run against the learner's draft of `exerciseId` (default: the build). */
  checkpoint: { description: string; exerciseId?: string; tests?: TestCase[] }
  /** A ladder, shown one at a time: concept nudge, structure, operation, outline. */
  hints: string[]
}

export interface LabScaffold {
  /** A smaller sibling problem, fully solved first. */
  workedExample: { problem: string; walkthrough: { step: string; why: string; code?: string }[]; solution: string }
  /** 4–7 steps, in order. */
  steps: LabScaffoldStep[]
  /** Revealed only after an attempt at the current step; a reveal marks that step 'revealed' (not own work). */
  referenceSolution: string
  /** 2–3 written prompts (at least DESIGN_MIN_CHARS each) before a scaffolded lab can be marked done. */
  explainBack: string[]
}
