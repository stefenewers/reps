import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_BY_ID } from '@/data/course'
import { GATE_BY_ID } from '@/data/course/gates'
import { LAB_BY_ID } from '@/data/course/lessons'
import { DAY_PLAN, LAB_DUE } from '@/data/course/schedule'
import { UNIT_BY_ID } from '@/data/course/units'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { createContracts, type ContractInput } from '@/lib/course/contract'
import type { LabState } from '@/lib/course/labs'
import { unitPath } from '@/lib/course/routing'
import type { Attempt } from '@/lib/types'

let n = 0
const at = (exerciseId: string, date: string, over: Partial<Attempt> = {}): Attempt => {
  n++
  const t = `${date}T12:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}Z`
  return { id: `k${n}`, exerciseId, date, skills: EXERCISE_BY_ID[exerciseId]?.skills ?? [], stage: 'microbuild', mode: 'practice', passed: true, attemptsBeforePass: 0, hintsUsed: 0, solutionViewed: false, runtimeErrors: [], startedAt: t, completedAt: t, retrievalType: 'first-exposure', updatedAt: t, ...over } as Attempt
}
const input = (attempts: Attempt[], labStates: Record<string, LabState | undefined> = {}): ContractInput => ({ attempts, entries: [], mastery: {}, labStates, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID })
const W1_PATH = ['w1-state-while', 'w1-loop-control', 'w1-running-state', 'w1-mutation-references', 'w1-integration'].flatMap((u) => unitPath(UNIT_BY_ID[u], { sections: SECTION_BY_ID, exercises: EXERCISE_BY_ID }).map((e) => e.id))
const passes = (ids: string[], date: string) => ids.map((id) => at(id, date))
const designed = (labId: string): LabState => ({ design: Object.fromEntries(LAB_BY_ID[labId].designQuestions.map((_, i) => [i, 'A real sentence about the design.'])), review: Object.fromEntries(LAB_BY_ID[labId].review.map((_, i) => [i, true])), doneAt: `${LAB_DUE[labId]}T15:00:00` })
const built = (labId: string) => [at(LAB_BY_ID[labId].buildExerciseId, LAB_DUE[labId]), at(LAB_BY_ID[labId].changeRequest.exerciseId, LAB_DUE[labId])]

test('a training day is complete only when the rep target is met and nothing due is open', () => {
  const mon = '2026-10-26'
  assert.equal(createContracts(input(passes(W1_PATH.slice(0, 9), mon))).dayContract(mon).complete, false)
  const c = createContracts(input(passes(W1_PATH.slice(0, 10), mon))).dayContract(mon)
  assert.deepEqual([c.reps.done, c.reps.target, c.complete], [10, 10, DAY_PLAN[mon].labsDue.length === 0 && DAY_PLAN[mon].gatesDue.length === 0])
  assert.match(createContracts(input(passes(W1_PATH.slice(0, 9), mon))).dayContract(mon).remaining[0], /1 more qualifying rep/)
})

test('a day with a lab due is not complete until the lab is done, however many reps were done', () => {
  const labDay = LAB_DUE['lab-savings-goal']
  const reps = passes(W1_PATH.slice(0, 12), labDay)
  const without = createContracts(input(reps)).dayContract(labDay)
  assert.equal(without.reps.met, true)
  assert.equal(without.complete, false)
  assert.ok(without.remaining.some((r) => r.startsWith('Lab: Savings Goal')))
  const withLab = createContracts(input([...reps, ...built('lab-savings-goal')], { 'lab-savings-goal': designed('lab-savings-goal') })).dayContract(labDay)
  assert.equal(withLab.labs.find((l) => l.id === 'lab-savings-goal')?.state, 'done')
})

test('a checkpoint due today keeps the day open until it is cleared (or failed today and repaired)', () => {
  const gateDay = Object.values(DAY_PLAN).find((d) => d.week === 1 && d.gatesDue.length)!.date
  const allPath = passes(W1_PATH, '2026-10-26')
  const reps = passes(W1_PATH.slice(0, 10), gateDay)
  const open = createContracts(input([...allPath, ...reps])).dayContract(gateDay)
  assert.equal(open.complete, false)
  assert.ok(open.gates.length > 0 && open.gates.every((g) => g.state !== 'cleared'))
  // Clear every gate due that day with clean cold passes of its variants.
  const clears = DAY_PLAN[gateDay].gatesDue.flatMap((g) => GATE_BY_ID[g].pool.slice(0, GATE_BY_ID[g].need).map((id) => at(id, gateDay, { retrievalType: 'cold' })))
  const labs = Object.fromEntries(Object.keys(LAB_DUE).filter((l) => LAB_BY_ID[l].week === 1).map((l) => [l, designed(l)]))
  const labBuilds = Object.keys(labs).flatMap(built)
  const cleared = createContracts(input([...allPath, ...reps, ...clears, ...labBuilds], labs)).dayContract(gateDay)
  assert.ok(cleared.gates.every((g) => g.state === 'cleared'), JSON.stringify(cleared.gates))
  assert.equal(cleared.complete, true, cleared.remaining.join('; '))
})

test('planned rest owes nothing and protects the streak', () => {
  const sun = '2026-11-01'
  const c = createContracts(input([])).dayContract(sun)
  assert.deepEqual([c.type, c.complete, c.reps.target, c.remaining.length], ['rest', true, 0, 0])
  const xmas = createContracts(input([])).dayContract('2026-12-25')
  assert.equal(xmas.complete, true)
})

test('the week is complete only with its output, builds, checkpoints and targets', () => {
  const days = Object.values(DAY_PLAN).filter((d) => d.week === 1).map((d) => d.date)
  const reps = days.flatMap((d, i) => passes(W1_PATH.slice(i * 10, i * 10 + 10).length ? W1_PATH.slice(i * 10, i * 10 + 10) : [], d))
  const extra = days.flatMap((d) => passes(['o2-loops'].flatMap((s) => SECTION_BY_ID[s].exercises.map((e) => e.id)).slice(0, 0), d))
  const week = createContracts(input([...reps, ...extra])).weekContract(1, '2026-11-02')
  assert.equal(week.complete, false, 'no builds, no checkpoints')
  assert.ok(week.labs.some((l) => !l.done))
  assert.ok(week.gates.some((g) => !g.cleared))
  assert.equal(week.status, 'off-track')
})
