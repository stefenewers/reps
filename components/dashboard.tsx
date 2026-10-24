'use client'

import { useSyncExternalStore } from 'react'
import CourseDashboard from '@/components/course/course-dashboard'
import { PreviewToday, useReps } from '@/components/reps-provider'
import { COURSE_START } from '@/data/course/calendar'

const noop = () => () => {}

/**
 * Today. One product: the course day from Oct 26; before it, Day 1 as a
 * preview (learning open, nothing counted, the real date kept for every save).
 */
export default function Dashboard() {
  // The page is prerendered at deploy time, so "today" on the server is the deploy date.
  // Draw the day only once we are in the browser and know the real one.
  const inBrowser = useSyncExternalStore(noop, () => true, () => false)
  const { today } = useReps()
  if (!inBrowser) return <main className="relative flex-1 bg-canvas" aria-busy="true" />
  return today >= COURSE_START ? (
    <CourseDashboard />
  ) : (
    <PreviewToday date={COURSE_START}>
      <CourseDashboard preview />
    </PreviewToday>
  )
}
