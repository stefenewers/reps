'use client'

import { useReps } from '@/components/reps-provider'
import { checksKey } from '@/data/course/applied'
import { courseWeekOf } from '@/data/course/calendar'
import { LESSON_BY_ID } from '@/data/course/lessons'
import { labKey, labProgress, type LabState } from '@/lib/course/labs'
import { LAB_BY_ID } from '@/data/course/lessons'

/**
 * A library item's state for this learner: where it sits relative to this week (browsing ahead is fine),
 * and what is already done. Evidence only; never a percentage.
 */
export default function LearnMark({ id, week, kind = 'lesson' }: { id: string; week?: number; kind?: 'lesson' | 'example' | 'demo' | 'lab' }) {
  const { repo, attempts, today } = useReps()
  const now = Math.max(1, courseWeekOf(today))
  const key = kind === 'lab' ? null : `${kind}:${id}`
  const done =
    kind === 'lab' ? Boolean(LAB_BY_ID[id] && labProgress(LAB_BY_ID[id], repo.state<LabState>(labKey(id)), attempts).done) : Boolean(key && repo.state(key))
  const checks = kind === 'lesson' && LESSON_BY_ID[id]?.checks?.length ? Boolean(repo.state<{ answeredOn?: string }>(checksKey(id))?.answeredOn) : false
  const when = week === undefined ? 'Reference' : week === now ? 'This week' : week > now ? `Week ${week} · ahead` : `Week ${week}`
  return (
    <span className="flex flex-wrap items-center gap-1.5" data-state={done ? 'done' : 'open'}>
      <span className={`tag ${week === now ? 'tag-flame' : week !== undefined && week > now ? 'tag-locked' : 'tag-plain'}`}>{when}</span>
      {done && <span className="tag tag-pass">{kind === 'lab' ? '✓ Built' : kind === 'demo' ? '✓ Watched' : '✓ Done'}</span>}
      {checks && <span className="tag tag-cold">✓ Checks</span>}
    </span>
  )
}
