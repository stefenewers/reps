import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_BY_ID } from '@/data/course'
import { GATE_BY_ID } from '@/data/course/gates'
import { LABS } from '@/data/course/lessons'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { courseStatus } from '@/lib/course/routing'
import { evidenceSummary, finalDecision, memorizedRisk, mockPolicy, readiness, transferGrade, type EvidenceSummary, type LabEvidence, type ReadinessInput } from '@/lib/course/readiness'
import type { SolveEntry } from '@/lib/solve-log'
import type { Attempt } from '@/lib/types'

const calm: EvidenceSummary = { independent: 0, coldIndependent: 0, selfCorrected: 0, retrieval: 0, assisted: 0, reconstructed: 0, outsideUnaided: 0, outsideCold: 0, outsideHinted: 0, outsideRebuilt: 0, recentAssistance: 0 }
const statuses = (today: string, attempts: Attempt[] = []) => courseStatus({ attempts, mastery: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID, today })
const base = (today: string, over: Partial<ReadinessInput> = {}): ReadinessInput => ({ statuses: statuses(today), finishedWeeks: [], currentWeek: 'on-track', evidence: calm, labs: [], mocksDone: 0, today, ...over })

let n = 0
const at = (exerciseId: string, date: string, over: Partial<Attempt> = {}): Attempt => {
  n++
  const t = `${date}T10:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}Z`
  return { id: `r${n}`, exerciseId, date, skills: [], stage: 'pattern', mode: 'practice', passed: true, attemptsBeforePass: 0, hintsUsed: 0, solutionViewed: false, runtimeErrors: [], startedAt: t, completedAt: t, retrievalType: 'cold', updatedAt: t, ...over } as Attempt
}

test('readiness has the seven dimensions of the spec, each with a reason, and no percentage', () => {
  const r = readiness(base('2026-10-26'))
  assert.deepEqual(r.dimensions.map((d) => d.id), ['foundations', 'problem-solving', 'core-dsa', 'transfer', 'building', 'ai-fde', 'interview'])
  for (const d of [...r.dimensions, ...r.core]) assert.ok(d.why.length > 0 && !/%/.test(d.why), d.id)
  assert.equal(r.track, 'on-track')
})

test('the track follows the week contract: never on track while this week or last week is off track', () => {
  assert.equal(readiness(base('2026-11-03', { currentWeek: 'off-track' })).track, 'off-track')
  assert.equal(readiness(base('2026-11-10', { finishedWeeks: ['complete', 'off-track'] })).track, 'off-track')
  assert.equal(readiness(base('2026-11-03', { currentWeek: 'recoverable' })).track, 'at-risk')
  assert.equal(readiness(base('2026-10-27', { evidence: { ...calm, recentAssistance: 0.7 } })).track, 'off-track')
  assert.ok(readiness(base('2026-11-03', { currentWeek: 'off-track' })).why.some((w) => /off track/.test(w)))
})

test('evidence is classified exactly, every checkpoint variant counts, and a later cold solve upgrades an earlier assisted one', () => {
  const variant = GATE_BY_ID['g-hashing'].pool[0]
  const capstone = 'cap-two-sum'
  const attempts = [
    at(variant, '2026-11-02', { hintsUsed: 2 }), // assisted first...
    at(variant, '2026-11-09'), // ...then cold and clean on a later day: retrieval? no, no earlier clean pass: cold-independent
    at(capstone, '2026-11-02', { retrievalType: 'first-exposure' }), // independent, not cold
  ]
  const ev = evidenceSummary(attempts, [], EXERCISE_BY_ID, '2026-11-10')
  assert.equal(ev.coldIndependent, 1, 'the variant, upgraded from assisted')
  assert.equal(ev.assisted, 0)
  assert.equal(ev.independent, 1, 'the capstone is independent, not cold-independent')
  const entries = [{ id: 'lc:49:new', lc: 49, title: 'Group Anagrams', date: '2026-11-03', kind: 'new', result: 'solution', at: '' }, { id: 'lc:49:review1', lc: 49, title: 'Group Anagrams', date: '2026-11-06', kind: 'review1', result: 'unaided', at: '' }] as SolveEntry[]
  const ev2 = evidenceSummary([], entries, EXERCISE_BY_ID, '2026-11-10')
  assert.deepEqual([ev2.outsideCold, ev2.outsideHinted, ev2.outsideRebuilt], [1, 0, 0])
})

test('labs feed Software Building and Applied AI/FDE; AI never blocks a general SWE result', () => {
  const lab = (id: string, done: boolean, due = true): LabEvidence => ({ lab: LABS.find((l) => l.id === id)!, done, due, buildPassed: done, changePassed: done, designDone: done })
  const labs = [lab('lab-savings-goal', true), lab('lab-inventory', false), lab('lab-support-router', false, false)]
  const r = readiness(base('2026-11-02', { labs }))
  const building = r.dimensions.find((d) => d.id === 'building')!
  assert.equal(building.status, 'developing')
  assert.match(building.why, /1 of 2/)
  assert.equal(r.dimensions.find((d) => d.id === 'ai-fde')!.status, 'not-started')
})

test('transfer grading is order-independent; memorized risk works without a recorded duration', () => {
  const ids = Array.from({ length: 12 }, (_, i) => `t${i}`)
  const ex = Object.fromEntries(ids.map((id) => [id, { id, stage: 'interview', minutes: 20, kind: 'code' }])) as never
  const good = ids.map((id) => at(id, '2027-01-20'))
  assert.equal(transferGrade([...good].reverse(), ex, ids).grade, 'green')
  const repeat = at('t0', '2027-01-21', { startedAt: '2027-01-21T10:00:00Z', completedAt: '2027-01-21T10:01:00Z' })
  assert.equal(memorizedRisk(repeat, [at('t0', '2027-01-20'), repeat]), true)
  assert.deepEqual(mockPolicy('red'), { mocksRequired: 0, mocksAllowed: 0, note: 'No mock theatre yet: cold transfer and repair first.' })
})

test('the final decision needs evidence on several fronts', () => {
  const r = readiness(base('2027-01-25'))
  assert.equal(finalDecision(r, 'green', 2), 'not-yet-ready', 'green transfer alone is not enough: foundations and core are not ready')
  assert.equal(finalDecision(r, 'red', 0), 'not-yet-ready')
})
