import { APPLIED_SCHEDULE, CAPABILITIES, LAB_PREREQUISITES } from '@/data/course/applied'
import { COURSE_START, COURSE_END, dailyTarget, dayType } from '@/data/course/calendar'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { LABS, LESSON_BY_ID } from '@/data/course/lessons'
import { DAY_PLAN, LAB_DUE } from '@/data/course/schedule'
import { UNIT_BY_ID, UNITS } from '@/data/course/units'
import { addDays } from '@/lib/dates'

/**
 * The Applied Engineering / system design audit (npm run audit:applied; docs/applied-engineering.md):
 * every idea is taught before a lab relies on it, and the thread adds no hidden daily work.
 */

/** The first and last day a unit is in focus on Today (its lessons surface on those days). */
export function unitFocusWindows(): Record<string, { first: string; last: string }> {
  const out: Record<string, { first: string; last: string }> = {}
  for (const [date, plan] of Object.entries(DAY_PLAN).sort(([a], [b]) => a.localeCompare(b)))
    for (const u of plan.focusUnits ?? []) {
      out[u] ??= { first: date, last: date }
      out[u].last = date
    }
  return out
}

/** The first day a lesson (spine or applied) is surfaced on Today, if it is. */
export function firstTaught(lessonId: string, windows = unitFocusWindows()): string | undefined {
  const units = [
    ...UNITS.filter((u) => u.lessonIds.includes(lessonId)).map((u) => u.id),
    ...APPLIED_SCHEDULE.filter((x) => x.lessonId === lessonId).map((x) => x.unitId)
  ]
  return units
    .map((u) => windows[u]?.first)
    .filter((d): d is string => Boolean(d))
    .sort()[0]
}

/** When a lab is due (or, for an optional lab, the last focus day of its unit). */
export function labDeadline(labId: string, windows = unitFocusWindows()): string | undefined {
  const lab = LABS.find((l) => l.id === labId)
  return LAB_DUE[labId] ?? (lab ? windows[lab.unitId]?.last : undefined)
}

/** The Weeks 12 and 13 culminations must rest on all of these. */
export const CULMINATION_PREREQUISITES: Record<string, string[]> = {
  'lab-support-router': ['ae-model-boundary', 'ae-tools-workflows', 'ae-evals', 'ae-reliability', 'ae-observability', 'sd-auth-permissions'],
  'lab-fde-workflow': ['ae-discovery', 'ae-model-boundary', 'ae-evals', 'ae-requirements-change']
}

