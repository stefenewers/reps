import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_BY_ID } from '@/data/course'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { UNITS } from '@/data/course/units'
import { GATE_BY_ID } from '@/data/course/gates'
import { createContracts, type ContractInput } from '@/lib/course/contract'
import { courseDailyPlan } from '@/lib/course/daily-plan'
import { courseStatus, unitInventory } from '@/lib/course/routing'
import type { Attempt } from '@/lib/types'

const input = (): ContractInput => ({ attempts: [], entries: [], mastery: {}, labStates: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID })
let serial = 0
const pass = (id: string, date: string): Attempt => ({
  id: `plan-${serial++}`,
  exerciseId: id,
  date,
  skills: EXERCISE_BY_ID[id].skills,
  stage: EXERCISE_BY_ID[id].stage,
  mode: 'practice',
  passed: true,
  attemptsBeforePass: 0,
  hintsUsed: 0,
  solutionViewed: false,
  runtimeErrors: [],
  startedAt: `${date}T10:00:00Z`,
  completedAt: `${date}T10:01:00Z`,
  retrievalType: 'cold',
  updatedAt: `${date}T10:01:00Z`
})

test('Today offers placement before teaching; passing it skips that unit rather than requiring its path', () => {
  const i = input()
  const unit = UNITS[1]
  i.attempts = [...UNITS[0].path!, ...unit.path!.slice(0, Math.ceil(unit.path!.length * 0.4))].map((id) => pass(id, '2026-10-20'))
  const plan = courseDailyPlan('2026-10-27', i)
  assert.equal(plan[0].purpose, 'gate')
  for (const g of unit.gateIds) i.attempts.push(...GATE_BY_ID[g].pool.slice(0, GATE_BY_ID[g].need).map((id) => pass(id, '2026-10-27')))
  assert.equal(courseStatus({ ...i, today: '2026-10-27' })[1].state, 'ready')
  assert.ok(!courseDailyPlan('2026-10-27', i).some((q) => q.required && q.unitId === unit.id && q.purpose !== 'problem'))
})

test('a placement half passed stays placement: the next variant stays open, not locked behind the path', () => {
  const i = input()
  const unit = UNITS.find((u) => u.id === 'w1-mutation-references')!
  const gate = GATE_BY_ID[unit.gateIds[0]]
  i.attempts = [...UNITS[0].path!, ...unit.path!.slice(0, Math.ceil(unit.path!.length * 0.4))].map((id) => pass(id, '2026-10-20'))
  i.attempts.push(pass(gate.pool[0], '2026-10-27'))
  const g = createContracts(i).dayContract('2026-10-27').gates.find((x) => x.id === gate.id)!
  assert.equal(g.state, 'open')
  assert.ok(courseDailyPlan('2026-10-27', i).some((q) => q.purpose === 'gate' && q.exerciseId === g.next[0]))
})

test('a failed placement, once repaired, offers the unit’s path even before the calendar introduces it', () => {
  const i = input()
  const unit = UNITS.find((u) => u.id === 'w1-mutation-references')!
  const gate = GATE_BY_ID[unit.gateIds[0]]
  i.attempts = [...UNITS[0].path!, ...unit.path!.slice(0, Math.ceil(unit.path!.length * 0.4))].map((id) => pass(id, '2026-10-20'))
  i.attempts.push({ ...pass(gate.pool[0], '2026-10-26'), passed: false, completedAt: undefined, attemptsBeforePass: 2 })
  const repair = createContracts(i).dayContract('2026-10-26').repair[0].reps
  i.attempts.push(...repair.map((id) => pass(id, '2026-10-26')))
  const plan = courseDailyPlan('2026-10-27', i)
  assert.ok(plan.some((q) => q.required && q.unitId === unit.id && unit.path!.includes(q.exerciseId!)), 'the path reps that unlock the checkpoint are offered')
})

test('a checkpoint tried early and still waiting on its reps does not hold today open', () => {
  const i = input()
  const pool = GATE_BY_ID['g-mutation-references'].pool
  const unit = (id: string) => UNITS.find((u) => u.id === id)!.path!
  i.attempts = [
    ...unit('w1-state-while').map((id) => pass(id, '2026-10-26')),
    ...[...unit('w1-loop-control'), 'c1-state-counter', 'c1-state-swap', 'c1-state-overdrawn', pool[0]].map((id) => pass(id, '2026-10-27'))
  ]
  const c = createContracts(i).dayContract('2026-10-27')
  assert.ok(c.reps.met)
  assert.ok(!c.gates.some((g) => g.id === 'g-mutation-references'), 'not due until its day')
})

test('a due checkpoint still locked after the rep target is met keeps the reps that open it on offer', () => {
  const i = input()
  const unit = (id: string) => UNITS.find((u) => u.id === id)!.path!
  i.attempts = [
    ...['w1-state-while', 'w1-loop-control', 'w1-running-state'].flatMap(unit).map((id) => pass(id, '2026-10-26')),
    ...['c1-state-counter', 'c1-state-swap', 'c1-state-overdrawn', ...unit('w1-mutation-references').slice(0, 1), ...unit('w1-loop-control').slice(0, 6)].map((id) =>
      pass(id, '2026-10-30')
    )
  ]
  const c = createContracts(i).dayContract('2026-10-30')
  assert.ok(c.reps.met)
  assert.equal(c.gates.find((g) => g.id === 'g-mutation-references')!.state, 'locked')
  const plan = courseDailyPlan('2026-10-30', i)
  assert.ok(unit('w1-mutation-references').slice(1).every((id) => plan.some((q) => q.exerciseId === id && q.required)))
})

test('today’s own teaching never silently converts a novice into placement', () => {
  const i = input()
  i.attempts = UNITS[0].path!.slice(0, Math.ceil(UNITS[0].path!.length * 0.4)).map((id) => pass(id, '2026-10-26'))
  assert.notEqual(courseStatus({ ...i, today: '2026-10-26' })[0].route, 'placement')
  assert.notEqual(courseDailyPlan('2026-10-26', i)[0]?.purpose, 'gate')
})

test('flex retrieves due work first, labels fresh work honestly and never repeats yesterday’s pass', () => {
  const i = input()
  const inventory = unitInventory(UNITS[0], i).filter((e) => e.kind === 'code' && !e.lab)
  assert.ok(inventory.length >= 2)
  i.attempts = [pass(inventory[0].id, '2026-10-20'), pass(inventory[1].id, '2026-10-25')]
  const plan = courseDailyPlan('2026-10-26', i)
  const retrieval = plan.filter((q) => q.purpose === 'retrieve')
  assert.equal(retrieval[0]?.exerciseId, inventory[0].id)
  assert.ok(!plan.some((q) => q.exerciseId === inventory[1].id))
  assert.ok(courseDailyPlan('2026-10-26', input()).every((q) => q.purpose !== 'retrieve'))
})

test('future and malformed history cannot change the current prescription', () => {
  const i = input()
  const expected = courseDailyPlan('2026-10-26', i)
  i.attempts = UNITS[0].path!.map((id) => pass(id, '2026-11-10'))
  i.attempts.push({ ...pass(UNITS[0].path![0], '2026-10-26'), completedAt: 'invalid' })
  assert.deepEqual(courseDailyPlan('2026-10-26', i), expected)
})
