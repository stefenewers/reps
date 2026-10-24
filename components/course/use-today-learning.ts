'use client'

import { useReps } from '@/components/reps-provider'
import { useCourseDay } from '@/components/use-course-day'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { LESSON_BY_ID, WORKED_EXAMPLE_BY_ID } from '@/data/course/lessons'
import { DAY_PLAN } from '@/data/course/schedule'
import { UNIT_BY_ID } from '@/data/course/units'
import { demosForConcept } from '@/lib/demos'
import { APPLIED_BY_UNIT, APPLIED_SCHEDULE, checksKey } from '@/data/course/applied'
import { daysBetween } from '@/lib/dates'
import type { LearningUnit } from '@/data/course/units'

export type LearnKind = 'lesson' | 'demo' | 'example'

export interface LearnItem {
  key: string
  kind: LearnKind
  title: string
  href: string
  /** A reading/working estimate, for planning the session (not a target). */
  minutes: number
  done: boolean
  /** Applied Engineering or system design teaching (after the unit's own learning). */
  thread?: 'applied' | 'design'
}

const ORDER: LearnKind[] = ['lesson', 'demo', 'example']
/** The unit's own lessons, demos and examples first; its applied / design lessons after them. */
const rank = (x: { kind: LearnKind; thread?: string }) => (x.thread ? ORDER.length : ORDER.indexOf(x.kind))

/** One applied lesson to recall today, if any is due (two or more weeks since learned, three since last recalled). */
function appliedRecall(today: string, state: (key: string) => unknown): { lessonId: string; title: string; href: string } | undefined {
  for (const { lessonId } of APPLIED_SCHEDULE) {
    const learned = state(`lesson:${lessonId}`) as { completedOn?: string } | null
    if (!learned?.completedOn || daysBetween(learned.completedOn, today) < 14) continue
    const checks = state(checksKey(lessonId)) as { answeredOn?: string } | null
    if (checks?.answeredOn && daysBetween(checks.answeredOn, today) < 21) continue
    const l = LESSON_BY_ID[lessonId]
    if (l?.checks?.length) return { lessonId, title: l.title, href: `/learn/${lessonId}#checks` }
  }
  return undefined
}
const words = (s: string) => s.split(/\s+/).filter(Boolean).length

function lessonMinutes(id: string): number {
  const l = LESSON_BY_ID[id]
  if (!l) return 5
  if (l.minutes) return l.minutes
  const text = [l.concept, l.mentalModel, l.whyItMatters, ...l.sections.map((s) => `${s.body} ${s.code ?? ''}`), ...l.mistakes].join(' ')
  return Math.max(3, Math.round(words(text) / 160))
}

/** What a learning step is called when it is the next thing to do. */
export const LEARN_ACTION: Record<LearnKind, string> = { lesson: 'Start lesson', demo: 'Watch it move', example: 'Rebuild the example' }
export const LEARN_LABEL: Record<LearnKind, string> = { lesson: 'Lesson', demo: 'Watch it move', example: 'Worked example' }

/**
 * Today's teaching, in order: lessons, then the moving pictures, then the worked
 * example you rebuild. The one source for Today's Learn step and for the
 * "next" hand-off at the end of every learning page. Learning is never counted;
 * it is what makes the reps count.
 */
export function useTodayLearning() {
  const { repo, today } = useReps()
  const cd = useCourseDay()
  const focus = (DAY_PLAN[today]?.focusUnits ?? []).map((id) => UNIT_BY_ID[id]).filter(Boolean)
  const units: LearningUnit[] = focus.length ? focus : cd.course.current ? [cd.course.current.unit] : []
  // When the course is behind the calendar, teach the unit the learner is actually on.
  const learningUnits = cd.course.current && cd.course.current.unit.week < cd.week.number ? [cd.course.current.unit] : units
  const unlabeled = cd.week.unlabeled
  const items: LearnItem[] = unlabeled
    ? []
    : learningUnits
        .flatMap((u) => [
          ...u.lessonIds.map((id) => ({
            key: `lesson:${id}`,
            kind: 'lesson' as const,
            title: (LESSON_BY_ID[id] ?? CONCEPT_BY_ID[id])?.title ?? id,
            href: `/learn/${id}`,
            minutes: lessonMinutes(id)
          })),
          ...u.lessonIds
            .flatMap((id) => demosForConcept(id))
            .map((d) => ({ key: `demo:${d.id}`, kind: 'demo' as const, title: d.title, href: `/demo/${d.id}`, minutes: 3 })),
          ...u.workedExampleIds.map((id) => ({
            key: `example:${id}`,
            kind: 'example' as const,
            title: WORKED_EXAMPLE_BY_ID[id]?.title ?? id,
            href: `/example/${id}`,
            minutes: 3 + (WORKED_EXAMPLE_BY_ID[id]?.subgoals.length ?? 3)
          })),
          // The applied / design thread: short engineering lessons taught alongside this unit, after its own learning.
          ...(APPLIED_BY_UNIT[u.id] ?? [])
            .filter((id) => LESSON_BY_ID[id])
            .map((id) => ({
              key: `lesson:${id}`,
              kind: 'lesson' as const,
              title: LESSON_BY_ID[id].title,
              href: `/learn/${id}`,
              minutes: lessonMinutes(id),
              thread: LESSON_BY_ID[id].thread
            }))
        ])
        .filter((x, i, xs) => xs.findIndex((y) => y.key === x.key) === i)
        .sort((a, b) => rank(a) - rank(b))
        .map((x) => ({ ...x, done: Boolean(repo.state(x.key)) }))
  const next = items.find((l) => !l.done)
  const catchingUp = learningUnits.some((u) => !units.some((x) => x.id === u.id))
  // Spaced recall (optional, never counted): one applied lesson learned two or more weeks ago whose checks
  // have not been revisited for three weeks comes back as a two-minute question.
  const recall = unlabeled ? undefined : appliedRecall(today, (id) => repo.state(id))
  return { units, learningUnits, catchingUp, items, next, unlabeled, recall, done: items.filter((l) => l.done).length }
}

