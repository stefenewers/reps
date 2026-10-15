import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LOADS, RAMP, capacityFor, projectedLoad, reviewWeek, stageFor, weekOf, type DayRecord } from '@/lib/training-capacity'
import { isCore, loadLimit, prescribe, units, type Candidate } from '@/lib/today-plan'
import { addDays, parseLocal } from '@/lib/dates'

/** Progressive capacity: how much to train today, and today's prescription inside it. */

const START = '2026-10-12'
const study = (d: string) => parseLocal(d).getDay() !== 0
const day = (u: number, over: Partial<DayRecord> = {}): DayRecord => ({ reps: u, minutes: 60, assisted: 0, passed: u, coldPassed: 0, coldTotal: 0, ...over })
/** A record where each week w has the given per-day units (Mon–Sat). */
const history = (weeks: Record<number, DayRecord[]>) => (d: string) => {
  const w = weekOf(d, START)
  const i = Math.floor((parseLocal(d).getTime() - parseLocal(addDays(START, (w - 1) * 7)).getTime()) / 86_400_000)
  return weeks[w]?.[i]
}
const full = (load: number, n = 6, over: Partial<DayRecord> = {}) => Array.from({ length: n }, () => day(load, over))

// ── the ramp ─────────────────────────────────────────────────────────────────

test('week 1 is 10 reps a day, whatever has or has not been done', () => {
  for (const d of ['2026-10-12', '2026-10-15', '2026-10-17']) {
    const c = capacityFor(d, START, () => undefined, study)
    assert.deepEqual([c.week, c.requiredReps, c.phase], [1, 10, 'foundation'])
  }
  assert.match(capacityFor('2026-10-13', START, () => undefined, study).reason, /10 reps/)
})

test('weekly progression is one step at most: 10 → 12 → 15 → 18 → 20 → 22 → 25', () => {
  assert.deepEqual(LOADS, [10, 12, 15, 18, 20, 22, 25])
  // A perfect Week 1 (every day, no help) is 12, not 15.
  assert.equal(capacityFor('2026-10-19', START, history({ 1: full(10) }), study).requiredReps, 12)
  // A merely handled week is also one step.
  assert.equal(capacityFor('2026-10-19', START, history({ 1: full(10, 5, { assisted: 3 }) }), study).requiredReps, 12)
  // Perfect every week: one step each Monday, never two, up to each stage's ceiling.
  const loads: number[] = []
  const always = () => day(30)
  for (let w = 1; w <= 13; w++) loads.push(capacityFor(addDays(START, (w - 1) * 7), START, always, study).requiredReps)
  assert.deepEqual(loads, [10, 12, 15, 18, 20, 20, 20, 20, 22, 25, 25, 25, 25])
  for (let i = 1; i < loads.length; i++) assert.ok(LOADS.indexOf(loads[i]) - LOADS.indexOf(loads[i - 1]) <= 1, `one step at most: ${loads[i - 1]} → ${loads[i]}`)
  assert.ok(Math.max(...loads) <= 25, 'the last month adds difficulty, not endless volume')
})

test('a weak or incomplete week holds the load, and says why without calling it failure', () => {
  // Three full days only.
  const few = capacityFor('2026-10-19', START, history({ 1: [day(10), day(10), day(10), day(0), day(0), day(0)] }), study)
  assert.equal(few.requiredReps, 10)
  assert.match(few.reason, /3 of 4 days at the full load/)
  assert.match(few.reason, /Holding the load.*not falling behind/)
  // Every day done, but mostly with the solution open.
  const leaning = capacityFor('2026-10-19', START, history({ 1: full(10, 6, { assisted: 6 }) }), study)
  assert.equal(leaning.requiredReps, 10)
  assert.match(leaning.reason, /with the solution or several hints/)
  // Cold reps failing.
  assert.equal(capacityFor('2026-10-19', START, history({ 1: full(10, 6, { coldTotal: 5, coldPassed: 1 }) }), study).requiredReps, 10)
  // At 12, a weak week 2 holds at 12: it never goes back down.
  assert.equal(capacityFor('2026-10-26', START, history({ 1: full(10), 2: [day(12), day(0), day(0), day(0), day(0), day(0)] }), study).requiredReps, 12)
})

test('one exceptional day cannot create a jump', () => {
  // One 60-rep day and nothing else: the week was not handled.
  const one = capacityFor('2026-10-19', START, history({ 1: [day(60), day(0), day(0), day(0), day(0), day(0)] }), study)
  assert.equal(one.requiredReps, 10)
  // Even a huge week moves one step.
  assert.equal(capacityFor('2026-10-19', START, history({ 1: full(40) }), study).requiredReps, 12)
})

