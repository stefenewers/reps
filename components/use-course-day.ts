'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { useCourse } from '@/components/use-course'
import { useCredits } from '@/components/use-credits'
import { COURSE_START, courseWeekOf, weekDates } from '@/data/course/calendar'
import { LABS } from '@/data/course/lessons'
import { WEEK_BY_NUMBER } from '@/data/course/weeks'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { labKey, labProgress, type LabState } from '@/lib/course/labs'
import { evidenceSummary, readiness } from '@/lib/course/readiness'
import { courseDay, flameFor, momentum, trainingStreak, weekProgress } from '@/lib/course/week-status'

/**
 * Everything Today shows about the course, derived: the day, the week, the
 * streak, the flame, the labs, the checkpoints and the February readiness read.
 */
export function useCourseDay() {
  const { attempts, repo, today } = useReps()
  const course = useCourse()
  const credits = useCredits()
  return useMemo(() => {
    const day = courseDay(today, credits.byDate)
    const week = WEEK_BY_NUMBER[day.week] ?? WEEK_BY_NUMBER[1]
    const labs = LABS.filter((l) => l.week === week.number).map((lab) => ({ lab, progress: labProgress(lab, repo.state<LabState>(labKey(lab.id)), attempts) }))
    const required = labs.filter((l) => !l.lab.optional)
    const weekGates = course.statuses.filter((s) => s.unit.week === week.number).flatMap((s) => s.gates.filter((g) => g.available.length))
    const gatesCleared = weekGates.filter((g) => g.cleared).length
    const progress = weekProgress(week.number, today, credits.byDate, { labsDone: required.filter((l) => l.progress.done).length, labsRequired: required.length, gatesCleared, gatesRequired: weekGates.length })
    // Finished weeks, for the readiness read.
    const finished = Array.from({ length: Math.max(0, courseWeekOf(today) - 1) }, (_, i) => weekProgress(i + 1, weekDates(i + 1)[6], credits.byDate).status)
    const done = credits.items[today] ?? []
    const assistedToday = done.filter((c) => c.evidence === 'assisted' || c.evidence === 'reconstructed').length
    const streak = trainingStreak(today, credits.byDate)
    const total = Object.entries(credits.byDate).filter(([d]) => d >= COURSE_START && d <= today).reduce((n, [, v]) => n + v, 0)
    const ev = evidenceSummary(attempts, EXERCISE_BY_ID, today)
    const ready = readiness(course.statuses, finished, ev, today)
    return {
      day,
      week,
      progress,
      labs,
      weekGates,
      gatesCleared,
      streak,
      flame: flameFor(done.length, day.type === 'training' ? day.target : day.optionalTarget),
      momentum: momentum(today, credits.byDate, { gatesCleared, labsDone: required.filter((l) => l.progress.done).length }),
      doneToday: done.length,
      assistedToday,
      total,
      credits: credits.byDate,
      readiness: ready,
      course,
    }
  }, [attempts, repo, today, course, credits])
}
