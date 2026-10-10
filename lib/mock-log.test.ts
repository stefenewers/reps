import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mockSummary, rubricAverage, type MockLogEntry } from '@/lib/mock-log'
import { DESIGN_TRACK } from '@/data/design-track'
import { STORY_PROMPTS } from '@/data/stories'

const m = (over: Partial<MockLogEntry>): MockLogEntry => ({ id: 'a', date: '2026-10-20', type: 'Self-recorded', scores: {}, at: '', ...over })

test('rubric average uses only the scores filled in, 1 to 4', () => {
  assert.equal(rubricAverage(m({ scores: { Clarify: 2, Code: 4 } })), 3)
  assert.equal(rubricAverage(m({ scores: {} })), null)
  assert.equal(rubricAverage(m({ scores: { Code: 9 } })), null)
})

test('mock summary counts sessions through a date and averages their scores', () => {
  const es = [m({ id: 'a', scores: { Code: 2 } }), m({ id: 'b', date: '2026-11-01', scores: { Code: 4 } }), m({ id: 'c', date: '2026-12-01' })]
  assert.deepEqual(mockSummary(es), { count: 3, average: 3 })
  assert.deepEqual(mockSummary(es, '2026-10-31'), { count: 1, average: 2 })
  assert.deepEqual(mockSummary([]), { count: 0, average: null })
})

test('the design track and the stories checklist are complete', () => {
  assert.equal(STORY_PROMPTS.length, 12)
  assert.equal(new Set(STORY_PROMPTS.map((s) => s.id)).size, 12)
  assert.ok(DESIGN_TRACK.length >= 8)
  for (const d of DESIGN_TRACK) assert.ok(d.week >= 1 && d.week <= 13 && d.deliverables.length >= 3, d.id)
})
