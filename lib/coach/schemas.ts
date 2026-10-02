import { z } from 'zod'
import type { Exercise, RepType, Stage, TestCase } from '@/lib/types'

/**
 * Structured contracts for the adaptive coach. Every model response is
 * validated here before it is used; generated coding reps are additionally
 * executed (lib/coach/verify.ts) before they are ever shown.
 */

export const testSchema = z.object({
  call: z.string().min(1).max(400),
  expected: z.string().min(1).max(400),
  compare: z.enum(['exact', 'unordered', 'sorted-inner', 'float']).optional(),
})

export const generatedRepSchema = z
  .object({
    title: z.string().min(2).max(80),
    type: z.enum(['foundation', 'combine', 'pattern', 'cold']),
    format: z.enum(['code', 'output']),
    difficulty: z.number().int().min(1).max(5),
    skills: z.array(z.string()).min(1).max(6),
    prompt: z.string().min(10).max(1500),
    starterCode: z.string().max(1500).optional().nullable(),
    code: z.string().max(1500).optional().nullable(),
    expectedOutput: z.string().max(800).optional().nullable(),
    examples: z.array(z.object({ input: z.string().max(300), output: z.string().max(300) })).max(3).default([]),
    visibleTests: z.array(testSchema).max(4).default([]),
    hiddenTests: z.array(testSchema).max(8).default([]),
    canonicalSolution: z.string().max(2500),
    explanation: z.string().max(800),
    hints: z.array(z.string().max(300)).max(4).default([]),
    complexity: z.object({ time: z.string().max(40), space: z.string().max(40) }).optional().nullable(),
    signature: z.string().min(3).max(80),
  })
  .superRefine((r, ctx) => {
    if (r.format === 'output' && (!r.code || r.expectedOutput == null)) ctx.addIssue({ code: 'custom', message: 'output reps need code and expectedOutput' })
    if (r.format === 'code' && r.visibleTests.length + r.hiddenTests.length < 3) ctx.addIssue({ code: 'custom', message: 'code reps need at least 3 tests' })
  })

export type GeneratedRep = z.infer<typeof generatedRepSchema>

export const generateResponseSchema = z.object({ reps: z.array(generatedRepSchema).min(1).max(3) })

export const generateRequestSchema = z.object({
  skills: z.array(z.string()).min(1).max(6),
  mastery: z.record(z.string(), z.number()).default({}),
  recentMistakes: z.array(z.string().max(160)).max(6).default([]),
  recentSignatures: z.array(z.string().max(80)).max(10).default([]),
  desiredDifficulty: z.number().int().min(1).max(5),
  type: z.enum(['foundation', 'combine', 'pattern', 'cold']),
  format: z.enum(['code', 'output', 'any']).default('any'),
  count: z.number().int().min(1).max(3).default(1),
  hidePattern: z.boolean().default(false),
  /** Set on the single retry after a generated rep failed verification. */
  previousFailure: z.string().max(600).optional(),
  /** A short summary of the rep that prompted this request. */
  basedOn: z.string().max(600).optional(),
})
export type GenerateRequest = z.infer<typeof generateRequestSchema>

export const hintRequestSchema = z.object({
  title: z.string().max(120),
  prompt: z.string().max(2000),
  skills: z.array(z.string()).max(8),
  code: z.string().max(4000),
  level: z.number().int().min(1).max(4),
  previousHints: z.array(z.string().max(400)).max(6).default([]),
  failure: z.string().max(800).optional(),
})
export const hintResponseSchema = z.object({ hint: z.string().min(1).max(600) })

export const MISTAKE_CATEGORIES = [
  'python-syntax',
  'python-api-recall',
  'data-structure-usage',
  'algorithm',
  'state-management',
  'edge-case',
  'complexity',
  'implementation',
] as const

export const MISTAKE_LABEL: Record<(typeof MISTAKE_CATEGORIES)[number], string> = {
  'python-syntax': 'Python syntax',
  'python-api-recall': 'Python API recall',
  'data-structure-usage': 'Data-structure usage',
  algorithm: 'Algorithm misunderstanding',
  'state-management': 'State management',
  'edge-case': 'Edge case',
  complexity: 'Complexity',
  implementation: 'Implementation mistake',
}

