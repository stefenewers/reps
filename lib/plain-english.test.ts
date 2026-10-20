import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { PLAIN_ENGLISH } from '@/data/plain-english'
import { promptExamples, wordingProblems } from '@/lib/wording'
import { needsRelearn } from '@/lib/training-state'
import type { Attempt, Exercise } from '@/lib/types'

test('every rep that has had the plain-English pass reads plainly', () => {
  for (const id of PLAIN_ENGLISH) {
    const e = EXERCISE_BY_ID[id]
    assert.ok(e, `unknown rep ${id}`)
    assert.deepEqual(wordingProblems(e), [], id)
  }
})

const rep = (prompt: string, over: Partial<Exercise> = {}) => ({ ...EXERCISE_BY_ID['d3-tp-mismatches'], prompt, starterCode: 'def f(x):\n    pass\n', solution: 'def f(x):\n    return x\n', ...over }) as Exercise

test('the wording check catches the habits that made prompts hard to read', () => {
  assert.ok(wordingProblems(rep('Write `f(x)`: a list where entry `i` is the best of the others.\n\n`f(1)` → `1`\n`f(2)` → `2`')).some((p) => p.includes('Write `f()`')))
  assert.ok(wordingProblems(rep('A set cannot remember where a value was; something else can.\n\n`f(1)` → `1`\n`f(2)` → `2`')).some((p) => p.includes('riddle')))
  assert.ok(wordingProblems(rep(`${'word '.repeat(40)}.\n\n\`f(1)\` → \`1\`\n\`f(2)\` → \`2\``)).some((p) => p.includes('sentence of')))
  assert.ok(wordingProblems(rep('Return `x`.\n\n`f(1)` → `1`', { stage: 'microbuild' })).some((p) => p.includes('normal and an edge example')))
  assert.deepEqual(wordingProblems(rep('`x` is a number. Return it unchanged.\n\n`f(1)` → `1`\n`f(0)` → `0`', { stage: 'microbuild' })), [])
})

test('prompt examples are read for the functions the solution defines, and nothing else', () => {
  const e = rep('`f([1, 2])` → `[1, 2]` and `len(x)` → `2`')
  assert.deepEqual(promptExamples(e), [{ call: 'f([1, 2])', expect: '[1, 2]' }])
})

test('a rep that needed help on two different days opens with the concept again, until it is passed clean', () => {
  const at = (date: string) => ({ id: `${date}-${Math.random()}`, exerciseId: 'x', date, passed: true, completedAt: `${date}T10:00:00Z`, solutionViewed: false, hintsUsed: 0 }) as Attempt
  const helped = (date: string) => ({ ...at(date), solutionViewed: true })
  assert.equal(needsRelearn('x', [helped('2026-10-13')]), false, 'once is a redo, not a gap')
  assert.equal(needsRelearn('x', [helped('2026-10-13'), helped('2026-10-19')]), true)
  assert.equal(needsRelearn('x', [helped('2026-10-13'), helped('2026-10-19'), at('2026-10-21')]), false, 'a clean pass closes it')
  assert.equal(needsRelearn('x', [helped('2026-10-13'), { ...at('2026-10-13'), hintsUsed: 2 }]), false, 'the same day twice is one day')
})
