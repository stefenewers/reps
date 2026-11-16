import { LABS } from '@/data/course/lessons'
import { inSprint, SPRINT_START, SPRINT_UNITS } from '@/data/course/sprint'
import type { ContractInput } from '@/lib/course/contract'
import { labProgress } from '@/lib/course/labs'
import { courseStatus, unitsOn } from '@/lib/course/routing'
import { nextTrainingDay, sprintPlan, type SprintDay, type SprintPlan } from '@/lib/course/sprint-plan'
import type { ReviewItem } from '@/lib/types'

/** ContractInput plus the review queue (optional: without it the review block is empty, the targets are the same). */
export type OverlayInput = ContractInput & { review?: ReviewItem[] }

const cache = new WeakMap<object, Map<string, SprintPlan>>()

/** The sprint plan as of the START of `date`: statuses and labs from attempts before it, so a day's target never moves during the day. */
export function sprintPlanAsOf(date: string, input: OverlayInput): SprintPlan {
  let byDate = cache.get(input)
  if (!byDate) cache.set(input, (byDate = new Map()))
  const hit = byDate.get(date)
  if (hit) return hit
  const before = input.attempts.filter((a) => a.date < date)
  const statuses = courseStatus({ attempts: before, mastery: input.mastery, exercises: input.exercises, sections: input.sections, today: date })
  const labsDone = new Set(LABS.filter((l) => { const p = labProgress(l, input.labStates[l.id], before); return p.done && (p.doneOn ?? '') < date }).map((l) => l.id))
  const plan = sprintPlan({ statuses, review: input.review ?? [], attempts: before, entries: input.entries.filter((e) => e.date < date), exercises: input.exercises, mastery: input.mastery, labsDone }, date)
  byDate.set(date, plan)
  return plan
}

/** The sprint day for a date in [SPRINT_START, SPRINT_END] (or a spill day), as planned at its start. */
export function sprintDayOn(date: string, input: OverlayInput): SprintDay | undefined {
  if (date < SPRINT_START) return undefined
  return sprintPlanAsOf(date, input).days.find((d) => d.date === date)
}

/**
 * When each sprint unit's checkpoints and labs are due: the training day after its path is first fully passed.
 * First-pass dates never move, so a due date never moves once it exists. Nothing is due before SPRINT_START.
 */
export function sprintDueDates(input: Pick<ContractInput, 'attempts'>): { gates: Map<string, string>; labs: Map<string, string> } {
  const first = new Map<string, string>()
  for (const a of input.attempts) if (a.passed && a.completedAt && !a.solutionViewed && (!first.has(a.exerciseId) || a.date < first.get(a.exerciseId)!)) first.set(a.exerciseId, a.date)
  const gates = new Map<string, string>()
  const labs = new Map<string, string>()
  for (const unit of unitsOn(SPRINT_START)) {
    if (!(SPRINT_UNITS as readonly string[]).includes(unit.id) || !unit.path?.length) continue
    const dates = unit.path.map((id) => first.get(id))
    if (dates.some((d) => !d)) continue
    const done = (dates as string[]).sort().at(-1)!
    const due = nextTrainingDay(done < SPRINT_START ? SPRINT_START : done)
    for (const g of unit.gateIds) gates.set(g, due)
    for (const l of unit.labIds) if (!LABS.find((x) => x.id === l)?.optional) labs.set(l, due)
  }
  return { gates, labs }
}

export { inSprint }
