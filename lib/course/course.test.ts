import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COURSE_START, COURSE_TARGET, courseWeekOf, dailyTarget, dayType, trainingDays, weekTarget } from '@/data/course/calendar'
import { WEEKS } from '@/data/course/weeks'
import { UNITS, UNIT_BY_ID } from '@/data/course/units'

test('the course: 14 weeks from Oct 26 to Jan 31, 950 qualifying problems with holidays', () => {
  assert.equal(WEEKS.length, 14)
  assert.equal(WEEKS[0].startsOn, '2026-10-26')
  assert.equal(WEEKS[13].endsOn, '2027-01-31')
  assert.deepEqual(WEEKS.map((w) => w.targetProblems), [50, 60, 75, 75, 75, 75, 75, 75, 60, 45, 75, 75, 60, 75])
  assert.equal(COURSE_TARGET, 950)
  assert.deepEqual([1, 2, 3, 9, 14].map(dailyTarget), [10, 12, 15, 15, 15])
})

test('planned rest: Sundays and the five holidays are rest, Saturdays are optional recovery', () => {
  for (const d of ['2026-12-25', '2026-12-26', '2026-12-31', '2027-01-01', '2027-01-18', '2026-11-01']) assert.equal(dayType(d), 'rest', d)
  assert.equal(dayType('2026-10-31'), 'recovery')
  assert.equal(dayType('2026-10-26'), 'training')
  assert.deepEqual(trainingDays(9), ['2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24'])
  assert.deepEqual(trainingDays(10), ['2026-12-28', '2026-12-29', '2026-12-30'])
  assert.equal(trainingDays(13)[0], '2027-01-19', 'MLK Day is off')
  assert.equal(weekTarget(10), 45)
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
  assert.ok(path.length >= 20)
  assert.equal(path[0].id, SECTION_BY_ID['d3-two-pointers'].exercises[0].id)
  assert.deepEqual(unitPath(two).map((e) => e.id), path.map((e) => e.id))
  assert.equal(UNIT_OF_EXERCISE['cap-two-sum'], 'w2-hashing')
  assert.equal(UNIT_OF_EXERCISE['cap-valid-palindrome'], 'w3-two-pointers')
})
