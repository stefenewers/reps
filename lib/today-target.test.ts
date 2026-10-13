import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startLabel, todayTarget, type TodayInput } from '@/lib/today-target'

/** Today's target, maintenance and bonus, and when the day is done. */

const TODAY = '2026-10-13'
const rep = (id: string, done = false, baseline = TODAY, section = 'Index maps', minutes = 9) => ({ id, minutes, done, baseline, section })
const base = (over: Partial<TodayInput> = {}): TodayInput => ({
  today: TODAY,
  rest: false,
  status: { state: 'on-pace', days: 0 },
  finish: '2027-01-09',
  finishDelta: 0,
  planEnd: '2027-01-09',
  reps: [rep('a'), rep('b'), rep('c'), rep('d')],
  problems: [],
  prep: [],
  resolves: { total: 0, logged: 0 },
  cold: { due: 0, cap: 3, doneToday: 0 },
  ahead: 'Complements · Write: list the complements',
  ...over,
})
const states = (t: ReturnType<typeof todayTarget>) => t.items.map((i) => `${i.category}:${i.key}:${i.state}`)

test('caught up, target unfinished: "On track" is how the day starts, and the target remaining is plain', () => {
  const t = todayTarget(base({ reps: [rep('a', true), rep('b'), rep('c'), rep('d')] }))
  assert.equal(t.start.label, 'On track')
  assert.equal(t.day, 'target', 'on track at the start of the day is not the same as done')
  assert.deepEqual([t.target.repsDone, t.target.repsTotal, t.target.percent, t.target.minutesLeft], [1, 4, 25, 27])
  assert.equal(t.headline, '3 reps of today’s target remaining')
  assert.match(t.message, /^Finish this target to stay on track for Jan 9, the last day of the plan\.$/)
  assert.deepEqual(states(t), ['target:plan:now'])
})

test('behind: the status says so, and the checklist still says exactly what to do next', () => {
  const t = todayTarget(base({ status: { state: 'behind', days: 2 }, finish: '2027-01-12', finishDelta: 3, reps: [rep('a', false, '2026-10-12'), rep('b', false, '2026-10-12'), rep('c', false, '2026-10-12')] }))
  assert.equal(t.start.label, '2 working days behind')
  assert.equal(t.day, 'target')
  assert.equal(t.next?.key, 'plan')
  assert.equal(t.target.repsTotal, 3, "today's target is today's pace, not the whole backlog")
  assert.match(t.message, /came into today 2 working days behind/)
  assert.match(t.message, /keeps the forecast at Jan 12, 3 days after Jan 9/)
  assert.doesNotMatch(t.message, /on track/, 'finishing the target does not claim you have caught up')
})

test('target complete, maintenance remains: "target reached", never "everything complete"', () => {
  const t = todayTarget(base({ reps: [rep('a', true), rep('b', true)], resolves: { total: 2, logged: 1 }, cold: { due: 9, cap: 3, doneToday: 1 } }))
  assert.equal(t.day, 'maintenance')
  assert.equal(t.headline, 'Today’s target reached.')
  assert.equal(t.target.percent, 100)
  assert.deepEqual([t.maintenance.left, t.maintenance.summary, t.maintenance.minutesLeft], [3, '1 re-solve · 2 cold reps', 25])
  assert.match(t.message, /You are on track for Jan 9.*Maintenance remaining: 1 re-solve · 2 cold reps/)
  assert.match(t.message, /not needed for pace/)
  assert.doesNotMatch(`${t.headline} ${t.message}`, /Everything due|Done for today/i)
  assert.deepEqual(states(t), ['target:plan:done', 'maintenance:resolves:now', 'maintenance:cold:todo', 'bonus:bonus:todo'])
})

test('target and maintenance complete: the day is complete, and what follows is bonus', () => {
  const t = todayTarget(base({ reps: [rep('a', true), rep('b', true)], resolves: { total: 2, logged: 2 }, cold: { due: 6, cap: 3, doneToday: 3 } }))
  assert.equal(t.day, 'complete')
  assert.equal(t.headline, 'Everything due today is complete.')
  assert.match(t.message, /Anything else today is bonus/)
  assert.equal(t.next, null)
  const bonus = t.items.find((i) => i.category === 'bonus')!
  assert.match(bonus.label, /^Keep going: Complements/)
  assert.equal(bonus.detail, 'not needed today')
  // Today's share of the cold reps is done even though more are due: the cap is the day's number.
  assert.deepEqual([t.items.find((i) => i.key === 'cold')!.done, t.items.find((i) => i.key === 'cold')!.total], [3, 3])
})

