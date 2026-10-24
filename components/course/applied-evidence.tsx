'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { taughtWeek, THREAD_LABEL } from '@/lib/course/library'
import { CAPABILITIES, capabilityStatus, checksKey, type CapabilityStatus } from '@/data/course/applied'
import { LAB_BY_ID, LESSON_BY_ID } from '@/data/course/lessons'
import { labKey, labProgress, type LabState } from '@/lib/course/labs'

/** The week a capability is first taught (its earliest lesson). */
const firstWeek = (ids: string[]) => Math.min(...ids.map((id) => taughtWeek(id) ?? 99))

const STATUS: Record<CapabilityStatus, { label: string; tag: string; step: number }> = {
  'not-introduced': { label: 'Not introduced', tag: 'tag-locked', step: 0 },
  learning: { label: 'Learning', tag: 'tag-learn', step: 1 },
  practiced: { label: 'Practiced', tag: 'tag-cold', step: 2 },
  applied: { label: 'Applied', tag: 'tag-pass', step: 3 }
}

/**
 * Applied Engineering and junior system design evidence (docs/applied-engineering.md): what each capability
 * rests on, from real evidence only (a lesson read, its checks answered, a lab that uses it done).
 * Capability evidence, not a job-readiness score: no percentage, no "FDE ready".
 */
export default function AppliedEvidence() {
  const { repo, attempts } = useReps()
  const evidence = {
    lessonDone: (id: string) => Boolean(repo.state(`lesson:${id}`)),
    checksDone: (id: string) => Boolean(repo.state<{ answeredOn?: string }>(checksKey(id))?.answeredOn) || !LESSON_BY_ID[id]?.checks?.length,
    labDone: (id: string) => Boolean(LAB_BY_ID[id] && labProgress(LAB_BY_ID[id], repo.state<LabState>(labKey(id)), attempts).done)
  }
  return (
    <section aria-labelledby="applied-h" data-testid="applied-evidence">
      <h2 id="applied-h" className="section-title">
        Engineering beyond the problems
      </h2>
      <p className="mt-1 max-w-[760px] text-[13.5px] text-muted">
        Applied Engineering and system design, from evidence: <b className="font-medium text-ink-2">learning</b> once its lesson is read,{' '}
        <b className="font-medium text-ink-2">practiced</b> once its checks are answered, <b className="font-medium text-ink-2">applied</b> once a lab that
        uses it is done. Capability evidence, not a job-readiness score. These are introduced progressively through the course, so &ldquo;Not
        introduced&rdquo; early on just means its week has not come yet.
      </p>
      {(['applied', 'design'] as const).map((lane) => (
        <div key={lane} className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="label">{THREAD_LABEL[lane]}</p>
            <Link href={`/learn#${lane}`} className="text-[12.5px] font-medium text-ink-2 hover:text-ink hover:underline">
              Browse the {THREAD_LABEL[lane]} lessons →
            </Link>
          </div>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.filter((c) => c.lane === lane).map((c) => {
              const s = STATUS[capabilityStatus(c, evidence)]
              return (
                <li key={c.id} className="rounded-xl bg-bg px-4 py-3 shadow-[0_0_0_1px_var(--hairline)]" data-capability={c.id} data-status={capabilityStatus(c, evidence)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold text-ink">{c.title}</span>
                    <span className={`tag ${s.tag}`}>
                      {s.label}
                      {capabilityStatus(c, evidence) === 'not-introduced' && firstWeek(c.lessonIds) ? ` · Week ${firstWeek(c.lessonIds)}` : ''}
                    </span>
                  </div>
                  <span className="mt-2 flex gap-1" aria-hidden="true">
                    {[1, 2, 3].map((i) => (
                      <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= s.step ? 'var(--cold)' : 'var(--surface-3)' }} />
                    ))}
                  </span>
                  <p className="mt-2 text-[12px] text-muted">
                    {c.lessonIds
                      .map((id) => LESSON_BY_ID[id])
                      .filter(Boolean)
                      .map((l, i) => (
                        <span key={l.id}>
                          {i > 0 ? ' · ' : ''}
                          <Link href={`/learn/${l.id}`} className="hover:underline">
                            {l.title}
                          </Link>
                        </span>
                      ))}
                    {c.labIds.length > 0 && (
                      <>
                        {' '}
                        → applied in{' '}
                        {c.labIds
                          .map((id) => LAB_BY_ID[id])
                          .filter(Boolean)
                          .map((l, i) => (
                            <span key={l.id}>
                              {i > 0 ? ', ' : ''}
                              <Link href={`/lab/${l.id}`} className="hover:underline">
                                {l.title}
                              </Link>
                            </span>
                          ))}
                      </>
                    )}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}
