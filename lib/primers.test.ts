import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PRIMERS, PRIMER_BY_SKILL, primersFor } from '@/data/primers'
import { SKILLS } from '@/data/skills'
import { ALL_EXERCISES } from '@/data/curriculum'

test('every skill has exactly one primer', () => {
  const counts = new Map<string, number>()
  for (const p of PRIMERS) for (const s of p.skills) counts.set(s, (counts.get(s) ?? 0) + 1)
  const missing = SKILLS.filter((s) => !counts.has(s.id)).map((s) => s.id)
  assert.deepEqual(missing, [], 'skills without a primer')
  for (const [s, n] of counts) assert.equal(n, 1, `${s} covered ${n} times`)
})

test('every rep has at least one primer behind its Basics button', () => {
  const bare = ALL_EXERCISES.filter((e) => primersFor(e.skills).length === 0).map((e) => e.id)
  assert.deepEqual(bare, [])
})

test('primersFor returns each concept once, in skill order', () => {
  const ps = primersFor(['set_add', 'set_membership', 'dict_get', 'set_create'])
  assert.deepEqual(
    ps.map((p) => p.id),
    [PRIMER_BY_SKILL.set_add.id, PRIMER_BY_SKILL.dict_get.id],
  )
})

test('primers are short and complete', () => {
  for (const p of PRIMERS) {
    assert.ok(p.what.length > 40 && p.what.length < 600, `${p.id} what`)
    assert.ok(p.syntax.length >= 3 && p.syntax.length <= 7, `${p.id} syntax lines`)
    assert.ok(p.gotchas.length >= 2 && p.gotchas.length <= 5, `${p.id} gotchas`)
    assert.ok(p.example.code.trim() && p.example.output.trim(), `${p.id} example`)
  }
})
