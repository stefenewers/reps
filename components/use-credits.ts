'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { useSolveLog } from '@/components/use-solve-log'
import { COURSE_START } from '@/data/course/calendar'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { dailyCredits, type CreditItem } from '@/lib/course/credit'
import { addDays } from '@/lib/dates'

/** Qualifying credits per date, from the course start to today (lib/course/credit.ts decides what counts). */
export function useCredits(): { byDate: Record<string, number>; items: Record<string, CreditItem[]> } {
  const { attempts, today } = useReps()
  const { entries } = useSolveLog()
  return useMemo(() => {
    const items: Record<string, CreditItem[]> = {}
    for (let d = COURSE_START; d <= today; d = addDays(d, 1)) items[d] = dailyCredits(d, attempts, entries, EXERCISE_BY_ID)
    return { items, byDate: Object.fromEntries(Object.entries(items).map(([d, xs]) => [d, xs.length])) }
  }, [attempts, entries, today])
}