test('ahead: work from later in the plan is bonus, not today’s requirement', () => {
  const t = todayTarget(base({ status: { state: 'ahead', days: 2 }, finishDelta: -2, finish: '2027-01-07', reps: [rep('x', false, '2026-10-15'), rep('y', false, '2026-10-15')] }))
  assert.equal(t.start.label, '2 working days ahead')
  assert.equal(t.day, 'complete', 'nothing is required today')
  assert.equal(t.target.repsTotal, 0)
  assert.equal(t.target.percent, 100)
  assert.deepEqual(states(t), ['bonus:bonus:todo'])
  assert.equal(t.items[0].label, '2 more items from later in the plan')
  assert.equal(t.next, null, 'bonus is never presented as the next required thing')
  // Partly ahead: what the line expected by today is the target, the rest of the stretch is bonus.
  const mixed = todayTarget(base({ reps: [rep('a'), rep('x', false, '2026-10-14')] }))
  assert.deepEqual([mixed.target.repsTotal, mixed.day], [1, 'target'])
  assert.equal(mixed.items.find((i) => i.category === 'bonus')!.label, '1 more item from later in the plan')
})

test('reactivation comes first and says what it is: recommended prep, not counted toward the target', () => {
  const prep = [
    { key: 'warm' as const, label: 'Warm up', detail: 'list indexing', total: 1, done: 0, minutes: 5 },
    { key: 'redo' as const, label: 'Again, cold', detail: '3 reps that needed help last session', total: 3, done: 0, minutes: 20 },
  ]
  const t = todayTarget(base({ prep }))
  assert.deepEqual(states(t), ['target:warm:now', 'target:redo:todo', 'target:plan:todo'])
  assert.ok(t.items[0].prep && t.items[1].prep && !t.items[2].prep)
  assert.equal(t.next?.key, 'warm')
  // Not counted: the percentage and the remaining minutes are the plan's own work.
  assert.deepEqual([t.target.repsTotal, t.target.percent, t.target.minutesLeft], [4, 0, 36])
  // Skipping the warm-up and doing the plan still reaches the target.
  const skipped = todayTarget(base({ prep, reps: [rep('a', true), rep('b', true), rep('c', true), rep('d', true)] }))
  assert.equal(skipped.day, 'complete')
  // With no target left to prepare for (ahead), prep is not shown at all.
  assert.ok(!todayTarget(base({ prep, reps: [] })).items.some((i) => i.prep))
})

test('a due LeetCode re-solve is in the same checklist, under maintenance, and a new problem is target work', () => {
  const t = todayTarget(base({ problems: [{ lc: 49, title: 'Group Anagrams', minutes: 40, done: false, baseline: TODAY }], resolves: { total: 1, logged: 0 } }))
  assert.deepEqual(states(t), ['target:plan:now', 'target:problem:todo', 'maintenance:resolves:todo'])
  assert.equal(t.headline, '4 reps and 1 problem of today’s target remaining')
  assert.equal(t.target.minutesLeft, 76)
  const done = todayTarget(base({ reps: [rep('a', true)], problems: [{ lc: 49, title: 'Group Anagrams', minutes: 40, done: true, baseline: TODAY }], resolves: { total: 1, logged: 0 } }))
  assert.deepEqual([done.day, done.next?.key, done.maintenance.summary], ['maintenance', 'resolves', '1 re-solve'])
})

test('a rest day is simply a rest day: no percentage, no checklist', () => {
  const t = todayTarget(base({ rest: true, resolves: { total: 2, logged: 0 } }))
  assert.deepEqual([t.day, t.headline, t.target.percent, t.items.length, t.next], ['rest', 'Rest day.', 0, 0, null])
  assert.match(t.message, /Rest is part of the plan/)
  // A working day with nothing in it at all reads the same way.
  assert.equal(todayTarget(base({ reps: [], ahead: null })).day, 'rest')
})

test('the start label only ever describes how the day began', () => {
  assert.equal(startLabel({ state: 'on-pace', days: 0 }), 'On track')
  assert.equal(startLabel({ state: 'behind', days: 1 }), '1 working day behind')
  assert.equal(startLabel({ state: 'ahead', days: 3 }), '3 working days ahead')
  assert.equal(startLabel({ state: 'not-started', days: 0 }), 'Not started yet')
})
