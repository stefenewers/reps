import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PLAN_DAYS, dayExercises } from '@/data/curriculum'
import { PLAN_UNITS } from '@/data/schedule-90'
import { CHECKPOINTS } from '@/data/program-90day'
import { activeDates, activityByDate, checkpointStatus, problemsSolved, streak, unitReadiness, weeklyTime } from '@/lib/progress-90'
import { attempt } from '@/lib/test-helpers'
import type { SolveEntry } from '@/lib/solve-log'

const solve = (over: Partial<SolveEntry>): SolveEntry => ({ id: 'lc:49:new', lc: 49, title: 'Group Anagrams', date: '2026-10-16', kind: 'new', result: 'unaided', at: '', ...over })

test('activity adds time in Reps to minutes logged on LeetCode', () => {
  const a = [attempt({ date: '2026-10-12', durationSeconds: 600 }), attempt({ date: '2026-10-12', durationSeconds: 300 })]
  const act = activityByDate(a, [solve({ date: '2026-10-12', minutes: 20 }), solve({ id: 'x', date: '2026-10-13' })])
  assert.equal(act['2026-10-12'], 35)
  assert.equal(act['2026-10-13'], 0)
  assert.ok(activeDates(a, [solve({ id: 'x', date: '2026-10-13' })]).has('2026-10-13'), 'a logged solve counts as activity even without minutes')
})

test('streak counts working days in a row; off days do not break it and today is not held against you', () => {
  const days = new Set(['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-19'])
  assert.equal(streak(days, '2026-10-19', PLAN_DAYS), 4, 'Sunday Oct 18 is off and does not break it')
  assert.equal(streak(days, '2026-10-20', PLAN_DAYS), 4, 'today not started yet')
  assert.equal(streak(days, '2026-10-21', PLAN_DAYS), 0, 'Oct 20 was missed')
  assert.equal(streak(new Set(), '2026-10-12', PLAN_DAYS), 0)
})

test('weekly time compares practice with the planned blocks, for all 13 weeks', () => {
  const w = weeklyTime({ '2026-10-12': 90, '2026-10-13': 30.4 }, PLAN_DAYS)
  assert.equal(w.length, 13)
  assert.equal(w[0].actual, 120)
  assert.ok(w[0].planned > 500 && w[0].planned < 900, `week 1 plans ${w[0].planned} min`)
  assert.ok(w[4].planned > w[0].planned, 'the full phase plans more than the soft start')
  assert.equal(w[10].planned < w[9].planned, true, 'a buffer week plans less')
})

test('a pattern is cleared when every rep of its ladder and check is passed', () => {
  const hashing = PLAN_UNITS[0]
  const none = unitReadiness(PLAN_UNITS, PLAN_DAYS, [])
  assert.equal(none[0].name, 'Hashing')
  assert.ok(none[0].total > 20 && !none[0].cleared)
  const ids = new Set(hashing.sections.concat(hashing.check!))
  const all = PLAN_DAYS.flatMap((d) => d.sections.filter((s) => !s.optional && ids.has(s.id)).flatMap((s) => s.exercises)).map((e) => attempt({ exerciseId: e.id }))
  const done = unitReadiness(PLAN_UNITS, PLAN_DAYS, all)
  assert.ok(done[0].cleared)
  assert.ok(!done[1].cleared)
  assert.equal(PLAN_UNITS.length, 15)
})

test('problems done counts each LeetCode number once, from the log or a Reps capstone', () => {
  const caps = { 'cap-two-sum': 1 }
  const solves = [solve({}), solve({ id: 'lc:49:review1', kind: 'review1', date: '2026-10-20' })]
  assert.equal(problemsSolved(solves, [attempt({ exerciseId: 'cap-two-sum', date: '2026-10-14' })], caps), 2)
  assert.equal(problemsSolved(solves, [attempt({ exerciseId: 'cap-two-sum', date: '2026-10-14' })], caps, '2026-10-15'), 1)
  assert.equal(problemsSolved([], [attempt({ exerciseId: 'cap-two-sum', passed: false })], caps), 0)
})

test('checkpoints report actual against target and whether each is met', () => {
  const first = dayExercises(PLAN_DAYS[0])
  const st = checkpointStatus(CHECKPOINTS, '2026-10-20', { units: PLAN_UNITS, planDays: PLAN_DAYS, attempts: first.map((e) => attempt({ exerciseId: e.id, date: '2026-10-11' })), solves: [solve({ id: 'lc:1:review1', lc: 1, kind: 'review1' })], mocks: [], inAppMocks: ['2026-10-19'], capstoneNumber: {} })
  assert.deepEqual(st.map((c) => c.label), ['Day 30', 'Day 60', 'Day 90'])
  assert.equal(st[0].reached, false)
  const row = (name: string) => st[0].rows.find((r) => r.name === name)!
  assert.equal(row('Patterns cleared').actual, '0')
  assert.equal(row('Re-solves unaided').actual, '100%')
  assert.ok(row('Re-solves unaided').met)
  assert.equal(row('Mocks logged').actual, '1')
  assert.ok(!row('Problems done').met)
})
