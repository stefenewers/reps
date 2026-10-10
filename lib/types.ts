/**
 * Core domain types for Reps.
 *
 * Curriculum (skills, exercises, days, problems) is static data under data/.
 * Progress (attempts, reviews, generated reps) lives in IndexedDB, see lib/store.
 */

export type SkillId = string

/** The pedagogical ladder. UI copy maps these to simpler labels, see lib/labels.ts. */
export type Stage =
  | 'recognize'
  | 'trace'
  | 'recall'
  | 'complete'
  | 'reconstruct'
  | 'microbuild'
  | 'debug'
  | 'combine'
  | 'pattern'
  | 'capstone'
  | 'interview'
  | 'retrieval'

/** The kinds of reps, part of the product vocabulary. */
export type RepType = 'foundation' | 'combine' | 'pattern' | 'capstone' | 'cold' | 'interview'

/**
 * How an exercise is answered.
 * - choice: pick one option
 * - output: predict exactly what the code prints
 * - code: write/complete code in the editor, checked by tests
 * - reorder: put shuffled lines in order, checked by tests (or by canonical order)
 * - explain: written explanation, self-checked against a rubric
 */
export type ExerciseKind = 'choice' | 'output' | 'code' | 'reorder' | 'explain'

/**
 * How a code rep is presented. Execution is identical (editor + tests); the
 * style changes the framing and the audit's view of it.
 * - debug: broken code is preloaded; make the tests pass
 * - modify: working code; change its behaviour as asked
 * - optimize: working but slow code; rewrite it
 * - translate: rewrite in a different construct (index loop → enumerate)
 * - from-signature: just a def line
 * - finish: a meaningful partial implementation
 * - write-test: encode an edge case as an assertion
 */
export type RepStyle = 'debug' | 'modify' | 'optimize' | 'translate' | 'from-signature' | 'finish' | 'write-test'

export type Compare = 'exact' | 'unordered' | 'sorted-inner' | 'float'

/**
 * A deterministic test.
 * - call: a Python expression evaluated after the user's code runs, e.g. "two_sum([2, 7], 9)"
 * - expected: a Python expression for the expected value, e.g. "[0, 1]"
 * - stdout: instead of call/expected, compare everything the user's code printed
 * - check: a Python statement block that must not raise (asserts), for unusual cases
 */
export interface TestCase {
  name?: string
  call?: string
  expected?: string
  stdout?: string
  check?: string
  compare?: Compare
  hidden?: boolean
}

export interface Example {
  input: string
  output: string
  note?: string
}

export interface ReviewMeta {
  /** Important concepts are resurfaced as cold reps (next day, ~3 days, before Oct 11). */
  important: boolean
}

export interface Exercise {
  id: string
  title: string
  kind: ExerciseKind
  /** Part of a mastery check: only a pass without the solution open counts. */
  cleanPass?: boolean
  stage: Stage
  repType: RepType
  skills: SkillId[]
  /** Skills that should be at least introduced before this exercise is sensible. */
  prerequisites: SkillId[]
  difficulty: 1 | 2 | 3 | 4 | 5
  /** Markdown-lite: paragraphs, `inline code`, **bold**, and ``` fenced blocks. */
  prompt: string
  /** Code shown read-only with the prompt (choice/output/explain). */
  code?: string
  options?: string[]
  answer?: number
  expectedOutput?: string
  starterCode?: string
  /** Lines for a reorder exercise, in the correct order (shuffled for display). */
  lines?: string[]
  solution?: string
  tests?: TestCase[]
  examples?: Example[]
  /** Progressive hints: conceptual nudge, structure, operation, outline. */
  hints?: string[]
  /** Short concept reminder shown in Learn mode. */
  note?: string
  /** Shown after completion. */
  explanation?: string
  rubric?: string[]
  complexity?: { time: string; space: string }
  /** Canonical problem this is the capstone for. */
  problemId?: string
  /** Structural signature for deduplication, e.g. "freq-map:count-chars". */
  signature: string
  minutes: number
  review: ReviewMeta
  style?: RepStyle
  /** Present on AI-generated reps. */
  generated?: { key: string; createdAt: string; used: boolean }
}

export interface Section {
  id: string
  title: string
  /** One line on what this block trains. */
  summary: string
  exercises: Exercise[]
  /** Extra reps: available, but not part of the day's required plan or any progress total. */
  optional?: boolean
  /** A mastery check: every rep must be passed without opening the solution before anything after it unlocks. */
  gate?: boolean
}

