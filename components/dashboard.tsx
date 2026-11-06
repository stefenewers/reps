'use client'

import { useSyncExternalStore } from 'react'
import CourseDashboard from '@/components/course/course-dashboard'
import { PreviewToday, useReps } from '@/components/reps-provider'
import { COURSE_START, dayOffKey } from '@/data/course/calendar'
import { nextTrainingDay } from '@/lib/course/resolves'
import { addDays } from '@/lib/dates'

const noop = () => () => {}

/**
 * Today. One product: the course day from Oct 26; before it, Day 1 as a
 * preview (learning open, nothing counted, the real date kept for every save).
 * A training day marked off shows the next training day the same way.
 */
export default function Dashboard() {
  // The page is prerendered at deploy time, so "today" on the server is the deploy date.
  // Draw the day only once we are in the browser and know the real one.
  const inBrowser = useSyncExternalStore(noop, () => true, () => false)
  const { today, repo, version } = useReps()
  void version
  if (!inBrowser) return <main className="relative flex-1 bg-canvas" aria-busy="true" />
  const off = today >= COURSE_START && Boolean(repo.state<{ off?: boolean }>(dayOffKey(today))?.off)
  return off ? (
    <PreviewToday date={nextTrainingDay(addDays(today, 1))}>
      <CourseDashboard />
    </PreviewToday>
  ) : today >= COURSE_START ? (
    <CourseDashboard />
  ) : (
    <PreviewToday date={COURSE_START}>
      <CourseDashboard preview />
    </PreviewToday>
  )
}
