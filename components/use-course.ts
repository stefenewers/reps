'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { useSolveLog } from '@/components/use-solve-log'
import { SECTION_BY_ID } from '@/data/course'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { CAPSTONE_NUMBER } from '@/components/use-pacing'
import { courseQueue, courseStatus, type CourseContext } from '@/lib/course/routing'
import { passedSet } from '@/lib/progress'

/** The course, live: every unit's state (placement, gates, locks) and the queue of what it asks for next. */
export function useCourse() {
  const { attempts, mastery, today } = useReps()
  const { entries } = useSolveLog()
  return useMemo(() => {
    const ctx: CourseContext = { attempts, mastery, exercises: EXERCISE_BY_ID, sections: SECTION_BY_ID, today }
    const statuses = courseStatus(ctx)
    const passed = passedSet(attempts)
    // A problem counts as solved once logged as new, or once its Reps capstone is passed.
    const solvedLc = new Set<number>([...entries.filter((e) => e.kind === 'new' && e.lc).map((e) => e.lc!), ...Object.entries(CAPSTONE_NUMBER).filter(([id]) => passed.has(id)).map(([, lc]) => lc)])
    const queue = courseQueue(statuses, ctx, solvedLc)
    const current = statuses.find((s) => !s.locked && s.state !== 'ready' && s.state !== 'maintenance')
    return { statuses, queue, current, solvedLc }
  }, [attempts, mastery, today, entries])
}
