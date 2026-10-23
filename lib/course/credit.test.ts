import { test } from 'node:test'
import assert from 'node:assert/strict'
import { coldEvidence, dailyCredits, gateClean, masteryEvidence, qualifies } from '@/lib/course/credit'
import type { SolveEntry } from '@/lib/solve-log'
import type { Attempt, Exercise } from '@/lib/types'

const ex = (id: string, over: Partial<Exercise> = {}) => ({ id, kind: 'code', stage: 'microbuild', repType: 'foundation', skills: ['while_loop'], ...over }) as Exercise
const EX: Record<string, Exercise> = { a: ex('a'), b: ex('b'), pick: ex('pick', { kind: 'choice' }), lab: ex('lab', { lab: true }), cold: ex('cold', { repType: 'cold', stage: 'retrieval' }) }
let n = 0
const at = (exerciseId: string, date: string, over: Partial<Attempt> = {}): Attempt =>
  ({ id: `t${n++}`, exerciseId, date, skills: ['while_loop'], stage: 'microbuild', mode: 'practice', passed: true, attemptsBeforePass: 0, hintsUsed: 0, solutionViewed: false, runtimeErrors: [], startedAt: `${date}T10:${String(n).padStart(2, '0')}:00Z`, completedAt: `${date}T10:${String(n).padStart(2, '0')}:30Z`, retrievalType: 'first-exposure', updatedAt: `${date}T10:00:00Z`, ...over }) as Attempt

test('a guided pass counts toward the day; a hinted pass counts too, as assisted evidence', () => {
  const guided = at('a', '2026-10-26')
  const hinted = at('b', '2026-10-26', { hintsUsed: 2 })
  assert.equal(qualifies(guided, EX.a), true)
  assert.equal(masteryEvidence(guided, [guided]), 'independent')
  assert.equal(qualifies(hinted, EX.b), true)
  assert.equal(masteryEvidence(hinted, [hinted]), 'assisted')
})

test('a solution shown in the attempt earns nothing; a later rebuild counts, but as a reconstruction', () => {
  const revealed = at('a', '2026-10-26', { solutionViewed: true })
  assert.equal(qualifies(revealed, EX.a), false)
  assert.equal(masteryEvidence(revealed, [revealed]), 'revealed')
  // Immediate reconstruction in the same attempt is the revealed attempt itself: no credit.
  // A later attempt (the next day) rebuilds it: it counts, and it is not cold independence.
  const later = at('a', '2026-10-27', { retrievalType: 'cold' })
  assert.equal(qualifies(later, EX.a), true)
  assert.equal(masteryEvidence(later, [revealed, later]), 'reconstructed')
  assert.equal(coldEvidence(later, [revealed, later]), false)
  assert.equal(gateClean(later, [revealed, later]), false)
  // Once it has been passed clean after the reveal, a further cold pass is real retrieval.
  const clean = at('a', '2026-10-28')
  const cold = at('a', '2026-11-04', { retrievalType: 'cold' })
  assert.equal(masteryEvidence(cold, [revealed, later, clean, cold]), 'retrieval')
})

test('repeating the same rep on the same day counts once; failures, recognition and labs never count', () => {
  const day = '2026-10-26'
  const attempts = [at('a', day), at('a', day), at('a', day), at('b', day, { passed: false, completedAt: undefined }), at('pick', day), at('lab', day)]
  const credits = dailyCredits(day, attempts, [], EX)
  assert.deepEqual(credits.map((c) => c.key), ['a'])
})

test('an outside problem solved and logged counts once; a failed one does not', () => {
  const entries = [
    { id: 'lc:1:new', lc: 1, title: 'Two Sum', date: '2026-10-26', kind: 'new', result: 'unaided', at: '' },
    { id: 'lc:217:review1', lc: 217, title: 'Contains Duplicate', date: '2026-10-26', kind: 'review1', result: 'hinted', at: '' },
    { id: 'lc:242:review1', lc: 242, title: 'Valid Anagram', date: '2026-10-26', kind: 'review1', result: 'failed', at: '' },
  ] as SolveEntry[]
  const credits = dailyCredits('2026-10-26', [], entries, EX)
  assert.deepEqual(credits.map((c) => [c.lc, c.evidence]), [[1, 'outside-unaided'], [217, 'outside-hinted']])
})

test('evidence separates a clean cold solve, a self-correction and a gate pass', () => {
  const cold = at('cold', '2026-10-30', { retrievalType: 'cold' })
  assert.equal(masteryEvidence(cold, [cold]), 'cold-independent')
  assert.equal(coldEvidence(cold, [cold]), true)
  const fixed = at('cold', '2026-10-30', { retrievalType: 'cold', attemptsBeforePass: 2 })
  assert.equal(masteryEvidence(fixed, [fixed]), 'self-corrected')
  assert.equal(gateClean(fixed, [fixed]), true, 'fixing your own mistake is allowed in a gate')
  assert.equal(gateClean(at('cold', '2026-10-30', { attemptsBeforePass: 3 }), []), false)
  assert.equal(gateClean(at('cold', '2026-10-30', { hintsUsed: 1 }), []), false, 'a gate needs the clean standard')
})
