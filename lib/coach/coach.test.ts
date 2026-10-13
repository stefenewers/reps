import { test } from 'node:test'
import assert from 'node:assert/strict'
import { verifyGeneratedRep, type Run } from '@/lib/coach/verify'
import { isDuplicate, recentSignatures, signatureSimilarity } from '@/lib/coach/dedupe'
import { cacheKey, findLocal } from '@/lib/coach/cache'
import { parseChallenge } from '@/lib/coach/challenge'
import { toExercise } from '@/lib/coach/schemas'
import { GENERATION_GUIDANCE, TEACHING_RULES, generationSystem, pedagogyProblem } from '@/lib/coach/guidance'
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
  teaching: {
    concept: 'A frequency map is a dict from each item to how many times it has appeared. For every item you read its count so far (0 if it is new), add one, and store it back.',
    example: "counts = {}\nfor ch in 'aba':\n    counts[ch] = counts.get(ch, 0) + 1\nprint(counts)",
  },
  prompt: '`words` is a list of strings. Write `count_words(words)` returning a dict from each word to how many times it appears. An empty list gives `{}`.',
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

// ── generated reps follow the same pedagogy as authored ones ─────────────────

test('generation guidance depends on what the rep is for', () => {
  assert.doesNotMatch(TEACHING_RULES, /Prefer retrieval over explanation|Google|internship/i)
  assert.match(TEACHING_RULES, /SWE I \/ new-grad/)
  // Foundation asks for teaching and an example; cold asks for none; pattern does not name the pattern.
  const foundation = generationSystem({ count: 1, type: 'foundation', hidePattern: false })
  assert.match(foundation, /what the idea is/)
  assert.match(foundation, /one small worked example/)
  assert.match(foundation, /say what every input is/)
  const cold = generationSystem({ count: 1, type: 'cold', hidePattern: false })
  assert.match(cold, /minimal scaffolding/i)
  assert.match(cold, /No "teaching"/)
  assert.doesNotMatch(cold, /worked example/)
  const pattern = generationSystem({ count: 1, type: 'pattern', hidePattern: false })
  assert.match(pattern, /Do not name the algorithm, the pattern or the data structure/)
  assert.doesNotMatch(foundation, /Do not name the algorithm/)
  assert.match(generationSystem({ count: 1, type: 'combine', hidePattern: true }), /Do not name the algorithm/)
  // Every kind forbids the vague one-liner, and none of them is an essay brief.
  for (const kind of ['foundation', 'combine', 'pattern', 'cold'] as const) {
    assert.match(generationSystem({ count: 1, type: kind, hidePattern: false }), /Never a vague one-line mini-LeetCode/)
    assert.ok(GENERATION_GUIDANCE[kind].length < 700)
  }
})

test('a foundation rep must teach; a cold rep must not; a transfer rep must not name its pattern', async () => {
  const rep = (over: object) => ({ ...good, examples: good.examples, visibleTests: good.visibleTests, hiddenTests: good.hiddenTests, ...over }) as never
  assert.equal(pedagogyProblem(rep({})), null)
  assert.match(pedagogyProblem(rep({ teaching: null }))!, /must teach/)
  assert.match(pedagogyProblem(rep({ teaching: { concept: 'x'.repeat(750) } }))!, /too long/)
  assert.match(pedagogyProblem(rep({ teaching: { concept: good.teaching.concept, example: good.canonicalSolution } }))!, /must not be the solution/)
  // The same task as a cold rep: terse, and no teaching attached.
  const cold = { type: 'cold', teaching: null, examples: [], prompt: 'Write `count_words(words)` returning a dict of how many times each word appears.' }
  assert.equal(pedagogyProblem(rep(cold)), null)
  assert.match(pedagogyProblem(rep({ ...cold, teaching: good.teaching }))!, /no teaching/)
  assert.match(pedagogyProblem(rep({ ...cold, prompt: 'Explain. '.repeat(60) }))!, /over-scaffolded/)
  // Recognition is the test: the prompt may not say "frequency map" or "use a dict".
  const transfer = { type: 'pattern', teaching: null, title: 'Most common word', prompt: '`words` is a list of strings. Write `top_word(words)` returning the word that appears most often; ties go to the one seen first.' }
  assert.equal(pedagogyProblem(rep(transfer)), null)
  assert.match(pedagogyProblem(rep({ ...transfer, prompt: 'Build a frequency map of `words`, then return the most common word.' }))!, /names its technique/)
  assert.match(pedagogyProblem(rep({ type: 'combine', teaching: null }), { hidePattern: true }) ?? '', /^$|names its technique/)
  // A vague one-liner is rejected for any kind.
  assert.match(pedagogyProblem(rep({ type: 'combine', teaching: null, prompt: 'Count the words.' }))!, /too thin/)
  // And the check runs with the deterministic ones before anything is shown.
  const v = await verifyGeneratedRep({ ...good, teaching: null }, run)
  assert.equal(v.ok, false)
  assert.match(v.reason!, /^pedagogy: /)
  const ex = toExercise(good as never, 'gen-1', 'k', '2026-10-13T00:00:00Z')
  assert.equal(ex.teaching?.concept, good.teaching.concept)
  assert.equal(toExercise({ ...good, ...cold } as never, 'gen-2', 'k', '2026-10-13T00:00:00Z').teaching, undefined)
  assert.equal(toExercise({ ...good, ...transfer } as never, 'gen-3', 'k', '2026-10-13T00:00:00Z').transfer, true)
})
