import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BRIEFS } from '@/data/briefs'
import { MAX_MOVES, movesFor } from '@/data/primers/moves'
import { DAYS, EXERCISE_BY_ID } from '@/data/curriculum'

const text = (b: (typeof BRIEFS)[string]) => [b.task, b.returns, b.catch, ...(b.inputs ?? []).map((i) => i.is)].filter(Boolean).join('\n')

test('every brief belongs to a real rep and names its real inputs', () => {
  for (const [id, b] of Object.entries(BRIEFS)) {
    const e = EXERCISE_BY_ID[id]
    assert.ok(e, `brief for unknown rep ${id}`)
    const src = e.starterCode ?? e.code ?? ''
    for (const i of b.inputs ?? []) assert.match(src, new RegExp(`\\b${i.name}\\b`), `${id}: input ${i.name} is not in the rep's code`)
    assert.ok(b.task || b.returns, `${id}: says what to do or what to return`)
  }
})

test('a brief explains the question, never the answer', () => {
  for (const [id, b] of Object.entries(BRIEFS)) {
    const sol = EXERCISE_BY_ID[id].solution
    if (!sol) continue
    const t = text(b)
    for (const line of sol.split('\n').map((l) => l.trim()).filter((l) => l.length >= 12 && !l.startsWith('def ') && !l.startsWith('return ')))
      assert.ok(!t.includes(line), `${id}: brief contains the solution line "${line}"`)
  }
})

test('the dictionary stretch has a brief on every rep', () => {
  const day = DAYS.find((d) => d.date === '2026-10-03')!
  const want = ['o2-dictionaries', 'o2-dict-revision', 'o2-get', 'o2-iter-dicts', 'o2-frequency', 'o2-index-maps', 'o2-complements']
  const missing = day.sections.filter((s) => want.includes(s.id)).flatMap((s) => s.exercises).filter((e) => !BRIEFS[e.id]).map((e) => e.id)
  assert.deepEqual(missing, [])
})

test('moves: only what the rep is built from, at most three, never the pattern itself', () => {
  for (const e of Object.values(EXERCISE_BY_ID)) assert.ok(movesFor(e.skills).length <= MAX_MOVES, e.id)
  assert.deepEqual(movesFor(['dict_membership', 'dict_lookup', 'conditionals']).map((m) => m.id), ['dict-guarded'])
  assert.deepEqual(movesFor(['dict_membership', 'dict_lookup', 'accumulator', 'for_loop']).map((m) => m.id), ['dict-guarded', 'list-total', 'list-loop'])
  assert.deepEqual(movesFor(['frequency_map', 'index_map', 'complement']), [])
  assert.deepEqual(movesFor(['dict_items', 'conditionals', 'list_append']).map((m) => m.id), ['dict-loop', 'list-collect'])
})
