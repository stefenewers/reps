import { test } from 'node:test'
import assert from 'node:assert/strict'
import { courseLeetcode, nextTrainingDay } from '@/lib/course/resolves'
import type { SolveEntry } from '@/lib/solve-log'
import type { LeetcodeItem } from '@/lib/types'

const meta = (lc: number) => ({ lc, title: `P${lc}`, difficulty: 'Easy', pattern: 'x', type: 'new', mode: null, video: null, url: '' }) as unknown as LeetcodeItem
const entry = (id: string, lc: number, date: string, kind: SolveEntry['kind'], result: SolveEntry['result'] = 'unaided') => ({ id, lc, title: `P${lc}`, date, kind, result, at: '' }) as SolveEntry

test('re-solves come back +3, +10 and +30 days after the first solve, on a training day', () => {
  const first = entry('lc:1:new', 1, '2026-11-02', 'new')
  assert.deepEqual(courseLeetcode('2026-11-04', [first], [], meta).map((x) => x.solveId), [])
  assert.deepEqual(courseLeetcode('2026-11-05', [first], [], meta).map((x) => x.solveId), ['lc:1:review1'])
  const r1 = entry('lc:1:review1', 1, '2026-11-05', 'review1')
  assert.deepEqual(courseLeetcode('2026-11-06', [first, r1], [], meta).map((x) => x.solveId), [])
  assert.deepEqual(courseLeetcode('2026-11-12', [first, r1], [], meta).map((x) => x.solveId), ['lc:1:review2'])
  assert.equal(nextTrainingDay('2026-12-25'), '2026-12-28', 'never on a holiday or a weekend')
})

test('a re-solve that needed help comes back as a redo on the next training day', () => {
  const es = [entry('lc:1:new', 1, '2026-11-02', 'new'), entry('lc:1:review1', 1, '2026-11-06', 'review1', 'hinted')]
  assert.deepEqual(courseLeetcode('2026-11-09', es, [], meta).map((x) => x.solveId), ['redo:1:2026-11-09'])
})

test('new problems from the course queue are listed until logged, and stay visible on the day they were logged', () => {
  assert.deepEqual(courseLeetcode('2026-11-10', [], [125], meta).map((x) => [x.lc, x.type]), [[125, 'new']])
  const done = entry('lc:125:new', 125, '2026-11-10', 'new')
  assert.equal(courseLeetcode('2026-11-10', [done], [125], meta).length, 1)
  assert.equal(courseLeetcode('2026-11-11', [done], [], meta).length, 0)
})
