import { APPLIED_SCHEDULE, LAB_PREREQUISITES } from '@/data/course/applied'
import { CONCEPTS } from '@/data/concepts'
import { LABS, LESSONS, WORKED_EXAMPLES } from '@/data/course/lessons'
import { UNIT_BY_ID, UNITS } from '@/data/course/units'
import { DEMOS } from '@/lib/demos'

/**
 * The Learn library, derived from course data so its headings cannot go stale:
 * every lesson, concept guide, demo, worked example and build, with the week it is taught.
 * Browse everything here; Today assigns what to train.
 */

export const THREAD_LABEL = { core: 'Core SWE', applied: 'Applied Engineering', design: 'System Design' } as const
export type Track = keyof typeof THREAD_LABEL

/** The first week a lesson or concept guide is taught (spine units or the applied schedule). */
export function taughtWeek(id: string): number | undefined {
  const weeks = [
    ...UNITS.filter((u) => u.lessonIds.includes(id)).map((u) => u.week),
    ...APPLIED_SCHEDULE.filter((x) => x.lessonId === id).map((x) => UNIT_BY_ID[x.unitId]?.week)
  ].filter((w): w is number => typeof w === 'number')
  return weeks.length ? Math.min(...weeks) : undefined
}

/** Labs that build on a lesson or concept guide. */
export const labsUsing = (id: string) => LABS.filter((l) => LAB_PREREQUISITES[l.id]?.includes(id))

const byWeek = <T extends { week?: number }>(xs: T[]) => [...xs].sort((a, b) => (a.week ?? 99) - (b.week ?? 99))
const span = (weeks: (number | undefined)[]) => {
  const ws = weeks.filter((w): w is number => typeof w === 'number')
  if (!ws.length) return ''
  const lo = Math.min(...ws)
  const hi = Math.max(...ws)
  return lo === hi ? `Week ${lo}` : `Weeks ${lo}–${hi}`
}

export function library() {
  const lessons = LESSONS.map((l) => ({ lesson: l, week: taughtWeek(l.id), labs: labsUsing(l.id) }))
  const foundations = byWeek(lessons.filter((x) => !x.lesson.thread))
  const applied = byWeek(lessons.filter((x) => x.lesson.thread === 'applied'))
  const design = byWeek(lessons.filter((x) => x.lesson.thread === 'design'))
  const concepts = byWeek(CONCEPTS.map((c) => ({ concept: c, week: taughtWeek(c.id), labs: labsUsing(c.id) })))
  const examples = byWeek(WORKED_EXAMPLES.map((w) => ({ example: w, week: UNIT_BY_ID[w.unitId]?.week })))
  const demos = byWeek(DEMOS.map((d) => ({ demo: d, week: taughtWeek(d.concept) })))
  const labs = byWeek(LABS.map((l) => ({ lab: l, week: l.week, track: (l.aiFde ? 'applied' : 'core') as Track })))
  return {
    foundations,
    concepts,
    examples,
    demos,
    applied,
    design,
    labs,
    spans: {
      foundations: span(foundations.map((x) => x.week)),
      core: span([...foundations, ...concepts].map((x) => x.week)),
      concepts: span(concepts.map((x) => x.week)),
      applied: span(applied.map((x) => x.week)),
      design: span(design.map((x) => x.week)),
      labs: span(labs.map((x) => x.week))
    }
  }
}
