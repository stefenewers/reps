import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEMOS } from '@/lib/demos'
import { runTwoPointers } from '@/lib/demos/two-pointers'

/** Every demo: deterministic steps, a valid shape, working presets and custom input (REPS_2_1_SPEC.md §29). */
for (const demo of DEMOS) {
  test(`${demo.id}: steps are deterministic and complete`, () => {
    const a = demo.run(demo.defaultInput)
    const b = demo.run(demo.defaultInput)
    assert.deepEqual(a, b, 'same input, same steps')
    assert.ok(a.length >= 3, 'enough steps to see something change')
    for (const [i, s] of a.entries()) {
      assert.ok(s.label.trim() && s.why.trim(), `step ${i}: label and why`)
      assert.ok(s.lines.every((l) => l >= 1 && l <= demo.code.length), `step ${i}: lines inside the code`)
      if (s.predict) assert.ok(s.predict.answer >= 0 && s.predict.answer < s.predict.choices.length && s.predict.choices.length >= 2, `step ${i}: prediction`)
    }
    assert.ok(a.some((s) => s.predict), 'at least one prediction prompt')
    // Running never mutates the input (reset and re-run see the same thing).
    const copy = JSON.parse(JSON.stringify(demo.defaultInput))
    demo.run(demo.defaultInput)
    assert.deepEqual(demo.defaultInput, copy)
  })
  test(`${demo.id}: presets run, and the input box round-trips and rejects nonsense`, () => {
    for (const p of demo.presets) assert.ok(demo.run(p.input).length >= 2, p.label)
    if (demo.parseInput) {
      const back = demo.parseInput(demo.formatInput(demo.defaultInput))
      assert.ok('input' in back, 'the default input parses back')
      if ('input' in back) assert.deepEqual(demo.run(back.input), demo.run(demo.defaultInput))
      assert.ok('error' in demo.parseInput('not numbers at all'), 'nonsense is rejected with a reason')
    }
  })
}

test('two pointers: finds the pair, rules out only impossible values, and reports no pair when there is none', () => {
  const s = runTwoPointers({ values: [1, 3, 4, 6, 8, 11], target: 10 })
  const end = s[s.length - 1].state
  assert.deepEqual(end.found, [2, 3])
  assert.equal(s[s.length - 1].label, 'FOUND')
  // Every ruled-out value really is in no pair that sums to the target.
  const v = end.values
  for (const i of end.discarded) assert.ok(!v.some((x, j) => j !== i && x + v[i] === 10), `value ${v[i]} was safe to drop`)
  const none = runTwoPointers({ values: [2, 4, 6, 8], target: 3 })
  assert.equal(none[none.length - 1].label, 'NO PAIR')
  // The prediction says which pointer moves, and the next step moves exactly that one.
  for (let i = 0; i < s.length - 1; i++)
    if (s[i].predict) assert.equal(s[i + 1].label, s[i].predict!.answer === 0 ? 'MOVE LEFT' : 'MOVE RIGHT')
})
