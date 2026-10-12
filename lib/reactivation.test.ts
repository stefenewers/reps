import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { REACTIVATION, REACTIVATION_FINAL, REACTIVATION_REPS, reactivationStatus } from '@/data/reactivation'
import { bucketOf } from '@/lib/curriculum-audit'
import { attempt } from '@/lib/test-helpers'

const saved = { sessionId: 's1', startedAt: '2026-10-12T13:00:00.000Z' }
const pass = (id: string, over = {}) => attempt({ id: `r-${id}`, exerciseId: id, date: '2026-10-12', completedAt: '2026-10-12T14:00:00.000Z', ...over })

test('the reactivation session is existing reps, bottom up, and almost all writing', () => {
  assert.equal(new Set(REACTIVATION_REPS).size, REACTIVATION_REPS.length)
  for (const id of REACTIVATION_REPS) assert.ok(EXERCISE_BY_ID[id], `${id} exists`)
  assert.deepEqual(REACTIVATION.stages.map((s) => s.name), ['Python recall', 'Dictionary recall', 'Frequency maps', 'Index maps', 'Complement bridge', 'Put it together'])
  const reps = REACTIVATION_REPS.map((id) => EXERCISE_BY_ID[id])
  assert.ok(reps.every((e) => e.kind === 'code'), 'no multiple choice, no predict-the-output')
  assert.ok(reps.filter((e) => bucketOf(e) === 'debug').length >= 3, 'some debugging')
  const minutes = reps.reduce((n, e) => n + e.minutes, 0)
  assert.ok(minutes >= 50 && minutes <= 75, `${minutes} authored minutes`)
  // Everything before the complement bridge is something already passed: retrieval, not new material.
  const done = new Set<string>(JSON.parse(readFileSync('planning/done.json', 'utf8')))
  for (const s of REACTIVATION.stages.slice(0, 4)) for (const id of s.reps) assert.ok(done.has(id), `${id} was passed before`)
  // It ends inside Reps on one integration rep, not on a capstone or a LeetCode assignment.
  const last = EXERCISE_BY_ID[REACTIVATION_FINAL]
  assert.ok(last.repType !== 'capstone' && !last.problemId && last.tests!.length > 0)
  for (const k of ['enumerate', 'index_map', 'complement']) assert.ok(last.skills.includes(k) || last.prerequisites.includes(k), `the last rep uses ${k}`)
})

test('status: offered, then in progress from attempts made since it began, then done on a clean last rep', () => {
  assert.equal(reactivationStatus(undefined, []).state, 'offer')
  // Passes from before the session do not count: the reps are done again.
  const old = REACTIVATION_REPS.map((id) => pass(id, { completedAt: '2026-10-04T14:00:00.000Z', date: '2026-10-04' }))
  const fresh = reactivationStatus(saved, old)
  assert.deepEqual([fresh.state, fresh.done, fresh.next, fresh.stage], ['in-progress', 0, REACTIVATION_REPS[0], 'Python recall'])
  const mid = reactivationStatus(saved, [...old, ...REACTIVATION_REPS.slice(0, 9).map((id) => pass(id))])
  assert.deepEqual([mid.done, mid.next, mid.stage], [9, REACTIVATION_REPS[9], 'Frequency maps'])
  const all = REACTIVATION_REPS.map((id) => pass(id))
  assert.deepEqual([reactivationStatus(saved, all).state, reactivationStatus(saved, all).finishedOn], ['done', '2026-10-12'])
  // The last rep with the solution open is not "reasonably clean": one more pass.
  const peeked = [...all.slice(0, -1), pass(REACTIVATION_FINAL, { solutionViewed: true })]
  const st = reactivationStatus(saved, peeked)
  assert.deepEqual([st.state, st.finalNeedsCleanPass, st.next], ['in-progress', true, REACTIVATION_FINAL])
  assert.equal(reactivationStatus(saved, [...peeked, pass(REACTIVATION_FINAL, { id: 'again', hintsUsed: 1 })]).state, 'done')
})
