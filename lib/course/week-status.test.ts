import { test } from 'node:test'
import assert from 'node:assert/strict'
import { courseDay, flameFor, momentum, trainingStreak, weekProgress } from '@/lib/course/week-status'
import { trainingDays } from '@/data/course/calendar'

const fill = (dates: string[], n: number) => Object.fromEntries(dates.map((d) => [d, n]))

test('the daily target: 10 in week 1, 12 in week 2, 15 after; nothing on planned rest', () => {
  assert.deepEqual([courseDay('2026-10-26').target, courseDay('2026-11-02').target, courseDay('2026-11-09').target, courseDay('2027-01-25').target], [10, 12, 15, 15])
  for (const d of ['2026-12-25', '2026-12-26', '2026-12-31', '2027-01-01', '2027-01-18', '2026-11-01']) {
    const day = courseDay(d)
    assert.equal(day.type, 'rest', d)
    assert.equal(day.target, 0, `${d} creates no debt`)
  }
  assert.equal(courseDay('2026-12-25').holiday, 'Christmas Day')
})

test('a holiday week asks only for its training days: Christmas week 60, New Year week 45', () => {
  const w9 = weekProgress(9, '2026-12-27', fill(trainingDays(9), 15))
  assert.deepEqual([w9.target, w9.done, w9.status], [60, 60, 'on-track'])
  const w10 = weekProgress(10, '2027-01-03', fill(trainingDays(10), 15))
  assert.deepEqual([w10.target, w10.status], [45, 'on-track'])
})

test('Saturday is optional recovery: it shows what would close the week, and owes nothing', () => {
  const credits = { ...fill(trainingDays(3).slice(0, 4), 15), '2026-11-13': 11 }
  const sat = courseDay('2026-11-14', credits)
  assert.deepEqual([sat.type, sat.target, sat.optionalTarget], ['recovery', 0, 4])
  assert.equal(weekProgress(3, '2026-11-14', credits).status, 'recoverable')
  assert.equal(weekProgress(3, '2026-11-15', { ...credits, '2026-11-14': 4 }).status, 'on-track', 'four on Saturday recovers the week')
})

test('an unfinished morning is not a shortfall; a missed day is', () => {
  const mon = trainingDays(3)[0]
  assert.equal(weekProgress(3, mon, { [mon]: 3 }).status, 'on-track')
  assert.equal(weekProgress(3, trainingDays(3)[1], { [mon]: 3 }).status, 'recoverable')
  assert.equal(weekProgress(3, trainingDays(3)[2], {}).status, 'off-track')
})

test('a finished week missing a lab or a checkpoint is not on track, whatever the count', () => {
  const credits = fill(trainingDays(3), 15)
  assert.equal(weekProgress(3, '2026-11-16', credits, { labsDone: 1, labsRequired: 2, gatesCleared: 4, gatesRequired: 4 }).status, 'recoverable')
  assert.equal(weekProgress(3, '2026-11-16', credits, { labsDone: 2, labsRequired: 2, gatesCleared: 4, gatesRequired: 4 }).status, 'on-track')
})

test('the streak counts required days completed; planned rest (Sundays, holidays) protects it', () => {
  const credits = fill([...trainingDays(9), ...trainingDays(10)], 15)
  // Dec 21–24 then the holidays, Dec 28–30: seven training days in a row across Christmas.
  assert.equal(trainingStreak('2026-12-30', credits), 7)
  assert.equal(trainingStreak('2027-01-02', credits), 7, 'New Year rest does not break it')
  // An unfinished today does not break it; a missed training day does.
  assert.equal(trainingStreak('2027-01-04', { ...credits, '2027-01-04': 5 }), 7)
  assert.equal(trainingStreak('2027-01-05', { ...credits, '2027-01-05': 15 }), 1)
  // Saturday work is welcome but is not a required day.
  assert.equal(trainingStreak('2026-10-31', { ...fill(trainingDays(1), 10), '2026-10-31': 10 }), 5)
})

test('the flame grows with today’s progress; momentum cannot be farmed', () => {
  assert.deepEqual([0, 3, 5, 10].map((n) => flameFor(n, 10)), ['unlit', 'ember', 'burning', 'blaze'])
  const w = fill([...trainingDays(1), ...trainingDays(2)], 12)
  assert.equal(momentum('2026-11-06', w), 'on-fire')
  assert.equal(momentum('2026-11-06', fill([...trainingDays(1), ...trainingDays(2)].filter((_, i) => i % 2), 40)), 'building', 'big days on half the days is not momentum')
  assert.equal(momentum('2026-10-26', {}), 'starting')
})
