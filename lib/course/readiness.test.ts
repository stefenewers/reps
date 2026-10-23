import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_BY_ID } from '@/data/course'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { courseStatus } from '@/lib/course/routing'
import { finalDecision, mockPolicy, readiness, transferGrade, type EvidenceSummary } from '@/lib/course/readiness'
import type { Attempt } from '@/lib/types'

const calm: EvidenceSummary = { coldIndependent: 0, selfCorrected: 0, assisted: 0, reconstructed: 0, recentAssistance: 0 }
const statuses = (today: string) => courseStatus({ attempts: [], mastery: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID, today })

test('readiness explains itself per domain, never as one percentage', () => {
  const r = readiness(statuses('2026-10-26'), [], calm, '2026-10-26')
  assert.equal(r.track, 'on-track')
  assert.ok(r.domains.length >= 10)
  for (const d of r.domains) assert.ok(d.why.length > 0, d.id)
  assert.equal(r.interview, 'not-tested')
})

test('falling two weeks behind the calendar, or leaning on help, is not called on track', () => {
  assert.equal(readiness(statuses('2026-11-16'), [], calm, '2026-11-16').track, 'off-track', 'week 4 with week 1 unfinished')
  assert.equal(readiness(statuses('2026-11-02'), [], calm, '2026-11-02').track, 'at-risk', 'a week behind')
  assert.equal(readiness(statuses('2026-10-27'), [], { ...calm, recentAssistance: 0.7 }, '2026-10-27').track, 'off-track')
  assert.ok(readiness(statuses('2026-11-16'), [], calm, '2026-11-16').why.some((w) => /behind the calendar/.test(w)))
})

let n = 0
const at = (exerciseId: string, over: Partial<Attempt> = {}): Attempt =>
  ({ id: `r${n++}`, exerciseId, date: '2027-01-20', skills: [], stage: 'pattern', mode: 'practice', passed: true, attemptsBeforePass: 0, hintsUsed: 0, solutionViewed: false, runtimeErrors: [], startedAt: `2027-01-20T10:00:${String(n % 60).padStart(2, '0')}Z`, completedAt: `2027-01-20T10:00:${String(n % 60).padStart(2, '0')}Z`, retrievalType: 'cold', updatedAt: '', ...over }) as Attempt

test('Week 13 grades transfer as green, yellow or red, and Week 14 mocks follow the grade, not the calendar', () => {
  const ids = Array.from({ length: 12 }, (_, i) => `t${i}`)
  const ex = Object.fromEntries(ids.map((id) => [id, { id, stage: 'interview', minutes: 20, kind: 'code' }])) as never
  assert.equal(transferGrade(ids.map((id) => at(id)), ex, ids).grade, 'green')
  assert.equal(transferGrade(ids.map((id, i) => at(id, i % 2 ? { hintsUsed: 2 } : {})), ex, ids).grade, 'yellow')
  assert.equal(transferGrade(ids.slice(0, 3).map((id) => at(id, { solutionViewed: true })), ex, ids).grade, 'red')
  assert.deepEqual(mockPolicy('red'), { mocksRequired: 0, mocksAllowed: 0, note: 'No mock theatre yet: cold transfer and repair first.' })
  assert.equal(mockPolicy('yellow').mocksAllowed, 1)
  assert.equal(mockPolicy('green').mocksRequired, 2)
  const r = readiness(statuses('2027-01-25'), [], calm, '2027-01-25')
  assert.equal(finalDecision(r, 'red', 0), 'not-yet-ready')
})
