import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blockState, bridgeCycles, conversion, isStrong, readiness, repairReps, type Target } from '@/lib/bridges'
import { computeSkillMastery } from '@/lib/mastery'
import { attempt } from '@/lib/test-helpers'

const target = (over: Partial<Target> = {}): Target => ({
  lc: 128,
  title: 'Longest Consecutive Sequence',
  unit: 'Hashing',
  source: 'leetcode',
  section: 'br-128',
  mode: 'bridge-first',
  prerequisiteSkills: ['set_membership', 'sequence_start'],
  blocks: [
    { label: 'put the numbers in a set', skills: ['set_create', 'set_membership'], evidence: ['o2-set-a'] },
    { label: 'spot where a run starts', skills: ['sequence_start'], reps: ['b128-start', 'b128-starts'] },
    { label: 'only count from starts', skills: ['sequence_start'], reps: ['b128-mini'] },
  ],
  ...over,
})
const none = () => false

test('a target is not ready while any required block is unsatisfied', () => {
  const t = target()
  const all = ['o2-set-a', 'b128-start', 'b128-starts', 'b128-mini']
  assert.equal(readiness(t, new Set(all), none).ready, true)
  for (const missing of all) {
    const r = readiness(t, new Set(all.filter((id) => id !== missing)), none)
    assert.equal(r.ready, false, `ready without ${missing}`)
    assert.equal(r.nextRep, missing)
    assert.equal(r.repsLeft, 1)
  }
  const fresh = readiness(t, new Set(), none)
  assert.deepEqual([fresh.readyCount, fresh.total, fresh.nextRep, fresh.repsLeft], [0, 3, 'o2-set-a', 4])
})

test('blocks are worked in order: the next rep is the first one missing', () => {
  const r = readiness(target(), new Set(['o2-set-a', 'b128-start']), none)
  assert.deepEqual(r.blocks.map((b) => b.ready), [true, false, false])
  assert.equal(r.nextRep, 'b128-starts')
  assert.deepEqual(r.blocks[1].left, ['b128-starts'])
})

test('existing mastery can satisfy a prerequisite from the pattern ladder, but never a bridge rep', () => {
  const strong = (s: string) => s === 'set_create' || s === 'set_membership' || s === 'sequence_start'
  const t = target()
  const ladder = blockState(t.blocks[0], new Set(), strong)
  assert.deepEqual([ladder.ready, ladder.via], [true, 'mastery'])
  // Only one of the two skills strong: the evidence rep is still owed.
  assert.equal(blockState(t.blocks[0], new Set(), (s) => s === 'set_create').ready, false)
  // The bridge's own reps must be done, however strong the skill reads.
  const bridge = blockState(t.blocks[1], new Set(), strong)
  assert.deepEqual([bridge.ready, bridge.left], [false, ['b128-start', 'b128-starts']])
})

test('strong means fluent, or competent with a clean cold rep behind it', () => {
  const clean = (n: number, cold = false) => Array.from({ length: n }, (_, i) => attempt({ id: `a${i}`, skills: ['x'], stage: 'microbuild', retrievalType: cold && i === n - 1 ? 'cold' : 'first-exposure', completedAt: `2026-10-0${1 + (i % 8)}T10:00:00.000Z` }))
  assert.equal(isStrong(undefined), false)
  assert.equal(isStrong(computeSkillMastery('x', clean(2))), false, 'two reps is not strong')
  const warm = computeSkillMastery('x', clean(8))
  assert.equal(warm.coldCorrect, 0)
  assert.equal(isStrong(warm), warm.status === 'fluent', 'without a cold rep only fluent counts, and fluent needs one')
  assert.equal(isStrong(computeSkillMastery('x', clean(8, true))), true)
})

test('a failed attempt sends you to the smallest missing block, else the one that broke, else the last', () => {
  const t = target()
  assert.deepEqual(repairReps(t, new Set(['o2-set-a'])), { block: 1, reps: ['b128-start', 'b128-starts'] })
  const all = new Set(['o2-set-a', 'b128-start', 'b128-starts', 'b128-mini'])
  assert.deepEqual(repairReps(t, all), { block: 2, reps: ['b128-mini'] })
  assert.deepEqual(repairReps(t, all, 0), { block: 0, reps: ['o2-set-a'] })
})

test('dependency cycles between bridges are found', () => {
  const a = target({ lc: 1, blocks: [{ label: 'a', skills: ['x'], reps: ['a1'], evidence: ['b1'] }] })
  const b = target({ lc: 2, blocks: [{ label: 'b', skills: ['x'], reps: ['b1'], evidence: ['a1'] }] })
  const c = target({ lc: 3, blocks: [{ label: 'c', skills: ['x'], reps: ['c1'], evidence: ['a1'] }] })
  assert.deepEqual(bridgeCycles([a, c]), [])
  assert.equal(bridgeCycles([a, b, c]).length, 1)
})

test('target conversion counts first solves that needed no help', () => {
  const ts = [target({ lc: 1 }), target({ lc: 2 }), target({ lc: 3 }), target({ lc: 4 })]
  const first = new Map<number, 'unaided' | 'aided' | null>([[1, 'unaided'], [2, 'aided'], [3, 'unaided'], [4, null]])
  assert.deepEqual(conversion(ts, (t) => first.get(t.lc)!), { converted: 2, attempted: 3, rate: 2 / 3 })
  assert.equal(conversion(ts, () => null).rate, null)
})
