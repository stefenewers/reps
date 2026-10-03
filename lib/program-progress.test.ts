import { test } from 'node:test'
import assert from 'node:assert/strict'
import { programProgress } from '@/lib/progress'
import { DAYS, dayExercises } from '@/data/curriculum'
import { attempt } from '@/lib/test-helpers'

const TOTAL = DAYS.reduce((n, d) => n + dayExercises(d).length, 0)
const first = dayExercises(DAYS[0])[0]
const second = dayExercises(DAYS[0])[1]

test('the denominator is the fixed canonical curriculum, derived from data', () => {
  const p = programProgress(DAYS, [])
  assert.equal(p.total, TOTAL)
  assert.ok(TOTAL > 300, 'required reps across the calendar')
  assert.equal(TOTAL, DAYS.reduce((n, d) => n + d.sections.filter((s) => !s.optional).reduce((m, s) => m + s.exercises.length, 0), 0), 'extras never count')
})

test('0 completed → 0%', () => {
  const p = programProgress(DAYS, [])
  assert.equal(p.completed, 0)
  assert.equal(p.fraction, 0)
})

test('completing a canonical rep increments; failures and unfinished attempts do not', () => {
  assert.equal(programProgress(DAYS, [attempt({ exerciseId: first.id })]).completed, 1)
  assert.equal(programProgress(DAYS, [attempt({ exerciseId: first.id, passed: false })]).completed, 0)
  assert.equal(programProgress(DAYS, [attempt({ exerciseId: first.id, completedAt: undefined })]).completed, 0)
})

test('the same rep completed twice (or run back) counts once', () => {
  const p = programProgress(DAYS, [
    attempt({ exerciseId: first.id }),
    attempt({ exerciseId: first.id, retrievalType: 'immediate-reconstruction' }),
    attempt({ exerciseId: first.id, retrievalType: 'cold', sessionKind: 'review' }),
  ])
  assert.equal(p.completed, 1)
})

test('generated reps (Another rep, generated repair reps) never move the rail or its denominator', () => {
  const p = programProgress(DAYS, [attempt({ exerciseId: 'gen-1234', sessionKind: 'another' }), attempt({ exerciseId: 'gen-5678', sessionKind: 'repair' })])
  assert.equal(p.completed, 0)
  assert.equal(p.total, TOTAL)
})

test('repair, challenge and review sessions re-practice canonical reps without adding new ones', () => {
  const base = [attempt({ exerciseId: first.id })]
  const after = programProgress(DAYS, [...base, attempt({ exerciseId: first.id, sessionKind: 'repair' }), attempt({ exerciseId: first.id, sessionKind: 'challenge' })])
  assert.equal(after.completed, 1)
  assert.equal(after.total, TOTAL)
  // A canonical rep first completed inside a session still counts, exactly once.
  assert.equal(programProgress(DAYS, [...base, attempt({ exerciseId: second.id, sessionKind: 'repair' })]).completed, 2)
})

test('all canonical reps completed → 100% and every day complete', () => {
  const all = DAYS.flatMap((d) => dayExercises(d).map((e) => attempt({ exerciseId: e.id })))
  const p = programProgress(DAYS, all)
  assert.equal(p.completed, TOTAL)
  assert.equal(p.fraction, 1)
  assert.ok(p.days.every((d) => d.complete))
})

test('day markers follow cumulative workload, not equal tenths', () => {
  const p = programProgress(DAYS, [])
  assert.equal(p.days[0].start, 0)
  assert.equal(p.days[p.days.length - 1].end, 1)
  for (let i = 1; i < p.days.length; i++) assert.equal(p.days[i].start, p.days[i - 1].end)
  const widths = p.days.map((d) => d.end - d.start)
  assert.ok(Math.max(...widths) - Math.min(...widths) > 0.01, 'a heavier day takes more of the rail')
  assert.ok(Math.abs(widths[0] - dayExercises(DAYS[0]).length / TOTAL) < 1e-9)
})
