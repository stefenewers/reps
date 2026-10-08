import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MOCKS, MOCK_EXERCISES } from '@/data/mocks'

const BY_ID = new Map(MOCK_EXERCISES.map((e) => [e.id, e]))

test('exactly two ~45-minute mocks, every problem defined', () => {
  assert.equal(MOCKS.length, 2)
  for (const m of MOCKS) {
    assert.equal(m.minutes, 45)
    for (const id of m.exerciseIds) assert.ok(BY_ID.get(id), `${m.id}: ${id}`)
  }
})

test('the pair covers hashing, grid BFS and tree DFS, and Mock 2 ends on an interviewer follow-up', () => {
  const skills = (mockId: string) => new Set(MOCKS.find((m) => m.id === mockId)!.exerciseIds.flatMap((id) => BY_ID.get(id)!.skills))
  const one = skills('mock-1')
  const two = skills('mock-2')
  assert.ok(one.has('frequency_map') && one.has('bfs'), 'Mock 1: counting + grid BFS')
  assert.ok(two.has('tree_dfs'), 'Mock 2: a substantial tree DFS problem')
  const last = BY_ID.get(MOCKS[1].exerciseIds.at(-1)!)!
  assert.match(last.prompt, /Interviewer follow-up/)
})