export function auditApplied(): string[] {
  const problems: string[] = []
  const windows = unitFocusWindows()

  // 1. Every scheduled concept has a real teaching object, sized as a short lesson with checks.
  for (const { lessonId, unitId } of APPLIED_SCHEDULE) {
    const l = LESSON_BY_ID[lessonId]
    if (!l) {
      problems.push(`${lessonId}: scheduled but has no lesson`)
      continue
    }
    if (!l.thread) problems.push(`${lessonId}: missing thread (applied or design)`)
    if (!UNIT_BY_ID[unitId]) problems.push(`${lessonId}: unknown unit ${unitId}`)
    else if (!windows[unitId]) problems.push(`${lessonId}: unit ${unitId} is never in focus on Today`)
    if ((l.checks?.length ?? 0) < 2) problems.push(`${lessonId}: needs at least two checks`)
    if (l.sections.length < 3) problems.push(`${lessonId}: needs at least three sections`)
    if (!l.sections.some((s) => s.code && s.output !== undefined)) problems.push(`${lessonId}: needs a runnable example with its output`)
    if (l.mistakes.length < 3) problems.push(`${lessonId}: needs at least three common mistakes`)
    if (!l.minutes || l.minutes > 12) problems.push(`${lessonId}: should be a short lesson (minutes 1–12)`)
    // Week 13 is unlabeled transfer and Week 14 interview execution: no teaching is scheduled there.
    if (UNIT_BY_ID[unitId] && UNIT_BY_ID[unitId].week >= 13) problems.push(`${lessonId}: scheduled in Week ${UNIT_BY_ID[unitId].week}, where no teaching belongs`)
  }
  const scheduled = new Set(APPLIED_SCHEDULE.map((x) => x.lessonId))
  for (const id of Object.keys(LESSON_BY_ID)) if (LESSON_BY_ID[id].thread && !scheduled.has(id)) problems.push(`${id}: applied/design lesson is not scheduled`)

  // 2. Teach before testing: every lab names what its design questions assume, and each is taught by the deadline.
  for (const lab of LABS) {
    const prereqs = LAB_PREREQUISITES[lab.id]
    if (!prereqs?.length) {
      problems.push(`${lab.id}: no prerequisite lessons mapped for its design questions`)
      continue
    }
    const due = labDeadline(lab.id, windows)
    for (const id of prereqs) {
      if (!LESSON_BY_ID[id] && !CONCEPT_BY_ID[id]) {
        problems.push(`${lab.id}: prerequisite ${id} has no lesson or concept guide`)
        continue
      }
      const first = firstTaught(id, windows)
      if (!first) problems.push(`${lab.id}: ${id} is never taught on Today (only inside the lab)`)
      else if (due && first > due) problems.push(`${lab.id}: ${id} is first taught ${first}, after the lab is due ${due}`)
    }
  }
  for (const [labId, needed] of Object.entries(CULMINATION_PREREQUISITES))
    for (const id of needed) if (!LAB_PREREQUISITES[labId]?.includes(id)) problems.push(`${labId}: culmination must build on ${id}`)
  for (const id of Object.keys(LAB_PREREQUISITES)) if (!LABS.some((l) => l.id === id)) problems.push(`LAB_PREREQUISITES: unknown lab ${id}`)

  // 3. Evidence views only point at real objects.
  for (const c of CAPABILITIES) {
    for (const id of c.lessonIds) if (!LESSON_BY_ID[id]) problems.push(`capability ${c.id}: unknown lesson ${id}`)
    for (const id of c.labIds) if (!LABS.some((l) => l.id === id)) problems.push(`capability ${c.id}: unknown lab ${id}`)
  }

  // 4. No hidden daily work: applied teaching is never a rep, never on a unit's path, never a required lab.
  for (const u of UNITS) {
    const ids = new Set([...(u.path ?? []), ...u.lessonIds])
    for (const { lessonId } of APPLIED_SCHEDULE) if (ids.has(lessonId)) problems.push(`${u.id}: applied lesson ${lessonId} leaked into the unit's path or spine lessons`)
  }
  for (const lab of LABS) if (lab.id === 'lab-grounded-answer' && !lab.optional) problems.push('lab-grounded-answer must stay optional (no new required work)')
  const expected = (w: number) => (w === 1 ? 10 : w === 2 ? 12 : 15)
  for (let w = 1; w <= 14; w++) if (dailyTarget(w) !== expected(w)) problems.push(`Week ${w}: daily target changed to ${dailyTarget(w)}`)
  for (let d = COURSE_START; d <= COURSE_END; d = addDays(d, 1))
    if (dayType(d) === 'rest' && (DAY_PLAN[d]?.labsDue?.length || DAY_PLAN[d]?.gatesDue?.length)) problems.push(`${d}: planned rest has work due`)

  return problems
}

/** One row per applied lesson, for the audit report. */
export function appliedReport(): { lessonId: string; thread: string; week: number; unitId: string; firstDay: string; labs: string }[] {
  const windows = unitFocusWindows()
  return APPLIED_SCHEDULE.map(({ lessonId, unitId }) => ({
    lessonId,
    thread: LESSON_BY_ID[lessonId]?.thread ?? '?',
    week: UNIT_BY_ID[unitId]?.week ?? 0,
    unitId,
    firstDay: firstTaught(lessonId, windows) ?? '-',
    labs: Object.entries(LAB_PREREQUISITES)
      .filter(([, ids]) => ids.includes(lessonId))
      .map(([lab]) => `${lab}@${labDeadline(lab, windows) ?? '?'}`)
      .join(' ')
  }))
}
