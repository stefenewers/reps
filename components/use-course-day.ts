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
import { evidenceSummary, finalDecision, readiness, transferGrade } from '@/lib/course/readiness'
import { createContracts } from '@/lib/course/contract'
import { earnedEvents } from '@/lib/course/events'
import { LAB_DUE } from '@/data/course/schedule'
import { SECTION_BY_ID } from '@/data/course'
import { useSolveLog } from '@/components/use-solve-log'
import { courseDay, flameFor, momentum, weekProgress } from '@/lib/course/week-status'

/**
 * Everything Today shows about the course, derived: the day, the week, the
 * streak, the flame, the labs, the checkpoints and the February readiness read.
 */
export function useCourseDay() {
  const { attempts, repo, today, mastery, program, version } = useReps()
  const { entries } = useSolveLog()
  const course = useCourse()
  const credits = useCredits()
  return useMemo(() => {
    // Study state changes in place; its version invalidates lab/learning reads.
    void version
    // The one contract for the day and the week (lib/course/contract.ts): streak, flame, week status and readiness read it.
    const labStates = Object.fromEntries(LABS.map((l) => [l.id, repo.state<LabState>(labKey(l.id))]))
    const contracts = createContracts({ attempts, entries, mastery, labStates, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID })
    const dayC = contracts.dayContract(today)
    const day = courseDay(today, credits.byDate)
    const week = WEEK_BY_NUMBER[day.week] ?? WEEK_BY_NUMBER[14]
    const labs = LABS.filter((l) => l.week === week.number).map((lab) => ({ lab, progress: labProgress(lab, repo.state<LabState>(labKey(lab.id)), attempts) }))
    const required = labs.filter((l) => !l.lab.optional)
    const weekGates = course.statuses.filter((s) => s.unit.week === week.number).flatMap((s) => s.gates.filter((g) => g.available.length))
    const gatesCleared = weekGates.filter((g) => g.cleared).length
    const progress = weekProgress(week.number, today, credits.byDate, {
      labsDone: required.filter((l) => l.progress.done).length,
      labsRequired: required.length,
      gatesCleared,
      gatesRequired: weekGates.length
    })
    const weekC = contracts.weekContract(week.number, today)
    // Finished weeks, for the readiness read (from the same contract).
    const finished = Array.from(
      { length: Math.max(0, Math.min(14, courseWeekOf(today)) - 1) },
      (_, i) => contracts.weekContract(i + 1, weekDates(i + 1)[6]).status
    )
    const done = credits.items[today] ?? []
    const assistedToday = done.filter((c) => c.evidence === 'assisted' || c.evidence === 'reconstructed' || c.evidence === 'outside-hinted' || c.evidence === 'outside-reconstructed').length
    const streak = contracts.streak(today)
    const total = Object.entries(credits.byDate)
      .filter(([d]) => d >= COURSE_START && d <= today)
      .reduce((n, [, v]) => n + v, 0)
    const ev = evidenceSummary(attempts, entries, EXERCISE_BY_ID, today)
    const transferIds = (SECTION_BY_ID['c13-transfer']?.exercises ?? []).map((e) => e.id)
    const t = transferGrade(attempts, EXERCISE_BY_ID, transferIds)
    const labEvidence = LABS.map((lab) => {
      const p = labProgress(lab, labStates[lab.id], attempts)
      return {
        lab,
        done: p.done,
        due: (LAB_DUE[lab.id] ?? '9999') <= today,
        buildPassed: p.buildPassed,
        changePassed: p.changePassed,
        designDone: p.designDone
      }
    })
    const ready = readiness({
      statuses: course.statuses,
      finishedWeeks: finished,
      currentWeek: weekC.status,
      evidence: ev,
      labs: labEvidence,
      transfer: t,
      mocksDone: program.mocks.completed,
      today
    })
    return {
      day,
      week,
      progress,
      labs,
      weekGates,
      gatesCleared,
      streak,
      // The flame blazes only when the whole day's contract is complete, not just the rep count.
      flame:
        dayC.complete && day.type === 'training'
          ? ('blaze' as const)
          : (() => {
              const f = flameFor(done.length, day.type === 'training' ? day.target : day.optionalTarget)
              return f === 'blaze' ? ('burning' as const) : f
            })(),
      dayContract: dayC,
      weekContract: weekC,
      contracts,
      momentum: momentum(today, credits.byDate, { gatesCleared, labsDone: required.filter((l) => l.progress.done).length }),
      doneToday: done.length,
      assistedToday,
      total,
      credits: credits.byDate,
      events: earnedEvents(
        { attempts, entries, mastery, labStates, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID },
        today,
        total,
        program.mocks.completed,
        finalDecision(ready, t.grade, program.mocks.completed),
        ready
      ),
      readiness: ready,
      finalDecision: finalDecision(ready, t.grade, program.mocks.completed),
      course
    }
  }, [attempts, repo, today, course, credits, entries, mastery, program, version])
}
