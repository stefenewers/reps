import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_BY_ID } from '@/data/course'
import { dailyTarget, trainingDays, weekTarget } from '@/data/course/calendar'
import { GATE_BY_ID, GATE_OF_EXERCISE } from '@/data/course/gates'
import { LABS } from '@/data/course/lessons'
import { SCHEDULE } from '@/data/course/schedule'
import { UNITS } from '@/data/course/units'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { createContracts, type ContractInput } from '@/lib/course/contract'
import { courseDailyPlan } from '@/lib/course/daily-plan'
import { courseStatus } from '@/lib/course/routing'
import type { Attempt } from '@/lib/types'

const same = (actual: (string | number)[], expected: (string | number)[], label: string) => assert.deepEqual([...actual].sort(), [...expected].sort(), label)

test('all 14 curated weeks fit the output budget and schedule every obligation exactly once', () => {
  const seen = new Set<string>()
  for (const { week, days } of SCHEDULE) {
    const units = UNITS.filter((u) => u.week === week)
    const path = units.flatMap((u) => u.path ?? [])
    const gates = units.flatMap((u) => u.gateIds)
    const targets = units.flatMap((u) => u.targets)
    const required = path.length + gates.reduce((n, id) => n + GATE_BY_ID[id].need, 0) + targets.length
    assert.ok(required + Math.ceil(0.15 * weekTarget(week)) <= weekTarget(week), `week ${week}: ${required} + reserve exceeds ${weekTarget(week)}`)
    same(
      days.map((d) => d.date),
      trainingDays(week),
      `week ${week}: training dates`
    )
    same(
      days.flatMap((d) => d.gatesDue),
      gates,
      `week ${week}: checkpoints`
    )
    same(
      days.flatMap((d) => d.labsDue),
      LABS.filter((l) => l.week === week && !l.optional).map((l) => l.id),
      `week ${week}: labs`
    )
    same(
      days.flatMap((d) => d.targetsDue),
      targets,
      `week ${week}: targets`
    )
    let capacity = 0
    const dueUnits = new Set<string>()
    for (const d of days) {
      capacity += dailyTarget(week) - Math.ceil(0.15 * dailyTarget(week)) - d.gatesDue.reduce((n, id) => n + GATE_BY_ID[id].need, 0) - d.targetsDue.length
      for (const id of d.gatesDue) dueUnits.add(GATE_BY_ID[id].unitId)
      for (const id of d.labsDue) dueUnits.add(LABS.find((l) => l.id === id)!.unitId)
      for (const lc of d.targetsDue) dueUnits.add(units.find((u) => u.targets.includes(lc))!.id)
      const lastDue = Math.max(-1, ...units.map((u, i) => dueUnits.has(u.id) ? i : -1))
      const pathDue = units.slice(0, lastDue + 1).reduce((n, u) => n + u.path!.length, 0)
      assert.ok(capacity >= pathDue, `${d.date}: path before due items needs ${pathDue} slots; only ${capacity} available`)
    }
    for (const u of units) {
      assert.ok(u.path?.length, `${u.id}: explicit path`)
      for (const id of u.path!) {
        const e = EXERCISE_BY_ID[id]
        assert.ok(e, `${u.id}: missing ${id}`)
        assert.ok(['code', 'output', 'reorder'].includes(e.kind), `${id}: active production`)
        assert.ok(!GATE_OF_EXERCISE[id], `${id}: checkpoint cannot be path`)
        assert.ok(!seen.has(id), `${id}: duplicated path`)
        seen.add(id)
        assert.ok(
          u.sections.some((sid) => SECTION_BY_ID[sid]?.exercises.some((r) => r.id === id)),
          `${id}: belongs to unit inventory`
        )
      }
      for (const sid of [...u.sections, ...(u.optional ?? []), ...(u.stretch ?? []), ...(u.retrieval ?? [])])
        assert.ok(SECTION_BY_ID[sid], `${u.id}: unknown section ${sid}`)
    }
  }
})

