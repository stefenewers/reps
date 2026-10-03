import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dayStats, exerciseUnlocked, followingExercise, missingPrerequisites, nextExercise, problemReadiness, retrievalTypeFor, sectionUnlocked } from '@/lib/progress'
import { computeAllMastery } from '@/lib/mastery'
import { attempt, exercise } from '@/lib/test-helpers'
import type { DayModule } from '@/lib/types'
import { DAYS, MODULES, EXERCISE_BY_ID, ALL_EXERCISES } from '@/data/curriculum'
import { PROBLEMS } from '@/data/problems'
import { SKILLS, SKILL_BY_ID } from '@/data/skills'
import { buildRepairSet, skillDepth } from '@/lib/sessions'

const day: DayModule = {
  date: '2026-10-02',
  short: 'T',
  title: 'T',
  focus: 'T',
  capstones: [],
  sections: [
    { id: 's1', title: 'One', summary: '', exercises: [exercise({ id: 'a' }), exercise({ id: 'b' }), exercise({ id: 'c' })] },
    { id: 's2', title: 'Two', summary: '', exercises: [exercise({ id: 'd' }), exercise({ id: 'e' })] },
  ],
}

test('progression: next, following, completion', () => {
  const done = [attempt({ exerciseId: 'a' }), attempt({ exerciseId: 'b' })]
  assert.equal(nextExercise(day, done)?.id, 'c')
  assert.equal(followingExercise(day, 'c')?.id, 'd')
  const st = dayStats(day, done)
  assert.equal(st.completed, 2)
  assert.equal(st.percent, 40)
  assert.deepEqual(st.sectionsCompleted, [])
})

test('unlocking: a section opens once the previous one is 60% attempted', () => {
  assert.equal(sectionUnlocked(day, 1, [attempt({ exerciseId: 'a' })]), false)
  assert.equal(sectionUnlocked(day, 1, [attempt({ exerciseId: 'a' }), attempt({ exerciseId: 'b', passed: false, completedAt: undefined, attemptsBeforePass: 1 })]), true)
})

test('unlocking: within a section, earlier reps must be attempted first', () => {
  assert.equal(exerciseUnlocked(day, 'a', []), true)
  assert.equal(exerciseUnlocked(day, 'b', []), false)
  assert.equal(exerciseUnlocked(day, 'b', [attempt({ exerciseId: 'a' })]), true)
})

test('prerequisites: capstone lists unseen skills until they are practiced', () => {
  const cap = EXERCISE_BY_ID['cap-two-sum']
  const ids = SKILLS.map((s) => s.id)
  assert.ok(missingPrerequisites(cap, computeAllMastery(ids, [])).includes('enumerate'))
  const practiced = cap.skills.concat(cap.prerequisites).map((s) => attempt({ skills: [s] }))
  assert.deepEqual(missingPrerequisites(cap, computeAllMastery(ids, practiced)), [])
})

test('readiness grows with mastery of a problem’s skills', () => {
  const p = PROBLEMS.find((x) => x.id === 'two-sum')!
  const ids = SKILLS.map((s) => s.id)
  const before = problemReadiness(p, computeAllMastery(ids, []))
  const after = problemReadiness(p, computeAllMastery(ids, p.skills.flatMap((s) => [1, 2, 3].map(() => attempt({ skills: [s] })))))
  assert.equal(before, 0)
  assert.ok(after > 50)
})

test('retrieval type: first exposure, run it back, cold after 12 hours', () => {
  const ex = exercise({ id: 'z' })
  const now = new Date('2026-10-03T12:00:00Z')
  assert.equal(retrievalTypeFor(ex, [], { now }), 'first-exposure')
  assert.equal(retrievalTypeFor(ex, [], { runItBack: true, now }), 'immediate-reconstruction')
  assert.equal(retrievalTypeFor(ex, [attempt({ exerciseId: 'z', completedAt: '2026-10-02T20:00:00Z' })], { now }), 'cold')
  assert.equal(retrievalTypeFor(ex, [attempt({ exerciseId: 'z', completedAt: '2026-10-03T11:00:00Z' })], { now }), 'first-exposure')
  assert.equal(retrievalTypeFor(exercise({ repType: 'cold' }), [], { now }), 'cold')
})

test('curriculum integrity: every day, skill and capstone is wired', () => {
  assert.equal(DAYS.length, 10)
  for (const e of ALL_EXERCISES) for (const s of [...e.skills, ...e.prerequisites]) assert.ok(SKILL_BY_ID[s], `${e.id}: ${s}`)
  for (const p of PROBLEMS) assert.ok(EXERCISE_BY_ID[`cap-${p.id}`], `capstone for ${p.id}`)
  assert.ok(MODULES[0].sections.flatMap((s) => s.exercises).length >= 100, 'the foundation module is the thorough one')
})

test('skill graph is acyclic and primitives sit at depth 0', () => {
  for (const s of SKILLS) assert.ok(skillDepth(s.id) < 12, s.id)
  assert.equal(skillDepth('dict_create'), 0)
  assert.ok(skillDepth('frequency_map') > skillDepth('dict_get'))
})

test('repair set: primitives first, never a capstone, bounded', () => {
  const ids = buildRepairSet(['index_map', 'dict_assign', 'dict_membership'], computeAllMastery(SKILLS.map((s) => s.id), []), [], '2026-10-03')
  assert.ok(ids.length > 0 && ids.length <= 5)
  for (const id of ids) assert.notEqual(EXERCISE_BY_ID[id].repType, 'capstone')
  // dict_assign (depth 1) precedes index_map (depth 2+)
  const first = EXERCISE_BY_ID[ids[0]]
  assert.ok(first.skills.includes('dict_assign') || first.skills.includes('dict_membership'), first.id)
})