export interface DayModule {
  date: string // YYYY-MM-DD
  short: string // e.g. "Foundation"
  title: string // e.g. "Python fluency + hashing foundations"
  focus: string
  sections: Section[]
  capstones: string[] // problem ids
  /** Optional ids of interview mock sessions this day includes. */
  mocks?: string[]
  /** Topic modules (by their authored date) this calendar day draws from. */
  modules?: string[]
  /** 90-day plan: the LeetCode problems for the day (new ones and spaced re-solves), solved on LeetCode. */
  leetcode?: LeetcodeItem[]
  /** 90-day plan: soft start, build, full, buffer week, final week, or an off day. */
  phase?: 'soft' | 'build' | 'full' | 'buffer' | 'final' | 'off'
  /** 90-day plan: 1-based day number, Oct 11 = 1. */
  planDay?: number
  /** 90-day plan: week 1–13. */
  planWeek?: number
  /** 90-day plan: estimated real minutes of new work (ladder reps and new LeetCode problems). */
  planMinutes?: number
  /** 90-day plan: the day's new work in the order it is done (rep ids, `lc:<number>` for new LeetCode problems). */
  planOrder?: string[]
}

export interface LeetcodeItem {
  lc: number
  title: string
  difficulty: string
  pattern: string
  /** `redo`: a re-solve that needed help, to do again cold on the next working day. */
  type: 'new' | 'review1' | 'review2' | 'review3' | 'redo'
  /** Only on new problems: watch the walkthrough first, or attempt for 30 minutes first. */
  mode: 'study-first' | 'attempt-first' | null
  video: string | null
  url: string
}

export interface Skill {
  id: SkillId
  name: string
  group: SkillGroup
  definition: string
  prerequisites: SkillId[]
}

export type SkillGroup =
  | 'Python foundations'
  | 'Hashing'
  | 'Strings & pointers'
  | 'Windows & stacks'
  | 'Search & linked lists'
  | 'Recursion & trees'
  | 'BFS & grids'
  | 'Graphs'
  | 'Heaps, sorting & intervals'
  | 'Backtracking & DP'
  | 'Interview craft'

export interface Problem {
  id: string
  title: string
  leetcode: string
  number: number
  pattern: string
  skills: SkillId[]
  day: string
  /** Exercise id of the internal capstone that mirrors this problem. */
  exerciseId?: string
}

export type Mode = 'learn' | 'practice' | 'interview'
export type RetrievalType = 'first-exposure' | 'immediate-reconstruction' | 'cold'

export interface Attempt {
  id: string
  exerciseId: string
  date: string // YYYY-MM-DD local
  skills: SkillId[]
  stage: Stage
  mode: Mode
  code?: string
  answer?: string
  passed: boolean
  /** Failed submissions before the passing one (or total failed if never passed). */
  attemptsBeforePass: number
  hintsUsed: number
  solutionViewed: boolean
  runtimeErrors: string[]
  startedAt: string
  completedAt?: string
  durationSeconds?: number
  confidence?: 1 | 2 | 3 | 4 | 5
  mistakeType?: string
  mistakeNote?: string
  retrievalType: RetrievalType
  /** Set for reps from a session (review, repair, challenge). */
  sessionKind?: SessionKind
  updatedAt: string
}

export type SessionKind = 'day' | 'review' | 'repair' | 'challenge' | 'another' | 'weakest'

/**
 * A scheduled resurfacing. One pending item per skill (`skill:<id>`) and per
 * important exercise such as a capstone (`ex:<id>`).
 */
export interface ReviewItem {
  id: string
  reviewType: 'skill' | 'exercise'
  skillId?: SkillId
  exerciseId?: string
  dueAt: string // ISO
  /** Successful spaced (cold) reviews so far. */
  step: number
  reason: 'scheduled' | 'failed' | 'shaky'
  status: 'pending' | 'done'
  createdAt: string
  completedAt?: string
  updatedAt: string
}

export interface Session {
  id: string
  kind: SessionKind
  title: string
  exerciseIds: string[]
  createdAt: string
  /** Where "Retry capstone" points after a repair set. */
  returnTo?: string
}

export interface MockResult {
  id: string
  mockId: string
  startedAt: string
  completedAt?: string
  problems: { exerciseId: string; code: string; passed: boolean; testsPassed: number; testsTotal: number; complexity: string; explanation: string }[]
  scratchpad: string
  review?: string
}

export interface MistakeRecord {
  id: string
  exerciseId: string
  skills: SkillId[]
  category: string
  note: string
  date: string
}
