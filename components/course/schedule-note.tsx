'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { COURSE_START } from '@/data/course/calendar'
import { firstTaught } from '@/lib/course/applied-audit'
import { parseLocal } from '@/lib/dates'

const DAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

/**
 * Where a lesson sits in the course, so browsing ahead is never confused with today's assigned work.
 * Reading early is allowed: nothing here is counted, and Today still assigns it on its day.
 */
export default function ScheduleNote({ lessonId, week }: { lessonId: string; week?: number }) {
  const { today } = useReps()
  const first = firstTaught(lessonId)
  if (!first || !week) return null
  const now = today < COURSE_START ? COURSE_START : today
  if (first <= now) return null
  return (
    <p className="mb-8 rounded-xl bg-surface px-4 py-3 text-[13.5px] text-ink-2" data-testid="schedule-note">
      <b className="font-semibold text-ink">Browsing ahead.</b> This lesson is taught in Week {week}; it appears on Today from{' '}
      {DAY.format(parseLocal(first))}. Reading it now is fine. It is not counted, and{' '}
      <Link href="/" className="font-medium underline underline-offset-2">
        Today
      </Link>{' '}
      still decides what to train.
    </p>
  )
}
