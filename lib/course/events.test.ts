import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_BY_ID } from '@/data/course'
import { UNITS } from '@/data/course/units'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { earnedEvents } from '@/lib/course/events'
import type { ContractInput } from '@/lib/course/contract'
import { evidenceSummary, type Readiness } from '@/lib/course/readiness'
import type { Attempt } from '@/lib/types'

const input = (): ContractInput => ({ attempts: [], entries: [], mastery: {}, labStates: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID })
const ready: Readiness = { track: 'off-track', dimensions: [], core: [], why: [], evidence: evidenceSummary([], [], EXERCISE_BY_ID, '2026-10-26') }
const reps = UNITS[0].path!.concat(UNITS[1].path!).slice(0, 10)
function passes(date: string): Attempt[] {
  return reps.map(
    (exerciseId, i) =>
      ({
        id: `event-${i}`,
        exerciseId,
        date,
        skills: EXERCISE_BY_ID[exerciseId].skills,
        stage: EXERCISE_BY_ID[exerciseId].stage,
        mode: 'practice',
        passed: true,
        attemptsBeforePass: 0,
        hintsUsed: 0,
        solutionViewed: false,
        runtimeErrors: [],
        startedAt: `${date}T12:00:00Z`,
        completedAt: `${date}T12:01:00Z`,
        updatedAt: `${date}T12:01:00Z`,
        retrievalType: 'first-exposure'
      }) as Attempt
  )
}
test('earned moments do not celebrate an empty day or a met rep target with an unfinished lab', () => {
  const empty = input()
  assert.deepEqual(earnedEvents(empty, '2026-10-26', 0, 0, 'not-yet-ready', ready), [])
  const withReps = { ...input(), attempts: passes('2026-10-27') }
  assert.ok(!earnedEvents(withReps, '2026-10-27', 10, 0, 'not-yet-ready', ready).some((e) => e.id.startsWith('day:')))
})
test('a complete contract earns stable first-day and daily identities; output milestones cross at their actual thresholds', () => {
  const day = { ...input(), attempts: passes('2026-10-26') }
  const events = earnedEvents(day, '2026-10-26', 10, 0, 'not-yet-ready', ready)
  assert.ok(events.some((e) => e.id === 'first-day'))
  assert.ok(events.some((e) => e.id === 'day:2026-10-26'))
  assert.deepEqual(events, earnedEvents(day, '2026-10-26', 10, 0, 'not-yet-ready', ready))
  assert.ok(!earnedEvents(day, '2026-10-26', 49, 0, 'not-yet-ready', ready).some((e) => e.id === 'output:50'))
  assert.ok(earnedEvents(day, '2026-10-26', 50, 0, 'not-yet-ready', ready).some((e) => e.id === 'output:50'))
})
