'use client'

import Link from 'next/link'
import { IconArrowRight, IconCheck } from '@/components/icons'
import WeekStrip from '@/components/course/week-strip'
import type { useCourseDay } from '@/components/use-course-day'
import { INTERVIEW_CHECKPOINT } from '@/data/course/calendar'
import { motivate } from '@/data/course/motivation'
import { useReps } from '@/components/reps-provider'
import { SECTION_BY_ID } from '@/data/course'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { finalDecision, mockPolicy, transferGrade } from '@/lib/course/readiness'
import type { DomainStatus, Track } from '@/lib/course/readiness'
import type { WeekStatus } from '@/lib/course/week-status'

type CourseDayState = ReturnType<typeof useCourseDay>

export const WEEK_STATUS_LABEL: Record<WeekStatus, string> = { 'on-track': 'On track', recoverable: 'Recoverable', 'off-track': 'Off track' }
const WEEK_STATUS_TONE: Record<WeekStatus, string> = { 'on-track': 'bg-pass-soft text-green-ink', recoverable: 'bg-repair-soft text-repair', 'off-track': 'bg-repair-soft text-repair' }
export const TRACK_LABEL: Record<Track, string> = { 'on-track': 'On track', 'at-risk': 'At risk', 'off-track': 'Off track' }
export const DOMAIN_LABEL: Record<DomainStatus, string> = { ready: 'Ready', developing: 'Developing', building: 'Building', 'not-started': 'Not started', 'not-tested': 'Not tested yet' }
export const DOMAIN_TONE: Record<DomainStatus, string> = { ready: 'text-green-ink', developing: 'text-repair', building: 'text-learn', 'not-started': 'text-faint', 'not-tested': 'text-faint' }

