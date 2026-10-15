import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CONCEPTS, CONCEPT_BY_ID, GUIDE_BEHAVIOUR, conceptFor, conceptOfSkill, guideMode } from '@/data/concepts'
import { CONCEPT_VIDEOS } from '@/data/concept-videos'
import { PRIMERS } from '@/data/primers'
import { WALKTHROUGHS } from '@/data/walkthroughs'
import { PLAN_90, PLAN_WHEN_AHEAD } from '@/data/schedule-90'
import { ALL_EXERCISES as EXERCISES } from '@/data/curriculum'
import { SKILLS } from '@/data/skills'

const PATTERNS = ['dictionaries', 'frequency-maps', 'index-maps', 'sets', 'strings', 'two-pointers', 'sliding-window', 'stacks', 'binary-search', 'linked-lists', 'recursion', 'trees', 'bfs', 'grids', 'graphs', 'heaps', 'intervals', 'backtracking', 'dynamic-programming', 'complexity']

test('every major pattern has a concept resource', () => {
  for (const id of PATTERNS) assert.ok(CONCEPT_BY_ID[id], id)
})

test('every concept explains itself: what, mental model, why, core moves, mistakes, an example', () => {
  for (const c of CONCEPTS) {
    assert.ok(c.concept.length > 40, `${c.id}: concept`)
    assert.ok(c.mentalModel.length > 20, `${c.id}: mental model`)
    assert.ok(c.whyItMatters.length > 20, `${c.id}: why`)
    assert.ok(c.coreMoves.length >= 2, `${c.id}: core moves`)
    assert.ok(c.commonMistakes.length >= 1, `${c.id}: mistakes`)
    assert.ok(c.example.code.trim(), `${c.id}: example`)
  }
})

test('every primer belongs to a concept, and every practised skill maps to one', () => {
  const used = new Set(CONCEPTS.flatMap((c) => c.primers.map((p) => p.id)))
  for (const p of PRIMERS) assert.ok(used.has(p.id), `primer ${p.id} is in no concept`)
  const practised = new Set(EXERCISES.flatMap((e) => e.skills))
  for (const s of SKILLS) if (practised.has(s.id)) assert.ok(conceptOfSkill(s.id), `skill ${s.id}`)
  for (const e of EXERCISES) assert.ok(conceptFor(e.skills), `rep ${e.id} has no concept`)
})

test('concept videos are YouTube links, marked as concept videos, and every pattern has at least one', () => {
  for (const id of PATTERNS) assert.ok((CONCEPT_VIDEOS[id] ?? []).length >= 1, `${id}: no video`)
  for (const [id, vids] of Object.entries(CONCEPT_VIDEOS)) {
    assert.ok(CONCEPT_BY_ID[id], `videos for unknown concept ${id}`)
    for (const v of vids) {
      assert.match(v.url, /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/, `${id}: ${v.url}`)
      assert.equal(v.purpose, 'concept')
      assert.ok(v.title && v.channel, `${id}: ${v.url}`)
    }
  }
})

test('concept videos are distinct from problem walkthroughs', () => {
  const id = (u: string) => u.split('v=')[1]
  const walks = new Set([...WALKTHROUGHS.map((w) => w.url), ...PLAN_90.flatMap((d) => d.leetcode.map((l) => l.video)), ...PLAN_WHEN_AHEAD.map((l) => l.video)].filter((u): u is string => Boolean(u)).map(id))
  for (const [cid, vids] of Object.entries(CONCEPT_VIDEOS)) for (const v of vids) assert.ok(!walks.has(id(v.url)), `${cid}: ${v.url} is a problem walkthrough`)
})

test('the Learn layer: open on first exposure, collapsed on drills, help on prove, absent in interview', () => {
  const drill = EXERCISES.find((e) => e.repType === 'foundation' && !e.transfer && !e.cleanPass && e.stage !== 'retrieval')!
  const cap = EXERCISES.find((e) => e.repType === 'capstone')!
  const cold = EXERCISES.find((e) => e.repType === 'cold')!
  const transfer = EXERCISES.find((e) => e.transfer)!

  assert.equal(guideMode(drill, { firstExposure: true, interview: false }), 'learn')
  assert.equal(guideMode(drill, { firstExposure: false, interview: false }), 'practice')
  for (const e of [cap, cold, transfer]) assert.equal(guideMode(e, { firstExposure: false, interview: false }), 'prove', e.id)
  for (const e of [drill, cap]) assert.equal(guideMode(e, { firstExposure: true, interview: true }), 'hidden')

  assert.deepEqual(GUIDE_BEHAVIOUR.learn, { open: true, assisted: false })
  assert.deepEqual(GUIDE_BEHAVIOUR.practice, { open: false, assisted: false })
  assert.deepEqual(GUIDE_BEHAVIOUR.prove, { open: false, assisted: true })
})

test('a rep is taught by its specific pattern, not by Python basics', () => {
  assert.equal(conceptFor(['dict-get', 'for-loop'])?.id === 'python-basics', false)
})
