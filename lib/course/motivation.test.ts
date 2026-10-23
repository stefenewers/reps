import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MILESTONES, milestoneReached, motivate, todayLine } from '@/data/course/motivation'

test('copy follows the evidence: never "on track" when the week is off track', () => {
  const off = motivate('week-progress', { week: 3, weekDone: 20, weekTarget: 75, weekStatus: 'off-track', shortfall: 25 })
  assert.doesNotMatch(off.text, /on track/i)
  const on = motivate('week-progress', { week: 3, weekDone: 45, weekTarget: 75, weekStatus: 'on-track' })
  assert.match(on.text, /On track for February 1/)
})

test('planned rest has no guilt and no debt', () => {
  const rest = todayLine({ dayType: 'rest', holiday: 'Christmas Day' })
  assert.equal(rest.text, 'Christmas Day. Rest day. Nothing is due. Your plan is intact.')
  assert.doesNotMatch(rest.text, /behind|missed|owe|streak|catch up/i)
})

test('an incomplete day stays truthful and constructive', () => {
  const t = motivate('day-incomplete', { repsDone: 11, repsTarget: 15, skillImproved: 'pointer movement', weekStatus: 'recoverable' })
  assert.match(t.text, /^11\/15 complete\./)
  assert.match(t.text, /pointer movement/)
  assert.match(t.text, /4 reps short/)
  assert.doesNotMatch(t.text, /crushing|great job|amazing/i)
})

test('completion is celebrated only when the target is met, and help-heavy days say so', () => {
  assert.equal(todayLine({ dayType: 'training', repsDone: 14, repsTarget: 15 }).event, 'day-halfway')
  assert.equal(todayLine({ dayType: 'training', repsDone: 15, repsTarget: 15 }).event, 'day-complete')
  assert.equal(todayLine({ dayType: 'training', repsDone: 15, repsTarget: 15, seed: 'x' }).tone, 'celebrate')
  assert.match(motivate('day-complete', { repsDone: 15, repsTarget: 15, assistedCount: 10 }).text, /needed help/)
  assert.equal(todayLine({ dayType: 'training', repsDone: 0, repsTarget: 10 }).event, 'day-start')
})

test('milestones fire once, when crossed', () => {
  assert.deepEqual(MILESTONES, [50, 250, 500, 750, 950])
  assert.equal(milestoneReached(48, 51), 50)
  assert.equal(milestoneReached(51, 60), null)
})
