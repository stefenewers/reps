'use client'

import { useReps } from '@/components/reps-provider'
import { useCourseDay } from '@/components/use-course-day'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { LESSON_BY_ID, WORKED_EXAMPLE_BY_ID } from '@/data/course/lessons'
import { DAY_PLAN } from '@/data/course/schedule'
import { UNIT_BY_ID } from '@/data/course/units'
import { demosForConcept } from '@/lib/demos'
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
}

const ORDER: LearnKind[] = ['lesson', 'demo', 'example']
const words = (s: string) => s.split(/\s+/).filter(Boolean).length

function lessonMinutes(id: string): number {
  const l = LESSON_BY_ID[id]
  if (!l) return 5
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
          }))
        ])
        .filter((x, i, xs) => xs.findIndex((y) => y.key === x.key) === i)
        .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
        .map((x) => ({ ...x, done: Boolean(repo.state(x.key)) }))
  const next = items.find((l) => !l.done)
  const catchingUp = learningUnits.some((u) => !units.some((x) => x.id === u.id))
  return { units, learningUnits, catchingUp, items, next, unlabeled, done: items.filter((l) => l.done).length }
}

