'use client'

import { DOMAIN_LABEL, TRACK_LABEL } from '@/components/course/course-cards'
import { useCourseDay } from '@/components/use-course-day'
import type { DomainStatus } from '@/lib/course/readiness'

/**
 * The February readiness report (REPS_2_MASTER_SPEC.md §37; REPS_2_1_SPEC.md §11, §18):
 * the seven dimensions with their reasons, Core DSA topic by topic, and the
 * evidence by exact kind. Each dimension is a level on a ladder, never a
 * percentage: the reason beside it says why.
 */

/** The ladder a dimension climbs. "Not tested yet" sits beside it: untested is not weak. */
const LEVEL: Record<DomainStatus, number> = { 'not-tested': 0, 'not-started': 0, building: 1, developing: 2, ready: 4 }
const LEVEL_COLOR: Record<DomainStatus, string> = {
  ready: 'var(--pass)',
  developing: 'var(--flame-2)',
  building: 'var(--learn)',
  'not-started': 'var(--surface-3)',
  'not-tested': 'var(--surface-3)'
}

function Ladder({ status }: { status: DomainStatus }) {
  const level = LEVEL[status]
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className="h-2 w-7 rounded-full" style={{ background: i <= level ? LEVEL_COLOR[status] : 'var(--surface-3)' }} />
      ))}
    </span>
  )
}

export default function ReadinessReport() {
  const cd = useCourseDay()
  const r = cd.readiness
  return (
    <section aria-labelledby="readiness" data-testid="readiness-report">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="readiness" className="section-title scroll-mt-20">
          What you can do: Feb 1 readiness
        </h2>
        <span className={`tag ${r.track === 'on-track' ? 'tag-pass' : 'tag-repair'}`}>{TRACK_LABEL[r.track]}</span>
      </div>
      <ul className="mt-2 flex flex-col gap-0.5 text-[13.5px] text-ink-2">
        {r.why.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
      <ul className="mt-5 grid gap-2 lg:grid-cols-2">
        {r.dimensions.map((d) => (
          <li key={d.id} className="flex flex-col gap-1.5 rounded-xl bg-bg px-4 py-3.5 shadow-[0_0_0_1px_var(--hairline)]" data-domain={d.id} data-status={d.status}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[14.5px] font-semibold text-ink">{d.title}</span>
              <span className="flex items-center gap-2.5">
                <Ladder status={d.status} />
                <span className="w-[104px] text-right text-[11.5px] font-semibold uppercase tracking-wide text-ink-2">
                  {DOMAIN_LABEL[d.status]}
                  {d.stale && <span className="font-normal normal-case text-faint"> · stale</span>}
                </span>
              </span>
            </div>
            <p className="text-[12.5px] text-muted">{d.why}</p>
          </li>
        ))}
      </ul>
      <details className="mt-3">
        <summary className="cursor-pointer text-[13px] font-medium text-ink-2">Core DSA, topic by topic</summary>
        <ul className="mt-2 grid gap-x-6 sm:grid-cols-2">
          {r.core.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 border-t border-line py-2 text-[13px]" data-core={d.id} data-status={d.status} title={d.why}>
              <span className="text-ink">{d.title}</span>
              <span className="flex items-center gap-2">
                <Ladder status={d.status} />
                <span className="w-[92px] text-right text-[11px] font-semibold uppercase tracking-wide text-ink-2">
                  {DOMAIN_LABEL[d.status]}
                  {d.stale && <span className="font-normal normal-case text-faint"> · stale</span>}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </details>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" data-testid="evidence">
        {(
          [
            ['Cold, independent', r.evidence.coldIndependent],
            ['Independent', r.evidence.independent],
            ['Retrieval', r.evidence.retrieval],
            ['Self-corrected', r.evidence.selfCorrected],
            ['Assisted', r.evidence.assisted],
            ['Rebuilt after a solution', r.evidence.reconstructed]
          ] as [string, number][]
        ).map(([label, n]) => (
          <div key={label} className="rounded-xl bg-surface px-3 py-2.5" data-evidence={label}>
            <p className="num text-[20px] font-semibold text-ink">{n}</p>
            <p className="text-[12px] text-muted">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-muted" data-testid="outside-evidence">
        Outside problems: {r.evidence.outsideCold} cold re-solves, {r.evidence.outsideUnaided} unaided, {r.evidence.outsideHinted} with a small hint,{' '}
        {r.evidence.outsideRebuilt} rebuilt after a solution.
      </p>
      <p className="mt-3 text-[12px] text-faint">
        Each problem counts once, at its strongest: a later independent solve upgrades an earlier assisted one. Full problems only: capstones, checkpoints,
        unlabeled and interview problems. No single readiness percentage: each line says why.
      </p>
    </section>
  )
}