/** The week scoreboard: problems, builds, checkpoints, status, and the heat strip. */
export function WeekCard({ cd }: { cd: CourseDayState }) {
  const { week, progress, labs } = cd
  const line = motivate('week-progress', { week: week.number, weekDone: progress.done, weekTarget: progress.target, weekStatus: progress.status, shortfall: progress.shortfall })
  return (
    <section aria-labelledby="week-h" className="panel p-6" data-testid="week-card" data-status={progress.status}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="week-h" className="h2">
          Week {week.number} · {week.short}
        </h2>
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide ${WEEK_STATUS_TONE[progress.status]}`} data-testid="week-status">
          {WEEK_STATUS_LABEL[progress.status]}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-muted">{week.focus}</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="num text-[26px] font-semibold tracking-tight text-ink" data-testid="week-count">
            {progress.done} <span className="text-[15px] font-normal text-muted">/ {progress.target} problems</span>
          </p>
          <span className="bar bar-flame mt-2 block h-2" role="progressbar" aria-valuemin={0} aria-valuemax={progress.target} aria-valuenow={Math.min(progress.done, progress.target)} aria-label={`Week ${week.number}: ${progress.done} of ${progress.target}`}>
            <span style={{ width: `${Math.min(100, Math.round((100 * progress.done) / Math.max(1, progress.target)))}%` }} />
          </span>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{line.text}</p>
          <div className="mt-4">
            <WeekStrip week={week.number} today={cd.day.date} credits={cd.credits} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {labs.length > 0 && (
            <div>
              <p className="label">Builds</p>
              <ul className="mt-1 flex flex-col gap-1">
                {labs.map(({ lab, progress: p }) => (
                  <li key={lab.id} className="flex items-center gap-2 text-[13.5px]">
                    <span aria-hidden="true" className={`grid size-4 place-items-center rounded-full ${p.done ? 'bg-pass text-white' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
                      {p.done && <IconCheck size={9} strokeWidth={2.8} />}
                    </span>
                    <Link href={`/lab/${lab.id}`} className="min-w-0 truncate text-ink hover:underline" data-testid="lab-link">
                      {lab.title}
                    </Link>
                    <span className="ml-auto whitespace-nowrap text-[12px] text-muted">{p.done ? 'Done' : lab.optional ? 'Optional' : 'Not done'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cd.weekGates.length > 0 && (
            <div>
              <p className="label">Checkpoints {cd.gatesCleared} / {cd.weekGates.length}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {cd.weekGates.map((g) => (
                  <li key={g.gate.id} className="flex items-center gap-2 text-[13.5px]" data-testid="gate-row" data-cleared={g.cleared ? 'true' : 'false'}>
                    <span aria-hidden="true" className={`grid size-4 place-items-center rounded-full ${g.cleared ? 'bg-cold text-white' : g.failed ? 'bg-repair-soft shadow-[inset_0_0_0_1.5px_var(--repair)]' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
                      {g.cleared && <IconCheck size={9} strokeWidth={2.8} />}
                    </span>
                    <span className="text-ink">{g.gate.title}</span>
                    <span className="ml-auto text-[12px] text-muted">{g.cleared ? 'Cleared' : g.failed ? 'Repair, then retry' : `${g.clean.length}/${g.gate.need}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** The Road-to-Ready snapshot: where February readiness stands, per domain, without false precision. */
export function ReadinessCard({ cd }: { cd: CourseDayState }) {
  const r = cd.readiness
  return (
    <section aria-labelledby="ready-h" className="panel p-6" data-testid="readiness-card" data-track={r.track}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ready-h" className="h2">
          Feb 1 readiness
        </h2>
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide ${r.track === 'on-track' ? 'bg-pass-soft text-green-ink' : 'bg-repair-soft text-repair'}`} data-testid="track">
          {TRACK_LABEL[r.track]}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-muted">{r.why[0]}</p>
      <ul className="mt-4 flex flex-col gap-1.5">
        {r.dimensions.map((d) => (
          <li key={d.id} className="flex items-baseline justify-between gap-3 text-[13.5px]" data-dimension={d.id} title={d.why}>
            <span className="text-ink">{d.title}</span>
            <span className={`text-[12px] font-semibold uppercase tracking-wide ${DOMAIN_TONE[d.status]}`}>{DOMAIN_LABEL[d.status]}</span>
          </li>
        ))}
      </ul>
      <Link href="/progress#readiness" className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-ink hover:underline">
        The full readiness report <IconArrowRight size={12} />
      </Link>
      <p className="mt-1 text-[12px] text-faint">Interview-start checkpoint: {new Date(`${INTERVIEW_CHECKPOINT}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
    </section>
  )
}

/**
 * Weeks 13–14: the transfer grade and what it allows. Mocks are readiness-gated:
 * the calendar reaching Week 14 never makes them required by itself.
 */
export function InterviewCard({ cd }: { cd: CourseDayState }) {
  const { attempts, program } = useReps()
  const ids = (SECTION_BY_ID['c13-transfer']?.exercises ?? []).map((e) => e.id)
  const t = transferGrade(attempts, EXERCISE_BY_ID, ids)
  const policy = mockPolicy(t.grade)
  const mocksDone = program.mocks.completed
  const decision = cd.week.number >= 14 ? finalDecision(cd.readiness, t.grade, mocksDone) : null
  const GRADE = { green: 'Green', yellow: 'Yellow', red: 'Red' } as const
  return (
    <section aria-labelledby="interview-h" className="panel p-6" data-testid="interview-card" data-grade={t.grade}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="interview-h" className="h2">
          {cd.week.number >= 14 ? 'Interview execution' : 'Independent transfer'}
        </h2>
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide ${t.grade === 'green' ? 'bg-pass-soft text-green-ink' : t.grade === 'yellow' ? 'bg-repair-soft text-repair' : 'bg-surface-2 text-ink-2'}`} data-testid="transfer-grade">
          {GRADE[t.grade]}
        </span>
      </div>
      <p className="num mt-1 text-[13.5px] text-ink-2">
        {t.independent} of {t.attempted} unlabeled problems solved independently · {t.freshFull} full problems cold
      </p>
      <p className="mt-3 text-[14px] text-ink" data-testid="mock-policy">
        <span className="font-medium">Mocks: </span>
        {policy.note} {mocksDone ? `${mocksDone} done.` : ''}
      </p>
      {policy.mocksAllowed > 0 ? (
        <Link href="/interview" className="btn btn-sm mt-3">
          Open the mocks
        </Link>
      ) : (
        <p className="mt-2 text-[12.5px] text-muted">Mocks open once the transfer evidence says they will be useful.</p>
      )}
      {decision && (
        <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[14px] text-ink" data-testid="final-decision">
          <span className="font-semibold">{decision === 'ready' ? 'Ready' : decision === 'ready-with-gaps' ? 'Ready with targeted gaps' : 'Not yet ready'}. </span>
          {motivate(decision === 'ready' ? 'ready' : decision === 'ready-with-gaps' ? 'ready-with-gaps' : 'not-ready').text}
        </p>
      )}
    </section>
  )
}