export const diagnoseRequestSchema = z.object({
  exercise: z.object({ title: z.string().max(120), prompt: z.string().max(2000), stage: z.string().max(20) }),
  code: z.string().max(5000),
  failingTest: z.object({ call: z.string().max(400).nullable(), expected: z.string().max(400).nullable(), actual: z.string().max(400).nullable() }).optional(),
  stderr: z.string().max(1200).optional(),
  skills: z.array(z.string()).max(8),
  mastery: z.record(z.string(), z.number()).default({}),
  recentMistakes: z.array(z.string().max(160)).max(6).default([]),
  failedSubmissions: z.number().int().min(0).default(0),
})
export const diagnoseResponseSchema = z.object({
  category: z.enum(MISTAKE_CATEGORIES),
  diagnosis: z.string().min(1).max(500),
  missingPrerequisite: z.string().max(60).nullable().optional(),
  nextAction: z.enum(['syntax-reps', 'pattern-reps', 'retry', 'review-edge-cases']),
  repairSkills: z.array(z.string()).max(5).default([]),
})
export type Diagnosis = z.infer<typeof diagnoseResponseSchema>

export const interviewRequestSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('followup'), title: z.string().max(120), prompt: z.string().max(2000), code: z.string().max(5000) }),
  z.object({
    mode: z.literal('review'),
    problems: z
      .array(z.object({ title: z.string().max(120), code: z.string().max(5000), passed: z.boolean(), testsPassed: z.number(), testsTotal: z.number(), complexity: z.string().max(400), explanation: z.string().max(3000) }))
      .max(3),
    scratchpad: z.string().max(4000).default(''),
    minutesUsed: z.number().min(0).max(120),
  }),
])
export const followupResponseSchema = z.object({ questions: z.array(z.string().max(300)).min(1).max(4) })
export const reviewResponseSchema = z.object({
  summary: z.string().max(800),
  strengths: z.array(z.string().max(240)).max(4),
  improvements: z.array(z.string().max(240)).max(5),
  nextReps: z.array(z.string()).max(5).default([]),
})

export const verifyRequestSchema = z.object({
  title: z.string().max(120),
  prompt: z.string().max(2000),
  rubric: z.array(z.string().max(300)).min(1).max(6),
  explanation: z.string().min(1).max(4000),
})
export const verifyResponseSchema = z.object({ met: z.array(z.boolean()).max(6), feedback: z.string().max(500) })

export const planRequestSchema = z.object({
  request: z.string().min(2).max(400),
  weakest: z.array(z.string()).max(8).default([]),
})
export const planResponseSchema = z.object({
  skills: z.array(z.string()).min(1).max(6),
  count: z.number().int().min(1).max(15),
  difficulty: z.number().int().min(1).max(5),
  type: z.enum(['foundation', 'combine', 'pattern', 'cold']),
  hidePattern: z.boolean(),
  fresh: z.boolean(),
})
export type Plan = z.infer<typeof planResponseSchema>

// ── generated rep → Exercise ─────────────────────────────────────────────────

const STAGE_FOR: Record<GeneratedRep['type'], Stage> = { foundation: 'microbuild', combine: 'combine', pattern: 'pattern', cold: 'retrieval' }

export function toExercise(rep: GeneratedRep, id: string, key: string, createdAt: string): Exercise {
  const tests: TestCase[] = [...rep.visibleTests.map((t) => ({ ...t })), ...rep.hiddenTests.map((t) => ({ ...t, hidden: true }))]
  const base = {
    id,
    title: rep.title,
    stage: rep.format === 'output' ? ('trace' as Stage) : STAGE_FOR[rep.type],
    repType: rep.type as RepType,
    skills: rep.skills,
    prerequisites: [],
    difficulty: rep.difficulty as Exercise['difficulty'],
    prompt: rep.prompt,
    examples: rep.examples,
    hints: rep.hints,
    explanation: rep.explanation,
    complexity: rep.complexity ?? undefined,
    signature: rep.signature,
    minutes: rep.format === 'output' ? 2 : rep.type === 'pattern' ? 10 : 5,
    review: { important: false },
    generated: { key, createdAt, used: true },
  }
  if (rep.format === 'output') return { ...base, kind: 'output', code: rep.code ?? '', expectedOutput: rep.expectedOutput ?? '' }
  return { ...base, kind: 'code', starterCode: rep.starterCode ?? undefined, solution: rep.canonicalSolution, tests }
}
