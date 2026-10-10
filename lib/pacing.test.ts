import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PLAN_DAYS, dayExercises } from '@/data/curriculum'
import { PACE } from '@/data/schedule-90'
import { PROBLEMS } from '@/data/problems'
import { budgetOn, buildQueue, firstSolves, forecast, paceStatus, resolvesFor, workingOnOrAfter, type Done } from '@/lib/pacing'
import { attempt } from '@/lib/test-helpers'
import type { SolveEntry } from '@/lib/solve-log'

const CAPS: Record<string, number> = Object.fromEntries(PROBLEMS.map((p) => [p.exerciseId ?? `cap-${p.id}`, p.number]))
const queue = buildQueue(PLAN_DAYS, PACE, CAPS)
const none: Done = { reps: new Set(), lc: new Set() }
/** Everything the baseline schedules on or before a date, done. */
const doneThrough = (date: string): Done => ({
  reps: new Set(queue.filter((q) => q.kind === 'rep' && q.baseline <= date).map((q) => q.key)),
  lc: new Set(queue.filter((q) => q.kind === 'lc' && q.baseline <= date).map((q) => q.lc!.lc)),
})

test('the queue is the whole plan, once, in the order the work is done', () => {
  const reps = PLAN_DAYS.flatMap((d) => dayExercises(d).map((e) => e.id))
  assert.deepEqual(queue.filter((q) => q.kind === 'rep').map((q) => q.key), reps)
  assert.equal(new Set(queue.map((q) => q.key)).size, queue.length)
  const news = PLAN_DAYS.flatMap((d) => (d.leetcode ?? []).filter((x) => x.type === 'new'))
  assert.equal(queue.filter((q) => q.kind === 'lc').length, news.length)
  assert.equal(queue[0].baseline, '2026-10-11')
  assert.ok(queue.find((q) => q.key === 'cap-two-sum')!.capstoneLc === 1, 'a Reps capstone knows which LeetCode problem it is')
  // A mastery check always comes after the ladder reps of its pattern.
  const firstGate = queue.findIndex((q) => q.gate)
  assert.ok(firstGate > 20 && queue.slice(0, firstGate).every((q) => !q.gate))
})

test('pace: on the line, ahead and behind are measured in working days, and today never counts against you', () => {
  // Day 2 (Mon Oct 12), with day 1 done: on pace, even though none of today is done.
  assert.deepEqual(pick(paceStatus(queue, doneThrough('2026-10-11'), '2026-10-12', PLAN_DAYS)), ['on-pace', 0])
  // Nothing done by day 4: three working days behind (Oct 11, 12, 13).
  assert.deepEqual(pick(paceStatus(queue, none, '2026-10-14', PLAN_DAYS)), ['behind', 3])
  // A Sunday off does not add to the count: Sat Oct 17 undone, seen on Mon Oct 19 = 1 day behind.
  assert.deepEqual(pick(paceStatus(queue, doneThrough('2026-10-16'), '2026-10-19', PLAN_DAYS)), ['behind', 1])
  // Through Wed's work on Monday: two whole working days ahead (Tue and Wed).
  assert.deepEqual(pick(paceStatus(queue, doneThrough('2026-10-14'), '2026-10-12', PLAN_DAYS)), ['ahead', 2])
  // Finished today's work only: still "on pace", not ahead.
  assert.deepEqual(pick(paceStatus(queue, doneThrough('2026-10-12'), '2026-10-12', PLAN_DAYS)), ['on-pace', 0])
  assert.equal(paceStatus(queue, none, '2026-10-10', PLAN_DAYS).state, 'not-started')
  assert.equal(paceStatus(queue, doneThrough('2027-01-08'), '2026-12-01', PLAN_DAYS).state, 'complete')
  assert.equal(paceStatus(queue, none, '2026-10-12', PLAN_DAYS).next?.key, queue[0].key, 'next up is the first thing not done, whatever the date')
})
const pick = (s: ReturnType<typeof paceStatus>) => [s.state, s.days]

