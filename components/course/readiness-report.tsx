'use client'

import { DOMAIN_LABEL, DOMAIN_TONE, TRACK_LABEL } from '@/components/course/course-cards'
import { useCourseDay } from '@/components/use-course-day'

/**
 * The February readiness report (REPS_2_MASTER_SPEC.md §37; REPS_2_1_SPEC.md §11, §18):
 * the seven dimensions with their reasons, Core DSA topic by topic, and the
 * evidence by exact kind. Week summaries live on Progress (components/course/course-progress.tsx).
 */
export default function ReadinessReport() {
  const cd = useCourseDay()
  const r = cd.readiness
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="readiness" className="panel p-6" data-testid="readiness-report">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="readiness" className="h2 scroll-mt-20">
            Feb 1 readiness
          </h2>
          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide ${r.track === 'on-track' ? 'bg-pass-soft text-green-ink' : 'bg-repair-soft text-repair'}`}>{TRACK_LABEL[r.track]}</span>
        </div>
        <ul className="mt-2 flex flex-col gap-0.5 text-[13.5px] text-ink-2">
          {r.why.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
        <table className="mt-5 w-full text-[13.5px]">
          <tbody>
            {r.dimensions.map((d) => (
              <tr key={d.id} className="border-t border-line align-top" data-domain={d.id} data-status={d.status}>
                <td className="py-2 pr-3 font-medium text-ink">{d.title}</td>
                <td className={`whitespace-nowrap py-2 pr-3 text-[12px] font-semibold uppercase tracking-wide ${DOMAIN_TONE[d.status]}`}>
                  {DOMAIN_LABEL[d.status]}
                  {d.stale && <span className="ml-1 font-normal normal-case text-faint">· stale</span>}
                </td>
                <td className="py-2 text-muted">{d.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] font-medium text-ink-2">Core DSA, topic by topic</summary>
          <table className="mt-2 w-full text-[13px]">
            <tbody>
              {r.core.map((d) => (
                <tr key={d.id} className="border-t border-line align-top" data-core={d.id} data-status={d.status}>
                  <td className="py-1.5 pr-3 text-ink">{d.title}</td>
                  <td className={`whitespace-nowrap py-1.5 pr-3 text-[11.5px] font-semibold uppercase tracking-wide ${DOMAIN_TONE[d.status]}`}>
                    {DOMAIN_LABEL[d.status]}
                    {d.stale && <span className="ml-1 font-normal normal-case text-faint">· stale</span>}
                  </td>
                  <td className="py-1.5 text-muted">{d.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="evidence">
          {(
            [
              ['Cold, independent', r.evidence.coldIndependent],
              ['Independent', r.evidence.independent],
              ['Retrieval', r.evidence.retrieval],
              ['Self-corrected', r.evidence.selfCorrected],
              ['Assisted', r.evidence.assisted],
              ['Rebuilt after a solution', r.evidence.reconstructed],
            ] as [string, number][]
          ).map(([label, n]) => (
            <div key={label} className="rounded-xl bg-surface px-3 py-2.5" data-evidence={label}>
              <p className="num text-[20px] font-semibold text-ink">{n}</p>
              <p className="text-[12px] text-muted">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12.5px] text-muted" data-testid="outside-evidence">
          Outside problems: {r.evidence.outsideCold} cold re-solves, {r.evidence.outsideUnaided} unaided, {r.evidence.outsideHinted} with a small hint, {r.evidence.outsideRebuilt} rebuilt after a solution.
        </p>
        <p className="mt-3 text-[12px] text-faint">Each problem counts once, at its strongest: a later independent solve upgrades an earlier assisted one. Full problems only: capstones, checkpoints, unlabeled and interview problems. No single readiness percentage: each line says why.</p>
      </section>

    </div>
  )
}
