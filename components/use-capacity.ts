'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { useSolveLog } from '@/components/use-solve-log'
import { PLAN_DAYS, PLAN_START } from '@/data/curriculum'
import { capacityFor, isSunday, type DailyCapacity, type DayRecord } from '@/lib/training-capacity'

/** The record of each day's training, for the weekly capacity review. */
export function useDayRecords(): Map<string, DayRecord> {
  const { attempts } = useReps()
  const { entries } = useSolveLog()
  return useMemo(() => {
    const out = new Map<string, DayRecord>()
    const get = (d: string) => out.get(d) ?? (out.set(d, { reps: 0, minutes: 0, assisted: 0, passed: 0, coldPassed: 0, coldTotal: 0 }), out.get(d)!)
    const counted = new Set<string>()
    for (const a of attempts) {
      if (!a.completedAt && !a.attemptsBeforePass) continue
      const r = get(a.date)
      r.minutes += (a.durationSeconds ?? 0) / 60
      if (a.retrievalType === 'cold') {
        r.coldTotal++
        if (a.passed) r.coldPassed++
      }
      if (!a.passed || !a.completedAt) continue
      r.passed++
      if (a.solutionViewed || a.hintsUsed >= 2) r.assisted++
      // A rep counts once a day, however many times it is passed.
      const key = `${a.date}:${a.exerciseId}`
      if (counted.has(key)) continue
      counted.add(key)
      r.reps++
    }
    for (const e of entries) {
      if (!e.lc) continue
      const r = get(e.date)
      r.reps++
      r.minutes += e.minutes ?? 15
    }
    return out
  }, [attempts, entries])
}

const OFF = new Set(PLAN_DAYS.filter((d) => d.phase === 'off').map((d) => d.date))
export const isStudyDay = (date: string) => !isSunday(date) && !OFF.has(date)

/** Today's training capacity: 10 reps in week 1, then reviewed every week. */
export function useCapacity(): DailyCapacity {
  const { today } = useReps()
  const records = useDayRecords()
  return useMemo(() => capacityFor(today < PLAN_START ? PLAN_START : today, PLAN_START, (d) => records.get(d), isStudyDay), [today, records])
}
