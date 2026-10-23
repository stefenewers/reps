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
      assert.ok(
        s.lines.every((l) => l >= 1 && l <= demo.code.length),
        `step ${i}: lines inside the code`
      )
      if (s.predict) assert.ok(s.predict.answer >= 0 && s.predict.answer < s.predict.choices.length && s.predict.choices.length >= 2, `step ${i}: prediction`)
    }
    assert.ok(
      a.some((s) => s.predict),
      'at least one prediction prompt'
    )
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
  for (let i = 0; i < s.length - 1; i++) if (s[i].predict) assert.equal(s[i + 1].label, s[i].predict!.answer === 0 ? 'MOVE LEFT' : 'MOVE RIGHT')
})

import { runSlidingWindow } from '@/lib/demos/sliding-window'
import { runBinarySearch } from '@/lib/demos/binary-search'
import { runLinkedList } from '@/lib/demos/linked-list'
import { runRecursion } from '@/lib/demos/recursion'
import { runTrees } from '@/lib/demos/trees'
import { runGraphs } from '@/lib/demos/graphs'
import { runBacktracking } from '@/lib/demos/backtracking'
import { runDP } from '@/lib/demos/dynamic-programming'
import { runHeap } from '@/lib/demos/heaps'
import { runIntervals } from '@/lib/demos/intervals'

test('sliding window: every measured window is valid and longest agrees with exhaustive search', () => {
  for (const values of [
    [2, 1, 4, 1, 2],
    [0, 0, 0],
    [8, 9],
    [1, 2, 6, 1]
  ])
    for (const target of [0, 3, 5]) {
      let best = 0
      for (let i = 0; i < values.length; i++)
        for (let j = i; j < values.length; j++) if (values.slice(i, j + 1).reduce((n, x) => n + x, 0) <= target) best = Math.max(best, j - i + 1)
      const steps = runSlidingWindow({ values, target })
      assert.deepEqual(steps.at(-1)!.state.result, [best])
      for (const s of steps.filter((s) => s.label === 'MEASURE')) assert.ok(Number(s.vars.total) <= target)
    }
})
test('binary search: the target is never discarded and absent values return -1', () => {
  for (const target of [1, 3, 5, 7, 9, 2, 10]) {
    const values = [1, 3, 5, 7, 9],
      steps = runBinarySearch({ values, target })
    assert.deepEqual(steps.at(-1)!.state.result, [values.indexOf(target)])
    for (const s of steps) for (const i of s.state.discarded ?? []) assert.notEqual(values[i], target)
  }
})
test('linked list: final arrows reverse the existing nodes, and earlier snapshots stay intact', () => {
  const steps = runLinkedList({ values: [4, 7, 2], target: 0 })
  assert.deepEqual(steps[0].state.edges, [
    ['0', '1'],
    ['1', '2']
  ])
  assert.deepEqual(steps.at(-1)!.state.edges, [
    ['1', '0'],
    ['2', '1']
  ])
  assert.equal(steps.at(-1)!.state.pointers?.prev, 2)
  assert.deepEqual(steps.at(-1)!.state.result, [2, 7, 4])
})
test('recursion: return values combine correctly and every frame is popped', () => {
  for (const target of [0, 1, 4, 8]) {
    const steps = runRecursion({ values: [0], target })
    assert.deepEqual(steps.at(-1)!.state.frames, [])
    assert.deepEqual(steps.at(-1)!.state.result, [(target * (target + 1)) / 2])
  }
})
test('trees: DFS returns height three and BFS visits in level order', () => {
  const values = [8, 3, 10, 1, 6, 9, 12],
    steps = runTrees({ values, target: 0 })
  assert.equal(steps.find((s) => s.label === 'BFS')!.vars.height, 3)
  assert.deepEqual(steps.at(-1)!.state.result, values)
  assert.deepEqual(
    steps.filter((s) => s.label === 'LEVEL').map((s) => s.vars.size),
    [1, 2, 4]
  )
})
test('graphs: a cycle and shared neighbor do not duplicate discovered rooms', () => {
  const steps = runGraphs({ values: [10, 20, 30, 40], target: 0 })
  assert.deepEqual(steps.find((s) => s.label === 'DONE BFS')!.state.result, [10, 20, 30, 40])
  assert.equal(steps.at(-1)!.state.visited?.length, 4)
  assert.equal(new Set(steps.at(-1)!.state.visited).size, 4)
})
test('backtracking: each subset is saved once and every choice is undone', () => {
  const steps = runBacktracking({ values: [1, 2, 3], target: 0 }),
    end = steps.at(-1)!.state
  assert.equal(end.result?.length, 8)
  assert.equal(new Set(end.result).size, 8)
  assert.deepEqual(end.frontier, [])
  assert.equal(steps.filter((s) => s.label === 'CHOOSE').length, steps.filter((s) => s.label === 'UNDO').length)
})
test('DP: duplicate recursion becomes memo lookup, and the table agrees with recurrence', () => {
  const steps = runDP({ values: [0], target: 5 })
  assert.ok(steps.some((s) => s.label === 'DUPLICATE'))
  assert.ok(steps.some((s) => s.label === 'LOOKUP'))
  assert.deepEqual(steps.at(-1)!.state.table, [1, 1, 2, 3, 5, 8])
  assert.deepEqual(steps.at(-1)!.state.result, [8])
})
test('heap: settled states satisfy heap order and keep exactly the largest k seen', () => {
  const values = [4, 9, 2, 8, 5, 10],
    steps = runHeap({ values, target: 3 })
  let count = 0
  for (const s of steps.filter((s) => s.label === 'TOP K')) {
    count++
    const h = s.state.values.map(Number)
    for (let i = 1; i < h.length; i++) assert.ok(h[Math.floor((i - 1) / 2)] <= h[i])
    assert.deepEqual(
      [...h].sort((a, b) => b - a),
      values
        .slice(0, count)
        .sort((a, b) => b - a)
        .slice(0, 3)
    )
  }
  assert.deepEqual(steps.at(-1)!.state.result, [10, 9, 8])
})
test('intervals: touching intervals merge, gaps stay separate and sorted input is not mutated', () => {
  const input = { values: [7, 1, 3, 12], target: 3 },
    steps = runIntervals(input)
  assert.deepEqual(steps.at(-1)!.state.intervals, [
    [1, 6],
    [7, 10],
    [12, 15]
  ])
  assert.deepEqual(runIntervals({ values: [1, 3, 5], target: 2 }).at(-1)!.state.intervals, [[1, 7]])
  assert.deepEqual(input.values, [7, 1, 3, 12])
})
