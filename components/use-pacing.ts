'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { lcMeta, useSolveLog } from '@/components/use-solve-log'
import { DAY_BY_DATE, EXERCISE_BY_ID, PLAN_DAYS, sectionSlice } from '@/data/curriculum'
import { PROBLEMS } from '@/data/problems'
import { PACE, RESOLVE_CAPS } from '@/data/schedule-90'
import { buildCalendar } from '@/lib/pace-calendar'
import { passedSet } from '@/lib/progress'
import type { DayModule } from '@/lib/types'

export const CAPSTONE_NUMBER: Record<string, number> = Object.fromEntries(PROBLEMS.map((p) => [p.exerciseId ?? `cap-${p.id}`, p.number]))

/**
 * The calendar and the pace gauge, rebuilt from progress whenever it changes.
 * `dayFor` gives the day to show for any date: a record of the past, today's
 * stretch, or a forecast; dates before the plan fall back to the sprint days.
 */
export function usePacing() {
  const { attempts, today } = useReps()
  const { entries } = useSolveLog()
  const calendar = useMemo(
    () =>
      buildCalendar({
        planDays: PLAN_DAYS,
        pace: PACE,
        attempts,
        entries,
        today,
        capstoneNumber: CAPSTONE_NUMBER,
        passed: passedSet(attempts),
        cleanPass: (id) => Boolean(EXERCISE_BY_ID[id]?.cleanPass),
        sectionSlice,
        lcMeta,
        resolveCaps: RESOLVE_CAPS,
      }),
    [attempts, entries, today],
  )
  const dayFor = (date: string): DayModule | undefined => calendar.byDate[date] ?? DAY_BY_DATE[date]
  return { ...calendar, dayFor, today }
}
