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
  /** Applied AI / FDE lane. */
  aiFde?: boolean
  /** Not required (a holiday week's second build). */
  optional?: boolean
}
