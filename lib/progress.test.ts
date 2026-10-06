import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blockingGate, dayStats, exerciseUnlocked, followingExercise, lockedByGate, missingPrerequisites, nextExercise, passedSet, problemReadiness, retrievalTypeFor, sectionUnlocked } from '@/lib/progress'
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

test('mastery check: only a pass without the solution counts, and what follows stays locked until then', () => {
  assert.ok(EXERCISE_BY_ID['o2-drev-trace'].cleanPass && EXERCISE_BY_ID['o2-drev-reprice'].cleanPass, 'check reps are flagged')
  const day3 = DAYS.find((d) => d.sections.some((s) => s.id === 'o2-dict-revision'))!
  const si = day3.sections.findIndex((s) => s.id === 'o2-get')
  const check = day3.sections.find((s) => s.id === 'o2-dict-revision')!
  const all = check.exercises.map((e) => attempt({ exerciseId: e.id }))
  const before = day3.sections.slice(0, si - 1).flatMap((s) => s.exercises.map((e) => attempt({ exerciseId: e.id })))

  // Nothing cleared: .get is hard-locked behind the check.
  assert.equal(blockingGate(day3, si, before)?.id, 'o2-dict-revision')
  assert.equal(lockedByGate(day3, day3.sections[si].exercises[0].id, before)?.id, 'o2-dict-revision')
  assert.equal(sectionUnlocked(day3, si, before), false)

  // One rep passed with the solution open: still locked, and it is still "next".
  const peeked = [...before, ...all.slice(1), attempt({ exerciseId: check.exercises[0].id, solutionViewed: true })]
  assert.ok(!passedSet(peeked).has(check.exercises[0].id))
  assert.equal(nextExercise(day3, peeked)?.id, check.exercises[0].id)
  assert.ok(lockedByGate(day3, day3.sections[si].exercises[0].id, peeked))

  // Run it back clean: unlocked.
  const clean = [...peeked, attempt({ exerciseId: check.exercises[0].id })]
  assert.equal(lockedByGate(day3, day3.sections[si].exercises[0].id, clean), undefined)
  assert.equal(sectionUnlocked(day3, si, clean), true)

  // Outside a check, viewing the solution still counts as a (reduced-credit) pass.
  assert.ok(passedSet([attempt({ exerciseId: 'o2-dbg-keyerror', solutionViewed: true })]).has('o2-dbg-keyerror'))
})

test('mastery check at the end of a day locks the next day until it is cleared', () => {
  const oct3 = DAYS.find((d) => d.date === '2026-10-03')!
  const oct4 = DAYS.find((d) => d.date === '2026-10-04')!
  const firstOct4 = oct4.sections.find((s) => !s.optional)!.exercises[0]
  const everythingOct3 = oct3.sections.filter((s) => !s.optional).flatMap((s) => s.exercises)
  const allButLast = everythingOct3.slice(0, -1).map((e) => attempt({ exerciseId: e.id }))
  assert.equal(lockedByGate(oct4, firstOct4.id, allButLast)?.id, 'o2-dict-mastery')
  const done = everythingOct3.map((e) => attempt({ exerciseId: e.id }))
  assert.equal(lockedByGate(oct4, firstOct4.id, done), undefined)
  // The ladder (Oct 4) is no longer a check: Oct 5 opens without it.
  const oct5 = DAYS.find((d) => d.date === '2026-10-05')!
  const firstOct5 = oct5.sections.find((s) => !s.optional)!.exercises[0]
  assert.equal(lockedByGate(oct5, firstOct5.id, done), undefined)
  // Extras are never locked.
  const extra = oct4.sections.find((s) => s.optional)?.exercises[0]
  if (extra) assert.equal(lockedByGate(oct4, extra.id, allButLast), undefined)
})
