import { test } from 'node:test'
import assert from 'node:assert/strict'
import { APPLIED_SCHEDULE, CAPABILITIES, capabilityStatus } from '@/data/course/applied'
import { createContracts } from '@/lib/course/contract'
import { auditApplied, firstTaught, labDeadline } from '@/lib/course/applied-audit'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { SECTION_BY_ID } from '@/data/course'
import { UNIT_BY_ID } from '@/data/course/units'

/** The Applied Engineering / system design thread (docs/applied-engineering.md). */

test('the applied audit passes: every idea is taught before a lab relies on it, and no hidden daily work', () => {
  assert.deepEqual(auditApplied(), [])
})

test('the Week 12 and Week 13 culminations are reached only after their teaching', () => {
  for (const [lab, ids] of [
    ['lab-support-router', ['ae-model-boundary', 'ae-tools-workflows', 'ae-evals', 'ae-reliability', 'sd-auth-permissions']],
    ['lab-fde-workflow', ['ae-discovery', 'ae-evals', 'ae-requirements-change']]
  ] as const) {
    const due = labDeadline(lab)!
    for (const id of ids) assert.ok(firstTaught(id)! <= due, `${id} before ${lab}`)
  }
})

test('the thread is spread across the course, not dumped in Week 12, and never in Weeks 13–14', () => {
  const weeks = new Set(APPLIED_SCHEDULE.map((x) => UNIT_BY_ID[x.unitId].week))
  assert.ok(weeks.size >= 10, `taught across ${weeks.size} weeks`)
  assert.ok(APPLIED_SCHEDULE.filter((x) => UNIT_BY_ID[x.unitId].week === 12).length <= 3)
  assert.ok([...weeks].every((w) => w <= 12))
  assert.ok(APPLIED_SCHEDULE.some((x) => UNIT_BY_ID[x.unitId].week <= 2), 'program design starts in Weeks 1–2')
})

test('applied teaching changes no day contract: targets 10 / 12 / 15, rest owes nothing', () => {
  const c = createContracts({ attempts: [], entries: [], mastery: {}, labStates: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID })
  assert.equal(c.dayContract('2026-10-27').reps.target, 10)
  assert.equal(c.dayContract('2026-11-03').reps.target, 12)
  assert.equal(c.dayContract('2027-01-12').reps.target, 15)
  assert.equal(c.dayContract('2026-11-01').complete, true)
  assert.equal(c.dayContract('2026-12-25').complete, true)
  // The optional retrieval mini-build is never required.
  assert.ok(c.weekContract(12, '2027-01-17').labs.every((l) => l.id !== 'lab-grounded-answer' || l.optional))
})

test('capability status comes from evidence only: learning, practiced, applied; never a percentage', () => {
  const tools = CAPABILITIES.find((c) => c.id === 'tools')!
  const none = { lessonDone: () => false, checksDone: () => false, labDone: () => false }
  assert.equal(capabilityStatus(tools, none), 'not-introduced')
  assert.equal(capabilityStatus(tools, { ...none, lessonDone: () => true }), 'learning')
  assert.equal(capabilityStatus(tools, { ...none, lessonDone: () => true, checksDone: () => true }), 'practiced')
  assert.equal(capabilityStatus(tools, { lessonDone: () => true, checksDone: () => false, labDone: () => true }), 'applied')
  // A finished lab alone, with no lesson read, is not evidence of the capability being taught.
  assert.equal(capabilityStatus(tools, { ...none, labDone: () => true }), 'not-introduced')
})
