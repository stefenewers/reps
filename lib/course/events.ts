import { PLAN_DAYS } from '@/data/curriculum'
import { CAPSTONE_LC } from '@/data/course/capstones'
import { MILESTONES, motivate, type Motivation } from '@/data/course/motivation'
import { UNITS } from '@/data/course/units'
import { createContracts, type ContractInput } from '@/lib/course/contract'
import { bestEvidence } from '@/lib/course/credit'
import { courseStatus } from '@/lib/course/routing'
import type { FinalDecision, Readiness } from '@/lib/course/readiness'

const MEDIUM = new Set(PLAN_DAYS.flatMap((d) => (d.leetcode ?? []).filter((p) => p.difficulty.toLowerCase() === 'medium').map((p) => p.lc)))

export interface EarnedEvent {
  id: string
  date: string
  message: Motivation
}
/** Earned moments, with stable identities so UI visits never farm celebrations. */
export function earnedEvents(input: ContractInput, date: string, total: number, mocksDone: number, decision: FinalDecision, ready: Readiness): EarnedEvent[] {
  const contracts = createContracts(input),
    day = contracts.dayContract(date),
    statuses = courseStatus({ ...input, today: date })
  const events: EarnedEvent[] = []
  const add = (id: string, message: Motivation) => events.push({ id, date, message })
  if (decision === 'ready') add('ready', motivate('ready'))
  for (const n of [...MILESTONES].reverse()) if (total >= n) add(`output:${n}`, motivate('milestone', { milestone: n }))
  if (mocksDone > 0) add('first-mock', motivate('mock-complete'))
  for (const s of statuses)
    for (const g of s.gates) {
      if (g.cleared && g.clearedOn === date) {
        const next = UNITS.find((u) => u.prerequisites.includes(s.unit.id))
        add(`gate:${g.gate.id}`, motivate('gate-cleared', { gateTitle: g.gate.title, nextUnit: next?.title, seed: g.gate.id }))
        add('first-clean-gate', { event: 'gate-cleared', tone: 'celebrate', text: 'First clean checkpoint. You proved a prerequisite with your own work.' })
      }
      if (
        g.failed &&
        g.repairPlan.length > 0 &&
        !g.repair.length &&
        input.attempts.some((a) => a.date === date && a.passed && g.repairPlan.includes(a.exerciseId))
      )
        add(`repair:${g.gate.id}:${g.failedAt}`, motivate('repair-success'))
    }
  for (let w = 1; w <= day.week; w++) {
    const c = contracts.weekContract(w, date)
    if (c.complete) add(`week:${w}`, motivate('week-complete', { week: w, weekDone: c.output.done, weekTarget: c.output.target }))
  }
  if (day.type === 'training' && day.complete) {
    add(`day:${date}`, motivate('day-complete', { repsDone: day.reps.done, repsTarget: day.reps.target, seed: date }))
    add('first-day', motivate('milestone', { milestone: 1 }))
  }
  if (
    input.attempts.some(
      (a) => a.passed && ['independent', 'cold-independent'].includes(bestEvidence(a.exerciseId, input.attempts) ?? '') && MEDIUM.has(CAPSTONE_LC[a.exerciseId])
    )
  )
    add('first-independent-medium', {
      event: 'transfer-breakthrough',
      tone: 'celebrate',
      text: 'First Medium solved independently. You produced the full solution without hints or a revealed answer.'
    })
  const cold = input.attempts.filter(
    (a) => a.date === date && a.passed && input.exercises[a.exerciseId]?.transfer && bestEvidence(a.exerciseId, input.attempts) === 'cold-independent'
  )
  if (cold.length)
    add('first-independent-transfer', {
      event: 'transfer-breakthrough',
      tone: 'celebrate',
      text: 'Cold transfer solved independently. You chose the approach and produced the solution.'
    })
  for (const domain of ready.dimensions)
    if (domain.status === 'ready')
      add(`readiness:${domain.id}`, {
        event: 'trajectory',
        tone: 'warm',
        text: `${domain.title}: the evidence now meets its readiness standard. ${domain.why}`
      })
  const improved = statuses.find(
    (s) =>
      s.gates.some((g) => g.clearedOn === date) &&
      input.attempts.some(
        (a) =>
          a.date < date &&
          a.date <= new Date(Date.parse(date + 'T12:00:00Z') - 14 * 86400000).toISOString().slice(0, 10) &&
          s.path.some((e) => e.id === a.exerciseId) &&
          (a.hintsUsed > 0 || a.solutionViewed)
      )
  )
  if (improved)
    add(`improved:${improved.unit.id}`, {
      event: 'trajectory',
      tone: 'warm',
      text: `${improved.unit.title} needed help earlier. Today you cleared its checkpoint cold. That is progress you can point to.`
    })
  return events
}