test('the ramp is visible and monotone; the forecast assumes one step a week', () => {
  assert.deepEqual(RAMP.map((s) => s.phase), ['foundation', 'foundation', 'build', 'transfer', 'interview'])
  assert.equal(stageFor(1).range, '10 reps')
  assert.equal(stageFor(6).phase, 'transfer')
  assert.equal(stageFor(12).phase, 'interview')
  const now = capacityFor('2026-10-15', START, () => undefined, study)
  assert.deepEqual(['2026-10-16', '2026-10-20', '2026-10-27', '2026-11-03', '2026-12-30'].map((d) => projectedLoad(d, now, START)), [10, 12, 15, 18, 25])
  assert.equal(reviewWeek(1, 10, []).ready, false, 'no training, no increase')
})

// ── today's prescription ─────────────────────────────────────────────────────

const rep = (key: string, kind: Candidate['kind'] = 'drill', u = 1): Candidate => ({ key, kind, title: key, units: u, exerciseId: key })
const plan = Array.from({ length: 40 }, (_, i) => rep(`p${i}`))
const base = { capacity: 10, phase: 'foundation' as const, doneToday: [], prep: [], plan, resolves: [], cold: [] }

test('week 1 is 10 actual reps: ten things to do, and ten done completes the day', () => {
  const t = prescribe(base)
  assert.equal(t.items.length, 10)
  assert.deepEqual(t.items.map((i) => i.key), plan.slice(0, 10).map((p) => p.key))
  assert.deepEqual([t.repsDone, t.complete], [0, false])
  // Forty items in the queue (or four hundred) change nothing about today.
  assert.equal(prescribe({ ...base, plan: Array.from({ length: 400 }, (_, i) => rep(`q${i}`)) }).items.length, 10)
})

test('missed days add nothing to today: the next ten reps are simply the next ten', () => {
  // Whatever happened yesterday, today asks for ten reps from wherever the queue stands.
  const t = prescribe({ ...base, plan: plan.slice(3) })
  assert.equal(t.items.length, 10)
  assert.equal(t.items[0].key, 'p3')
})

test('a capstone weighs more internally, but it is one rep: ten reps stay ten activities', () => {
  assert.deepEqual([units({ kind: 'prove', capstone: true }), units({ kind: 'transfer' }), units({ kind: 'problem' }), units({ kind: 'drill' }), units({ kind: 'combine', combineHeavy: true })], [3, 2, 3, 1, 2])
  const t = prescribe({ ...base, phase: 'build', plan: [rep('a'), rep('b'), rep('cap', 'prove', 3), rep('t', 'transfer', 2), ...plan] })
  assert.equal(t.items.length, 10, 'ten activities, not seven')
  assert.ok(t.items.some((i) => i.key === 'cap'))
  assert.ok(t.items.reduce((n, i) => n + i.units, 0) <= loadLimit(10), 'the internal load stays within its headroom')
})

test('a heavy rep that does not fit waits, lighter work fills the day, and the day can still be finished', () => {
  // Nine reps done today, one of them heavy; the next rep in the queue is a capstone.
  const doneToday = [{ key: 'x0', units: 3 }, ...Array.from({ length: 8 }, (_, i) => ({ key: `x${i + 1}`, units: 1 }))]
  const queue = [rep('cap', 'prove', 3), rep('d1'), rep('d2')]
  const t = prescribe({ ...base, phase: 'build', doneToday, plan: queue })
  const todo = t.items.filter((i) => !i.done)
  assert.equal(todo.length, 1, 'exactly one rep left: 9 / 10 is never a dead end')
  assert.equal(todo[0].key, 'd1', 'a light rep fills the last slot, not a capstone forced into it')
  assert.equal(t.optional[0].key, 'cap', 'the capstone is not skipped: it is still first in the queue')
  // Many heavy reps in a row: the day still has ten things in it.
  const heavy = Array.from({ length: 8 }, (_, i) => rep(`cap${i}`, 'prove', 3))
  const h = prescribe({ ...base, phase: 'build', plan: [...heavy, ...plan] })
  assert.equal(h.items.length, 10)
  assert.ok(h.items.reduce((n, i) => n + i.units, 0) <= loadLimit(10))
})

