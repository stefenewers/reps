import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MODULES as DAYS } from '@/data/curriculum'
import { auditDays, bucketOf, engagementOf, GUARDRAILS, guardrailViolations, inflated, isFromScratch, productionLines } from '@/lib/curriculum-audit'
import { choice, code, debug, fill, output, write, t } from '@/data/exercises/build'

/** Reps is code-first. These tests keep it that way. */

test('the curriculum passes every code-first guardrail', () => {
  assert.deepEqual(guardrailViolations(DAYS), [])
})

test('overall and per-day active coding time clear the thresholds', () => {
  const { days, overall } = auditDays(DAYS)
  assert.ok(overall.activeTimeShare >= GUARDRAILS.overallActiveTime)
  assert.ok(overall.modeledActiveTimeShare >= GUARDRAILS.overallActiveTime)
  for (const d of days) assert.ok(d.activeTimeShare >= GUARDRAILS.dayActiveTime, d.date)
})

test('every authored topic module carries roughly 5.5–6.5 hours of content', () => {
  for (const d of auditDays(DAYS).days) assert.ok(d.minutes >= 330 && d.minutes <= 400, `${d.date}: ${d.minutes} min`)
})

test('classification: passive, guided and active are judged by what you produce', () => {
  const base = { title: 'x', skills: ['for_loop'], prompt: 'p' }
  assert.equal(engagementOf(choice({ ...base, id: 'a', options: ['x', 'y'], answer: 0 })), 'passive')
  assert.equal(engagementOf(output({ ...base, id: 'b', code: 'print(1)', expectedOutput: '1' })), 'passive')
  // One tiny blank is passive; writing a function from a signature is active.
  assert.equal(engagementOf(fill({ ...base, id: 'c', starterCode: 'x = ____', solution: 'x = 0', tests: [t.check('x', 'assert x == 0')] })), 'passive')
  const w = write({ ...base, id: 'd', starterCode: 'def f(nums):\n    pass', solution: 'def f(nums):\n    total = 0\n    for n in nums:\n        total += n\n    return total', tests: [t.eq('f([1])', '1')] })
  assert.equal(engagementOf(w), 'active')
  assert.ok(isFromScratch(w))
  assert.equal(productionLines(w), 4)
  // A code rep where you only add one line is guided, not active.
  const one = code({ ...base, id: 'e', starterCode: 'nums = [1]\ntotal = 0', solution: 'nums = [1]\ntotal = 0\ntotal = sum(nums)', tests: [t.check('t', 'assert total == 1')] })
  assert.equal(engagementOf(one), 'guided')
  const d = debug({ ...base, id: 'f', brokenCode: 'def f(n):\n    return n', solution: 'def f(n):\n    return n + 1', tests: [t.eq('f(1)', '2')] })
  assert.equal(bucketOf(d), 'debug')
  assert.equal(engagementOf(d), 'active')
})

test('inflated estimates are caught', () => {
  const base = { title: 'x', skills: ['for_loop'], prompt: 'p' }
  const honest = write({ ...base, id: 'g', starterCode: 'def f():\n    pass', solution: 'def f():\n    a = 1\n    return a', tests: [t.eq('f()', '1')], minutes: 3 })
  const padded = { ...honest, minutes: 15 }
  assert.equal(inflated(honest), false)
  assert.equal(inflated(padded), true)
})

test('too many passive reps in a row is a violation', () => {
  const base = { title: 'x', skills: ['for_loop'], prompt: 'p' }
  const passive = Array.from({ length: GUARDRAILS.maxConsecutivePassive + 1 }, (_, i) => output({ ...base, id: `p${i}`, code: 'print(1)', expectedOutput: '1' }))
  const day = { ...DAYS[0], sections: [{ id: 's', title: 's', summary: '', exercises: passive }] }
  assert.ok(guardrailViolations([day]).some((v) => v.includes('passive reps in a row')))
})
