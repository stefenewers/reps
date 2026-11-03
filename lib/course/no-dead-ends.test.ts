import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_BY_ID } from '@/data/course'
import { LAB_BY_ID } from '@/data/course/lessons'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { createContracts } from '@/lib/course/contract'
import { courseDailyPlan } from '@/lib/course/daily-plan'
import type { LabState } from '@/lib/course/labs'
import type { Attempt, RetrievalType } from '@/lib/types'

/**
 * Walks a learner through the course days as Today offers them: reps, then labs,
 * then open checkpoints. Whatever days were missed and whichever checkpoints
 * failed, an unfinished day must always offer something to do.
 */
const DAYS = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-11-02', '2026-11-03', '2026-11-04']

function walk(missed: string[], failFirstTry: boolean) {
  let n = 0
  const attempts: Attempt[] = []
  const labStates: Record<string, LabState> = {}
  const failed = new Set<string>()
  const input = () => ({ attempts, entries: [], mastery: {}, labStates, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID })
  const at = (exerciseId: string, date: string, retrievalType: RetrievalType = 'first-exposure'): Attempt => {
    n++
    const t = `${date}T${String(8 + (Math.floor(n / 3600) % 12)).padStart(2, '0')}:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}Z`
    return {
      id: `walk-${n}`,
      exerciseId,
      date,
      skills: EXERCISE_BY_ID[exerciseId]?.skills ?? [],
      stage: EXERCISE_BY_ID[exerciseId]?.stage ?? 'microbuild',
      mode: 'practice',
      passed: true,
      attemptsBeforePass: 0,
      hintsUsed: 0,
      solutionViewed: false,
      runtimeErrors: [],
      startedAt: t,
      completedAt: t,
      retrievalType,
      updatedAt: t
    }
  }
  for (const date of DAYS) {
    if (missed.includes(date)) continue
    for (let step = 0; ; step++) {
      assert.ok(step < 80, `${date}: the day never finishes`)
      const c = createContracts(input()).dayContract(date)
      if (c.complete) break
      const rep = courseDailyPlan(date, input()).find((q) => q.exerciseId && q.purpose !== 'gate' && q.purpose !== 'problem')
      const lab = c.labs.find((l) => l.state !== 'done')
      const gate = c.gates.find((g) => g.state === 'open' && g.next.length)
      if (rep) attempts.push(at(rep.exerciseId!, date))
      else if (lab) {
        const l = LAB_BY_ID[lab.id]
        attempts.push(at(l.buildExerciseId, date), at(l.changeRequest.exerciseId, date))
        labStates[lab.id] = {
          design: Object.fromEntries(l.designQuestions.map((_, i) => [i, 'A real sentence about the design.'])),
          review: Object.fromEntries(l.review.map((_, i) => [i, true])),
          doneAt: `${date}T15:00:00`
        }
      } else if (gate) {
        const fail = failFirstTry && !failed.has(gate.id)
        failed.add(gate.id)
        attempts.push(fail ? { ...at(gate.next[0], date, 'cold'), passed: false, completedAt: undefined, attemptsBeforePass: 3 } : at(gate.next[0], date, 'cold'))
      } else assert.fail(`${date}: nothing to do, but still required: ${c.remaining.join(' | ')}`)
    }
  }
}

const THU_FRI = ['2026-10-29', '2026-10-30']
test('every unfinished day has a next step: no days missed', () => walk([], false))
test('every unfinished day has a next step: two days missed', () => walk(THU_FRI, false))
test('every unfinished day has a next step: checkpoints failed once', () => walk([], true))
test('every unfinished day has a next step: days missed and checkpoints failed', () => walk(THU_FRI, true))
test('every unfinished day has a next step: three days missed', () => walk([...THU_FRI, '2026-11-02'], false))
