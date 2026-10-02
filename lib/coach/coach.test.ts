import { test } from 'node:test'
import assert from 'node:assert/strict'
import { verifyGeneratedRep, type Run } from '@/lib/coach/verify'
import { isDuplicate, recentSignatures, signatureSimilarity } from '@/lib/coach/dedupe'
import { cacheKey, findLocal } from '@/lib/coach/cache'
import { parseChallenge } from '@/lib/coach/challenge'
import { toExercise } from '@/lib/coach/schemas'
import { runPythonBatch } from '@/lib/content-check'
import type { GeneratedRepRow } from '@/lib/storage/types'
import type { RunResult } from '@/lib/python/runner'

/** Run generated code through the same harness with local python3. */
const run: Run = async (code, tests) => {
  const r = runPythonBatch([{ id: 'x', code, tests }]).get('x')!
  return { ...r, errorLine: null, tests: r.tests.map((t) => ({ ...t, hidden: false, call: null, stdout: '' })), durationMs: 0 } as RunResult
}

const good = {
  title: 'Count words',
  type: 'foundation',
  format: 'code',
  difficulty: 2,
  skills: ['frequency_map', 'dict_get'],
  prompt: 'Return a dict counting each word in `words`.',
  starterCode: 'def count_words(words):\n    pass',
  examples: [{ input: "['a','b','a']", output: "{'a': 2, 'b': 1}" }],
  visibleTests: [{ call: "count_words(['a', 'b', 'a'])", expected: "{'a': 2, 'b': 1}" }],
  hiddenTests: [
    { call: 'count_words([])', expected: '{}' },
    { call: "count_words(['x'])", expected: "{'x': 1}" },
  ],
  canonicalSolution: 'def count_words(words):\n    c = {}\n    for w in words:\n        c[w] = c.get(w, 0) + 1\n    return c',
  explanation: 'get with a default.',
  hints: ['h1', 'h2', 'h3', 'h4'],
  complexity: { time: 'O(n)', space: 'O(k)' },
  signature: 'freq-map:count-items',
}

test('a correct generated rep verifies', async () => {
  const v = await verifyGeneratedRep(good, run, ['dict_get'])
  assert.equal(v.ok, true, v.reason)
})

test('schema violations are rejected before anything runs', async () => {
  const v = await verifyGeneratedRep({ ...good, prompt: '' }, run)
  assert.equal(v.ok, false)
  assert.match(v.reason!, /schema/)
})

test('a wrong canonical solution is rejected', async () => {
  const v = await verifyGeneratedRep({ ...good, canonicalSolution: 'def count_words(words):\n    return {}' }, run)
  assert.equal(v.ok, false)
  assert.match(v.reason!, /fails/)
})

test('unknown or off-target skills are rejected', async () => {
  assert.equal((await verifyGeneratedRep({ ...good, skills: ['made_up'] }, run)).ok, false)
  assert.equal((await verifyGeneratedRep(good, run, ['heap_push_pop'])).ok, false)
})

test('starter code that already passes is rejected', async () => {
  const v = await verifyGeneratedRep({ ...good, starterCode: good.canonicalSolution }, run)
  assert.equal(v.ok, false)
})

test('output reps are checked against what Python actually prints', async () => {
  const base = { ...good, format: 'output', code: 'd = {}\nd[1] = 2\nprint(d)', visibleTests: [], hiddenTests: [], canonicalSolution: 'd = {}' }
  assert.equal((await verifyGeneratedRep({ ...base, expectedOutput: '{1: 2}' }, run)).ok, true)
  assert.equal((await verifyGeneratedRep({ ...base, expectedOutput: '{2: 1}' }, run)).ok, false)
})

test('dedupe: same structure in a new story is a duplicate; different structure is not', () => {
  assert.ok(isDuplicate('freq-map:count-items', ['freq-map:count-items']))
  assert.ok(isDuplicate('Freq map: count items', ['freq-map:count-items']))
  assert.ok(!isDuplicate('freq-map:argmax-tiebreak', ['freq-map:count-items']))
  assert.ok(signatureSimilarity('index-map:first-seen', 'index-map:last-seen') < 1)
})

test('recent signatures: newest first, filtered by skill, unique', () => {
  const sigs = recentSignatures(
    [
      { signature: 'a', skills: ['dict_get'], at: '2026-10-02T01:00:00Z' },
      { signature: 'b', skills: ['heap_push_pop'], at: '2026-10-02T02:00:00Z' },
      { signature: 'c', skills: ['dict_get'], at: '2026-10-02T03:00:00Z' },
      { signature: 'c', skills: ['dict_get'], at: '2026-10-02T04:00:00Z' },
    ],
    ['dict_get'],
  )
  assert.deepEqual(sigs, ['c', 'a'])
})

test('cache lookup: key by skills/difficulty/type, unused and not a recent duplicate', () => {
  const key = cacheKey(['frequency_map', 'dict_get'], 2, 'foundation')
  assert.equal(key, cacheKey(['dict_get', 'frequency_map', 'dict_get'], 2, 'foundation'))
  const row = (id: string, sig: string, usedAt?: string): GeneratedRepRow => ({
    id,
    cacheKey: key,
    signature: sig,
    type: 'foundation',
    difficulty: 2,
    skills: ['dict_get'],
    payload: toExercise(good as never, `gen-${id}`, key, '2026-10-02T00:00:00Z'),
    validated: true,
    createdAt: `2026-10-02T0${id}:00:00Z`,
    usedAt,
    updatedAt: '2026-10-02T00:00:00Z',
  })
  const rows = [row('1', 'freq-map:count-items', '2026-10-02T05:00:00Z'), row('2', 'freq-map:count-items'), row('3', 'freq-map:argmax')]
  assert.equal(findLocal(rows, key, [])?.id, '2')
  assert.equal(findLocal(rows, key, ['freq-map:count-items'])?.id, '3')
  assert.equal(findLocal(rows, cacheKey(['dict_get'], 3, 'foundation'), []), undefined)
})

test('challenge parsing: common requests resolve locally', () => {
  const a = parseChallenge('I keep forgetting .get(). Give me reps.', [])!
  assert.deepEqual(a.skills, ['dict_get'])
  const b = parseChallenge('Give me 10 fast dictionary + enumerate questions', [])!
  assert.equal(b.count, 10)
  assert.ok(b.skills.includes('enumerate'))
  const c = parseChallenge('I have 20 minutes. Hit my weakest skills.', ['dict_get', 'enumerate'])!
  assert.deepEqual(c.skills, ['dict_get', 'enumerate'])
  assert.equal(c.count, 7)
  const d = parseChallenge('Give me something with the same mechanics as Two Sum without telling me the pattern', [])!
  assert.equal(d.hidePattern, true)
  assert.equal(d.fresh, true)
  assert.equal(parseChallenge('surprise me', []), null)
})
