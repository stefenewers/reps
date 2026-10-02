import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildReviewSession, dueReviews, scheduleAfterAttempt } from '@/lib/schedule'
import { attempt, exercise } from '@/lib/test-helpers'
import { localDate } from '@/lib/dates'

const opts = { lastDay: '2026-10-11' }
const NOW = new Date(2026, 9, 2, 10, 0, 0) // Oct 2, 10:00 local
const ex = exercise({ skills: ['dict_get', 'frequency_map'] })

test('first production schedules each skill for the next morning', () => {
  const items = scheduleAfterAttempt(attempt({ skills: ex.skills }), ex, [], NOW, opts)
  assert.equal(items.length, 2)
  for (const i of items) {
    assert.equal(i.status, 'pending')
    assert.equal(localDate(new Date(i.dueAt)), '2026-10-03')
  }
})

test('recognition alone does not schedule a skill', () => {
  const items = scheduleAfterAttempt(attempt({ stage: 'recognize' }), exercise({ stage: 'recognize' }), [], NOW, opts)
  assert.equal(items.length, 0)
})

test('a failure brings the skill back within the hour', () => {
  const items = scheduleAfterAttempt(attempt({ passed: false }), exercise(), [], NOW, opts)
  assert.equal(items[0].reason, 'failed')
  assert.equal(new Date(items[0].dueAt).getTime() - NOW.getTime(), 3_600_000)
})

test('a shaky pass (hints) comes back later the same day', () => {
  const items = scheduleAfterAttempt(attempt({ hintsUsed: 3 }), exercise(), [], NOW, opts)
  assert.equal(items[0].reason, 'shaky')
  assert.equal(localDate(new Date(items[0].dueAt)), '2026-10-02')
})

test('clean cold reviews advance: +1 day, then +3 days, capped at the final day, then done', () => {
  let queue = scheduleAfterAttempt(attempt(), exercise(), [], NOW, opts)
  // Day 2: cold review when due
  let now = new Date(2026, 9, 3, 9)
  queue = scheduleAfterAttempt(attempt({ retrievalType: 'cold' }), exercise(), queue, now, opts)
  assert.equal(queue[0].step, 1)
  assert.equal(localDate(new Date(queue[0].dueAt)), '2026-10-06')
  now = new Date(2026, 9, 6, 9)
  queue = scheduleAfterAttempt(attempt({ retrievalType: 'cold' }), exercise(), queue, now, opts)
  assert.equal(queue[0].step, 2)
  assert.equal(localDate(new Date(queue[0].dueAt)), '2026-10-11', 'never past the last day')
  now = new Date(2026, 9, 11, 9)
  queue = scheduleAfterAttempt(attempt({ retrievalType: 'cold' }), exercise(), queue, now, opts)
  assert.equal(queue[0].status, 'done')
})

test('practice while already scheduled leaves the due date alone', () => {
  const first = scheduleAfterAttempt(attempt(), exercise(), [], NOW, opts)
  const again = scheduleAfterAttempt(attempt(), exercise(), first, new Date(NOW.getTime() + 60_000), opts)
  assert.equal(again.length, 0)
})

test('important exercises (capstones) get their own cold re-solve item', () => {
  const cap = exercise({ id: 'cap-two-sum', review: { important: true }, stage: 'capstone', repType: 'capstone' })
  const items = scheduleAfterAttempt(attempt({ exerciseId: cap.id, stage: 'capstone' }), cap, [], NOW, opts)
  assert.ok(items.some((i) => i.id === 'ex:cap-two-sum' && i.reviewType === 'exercise'))
})

test('dueReviews and buildReviewSession pick production reps for due skills', () => {
  const queue = scheduleAfterAttempt(attempt({ passed: false }), exercise(), [], NOW, opts)
  const later = new Date(NOW.getTime() + 2 * 3_600_000)
  const due = dueReviews(queue, later)
  assert.equal(due.length, 1)
  const pool = [exercise({ id: 'a', kind: 'choice', stage: 'recognize' }), exercise({ id: 'b' }), exercise({ id: 'c', kind: 'output', stage: 'trace' })]
  const ids = buildReviewSession(due, pool, { a: '2026-10-02', b: '2026-10-02', c: '2026-10-02' }, [], '2026-10-02', later)
  assert.deepEqual(ids, ['b'])
})