test('a perfect learner following the actual prescription completes every training day and all 14 weeks', () => {
  const input: ContractInput = { attempts: [], entries: [], mastery: {}, labStates: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID }
  let n = 0
  const pass = (exerciseId: string, date: string) => {
    const e = EXERCISE_BY_ID[exerciseId]
    const t = `${date}T12:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n++ % 60).padStart(2, '0')}Z`
    input.attempts.push({
      id: `sim-${n}`,
      exerciseId,
      date,
      skills: e.skills,
      stage: e.stage,
      mode: 'practice',
      passed: true,
      attemptsBeforePass: 0,
      hintsUsed: 0,
      solutionViewed: false,
      runtimeErrors: [],
      startedAt: t,
      completedAt: t,
      retrievalType: GATE_OF_EXERCISE[exerciseId] ? 'cold' : 'first-exposure',
      updatedAt: t
    } as Attempt)
  }
  for (const { week, days } of SCHEDULE) {
    for (const day of days) {
      for (let step = 0; step < dailyTarget(week) + 15; step++) {
        const c = createContracts(input).dayContract(day.date)
        if (c.reps.met && c.gates.every((g) => g.state === 'cleared') && c.targets.every((t) => t.state === 'done')) break
        const item = courseDailyPlan(day.date, input)[0]
        assert.ok(item, `${day.date}: no next step; ${c.remaining.join('; ')}`)
        if (item.exerciseId) pass(item.exerciseId, day.date)
        else
          input.entries.push({
            id: item.key,
            lc: item.lc,
            title: 'Simulation target',
            date: day.date,
            kind: 'new',
            result: 'unaided',
            at: `${day.date}T13:00:00Z`
          })
      }
      for (const id of day.labsDue) {
        const lab = LABS.find((l) => l.id === id)!
        const status = courseStatus({ ...input, today: day.date }).find((s) => s.unit.id === lab.unitId)!
        assert.equal(status.locked, false, `${day.date}: lab unit locked: ${id}`)
        pass(lab.buildExerciseId, day.date)
        pass(lab.changeRequest.exerciseId, day.date)
        input.labStates[id] = {
          design: Object.fromEntries(lab.designQuestions.map((_, i) => [i, 'Each function owns a clear input and output contract.'])),
          review: Object.fromEntries(lab.review.map((_, i) => [i, true])),
          doneAt: `${day.date}T16:00:00Z`
        }
      }
      const c = createContracts(input).dayContract(day.date)
      assert.equal(c.complete, true, `${day.date}: ${c.remaining.join('; ')}`)
      assert.equal(c.reps.done, dailyTarget(week), `${day.date}: prescribed work stays within the daily target`)
    }
    for (const unit of UNITS.filter((u) => u.week === week))
      for (const id of unit.path!)
        assert.ok(
          input.attempts.some((a) => a.exerciseId === id && a.passed),
          `week ${week}: prescribed path missing ${id}`
        )
    const c = createContracts(input).weekContract(week, days.at(-1)!.date)
    assert.equal(c.complete, true, `week ${week}: ${JSON.stringify(c)}`)
  }
})

test('missed weeks cannot reserve every slot for locked checkpoints and stall prerequisite practice', () => {
  const input: ContractInput = { attempts: [], entries: [], mastery: {}, labStates: {}, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID }
  for (const date of ['2026-11-17', '2026-12-02', '2027-01-25']) {
    const next = courseDailyPlan(date, input)
    assert.ok(next.length > 0, `${date}: a learner with no history can start the prerequisite`)
    assert.equal(next[0].exerciseId, UNITS[0].path![0])
    assert.ok(
      next.every((q) => q.unitId.startsWith('w1-')),
      'do not skip into the calendar week'
    )
  }
})

test('every checkpoint skill has been produced in the same or an earlier curated week', () => {
  const taught = new Set<string>()
  for (let week = 1; week <= 14; week++) {
    const units = UNITS.filter((u) => u.week === week)
    for (const unit of units) for (const id of unit.path!) for (const skill of EXERCISE_BY_ID[id].skills) taught.add(skill)
    for (const unit of units)
      for (const id of unit.gateIds) for (const skill of GATE_BY_ID[id].skills) assert.ok(taught.has(skill), `${id}: ${skill} must be taught by week ${week}`)
  }
})
