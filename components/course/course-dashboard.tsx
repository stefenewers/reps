'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import CourseToday from '@/components/course/course-today'
import { InterviewCard, ReadinessCard, WeekCard } from '@/components/course/course-cards'
import LeetcodeList from '@/components/leetcode-list'
import ProgressIO from '@/components/progress-io'
import { useReps } from '@/components/reps-provider'
import { SessionReviewCard } from '@/components/training-card'
import { useCourseDay } from '@/components/use-course-day'
import { usePacing } from '@/components/use-pacing'
import { lcMeta, useSolveLog } from '@/components/use-solve-log'
import { useTodayPlan } from '@/components/use-today-plan'
import { useTraining } from '@/components/use-training'
import RoadMini from '@/components/course/road-mini'
import { COURSE_END, INTERVIEW_CHECKPOINT } from '@/data/course/calendar'
import { PROBLEM_URLS } from '@/data/problem-urls'
import { courseLeetcode } from '@/lib/course/resolves'
import { parseLocal } from '@/lib/dates'
import type { DayModule, LeetcodeItem } from '@/lib/types'

/** A problem's card data: from the plan's metadata where it has it, else from the URL table. */
function problemMeta(lc: number): LeetcodeItem | undefined {
  const m = lcMeta(lc)
  if (m) return m
  const u = PROBLEM_URLS[lc]
  return u
    ? ({ lc, title: u.title, difficulty: '', pattern: '', type: 'new', mode: null, video: null, url: u.neetcode ?? u.leetcode } as unknown as LeetcodeItem)
    : undefined
}

/**
 * Today in Reps 2.0: the course day (target, flame, streak, path), the week
 * scoreboard, the readiness snapshot, outside problems, and the rest folded away.
 */
export default function CourseDashboard({ preview = false }: { preview?: boolean }) {
  const { today } = useReps()
  const pace = usePacing()
  // The course does not run on the 90-day calendar: training reads an empty day, and prescribes warm-ups from freshness.
  const day = useMemo<DayModule>(() => ({ date: today, short: '', title: '', focus: '', sections: [], capstones: [] }), [today])
  const training = useTraining(day)
  const { entries } = useSolveLog()
  const cd = useCourseDay()
  const lcItems = useMemo(() => courseLeetcode(today, entries, [], problemMeta), [today, entries])
  const resolves = lcItems.filter((x) => x.type !== 'new')
  const plan = useTodayPlan(pace, training, resolves)
  const prescribedLc = plan.items.filter((i) => i.kind === 'problem' && i.lc).map((i) => i.lc!)
  const listItems = useMemo(() => courseLeetcode(today, entries, prescribedLc, problemMeta), [today, entries, prescribedLc])
  const daysLeft = Math.max(0, Math.round((parseLocal(INTERVIEW_CHECKPOINT).getTime() - parseLocal(today).getTime()) / 86_400_000))

  return (
    <main className="relative flex-1 bg-canvas pb-32 lg:pb-16">
      <CourseToday plan={plan} training={training} cd={cd} lcUrl={(lc) => problemMeta(lc)?.url} preview={preview} />

      <div className="mx-auto mt-16 w-full max-w-[1180px] px-5 sm:px-8">
        {today <= COURSE_END && (
          <>
            <h2 className="section-title mb-5">This week</h2>
            <WeekCard cd={cd} />
          </>
        )}
        <div className="mt-12 mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="section-title">The bigger picture</h2>
          <p className="text-[13px] text-muted">
            Today → this week → the road → February 1{daysLeft ? ` (${daysLeft} days)` : ''}
          </p>
        </div>
        <RoadMini cd={cd} />
        <div className="mt-5">
          <ReadinessCard cd={cd} />
        </div>
        {cd.week.number >= 13 && (
          <div className="mt-5">
            <InterviewCard cd={cd} />
          </div>
        )}

        <div id="leetcode" className="mt-12 scroll-mt-6 empty:hidden">
          <LeetcodeList items={listItems} heading="Outside problems today" />
        </div>

        <details className="group mt-12 border-t border-line pt-6" data-testid="more">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[13.5px] font-medium text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
              ›
            </span>
            More: session review, lessons, skills, progress file
          </summary>
          <SessionReviewCard training={training} />
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/plan" className="btn btn-sm">
              Road to Ready: all 14 weeks
            </Link>
            <Link href="/progress#readiness" className="btn btn-sm">
              Readiness report
            </Link>
            <Link href="/learn" className="btn btn-sm">
              Learn library: every lesson and build
            </Link>
            <Link href="/skills" className="btn btn-sm">
              Skills
            </Link>
          </div>
        </details>

        <div className="mt-8 flex justify-end">
          <ProgressIO />
        </div>
      </div>
    </main>
  )
}
