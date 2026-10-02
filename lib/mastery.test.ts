import { test } from 'node:test'
import assert from 'node:assert/strict'
import { attemptQuality, computeSkillMastery, RECOGNITION_CAP } from '@/lib/mastery'
import { attempt } from '@/lib/test-helpers'

const S = 'dict_get'
const at = (i: number) => `2026-10-02T${String(8 + i).padStart(2, '0')}:00:00.000Z`

test('no attempts means unseen and zero', () => {
  const m = computeSkillMastery(S, [])
  assert.equal(m.status, 'unseen')
  assert.equal(m.score, 0)
})

test('one correct rep is not fluent, and not even competent', () => {
  const m = computeSkillMastery(S, [attempt()])
  assert.ok(m.score > 0 && m.score < 40, `score ${m.score}`)
  assert.equal(m.status, 'introduced')
})

test('a clean cold first-try solve beats a pass after four hints', () => {
  const cold = computeSkillMastery(S, [attempt({ retrievalType: 'cold', stage: 'capstone' })])
  const hinted = computeSkillMastery(S, [attempt({ hintsUsed: 4, stage: 'capstone' })])
  assert.ok(cold.score > hinted.score * 2, `cold ${cold.score} vs hinted ${hinted.score}`)
})

test('viewing the solution sharply reduces credit for reproducing it', () => {
  const viewed = attempt({ solutionViewed: true })
  assert.equal(attemptQuality(viewed), 0.3)
  const clean = computeSkillMastery(S, [attempt()])
  const after = computeSkillMastery(S, [viewed])
  assert.ok(after.score < clean.score / 2)
})

test('retries reduce quality but never below half', () => {
  assert.equal(attemptQuality(attempt({ attemptsBeforePass: 2 })), 0.8)
  assert.equal(attemptQuality(attempt({ attemptsBeforePass: 20 })), 0.5)
  assert.equal(attemptQuality(attempt({ passed: false })), 0)
})

test('recognition-only evidence is capped', () => {
  const reps = Array.from({ length: 30 }, (_, i) => attempt({ stage: 'recognize', completedAt: at(i % 12) }))
  const m = computeSkillMastery(S, reps)
  assert.ok(m.recognitionOnly)
  assert.ok(m.score <= RECOGNITION_CAP)
})

test('steady clean production reps reach competent; fluent also needs a clean cold rep', () => {
  const reps = Array.from({ length: 8 }, (_, i) => attempt({ stage: 'combine', completedAt: at(i) }))
  const warm = computeSkillMastery(S, reps)
  assert.ok(warm.score >= 65, `score ${warm.score}`)
  assert.notEqual(warm.status, 'fluent')
  const withCold = computeSkillMastery(S, [...reps, attempt({ stage: 'retrieval', retrievalType: 'cold', completedAt: at(9) })])
  assert.equal(withCold.status, 'fluent')
})

test('two failures in a row mark a skill weak', () => {
  const reps = [attempt({ completedAt: at(0) }), attempt({ completedAt: at(1) }), attempt({ passed: false, completedAt: at(2) }), attempt({ passed: false, completedAt: at(3) })]
  assert.equal(computeSkillMastery(S, reps).status, 'weak')
})

test('a failed cold rep marks a skill weak even after earlier success', () => {
  const reps = [...Array.from({ length: 6 }, (_, i) => attempt({ completedAt: at(i) })), attempt({ retrievalType: 'cold', passed: false, completedAt: at(7) })]
  assert.equal(computeSkillMastery(S, reps).status, 'weak')
})

test('abandoned attempts with failed submissions count as failures; untouched ones do not', () => {
  const abandoned = attempt({ passed: false, completedAt: undefined, attemptsBeforePass: 2 })
  const untouched = attempt({ passed: false, completedAt: undefined, attemptsBeforePass: 0 })
  assert.equal(computeSkillMastery(S, [abandoned]).failures, 1)
  assert.equal(computeSkillMastery(S, [untouched]).attempts, 0)
})

test('mastery is deterministic for the same history', () => {
  const reps = [attempt({ completedAt: at(1) }), attempt({ hintsUsed: 1, completedAt: at(2) }), attempt({ passed: false, completedAt: at(3) })]
  assert.deepEqual(computeSkillMastery(S, reps), computeSkillMastery(S, [...reps].reverse()))
})
