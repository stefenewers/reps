import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAYS, DAY_BY_DATE } from '@/data/curriculum'
import { leetcodeFor, nextReview, nextWorkingDay, planSolveId, redoQueue, resolveQueue, unaidedRate, type SolveEntry } from '@/lib/solve-log'
import type { LeetcodeItem } from '@/lib/types'

const entry = (over: Partial<SolveEntry>): SolveEntry => ({ id: 'lc:1:review1', lc: 1, title: 'Two Sum', date: '2026-10-17', kind: 'review1', result: 'unaided', at: '2026-10-17T15:00:00Z', ...over })
const meta = (lc: number): LeetcodeItem | undefined => DAYS.flatMap((d) => d.leetcode ?? []).find((x) => x.lc === lc)

test('next working day skips Sundays and days off', () => {
  assert.equal(nextWorkingDay('2026-10-16', DAYS), '2026-10-17') // Friday → Saturday
  assert.equal(nextWorkingDay('2026-10-17', DAYS), '2026-10-19') // Saturday → Monday (Sunday is off)
  assert.equal(nextWorkingDay('2026-11-25', DAYS), '2026-11-28') // Wed → Sat (Thanksgiving Thu + Fri off)
  assert.equal(nextWorkingDay('2026-12-31', DAYS), '2027-01-02') // Jan 1 off
  assert.equal(nextWorkingDay('2027-01-08', DAYS), null) // nothing after the plan
})

test('a re-solve that needed help comes back on the next working day', () => {
  const helped = entry({ result: 'hinted' })
  assert.deepEqual(redoQueue([helped], DAYS).map((r) => [r.lc, r.due, r.id]), [[1, '2026-10-19', 'redo:1:2026-10-19']])
  assert.deepEqual(redoQueue([entry({ result: 'failed' })], DAYS).map((r) => r.due), ['2026-10-19'])
  // Unaided re-solves and new problems never trigger one.
  assert.deepEqual(redoQueue([entry({})], DAYS), [])
  assert.deepEqual(redoQueue([entry({ id: 'lc:49:new', lc: 49, kind: 'new', result: 'hinted' })], DAYS), [])
})

test('the redo shows on its day, carries over until logged, and a redo that needs help triggers another', () => {
  const helped = entry({ result: 'hinted' })
  const monday = leetcodeFor(DAY_BY_DATE['2026-10-19'], [helped], DAYS, meta)
  assert.equal(monday[0].type, 'redo')
  assert.equal(monday[0].solveId, 'redo:1:2026-10-19')
  assert.ok(!leetcodeFor(DAY_BY_DATE['2026-10-17'], [helped], DAYS, meta).some((x) => x.type === 'redo'), 'not on the day it was logged')
  assert.ok(!leetcodeFor(DAY_BY_DATE['2026-10-18'], [helped], DAYS, meta).some((x) => x.type === 'redo'), 'never on an off day')
  assert.ok(leetcodeFor(DAY_BY_DATE['2026-10-20'], [helped], DAYS, meta).some((x) => x.type === 'redo'), 'still there the day after if not done')

  const done = entry({ id: 'redo:1:2026-10-19', kind: 'redo', date: '2026-10-19', result: 'unaided' })
  assert.deepEqual(redoQueue([helped, done], DAYS), [])
  assert.ok(leetcodeFor(DAY_BY_DATE['2026-10-19'], [helped, done], DAYS, meta).some((x) => x.solveId === done.id), 'a logged redo stays on the day it was done')

  const again = { ...done, result: 'hinted' as const }
  assert.deepEqual(redoQueue([helped, again], DAYS).map((r) => r.due), ['2026-10-20'])
})

test('the unaided rate counts re-solves and redos, not first contact', () => {
  const es = [entry({}), entry({ id: 'lc:49:review1', lc: 49, result: 'hinted' }), entry({ id: 'redo:49:2026-10-19', lc: 49, kind: 'redo', date: '2026-10-19', result: 'unaided' }), entry({ id: 'lc:128:new', lc: 128, kind: 'new', result: 'failed' })]
  assert.deepEqual(unaidedRate(es), { unaided: 2, total: 3, rate: 2 / 3 })
  assert.deepEqual(unaidedRate(es, '2026-10-17'), { unaided: 1, total: 2, rate: 0.5 })
  assert.equal(unaidedRate([]).rate, null)
})

test('next review: the pending redo if there is one, otherwise the next planned re-solve', () => {
  const first = DAYS.find((d) => d.leetcode?.some((x) => x.lc === 49 && x.type === 'new'))!
  const r1 = DAYS.find((d) => d.leetcode?.some((x) => x.lc === 49 && x.type === 'review1'))!
  const solved = entry({ id: 'lc:49:new', lc: 49, title: 'Group Anagrams', kind: 'new', date: first.date })
  assert.equal(nextReview(solved, [solved], DAYS), r1.date)
  const helped = entry({ id: planSolveId({ lc: 49, type: 'review1' }), lc: 49, kind: 'review1', date: r1.date, result: 'hinted' })
  assert.equal(nextReview(helped, [solved, helped], DAYS), nextWorkingDay(r1.date, DAYS))
})

test('the re-solve queue lists redos and unlogged planned re-solves, soonest first', () => {
  const q = resolveQueue([], DAYS, '2026-10-11', 5)
  assert.equal(q.length, 5)
  assert.deepEqual(q.map((x) => x.date), [...q.map((x) => x.date)].sort())
  assert.equal(q[0].date, '2026-10-11')
  const logged = entry({ id: planSolveId({ lc: q[0].lc, type: q[0].type }), lc: q[0].lc, date: '2026-10-11' })
  assert.ok(!resolveQueue([logged], DAYS, '2026-10-11', 5).some((x) => x.lc === q[0].lc && x.date === '2026-10-11'))
  assert.ok(resolveQueue([], DAYS, '2026-10-14', 3)[0].overdue, 'unlogged past re-solves are flagged overdue')
})
