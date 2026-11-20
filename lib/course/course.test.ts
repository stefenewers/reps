import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COURSE_START, COURSE_TARGET, courseWeekOf, dailyTarget, dayType, trainingDays, weekTarget } from '@/data/course/calendar'
import { WEEKS } from '@/data/course/weeks'
import { UNITS, UNIT_BY_ID } from '@/data/course/units'

test('the course: 14 weeks from Oct 26 to Jan 31; weeks 1–3 unchanged, then Sprint and Prep targets by date', () => {
  assert.equal(WEEKS.length, 14)
  assert.equal(WEEKS[0].startsOn, '2026-10-26')
  assert.equal(WEEKS[13].endsOn, '2027-01-31')
  // Before Nov 16: exactly as before. From it: Sprint floors (20 weekdays and the two make-up Sundays, 12 Saturdays) and Prep's nominal 6 (lib/course/sprint-plan.ts decides the real Sprint number).
  assert.deepEqual(WEEKS.slice(0, 3).map((w) => w.targetProblems), [50, 60, 75])
  assert.deepEqual([weekTarget(4), weekTarget(5)], [6 * 20 + 12, 4 * 20 + 12])
  assert.equal(COURSE_TARGET, WEEKS.reduce((n, w) => n + w.targetProblems, 0))
  assert.deepEqual([1, 2, 3].map(dailyTarget), [10, 12, 15])
})

test('planned rest: before Nov 16 Sundays and holidays (Saturdays optional); Sprint and Prep have their own rest days and train on Saturdays', () => {
  for (const d of ['2026-11-01', '2026-11-08', '2026-11-15']) assert.equal(dayType(d), 'rest', d)
  assert.equal(dayType('2026-10-31'), 'recovery')
  assert.equal(dayType('2026-11-14'), 'recovery')
  assert.equal(dayType('2026-10-26'), 'training')
  for (const d of ['2026-11-26', '2026-11-27', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31', '2027-01-01']) assert.equal(dayType(d), 'rest', d)
  for (const d of ['2026-11-21', '2026-11-22', '2026-11-28', '2026-11-29', '2026-12-05', '2027-01-18']) assert.equal(dayType(d), 'training', d)
  assert.deepEqual(trainingDays(9), ['2026-12-21', '2026-12-22', '2026-12-23'])
  assert.equal(dayType('2026-12-06'), 'rest', 'Sundays in Prep still rest')
  assert.deepEqual(trainingDays(10), ['2026-12-28', '2026-12-29', '2026-12-30', '2027-01-02'])
})

test('weeks are numbered from the course start', () => {
  assert.equal(courseWeekOf('2026-10-25'), 0)
  assert.equal(courseWeekOf(COURSE_START), 1)
  assert.equal(courseWeekOf('2026-11-01'), 1)
  assert.equal(courseWeekOf('2026-11-02'), 2)
  assert.equal(courseWeekOf('2027-01-31'), 14)
})

test('units: every week has units, ids are unique, prerequisites exist and come first', () => {
  assert.equal(new Set(UNITS.map((u) => u.id)).size, UNITS.length)
  for (const w of WEEKS) assert.ok(w.units.length, `week ${w.number}`)
  const order = new Map(UNITS.map((u, i) => [u.id, i]))
  for (const u of UNITS)
    for (const p of u.prerequisites) {
      assert.ok(UNIT_BY_ID[p], `${u.id}: unknown prerequisite ${p}`)
      assert.ok(order.get(p)! < order.get(u.id)!, `${u.id}: ${p} must come first`)
    }
})

test('the hard dependency chain of the spec is encoded', () => {
  const needs = (u: string, p: string) => {
    const seen = new Set<string>()
    const walk = (id: string): boolean => UNIT_BY_ID[id].prerequisites.some((x) => x === p || (!seen.has(x) && (seen.add(x), walk(x))))
    return walk(u)
  }
  assert.ok(needs('w3-two-pointers', 'w1-state-while'), 'state + while before pointers')
  assert.ok(needs('w5-linked-lists', 'w1-mutation-references'), 'mutation + references before rewiring')
  assert.ok(needs('w7-trees', 'w6-recursion'), 'recursion before trees')
  assert.ok(needs('w8-grids', 'w8-queue-bfs'), 'queue before BFS on grids')
  assert.ok(needs('w9-cycles', 'w8-graphs'), 'graph traversal before cycles')
})

import { SECTION_BY_ID, UNIT_OF_EXERCISE, unitPath } from '@/data/course'

test('the course can be queried: units resolve to existing reps, deterministically', () => {
  const two = UNIT_BY_ID['w3-two-pointers']
  const path = unitPath(two)
  assert.deepEqual(
    path.map((e) => e.id),
    two.path
  )
  assert.equal(path[0].id, SECTION_BY_ID['d3-two-pointers'].exercises[0].id)
  assert.deepEqual(
    unitPath(two).map((e) => e.id),
    path.map((e) => e.id)
  )
  assert.equal(UNIT_OF_EXERCISE['cap-two-sum'], 'w2-hashing')
  assert.equal(UNIT_OF_EXERCISE['cap-valid-palindrome'], 'w3-two-pointers')
})
