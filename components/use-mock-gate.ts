'use client'

import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { SECTION_BY_ID } from '@/data/course'
import { COURSE_START } from '@/data/course/calendar'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { mockPolicy, transferGrade, type TransferGrade } from '@/lib/course/readiness'

/**
 * Mocks are readiness-gated (REPS_2_1_SPEC.md §2.10, §25): during the course a
 * mock opens only when the Week 13 transfer evidence allows it (green: two,
 * yellow: one), never because the calendar reached Week 14. Before the course,
 * the old open behaviour stays.
 */
export function useMockGate(): { gated: boolean; grade: TransferGrade; allowed: number; done: number; canStart: (mockId: string) => boolean; note: string } {
  const { attempts, today, program, repo, version } = useReps()
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
    return {
      gated,
      grade: t.grade,
      allowed: policy.mocksAllowed,
      done,
      // A mock already started stays open; a new one needs an allowance left.
      canStart: (mockId: string) => !gated || started.has(mockId) || Math.max(done, started.size) < policy.mocksAllowed,
      note: policy.note
    }
  }, [attempts, today, program, repo, version])
}
