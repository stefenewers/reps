import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentProgramStage, mockProgress, programStageProgress, remainingProgramStages } from '@/lib/progress'
import { REQUIRED_MODULES as DAYS, dayExercises } from '@/data/curriculum'
import { FINISH_LINE, INTERVIEW_TARGET, PROGRAM_STAGES } from '@/data/program'
import { MOCKS } from '@/data/mocks'
import { attempt } from '@/lib/test-helpers'

const MOCK_IDS = MOCKS.map((m) => m.id)
const none = { completed: 0, total: MOCK_IDS.length }
const both = { completed: MOCK_IDS.length, total: MOCK_IDS.length }
const done = (dates: string[]) => DAYS.filter((d) => dates.includes(d.date)).flatMap((d) => dayExercises(d).map((e) => attempt({ exerciseId: e.id })))

test('stage config lines up one-to-one with the topic modules', () => {
  assert.equal(PROGRAM_STAGES.length, DAYS.length)
  PROGRAM_STAGES.forEach((s, i) => assert.equal(s.dayDate, DAYS[i].date))
  const stages = programStageProgress(PROGRAM_STAGES, DAYS, [], none)
  assert.equal(
    stages.reduce((n, s) => n + s.total, 0),
    DAYS.reduce((n, d) => n + dayExercises(d).length, 0),
    'stage totals come from curriculum data',
  )
})

test('no attempts → Python + Hashing is current, everything else upcoming', () => {
  const stages = programStageProgress(PROGRAM_STAGES, DAYS, [], none)
  assert.equal(currentProgramStage(stages)?.stage.title, 'Python + Hashing')
  assert.ok(stages.slice(1).every((s) => s.status === 'upcoming'))
  assert.equal(currentProgramStage(stages)?.currentSection, DAYS[0].sections[0].title)
})

test('partial first stage → Python + Hashing remains current, with the right section', () => {
  const firstSection = DAYS[0].sections[0].exercises.map((e) => attempt({ exerciseId: e.id }))
  const stages = programStageProgress(PROGRAM_STAGES, DAYS, firstSection, none)
  const cur = currentProgramStage(stages)!
  assert.equal(cur.stage.title, 'Python + Hashing')
  assert.equal(cur.completed, firstSection.length)
  assert.equal(cur.currentSection, DAYS[0].sections[1].title)
  assert.deepEqual(cur.nextSections, DAYS[0].sections.slice(2).map((s) => s.title))
})

test('first stage complete → Strings + Two Pointers becomes current', () => {
  const stages = programStageProgress(PROGRAM_STAGES, DAYS, done([DAYS[0].date]), none)
  assert.equal(stages[0].status, 'complete')
  assert.equal(currentProgramStage(stages)?.stage.title, 'Strings + Two Pointers')
})

test('working ahead: the earliest unfinished stage stays current, the later one shows partial', () => {
  const early = attempt({ exerciseId: dayExercises(DAYS[5])[0].id })
  const stages = programStageProgress(PROGRAM_STAGES, DAYS, [early], none)
  assert.equal(currentProgramStage(stages)?.stage.title, 'Python + Hashing')
  assert.equal(stages[5].status, 'partial')
  assert.equal(stages[5].completed, 1)
  // Even a whole later stage done out of order is complete, but never current.
  const ahead = programStageProgress(PROGRAM_STAGES, DAYS, done([DAYS[2].date]), none)
  assert.equal(ahead[2].status, 'complete')
  assert.equal(currentProgramStage(ahead)?.stage.title, 'Python + Hashing')
})

test('all reps done but mocks unfinished → Interview Execution is still current', () => {
  const all = done(DAYS.map((d) => d.date))
  const stages = programStageProgress(PROGRAM_STAGES, DAYS, all, { completed: 1, total: 2 })
  assert.equal(currentProgramStage(stages)?.stage.title, 'Interview Execution')
  assert.deepEqual(stages[stages.length - 1].mocks, { completed: 1, total: 2 })
})

test('all reps and both mocks → the whole program resolves complete', () => {
  const stages = programStageProgress(PROGRAM_STAGES, DAYS, done(DAYS.map((d) => d.date)), both)
  assert.ok(stages.every((s) => s.status === 'complete'))
  assert.equal(currentProgramStage(stages), undefined)
  assert.equal(remainingProgramStages(stages).length, 0)
})

test('remaining topics count is deterministic and ordered', () => {
  const a = remainingProgramStages(programStageProgress(PROGRAM_STAGES, DAYS, done([DAYS[0].date, DAYS[1].date]), none))
  const b = remainingProgramStages(programStageProgress(PROGRAM_STAGES, DAYS, done([DAYS[1].date, DAYS[0].date]), none))
  assert.equal(a.length, PROGRAM_STAGES.length - 2)
  assert.deepEqual(
    a.map((s) => s.stage.title),
    b.map((s) => s.stage.title),
  )
  assert.equal(a[0].stage.title, 'Sliding Window + Stack')
})

test('mock completion counts finished results only, once per mock', () => {
  assert.deepEqual(mockProgress([], MOCK_IDS), { completed: 0, total: 2 })
  assert.deepEqual(mockProgress([{ mockId: 'mock-1' }], MOCK_IDS), { completed: 0, total: 2 }, 'opened, not finished')
  assert.deepEqual(mockProgress([{ mockId: 'mock-1', completedAt: 'x' }], MOCK_IDS), { completed: 1, total: 2 })
  assert.deepEqual(
    mockProgress(
      [
        { mockId: 'mock-1', completedAt: 'x' },
        { mockId: 'mock-1', completedAt: 'y' },
        { mockId: 'mock-2', completedAt: 'z' },
      ],
      MOCK_IDS,
    ),
    { completed: 2, total: 2 },
  )
})

test('the interview target describes the interview, never its date', () => {
  const text = [INTERVIEW_TARGET.chip.full.join(' '), INTERVIEW_TARGET.chip.compact, INTERVIEW_TARGET.role, FINISH_LINE].join(' ')
  assert.doesNotMatch(text, /oct|october|\b12\b|2026|days?\b/i)
  assert.match(INTERVIEW_TARGET.chip.full.join(' · '), /Google SWE · 2×45m · Python/)
})
