import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EXERCISE_BY_ID, PLAN_DAYS, dayExercises, sectionSlice } from '@/data/curriculum'
import { PACE, RESOLVE_CAPS } from '@/data/schedule-90'
import { PROBLEMS } from '@/data/problems'
import { buildCalendar, nextRep } from '@/lib/pace-calendar'
import { passedSet } from '@/lib/progress'
import { attempt } from '@/lib/test-helpers'
import type { Attempt, LeetcodeItem } from '@/lib/types'
import type { SolveEntry } from '@/lib/solve-log'

const CAPS: Record<string, number> = Object.fromEntries(PROBLEMS.map((p) => [p.exerciseId ?? `cap-${p.id}`, p.number]))
const META = new Map<number, LeetcodeItem>()
for (const d of PLAN_DAYS) for (const x of d.leetcode ?? []) if (!META.has(x.lc)) META.set(x.lc, x)
const cal = (today: string, attempts: Attempt[] = [], entries: SolveEntry[] = []) =>
  buildCalendar({ planDays: PLAN_DAYS, pace: PACE, attempts, entries, today, capstoneNumber: CAPS, passed: passedSet(attempts), cleanPass: (id) => Boolean(EXERCISE_BY_ID[id]?.cleanPass), sectionSlice, lcMeta: (n) => META.get(n), resolveCaps: RESOLVE_CAPS })
const reps = (d: { sections: { optional?: boolean; exercises: { id: string }[] }[] }) => d.sections.flatMap((s) => s.exercises.map((e) => e.id))
const pass = (ids: string[], date: string) => ids.map((id) => attempt({ exerciseId: id, date, completedAt: `${date}T15:00:00Z` }))

test('on day 1 with nothing done, the forecast is the original schedule', () => {
  const c = cal('2026-10-11')
  assert.equal(c.days.length, 90)
  for (const base of PLAN_DAYS) {
    assert.deepEqual(reps(c.byDate[base.date]), dayExercises(base).map((e) => e.id), `${base.date}: reps`)
    const news = (d: { leetcode?: LeetcodeItem[] }) => (d.leetcode ?? []).filter((x) => x.type === 'new').map((x) => x.lc)
    assert.deepEqual(news(c.byDate[base.date]), news(base), `${base.date}: new LeetCode`)
  }
  assert.equal(c.finish, '2027-01-08')
  assert.equal(c.finishDelta, 0)
  assert.equal(c.status.state, 'on-pace')
})

test('missing days breaks nothing: today picks up at the first undone rep and the calendar re-lays itself', () => {
  const c = cal('2026-10-14') // three working days in, nothing done
  assert.deepEqual([c.status.state, c.status.days], ['behind', 3])
  assert.deepEqual(reps(c.byDate['2026-10-11']), [], 'a past day records what was done: nothing')
  assert.equal(c.byDate['2026-10-11'].focus, 'Nothing was logged this day.')
  assert.equal(reps(c.byDate['2026-10-14'])[0], dayExercises(PLAN_DAYS[0])[0].id, 'today starts where you actually are')
  assert.equal(nextRep(c.queue, new Set())!.key, dayExercises(PLAN_DAYS[0])[0].id)
  // Three lost days fit inside the buffer weeks, so the finish holds. That is what the buffers are for.
  assert.equal(c.finish, '2027-01-08')
  const twoWeeks = cal('2026-10-26')
  assert.ok(twoWeeks.finish! > '2027-01-08' && twoWeeks.finishDelta > 0, 'two lost weeks push the finish out, and nothing is dropped')
  assert.equal(twoWeeks.days.length, 90 + twoWeeks.finishDelta, 'the calendar grows to hold it')
  // Every rep is still on the calendar exactly once.
  const all = c.days.flatMap(reps)
  assert.equal(new Set(all).size, all.length)
  assert.equal(all.length, PLAN_DAYS.reduce((n, d) => n + dayExercises(d).length, 0))
})

test('today shows what you have done so far plus the rest of the day\'s stretch; past days show what you did', () => {
  const day1 = dayExercises(PLAN_DAYS[0]).map((e) => e.id)
  const day2 = dayExercises(PLAN_DAYS[1]).map((e) => e.id)
  const c = cal('2026-10-12', [...pass(day1, '2026-10-11'), ...pass(day2.slice(0, 3), '2026-10-12')])
  assert.deepEqual(reps(c.byDate['2026-10-11']), day1, 'day 1 is a record')
  const today = reps(c.byDate['2026-10-12'])
  assert.deepEqual(today.slice(0, 3), day2.slice(0, 3), 'what was done today leads')
  assert.ok(today.length > 3, 'then the rest of the stretch')
  assert.ok(c.doneTodayMinutes > 0 && c.todayBudget === PACE.budgets.soft[0])
  assert.equal(c.status.state, 'on-pace')
})

test('working ahead pulls later work forward and the finish comes in early', () => {
  const firstThree = PLAN_DAYS.slice(0, 3).flatMap((d) => dayExercises(d).map((e) => e.id))
  const c = cal('2026-10-11', pass(firstThree, '2026-10-11'))
  assert.equal(c.status.state, 'ahead')
  assert.ok(c.status.days >= 2)
  assert.ok(c.finishDelta <= 0)
  assert.deepEqual(reps(c.byDate['2026-10-11']).slice(0, firstThree.length), firstThree)
})

test('re-solves land on the day they fall due, counted from when you actually solved the problem', () => {
  const solved: SolveEntry = { id: 'lc:49:new', lc: 49, title: 'Group Anagrams', date: '2026-10-20', kind: 'new', result: 'unaided', at: '' }
  const c = cal('2026-10-21', [], [solved])
  const has = (date: string, type: string) => (c.byDate[date].leetcode ?? []).some((x) => x.lc === 49 && x.type === type)
  assert.ok(has('2026-10-20', 'new'), 'the day it was solved records it')
  assert.ok(has('2026-10-23', 'review1'), '+3 days')
  assert.ok(has('2026-10-30', 'review2'), '+10 days')
  assert.ok(has('2026-11-19', 'review3'), '+30 days')
  // Overdue re-solves come to today, most overdue first, up to the day's cap.
  const later = cal('2026-11-02', [], [solved])
  assert.ok(later.due.some((r) => r.lc === 49 && r.round === 1), 'it is waiting')
  const todays = (later.byDate['2026-11-02'].leetcode ?? []).filter((x) => x.type !== 'new')
  assert.equal(todays.length, RESOLVE_CAPS.build[0], 'today carries the cap, not the whole backlog')
  assert.deepEqual(todays.map((x) => x.lc), later.due.slice(0, todays.length).map((r) => r.lc), 'most overdue first')
})
