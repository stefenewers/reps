import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_BY_ID } from '@/data/course'
import { GATE_BY_ID } from '@/data/course/gates'
import { UNIT_BY_ID, UNITS } from '@/data/course/units'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { courseQueue, courseStatus, unitReps, type CourseContext } from '@/lib/course/routing'
import type { Attempt } from '@/lib/types'

let n = 0
const at = (exerciseId: string, date: string, over: Partial<Attempt> = {}): Attempt => {
  n++
  const t = `${date}T${String(8 + Math.floor(n / 3600) % 12).padStart(2, '0')}:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}Z`
  return { id: `a${n}`, exerciseId, date, skills: EXERCISE_BY_ID[exerciseId]?.skills ?? [], stage: 'microbuild', mode: 'practice', passed: true, attemptsBeforePass: 0, hintsUsed: 0, solutionViewed: false, runtimeErrors: [], startedAt: t, completedAt: t, retrievalType: 'first-exposure', updatedAt: t, ...over } as Attempt
}
const ctx = (attempts: Attempt[], today = '2026-12-10'): CourseContext => ({ attempts, mastery: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID, today })
const status = (c: CourseContext, id: string) => courseStatus(c).find((s) => s.unit.id === id)!

/** Everything in units up to (not including) `upTo` passed, and their gates cleared with every available variant. */
function through(upTo: string, date = '2026-12-01'): Attempt[] {
  const out: Attempt[] = []
  for (const u of UNITS) {
    if (u.id === upTo) break
    for (const e of unitReps(u, ctx([]))) out.push(at(e.id, date))
    for (const g of u.gateIds) for (const id of GATE_BY_ID[g].pool) if (EXERCISE_BY_ID[id]) out.push(at(id, date, { retrievalType: 'cold' }))
  }
  return out
}

test('a beginner starts at Week 1 with nothing unexplained: the first unit is open, later ones are locked behind it', () => {
  const s = courseStatus(ctx([], '2026-10-26'))
  assert.equal(s[0].unit.id, 'w1-state-while')
  assert.equal(s[0].locked, false)
  assert.equal(s.find((x) => x.unit.id === 'w3-two-pointers')!.locked, true, 'weak while/state cannot route into pointer-heavy training')
  const q = courseQueue(s, ctx([], '2026-10-26'), new Set())
  assert.equal(q[0].unitId, 'w1-state-while')
})

test('trees stay locked behind the recursion gate; clearing it opens them', () => {
  const before = through('w6-recursion')
  const recursionReps = unitReps(UNIT_BY_ID['w6-recursion'], ctx([])).map((e) => at(e.id, '2026-12-02'))
  const withoutGate = [...before, ...recursionReps]
  const locked = status(ctx(withoutGate), 'w7-trees')
  assert.equal(locked.locked, true)
  assert.deepEqual(locked.blockedBy, ['w6-recursion'])
  assert.ok(!courseQueue(courseStatus(ctx(withoutGate)), ctx(withoutGate), new Set()).some((x) => x.unitId === 'w7-trees'), 'no tree reps while the gate is open')
  const gate = GATE_BY_ID['g-recursion'].pool.filter((id) => EXERCISE_BY_ID[id])
  const cleared = [...withoutGate, ...gate.map((id) => at(id, '2026-12-03', { retrievalType: 'cold' }))]
  assert.equal(status(ctx(cleared), 'w7-trees').locked, false)
})

test('linked-list rewiring needs the mutation/reference gate; BFS needs the queue unit', () => {
  assert.ok(UNIT_BY_ID['w5-linked-lists'].prerequisites.includes('w1-mutation-references'))
  const s = courseStatus(ctx(through('w5-binary-search')))
  assert.equal(s.find((x) => x.unit.id === 'w5-linked-lists')!.locked, false)
  const noMutation = through('w1-mutation-references')
  assert.equal(courseStatus(ctx(noMutation)).find((x) => x.unit.id === 'w5-linked-lists')!.locked, true)
  assert.equal(courseStatus(ctx(through('w8-queue-bfs'))).find((x) => x.unit.id === 'w8-grids')!.locked, true)
})

test('placement: earlier evidence starts with the cold gate; passing it skips the teaching', () => {
  const hashing = UNIT_BY_ID['w2-hashing']
  const earlier = unitReps(hashing, ctx([])).slice(0, 60).map((e) => at(e.id, '2026-10-05'))
  const c = ctx(earlier, '2026-10-26')
  const s = status(c, 'w2-hashing')
  assert.equal(s.state, 'placement')
  const q = courseQueue(courseStatus(c), c, new Set()).filter((x) => x.unitId === 'w2-hashing' && x.required)
  assert.ok(q.length && q.every((x) => x.purpose === 'gate'), 'the gate is offered first, and only the gate')
  const passedGate = [...earlier, ...q.map((x) => at(x.exerciseId!, '2026-10-26', { retrievalType: 'cold' }))]
  const c2 = ctx(passedGate, '2026-10-26')
  assert.equal(status(c2, 'w2-hashing').state, 'ready')
  assert.ok(!courseQueue(courseStatus(c2), c2, new Set()).some((x) => x.unitId === 'w2-hashing' && x.exerciseId && x.required), 'no required teaching reps once placement is passed')
})

test('a failed gate routes 2–4 repair reps on the broken skill, then a different variant', () => {
  const pool = GATE_BY_ID['g-hashing'].pool
  const earlier = unitReps(UNIT_BY_ID['w2-hashing'], ctx([])).map((e) => at(e.id, '2026-10-05'))
  const failed = [...earlier, at(pool[0], '2026-10-26', { retrievalType: 'cold', passed: false, completedAt: undefined, attemptsBeforePass: 3 })]
  const c = ctx(failed, '2026-10-26')
  const g = status(c, 'w2-hashing').gates[0]
  assert.equal(g.failed, true)
  assert.ok(g.repair.length >= 1 && g.repair.length <= 4)
  const q = courseQueue(courseStatus(c), c, new Set()).filter((x) => x.unitId === 'w2-hashing' && x.required)
  assert.equal(q[0].purpose, 'repair')
  assert.ok(!q.some((x) => x.purpose === 'gate'), 'no variant until the repair is done')
  const repaired = [...failed, ...g.repair.map((id) => at(id, '2026-10-26'))]
  const c2 = ctx(repaired, '2026-10-26')
  const next = status(c2, 'w2-hashing').gates[0].next
  assert.ok(next.length > 0)
  assert.notEqual(next[0], pool[0], 'not the exact failed checkpoint')
})

test('a gate pass needs the clean standard: a solution or hints do not clear it', () => {
  const pool = GATE_BY_ID['g-hashing'].pool
  const earlier = unitReps(UNIT_BY_ID['w2-hashing'], ctx([])).map((e) => at(e.id, '2026-10-05'))
  const assisted = [...earlier, ...pool.map((id) => at(id, '2026-10-26', { retrievalType: 'cold', hintsUsed: 2 }))]
  assert.notEqual(status(ctx(assisted), 'w2-hashing').state, 'ready')
})
