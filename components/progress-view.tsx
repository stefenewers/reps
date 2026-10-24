'use client'

import CourseProgress from '@/components/course/course-progress'
import PageHero from '@/components/page-hero'

/** Progress is one model, derived from the day/week contract: evidence that you are becoming capable. */
export default function ProgressView() {
  return (
    <main className="flex-1 bg-canvas">
      <PageHero
        deck
        title="Your progress"
        sub="Evidence that you are becoming capable: what you can do now, what moved forward, how you produced it, and what still needs work."
      />
      <div className="relative mx-auto w-full max-w-[1180px] px-5 pb-28 sm:px-8">
        <CourseProgress />
      </div>
    </main>
  )
}
