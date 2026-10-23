'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { useCapacity } from '@/components/use-capacity'
import { useCredits } from '@/components/use-credits'
import { useCourse } from '@/components/use-course'
import { PROBLEM_URLS } from '@/data/problem-urls'
import type { QueuePurpose } from '@/lib/course/routing'
import { COURSE_START } from '@/data/course/calendar'
import type { usePacing } from '@/components/use-pacing'
import { lcMeta, useSolveLog } from '@/components/use-solve-log'
import { useTargets } from '@/components/use-targets'
import type { useTraining } from '@/components/use-training'
import { ALL_EXERCISES, DAY_OF_EXERCISE, EXERCISE_BY_ID } from '@/data/curriculum'
import { passedSet } from '@/lib/progress'
import { buildReviewSession, dueReviews } from '@/lib/schedule'
import { prescribe, repUnits, type Candidate, type ItemKind } from '@/lib/today-plan'
import { practiceBySkill, repPurpose } from '@/lib/training-state'
import type { LeetcodeItem } from '@/lib/types'

type Pace = ReturnType<typeof usePacing>

/** How a course queue item shows in today's list. */
const COURSE_KIND: Record<QueuePurpose, ItemKind> = { learn: 'learn', guided: 'learn', drill: 'drill', combine: 'combine', transfer: 'transfer', retrieve: 'cold', gate: 'gate', repair: 'repair', capstone: 'prove', problem: 'problem', extra: 'drill' }
type Training = ReturnType<typeof useTraining>
type DueLc = LeetcodeItem & { solveId: string }

/**
 * Today's prescription from the live state: the capacity, the warm-ups and redos
 * the training planner asks for, the plan's next work in queue order, and the
 * re-solves and cold reps that are due. See lib/today-plan.ts for the rules.
 */
export function useTodayPlan(pace: Pace, training: Training, dueLc: DueLc[]) {
  const { attempts, mastery, reviews, today } = useReps()
  const { entries } = useSolveLog()
  const { byLc } = useTargets()
  const capacity = useCapacity()
  const credits = useCredits()
  const course = useCourse()

  return useMemo(() => {
    const passed = passedSet(attempts)
    const practice = practiceBySkill(attempts)
    const ctx = { mastery, practice }
    const solvedLc = new Set(entries.filter((e) => e.kind === 'new' && e.lc).map((e) => e.lc!))
    const repKind = (id: string, sectionId?: string, gate?: boolean): ItemKind => {
      const e = EXERCISE_BY_ID[id]
      if (!e) return 'drill'
      if (e.transfer) return 'transfer'
      return repPurpose(e, { sectionId, gate }, ctx) as ItemKind
    }
    const rep = (id: string, kind: ItemKind): Candidate => ({ key: id, kind, title: EXERCISE_BY_ID[id]?.title ?? id, units: repUnits(EXERCISE_BY_ID[id]), exerciseId: id })

    // Warm-up and "again, cold": the training planner's repeats, in its order.
    const prep: Candidate[] = training.pending
      ? []
      : training.plan.blocks.filter((b) => b.extra && b.kind !== 'maintain').flatMap((b) => b.reps.map((id) => rep(id, b.kind === 'reactivate' ? 'warm' : 'redo')))
    // From Oct 26 the plan is the course queue (units, placement, gates, repairs, targets); before it, the 90-day queue.
    const coursePlan: Candidate[] | null =
      today >= COURSE_START
        ? course.queue.slice(0, 80).map((q) =>
            q.lc
              ? { key: q.key, kind: 'problem' as const, title: `LC ${q.lc} · ${lcMeta(q.lc)?.title ?? PROBLEM_URLS[q.lc]?.title ?? ''}`, units: 3, lc: q.lc, ready: Boolean(byLc.get(q.lc)?.ready ?? true) }
              : { ...rep(q.exerciseId!, COURSE_KIND[q.purpose]), required: q.purpose === 'gate' || q.purpose === 'repair' },
          )
        : null
    // The plan: the canonical queue from where you are, reps and new problems in order.
    const plan: Candidate[] = coursePlan ?? pace.queue
      .filter((q) => (q.kind === 'rep' ? !passed.has(q.key) : !solvedLc.has(q.lc!.lc)))
      .slice(0, 80)
      .map((q) =>
        q.kind === 'rep'
          ? rep(q.key, repKind(q.key, q.sectionId, q.gate))
          : { key: `lc:${q.lc!.lc}:new`, kind: 'problem' as const, title: `LC ${q.lc!.lc} · ${q.lc!.title}`, units: 3, lc: q.lc!.lc, ready: Boolean(byLc.get(q.lc!.lc)?.ready) },
      )
    // Maintenance: re-solves and redos due today, then cold reps on the skills that are due.
    const resolves: Candidate[] = dueLc.map((x) => ({ key: x.solveId, kind: 'resolve' as const, title: `LC ${x.lc} · ${x.title}`, units: 2, lc: x.lc }))
    const cold: Candidate[] = buildReviewSession(dueReviews(reviews), ALL_EXERCISES, DAY_OF_EXERCISE, attempts, today, new Date(), 4).map((id) => rep(id, 'cold'))

    // Done today: every rep passed today (once each), every LeetCode solve logged today.
    const seen = new Set<string>()
    // A rep passed on an earlier day and done again today is a warm-up (or a redo), not new plan work.
    const before = new Set(attempts.filter((a) => a.passed && a.date < today).map((a) => a.exerciseId))
    const doneToday = [
      ...attempts
        .filter((a) => a.passed && a.completedAt && a.date === today)
        .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))
        .filter((a) => !seen.has(a.exerciseId) && seen.add(a.exerciseId))
        .map((a) => ({ key: a.exerciseId, units: repUnits(EXERCISE_BY_ID[a.exerciseId]), title: EXERCISE_BY_ID[a.exerciseId]?.title, kind: a.sessionKind === 'review' ? ('cold' as const) : before.has(a.exerciseId) ? ('warm' as const) : repKind(a.exerciseId) })),
      ...entries.filter((e) => e.date === today && e.lc).map((e) => ({ key: e.id, units: e.kind === 'new' ? 3 : 2, title: `LC ${e.lc} · ${e.title}`, kind: e.kind === 'new' ? ('problem' as const) : ('resolve' as const) })),
    ]
    // In the course, what counts is decided by lib/course/credit.ts: a revealed solution, a repeat, a lab or a failure earns nothing.
    const counted = today >= COURSE_START ? new Set((credits.items[today] ?? []).map((c) => c.key)) : null
    const t = prescribe({ capacity: capacity.requiredReps, phase: capacity.phase, doneToday: counted ? doneToday.filter((d) => counted.has(d.key)) : doneToday, prep, plan, resolves, cold })
    return { ...t, capacityInfo: capacity }
  }, [attempts, entries, mastery, reviews, today, pace.queue, training, dueLc, byLc, capacity, credits, course])
}
