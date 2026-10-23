'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { InterviewTargetCompact } from '@/components/interview-target'
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
import WinstonPerch from '@/components/winston-perch'
import { INTERVIEW_CHECKPOINT } from '@/data/course/calendar'
import { PROBLEM_URLS } from '@/data/problem-urls'
import { courseLeetcode } from '@/lib/course/resolves'
import { parseLocal } from '@/lib/dates'
import type { DayModule, LeetcodeItem } from '@/lib/types'

const LONG_DAY = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

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
export default function CourseDashboard() {
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
    <main className="relative flex-1 bg-canvas">
      <div
        aria-hidden="true"
        className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[360px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />
      <div className="relative mx-auto w-full max-w-[1120px] px-5 pb-10 pt-12 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <p className="eyebrow text-muted" suppressHydrationWarning>
              {LONG_DAY.format(parseLocal(today))}
            </p>
            <h1 className="display-xl mt-2">Today&apos;s Reps</h1>
            <p className="mt-2 text-[16px] text-ink-2" data-testid="day-heading">
              Road to SWE I · Week {cd.week.number} of 14 · Feb 1 checkpoint{daysLeft ? ` in ${daysLeft} days` : ''}
            </p>
          </div>
          <InterviewTargetCompact />
        </header>

        <CourseToday plan={plan} training={training} cd={cd} lcUrl={(lc) => problemMeta(lc)?.url} />

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <WeekCard cd={cd} />
          <ReadinessCard cd={cd} />
        </div>
        {cd.week.number >= 13 && (
          <div className="mt-6">
            <InterviewCard cd={cd} />
          </div>
        )}

        <div id="leetcode" className="mt-8 scroll-mt-6 empty:hidden">
          <LeetcodeList items={listItems} heading="Outside problems today" />
        </div>

        <details className="group mt-10" data-testid="more">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-2 text-[13.5px] font-medium text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
              ›
            </span>
            More: session review, the road to ready, skills, progress file
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
              Lessons and concepts
            </Link>
            <Link href="/skills" className="btn btn-sm">
              Skills
            </Link>
          </div>
        </details>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <WinstonPerch
            className="mx-2"
            mood={cd.day.type !== 'training' ? 'rest' : cd.flame === 'blaze' ? 'celebrate' : cd.doneToday > 0 ? 'awake' : 'rest'}
          />
          <ProgressIO />
        </div>
      </div>
    </main>
  )
}
