'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { CAPSTONE_NUMBER } from '@/components/use-pacing'
import { lcMeta, useSolveLog } from '@/components/use-solve-log'
import { EXERCISE_BY_ID, PLAN_DAYS } from '@/data/curriculum'
import { TARGETS } from '@/data/problem-bridges'
import { PROBLEMS } from '@/data/problems'
import { PACE, PLAN_WHEN_AHEAD } from '@/data/schedule-90'
import { WALKTHROUGHS } from '@/data/walkthroughs'
import { conversion, isStrong, readiness, type FirstSolve, type Readiness, type Target } from '@/lib/bridges'
import { firstSolves, resolvesFor, type Resolve } from '@/lib/pacing'
import { passedSet } from '@/lib/progress'

const PROBLEM_BY_NUMBER = new Map(PROBLEMS.map((p) => [p.number, p]))
const WALK_BY_PROBLEM = new Map(WALKTHROUGHS.map((w) => [w.problemId, w]))
const AHEAD = new Map(PLAN_WHEN_AHEAD.map((x) => [x.lc, x]))

/** Where the problem lives and its walkthrough, whichever side of the plan it is on. */
export function targetLinks(t: Pick<Target, 'lc'>): { url: string; video: string | null } {
  const meta = lcMeta(t.lc) ?? AHEAD.get(t.lc)
  const problem = PROBLEM_BY_NUMBER.get(t.lc)
  return { url: meta?.url ?? problem?.leetcode ?? `https://leetcode.com/problemset/?search=${t.lc}`, video: meta?.video ?? (problem ? (WALK_BY_PROBLEM.get(problem.id)?.url ?? null) : null) }
}

export interface TargetState extends Readiness {
  target: Target
  /** How the first solve went, once there is one. */
  first: FirstSolve
  firstDate: string | null
  /** The three spaced re-solves, once the problem has been solved. */
  resolves: Resolve[]
  nextReview: string | null
  url: string
  video: string | null
}

/** Every target's readiness, first-solve result and re-solve status, from progress. */
export function useTargets() {
  const { attempts, mastery } = useReps()
  const { entries } = useSolveLog()
  return useMemo(() => {
    const passed = passedSet(attempts)
    const strong = (s: string) => isStrong(mastery[s])
    const anchors = firstSolves(entries, attempts, CAPSTONE_NUMBER, (id) => Boolean(EXERCISE_BY_ID[id]?.cleanPass))
    const resolves = resolvesFor(anchors, entries, PLAN_DAYS, PACE.resolveGaps)
    const firstSolve = (t: Target): FirstSolve => {
      if (t.source === 'leetcode') {
        const e = entries.find((x) => x.id === `lc:${t.lc}:new`)
        return e ? (e.result === 'unaided' ? 'unaided' : 'aided') : null
      }
      // A capstone: the first completed pass is the first solve; it is unaided when no hint or solution was used.
      const first = attempts.filter((a) => a.exerciseId === t.exerciseId && a.passed && a.completedAt).sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))[0]
      return first ? (first.hintsUsed === 0 && !first.solutionViewed ? 'unaided' : 'aided') : null
    }
    const states: TargetState[] = TARGETS.map((target) => {
      const mine = resolves.filter((r) => r.lc === target.lc)
      return {
        ...readiness(target, passed, strong),
        target,
        first: firstSolve(target),
        firstDate: anchors.get(target.lc) ?? null,
        resolves: mine,
        nextReview: mine.find((r) => !r.doneOn)?.due ?? null,
        ...targetLinks(target),
      }
    })
    const byLc = new Map(states.map((s) => [s.target.lc, s]))
    // Conversion is measured on the plan's targets and any when-ahead ones actually attempted.
    return { states, byLc, passed, conversion: conversion(TARGETS, firstSolve), nextOpen: states.find((s) => s.first === null && !s.target.whenAhead) ?? null }
  }, [attempts, entries, mastery])
}
