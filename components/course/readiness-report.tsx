'use client'

import { DOMAIN_LABEL, DOMAIN_TONE, TRACK_LABEL, WEEK_STATUS_LABEL } from '@/components/course/course-cards'
import { useCourseDay } from '@/components/use-course-day'
import { useReps } from '@/components/reps-provider'
import { courseWeekOf, weekDates } from '@/data/course/calendar'
import { LABS } from '@/data/course/lessons'
import { motivate } from '@/data/course/motivation'
import { WEEKS } from '@/data/course/weeks'
import { labKey, labProgress, type LabState } from '@/lib/course/labs'
import { weekProgress } from '@/lib/course/week-status'

/**
 * The February readiness report (REPS_2_MASTER_SPEC.md §37) and the weekly
 * summaries (§31, §50): evidence by domain, why each stands where it does,
 * and what each finished week moved.
 */
export default function ReadinessReport() {
  const cd = useCourseDay()
  const { attempts, repo, today } = useReps()
  const r = cd.readiness
  const current = courseWeekOf(today)
  const finished = WEEKS.filter((w) => w.number < current)
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

      {finished.length > 0 && (
        <section aria-labelledby="weeks-h" data-testid="week-summaries">
          <h2 id="weeks-h" className="h2">
            Weeks so far
          </h2>
          <ol className="mt-3 flex flex-col gap-3">
            {[...finished].reverse().map((w) => {
              const p = weekProgress(w.number, weekDates(w.number)[6], cd.credits)
              const labs = LABS.filter((l) => l.week === w.number).map((l) => ({ l, done: labProgress(l, repo.state<LabState>(labKey(l.id)), attempts).done }))
              const gates = cd.course.statuses.filter((s) => s.unit.week === w.number).flatMap((s) => s.gates.filter((g) => g.available.length))
              const complete = p.done >= p.target && labs.filter((x) => !x.l.optional).every((x) => x.done) && gates.every((g) => g.cleared)
              return (
                <li key={w.number} className="panel p-5" data-week={w.number}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[16px] font-semibold tracking-tight text-ink">
                      Week {w.number} {complete ? 'complete' : `· ${w.title}`}
                    </p>
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">{WEEK_STATUS_LABEL[p.status]}</span>
                  </div>
                  <p className="num mt-1 text-[14px] text-ink-2">
                    {p.daysComplete} training day{p.daysComplete === 1 ? '' : 's'} complete · {p.done} / {p.target} qualifying problems
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                    {labs.map(({ l, done }) => (
                      <li key={l.id} className={done ? 'text-green-ink' : 'text-muted'}>
                        {done ? '✓' : '—'} {l.title}
                      </li>
                    ))}
                    {gates.map((g) => (
                      <li key={g.gate.id} className={g.cleared ? 'text-cold' : 'text-muted'}>
                        {g.cleared ? '✓' : '—'} {g.gate.title} checkpoint
                      </li>
                    ))}
                  </ul>
                  {complete && <p className="mt-2 text-[13.5px] text-ink">{motivate('week-complete', { week: w.number, weekDone: p.done }).text}</p>}
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </div>
  )
}
