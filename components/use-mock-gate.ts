'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { SECTION_BY_ID } from '@/data/course'
import { COURSE_START } from '@/data/course/calendar'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { mockPolicy, transferGrade, type TransferGrade } from '@/lib/course/readiness'
import { MOCKS_FROM, PREP_START } from '@/data/course/sprint'
import { prepMockAllowed } from '@/lib/course/prep-plan'
import { useCourse } from '@/components/use-course'
import { MOCKS } from '@/data/mocks'

/**
 * Mocks are readiness-gated (REPS_2_1_SPEC.md §2.10, §25): during the course a
 * mock opens only when the Week 13 transfer evidence allows it (green: two,
 * yellow: one), never because the calendar reached Week 14. Before the course,
 * the old open behaviour stays.
 */
export function useMockGate(): { gated: boolean; prep?: boolean; grade: TransferGrade; allowed: number; done: number; canStart: (mockId: string) => boolean; note: string } {
  const { attempts, today, program, repo, version } = useReps()
  const course = useCourse()
  return useMemo(() => {
    void version
    const ids = (SECTION_BY_ID['c13-transfer']?.exercises ?? []).map((e) => e.id)
    const t = transferGrade(attempts, EXERCISE_BY_ID, ids)
    const policy = mockPolicy(t.grade)
    const gated = today >= COURSE_START
    const started = new Set(
      repo.engine
        .all('study_state')
        .filter((r) => r.id.startsWith('mock:') || r.id.startsWith('mock-start:'))
        .map((r) => (r.value as { mockId?: string }).mockId)
        .filter(Boolean) as string[]
    )
    const done = program.mocks.completed
    // Prep (from Dec 1): interview mode is open whatever Week 13 says. Mocks from Dec 7, on ready units only.
    if (today >= PREP_START) {
      const open = MOCKS.filter((m) => prepMockAllowed(today, m.id, course.statuses)).map((m) => m.id)
      return {
        gated: true,
        prep: true,
        grade: t.grade,
        allowed: open.length,
        done,
        canStart: (mockId: string) => started.has(mockId) || open.includes(mockId),
        note:
          today < MOCKS_FROM
            ? 'Prep is open: timed problems and format practice now; mocks open on Dec 7.'
            : open.length
              ? 'Mocks on the units you have passed. Each is followed by diagnosis and repair.'
              : 'No mock is open yet: each one opens once every unit it draws on is ready.'
      }
    }
    return {
      gated,
      grade: t.grade,
      allowed: policy.mocksAllowed,
      done,
      // A mock already started stays open; a new one needs an allowance left.
      canStart: (mockId: string) => !gated || started.has(mockId) || Math.max(done, started.size) < policy.mocksAllowed,
      note: policy.note
    }
  }, [attempts, today, program, repo, version, course.statuses])
}