test('forecast: on pace it lands on the last day; missing days pushes the finish out instead of breaking anything', () => {
  const onPace = forecast(queue, none, '2026-10-11', PLAN_DAYS, PACE)
  assert.equal(onPace.finish, '2027-01-08')
  assert.equal(onPace.days.reduce((n, d) => n + d.items.length, 0), queue.length, 'every item is placed exactly once')
  assert.deepEqual(onPace.days[0].items.map((q) => q.key), queue.filter((q) => q.baseline === '2026-10-11').map((q) => q.key), 'day 1 is the baseline day 1')

  // A week lost at the start: nothing is dropped, today picks up at the first undone item, and the finish moves later.
  const late = forecast(queue, none, '2026-10-19', PLAN_DAYS, PACE)
  assert.equal(late.days[0].date, '2026-10-19')
  assert.equal(late.days[0].items[0].key, queue[0].key)
  assert.equal(late.days.reduce((n, d) => n + d.items.length, 0), queue.length)
  assert.ok(late.finish! > '2027-01-08', `finish ${late.finish}`)
  // The buffer weeks absorb part of it: the slip at the end is smaller than the week that was lost.
  const slip = Math.round((new Date(late.finish!).getTime() - new Date('2027-01-08').getTime()) / 86_400_000)
  assert.ok(slip > 0 && slip < 8, `${slip} days late after losing a week`)

  // Never anything on a Sunday or a day off, and never more than two new LeetCode problems.
  for (const d of late.days) {
    assert.notEqual(new Date(`${d.date}T12:00:00`).getDay(), 0, d.date)
    assert.ok(!['2026-11-26', '2026-11-27', '2026-12-24', '2026-12-25', '2027-01-01'].includes(d.date), d.date)
    assert.ok(d.items.filter((q) => q.kind === 'lc').length <= PACE.maxNewLeetcode, d.date)
  }
})

test('forecast: work already done today comes out of today\'s stretch', () => {
  const full = forecast(queue, none, '2026-10-20', PLAN_DAYS, PACE)
  const part = forecast(queue, none, '2026-10-20', PLAN_DAYS, PACE, 100)
  assert.ok(part.days[0].date === '2026-10-20' && part.days[0].minutes < full.days[0].minutes)
  const spent = forecast(queue, none, '2026-10-20', PLAN_DAYS, PACE, 500)
  assert.equal(spent.days[0].date, '2026-10-21', 'today is used up: the rest starts tomorrow')
  assert.equal(budgetOn('2026-10-18', PLAN_DAYS, PACE), 0, 'Sunday')
  assert.equal(budgetOn('2026-10-20', PLAN_DAYS, PACE), PACE.budgets.build[0])
  assert.equal(budgetOn('2027-01-12', PLAN_DAYS, PACE), PACE.budgets.full[0], 'after the plan, the full pace continues')
})

test('re-solves follow the day you actually solved it: +3, +10, +30, never on a day off', () => {
  const rs = resolvesFor(new Map([[49, '2026-10-20']]), [], PLAN_DAYS, PACE.resolveGaps)
  assert.deepEqual(rs.map((r) => [r.round, r.due]), [[1, '2026-10-23'], [2, '2026-10-30'], [3, '2026-11-19']])
  // Solved on a Thursday: +3 is Sunday, so it slides to Monday.
  assert.equal(resolvesFor(new Map([[1, '2026-10-22']]), [], PLAN_DAYS, PACE.resolveGaps)[0].due, '2026-10-26')
  // +3 from Nov 23 is Thanksgiving: it slides to Saturday Nov 28.
  assert.equal(resolvesFor(new Map([[1, '2026-11-23']]), [], PLAN_DAYS, PACE.resolveGaps)[0].due, '2026-11-28')
  assert.equal(workingOnOrAfter('2026-12-24', PLAN_DAYS), '2026-12-26')
  // A re-solve done late pushes the next round out, so two rounds never land back to back.
  const late: SolveEntry = { id: 'lc:49:review1', lc: 49, title: 'Group Anagrams', date: '2026-10-30', kind: 'review1', result: 'unaided', at: '' }
  const after = resolvesFor(new Map([[49, '2026-10-20']]), [late], PLAN_DAYS, PACE.resolveGaps)
  assert.equal(after[0].doneOn, '2026-10-30')
  assert.ok(after.find((r) => r.round === 2)!.due >= '2026-11-02')
})

test('first solve: logged as new on LeetCode, or the capstone passed in Reps (whichever came first)', () => {
  const entries: SolveEntry[] = [{ id: 'lc:49:new', lc: 49, title: 'Group Anagrams', date: '2026-10-16', kind: 'new', result: 'hinted', at: '' }]
  const atts = [attempt({ exerciseId: 'cap-two-sum', date: '2026-10-14' }), attempt({ exerciseId: 'cap-two-sum', date: '2026-10-12', passed: false })]
  const f = firstSolves(entries, atts, CAPS, () => false)
  assert.equal(f.get(49), '2026-10-16')
  assert.equal(f.get(1), '2026-10-14')
  assert.equal(f.size, 2)
})
