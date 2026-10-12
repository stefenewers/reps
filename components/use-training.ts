'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { useTargets } from '@/components/use-targets'
import { DAYS, EXERCISE_BY_ID } from '@/data/curriculum'
import { TARGET_BY_LC, targetOfRep } from '@/data/problem-bridges'
import { REACTIVATION, REACTIVATION_KEY, REACTIVATION_REPS, reactivationStatus, type ReactivationState } from '@/data/reactivation'
import { SKILLS, skillName } from '@/data/skills'
import { isStrong } from '@/lib/bridges'
import { computeAllMastery } from '@/lib/mastery'
import { blockingGate, passedSet } from '@/lib/progress'
import { dueReviews } from '@/lib/schedule'
import { lastSession, planTrainingSession, sessionReview, type SessionPlan, type StretchRep } from '@/lib/session-planner'
import { getSession, skillDepth } from '@/lib/sessions'
import type { DayModule, Session } from '@/lib/types'

const SKILL_IDS = SKILLS.map((s) => s.id)
/** The section an authored rep sits in, by title: for "last session you were working on…". */
const SECTION_TITLE = new Map(DAYS.flatMap((d) => d.sections.flatMap((s) => s.exercises.map((e) => [e.id, s.title.replace(/ · more$/, '')] as const))))

export const trainingKey = (date: string) => `training:${date}`

/**
 * Today's training prescription: the session plan laid over today's stretch of
 * the canonical queue, the session already started from it (if any), where the
 * last session left off, and what today's work has changed so far.
 */
export function useTraining(day: DayModule) {
  const { repo, attempts, mastery, reviews, today, version } = useReps()
  const { byLc, nextOpen } = useTargets()

  return useMemo(() => {
    const passed = passedSet(attempts)
    // Today's stretch of the queue: an uncleared mastery check from an earlier day first, then today's undone reps.
    const carry = blockingGate(day, 0, attempts)
    const fromDay: StretchRep[] = day.sections
      .filter((s) => !s.optional)
      .flatMap((s) => s.exercises.filter((e) => !passed.has(e.id)).map((e) => ({ id: e.id, sectionId: s.id, sectionTitle: s.title, gate: Boolean(s.gate) })))
    const fromGate: StretchRep[] = carry ? carry.exercises.filter((e) => !passed.has(e.id)).map((e) => ({ id: e.id, sectionId: carry.id, sectionTitle: carry.title, gate: true })) : []
    const stretch = [...fromGate, ...fromDay.filter((r) => !fromGate.some((g) => g.id === r.id))]
    const news = (day.leetcode ?? []).filter((x) => x.type === 'new' && byLc.get(x.lc)?.first === null)
    const target = (stretch.map((r) => targetOfRep(r.id)).find(Boolean) ?? (news[0] && TARGET_BY_LC.get(news[0].lc)) ?? nextOpen?.target) || null

    const saved = repo.state<ReactivationState>(REACTIVATION_KEY)
    const reactivation = reactivationStatus(saved, attempts)
    const pending = today >= REACTIVATION.from && today <= REACTIVATION.until && reactivation.state !== 'done'

    const plan: SessionPlan = planTrainingSession({
      stretch,
      problems: news.map((x) => ({ lc: x.lc, title: x.title, ready: Boolean(byLc.get(x.lc)?.ready) })),
      exercises: EXERCISE_BY_ID,
      attempts,
      mastery,
      today,
      planDay: day.planDay,
      target,
      targetSolved: target ? byLc.get(target.lc)?.first !== null : false,
      dueSkills: dueReviews(reviews).flatMap((r) => (r.skillId ? [r.skillId] : [])),
      dueResolves: (day.leetcode ?? []).filter((x) => x.type !== 'new').length,
      strong: (s) => isStrong(mastery[s]),
      depth: skillDepth,
      skillName,
      pending: pending ? { title: 'Python → dictionaries → hashing', reps: REACTIVATION_REPS, why: 'You already learned these. The session above warms them back up, bottom first, before the plan continues.' } : undefined,
    })

    // The session started from today's plan, if there is one: its reps, and how many are done since it began.
    const started = repo.state<{ sessionId: string }>(trainingKey(today))
    const session: Session | undefined = started?.sessionId ? getSession(repo, started.sessionId) : undefined
    const since = session ? attempts.filter((a) => a.passed && a.completedAt && a.completedAt >= session.createdAt) : []
    const doneInSession = new Set(since.map((a) => a.exerciseId))
    const nextInSession = session?.exerciseIds.find((id) => !doneInSession.has(id)) ?? null

    const before = computeAllMastery(SKILL_IDS, attempts.filter((a) => a.date < today))
    return {
      plan,
      pending,
      session,
      doneInSession,
      nextInSession,
      last: lastSession(attempts, today, (id) => SECTION_TITLE.get(id)),
      review: sessionReview(attempts, today, before, mastery),
    }
    // `version` changes whenever the synced state (sessions, reactivation) does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, attempts, mastery, reviews, today, byLc, nextOpen, repo, version])
}
