import type { Attempt, Exercise } from '@/lib/types'

/** Builders for tests. */

let n = 0

export function attempt(over: Partial<Attempt> = {}): Attempt {
  n++
  const t = over.completedAt ?? `2026-10-02T1${n % 10}:00:00.000Z`
  return {
    id: `a${n}-${Math.random().toString(36).slice(2, 8)}`,
    exerciseId: 'ex1',
    date: '2026-10-02',
    skills: ['dict_get'],
    stage: 'microbuild',
    mode: 'learn',
    passed: true,
    attemptsBeforePass: 0,
    hintsUsed: 0,
    solutionViewed: false,
    runtimeErrors: [],
    startedAt: t,
    completedAt: t,
    retrievalType: 'first-exposure',
    updatedAt: t,
    ...over,
  }
}

export function exercise(over: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex1',
    title: 'Test rep',
    kind: 'code',
    stage: 'microbuild',
    repType: 'foundation',
    skills: ['dict_get'],
    prerequisites: [],
    difficulty: 2,
    prompt: 'Do it.',
    solution: 'x = 1',
    tests: [{ check: 'assert x == 1' }],
    signature: 'test',
    minutes: 2,
    review: { important: false },
    ...over,
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