test('foundation days are mostly learn, drill and combine; checks and maintenance take at most 30%', () => {
  const checks = [rep('cap', 'prove', 3), rep('cold-a', 'prove'), rep('t1', 'transfer', 2)]
  const t = prescribe({
    ...base,
    plan: [rep('l1', 'learn'), ...checks, rep('d1'), rep('c1', 'combine'), ...plan],
    prep: [rep('w1', 'warm'), rep('w2', 'warm')],
    resolves: [{ key: 'lc:217:review1', kind: 'resolve', title: 'Contains Duplicate', units: 2, lc: 217 }],
    cold: [rep('k1', 'cold'), rep('k2', 'cold')],
  })
  assert.equal(t.items.length, 10)
  const core = t.items.filter((i) => isCore(i.kind)).length
  assert.ok(core >= 7, `learn/drill/combine: ${core} of 10`)
  // The plan's own check comes before more maintenance, and one warm-up still happens.
  assert.ok(t.items.some((i) => i.key === 'cap'))
  assert.ok(t.items.some((i) => i.kind === 'warm'))
  // Outside the foundation weeks, the same inputs may carry more checks.
  const later = prescribe({ ...base, phase: 'build', plan: [rep('l1', 'learn'), ...checks, ...plan], cold: [rep('k1', 'cold'), rep('k2', 'cold')] })
  assert.ok(later.items.filter((i) => !isCore(i.kind)).length > 3)
})

test('warm-ups, redos, re-solves and cold reps take slots inside the day, never on top of it', () => {
  const t = prescribe({
    ...base,
    phase: 'build',
    prep: [rep('w1', 'warm'), rep('w2', 'warm'), rep('w3', 'warm'), rep('w4', 'warm'), rep('r1', 'redo')],
    resolves: [{ key: 'lc:217:review1', kind: 'resolve', title: 'Contains Duplicate', units: 2, lc: 217 }, { key: 'lc:387:redo', kind: 'resolve', title: 'First Unique', units: 2, lc: 387 }],
    cold: [rep('c1', 'cold'), rep('c2', 'cold')],
  })
  assert.equal(t.items.length, 10, 'still ten in total')
  assert.equal(t.items.filter((i) => i.kind === 'warm' || i.kind === 'redo').length, 2, 'prep takes at most 20%')
  assert.ok(t.items.filter((i) => i.kind === 'resolve' || i.kind === 'cold').length <= 2, 'maintenance takes at most 20%')
  assert.ok(t.items.filter((i) => i.kind === 'drill').length >= 6, 'the plan keeps most of the day')
  // What did not fit is not lost: it is offered once the day is done.
  assert.ok(t.optional.some((c) => c.key === 'w4') && t.optional.some((c) => c.key === 'c1'))
})

test('a new LeetCode problem is optional in the foundation weeks, and not prescribed before it is ready', () => {
  const problem: Candidate = { key: 'lc:49:new', kind: 'problem', title: 'Group Anagrams', units: 3, lc: 49, ready: true }
  const withProblem = [rep('a'), problem, ...plan]
  assert.ok(!prescribe({ ...base, plan: withProblem }).items.some((i) => i.kind === 'problem'), 'week 1: not required')
  assert.ok(prescribe({ ...base, plan: withProblem }).optional.some((c) => c.kind === 'problem'), 'but offered when the day is done')
  assert.ok(prescribe({ ...base, phase: 'build', plan: withProblem }).items.some((i) => i.kind === 'problem'), 'later, and ready: prescribed')
  assert.ok(!prescribe({ ...base, phase: 'build', plan: [rep('a'), { ...problem, ready: false }, ...plan] }).items.some((i) => i.kind === 'problem'))
})

test('ten reps done is “training complete”, and the queue is not marked done for it', () => {
  const doneToday = plan.slice(0, 10).map((p) => ({ key: p.key, units: 1 }))
  const t = prescribe({ ...base, doneToday })
  assert.deepEqual([t.repsDone, t.complete], [10, true])
  assert.ok(t.items.every((i) => i.done))
  assert.equal(t.optional[0].key, 'p10', 'what comes next in the queue is still there, as optional')
  // Partway: done reps count, the rest of the day is the next reps.
  const half = prescribe({ ...base, doneToday: doneToday.slice(0, 4) })
  assert.deepEqual([half.repsDone, half.items.filter((i) => !i.done).length, half.complete], [4, 6, false])
  // A heavy rep done outside the list is still one rep.
  assert.equal(prescribe({ ...base, doneToday: [{ key: 'something-else', units: 3 }] }).items.filter((i) => !i.done).length, 9)
})
