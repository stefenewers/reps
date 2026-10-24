'use client'

import Link from 'next/link'
import { GlyphTerminal, GlyphTimer } from '@/components/concept-icons'
import { InterviewTargetFull } from '@/components/interview-target'
import { useReps } from '@/components/reps-provider'
import { MOCKS } from '@/data/mocks'
import { DAYS, EXERCISE_BY_ID, MODULES } from '@/data/curriculum'
import MockLog from '@/components/mock-log'
import PageHero from '@/components/page-hero'
import { mockPolicy, type TransferGrade } from '@/lib/course/readiness'
import { useMockGate } from '@/components/use-mock-gate'
import { DesignTrack, StoriesChecklist } from '@/components/track-checklists'
import { shortDate } from '@/lib/dates'
import type { MockResult } from '@/lib/types'
import type { StudyStateRow } from '@/lib/storage/types'

const GRADE_COLOR: Record<TransferGrade, string> = { red: '#d4533f', yellow: '#e2a93b', green: '#2fa36b' }
const ROUTE_TITLE: Record<TransferGrade, string> = {
  red: 'Transfer and repair first',
  yellow: 'Transfer, timed singles, one mock',
  green: 'Mocks, each followed by repair'
}

export default function InterviewView() {
  const { repo, version, today } = useReps()
  void version
  const gate = useMockGate()
  const results = repo.engine
    .all('study_state')
    .filter((r: StudyStateRow) => r.id.startsWith('mock:'))
    .map((r) => r.value as MockResult)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  // Cold capstones for every problem you have met so far: its capstone (or the cold rep itself) is on a day up to today.
  const met = new Set(DAYS.filter((d) => d.date <= today).flatMap((d) => d.sections.flatMap((s) => s.exercises.map((e) => e.problemId).filter(Boolean))))
  const cold = MODULES.flatMap((m) => m.sections.flatMap((s) => s.exercises)).filter((e) => e.repType === 'cold' && e.problemId && met.has(e.problemId))

  return (
    <main data-mode="interview" className="flex-1 bg-canvas">
      <PageHero
        mood="night"
        eyebrow="Interview Mode"
        title="The scaffolding comes off."
        sub="Rehearsal for the real thing: 45 minutes in a focused room with a timer, a plain editor, your own tests and no assistance. Review happens afterward."
        deck
        aside={
          gate.gated ? (
            <div className="glass flex items-center gap-3 self-start rounded-2xl px-4 py-3">
              <span aria-hidden="true" className="size-3 rounded-full" style={{ background: GRADE_COLOR[gate.grade] }} />
              <div className="leading-tight">
                <p className="text-[15px] font-semibold capitalize">Route: {gate.grade}</p>
                <p className="num text-[12.5px] opacity-80">
                  {gate.done} of {gate.allowed} mocks used
                </p>
              </div>
            </div>
          ) : undefined
        }
      />
      <div className="relative mx-auto -mt-24 w-full max-w-[1180px] px-5 pb-28 sm:px-8">
      {gate.gated && (
        <section aria-labelledby="route-h" className="deck p-5 sm:p-7">
          <h2 id="route-h" className="section-title">
            Your Week 14 route
          </h2>
          <p className="mt-2 max-w-[720px] text-[14px] text-ink-2" data-testid="mock-gate">
            Mocks open with the evidence, not the calendar. Transfer grade: <span className="font-semibold text-ink">{gate.grade}</span>. {gate.note}{' '}
            {gate.allowed ? `${gate.done} of ${gate.allowed} done.` : ''}
          </p>
          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {(['red', 'yellow', 'green'] as const).map((g) => {
              const policy = mockPolicy(g)
              const here = gate.grade === g
              return (
                <li
                  key={g}
                  className={`flex flex-col rounded-2xl p-4 ${here ? 'bg-bg shadow-[0_0_0_2px_var(--ink)]' : 'bg-surface text-muted'}`}
                  data-route={g}
                  aria-current={here ? 'step' : undefined}
                >
                  <p className="flex items-center gap-2 text-[14px] font-semibold capitalize text-ink">
                    <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: GRADE_COLOR[g] }} />
                    {g}
                    {here && <span className="tag tag-plain ml-auto">You are here</span>}
                  </p>
                  <p className="mt-1 text-[12.5px] font-medium text-ink-2">{ROUTE_TITLE[g]}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed">{policy.note}</p>
                  <p className="num mt-auto pt-3 text-[12px]">
                    {policy.mocksAllowed ? `${policy.mocksAllowed} mock${policy.mocksAllowed === 1 ? '' : 's'} allowed` : 'No mocks yet'}
                  </p>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <h2 className={`section-title ${gate.gated ? 'mt-12' : ''}`}>Mock interviews</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {MOCKS.map((m) => {
          const past = results.filter((r) => r.mockId === m.id && r.completedAt)
          const open = gate.canStart(m.id)
          return (
            <li key={m.id} className={`flex flex-col gap-4 rounded-2xl p-6 ${open ? 'bg-shell text-shell-ink' : 'bg-surface text-muted'}`}>
              <div className="flex items-center justify-between">
                <span className={`grid size-10 place-items-center rounded-xl ${open ? 'bg-shell-3 text-white' : 'bg-surface-2 text-faint'}`}>
                  <GlyphTerminal size={18} />
                </span>
                <span className={`mono inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] ${open ? 'bg-shell-2 text-shell-ink' : 'bg-surface-2'}`}>
                  <GlyphTimer size={13} /> {m.minutes}:00
                </span>
              </div>
              <div>
                <h3 className="font-display text-[22px] font-semibold tracking-tight">{m.title}</h3>
                <p className={`mt-1 text-[13.5px] ${open ? 'text-shell-muted' : ''}`}>{m.note}</p>
              </div>
              <p className={`text-[12.5px] ${open ? 'text-shell-faint' : ''}`}>
                {m.minutes} min · {m.exerciseIds.length} problems
                {past.length ? ` · done ${past.length}×, last ${shortDate(past[0].startedAt.slice(0, 10))}` : ''}
              </p>
              {open ? (
                <Link href={`/interview/${m.id}`} className="btn self-start !bg-white !text-[#0b1220]">
                  {past.length ? 'Run it again' : 'Start'}
                </Link>
              ) : (
                <span className="btn self-start opacity-60" aria-disabled="true" data-testid="mock-locked">
                  Opens with readiness
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="mt-12">
        <InterviewTargetFull />
      </div>

      {cold.length > 0 && (
        <section className="mt-12">
          <h2 className="section-title">Timed cold solves</h2>
          <p className="mt-1 text-[13.5px] text-muted">Capstones from a blank editor, in Interview mode.</p>
          <ul className="mt-3 flex flex-wrap gap-2 text-[13.5px]">
            {cold.map((e) => (
              <li key={e.id}>
                <Link href={`/rep/${e.id}?mode=interview`} className="chip !h-8 !px-3">
                  {e.title.replace(' (cold)', '')}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cold.length === 0 && (
        <section className="mt-12">
          <h2 className="section-title">Timed cold solves</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            These open as you meet each capstone in the plan. The first is Two Sum, in week 1. <Link href="/" className="text-ink underline underline-offset-4">Go to Today</Link>.
          </p>
        </section>
      )}

      {results.length > 0 && (
        <section className="mt-12">
          <h2 className="section-title">In-app mock history</h2>
          <ul className="card mt-3 divide-y divide-line px-4 text-[13.5px]">
            {results.map((r) => (
              <li key={r.id} className="flex justify-between gap-4 py-2.5">
                <span>
                  {MOCKS.find((m) => m.id === r.mockId)?.title} · {shortDate(r.startedAt.slice(0, 10))}
                </span>
                <span className="text-muted">
                  {r.problems.map((p) => `${EXERCISE_BY_ID[p.exerciseId]?.title ?? p.exerciseId}: ${p.passed ? '✓' : '✗'}`).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <MockLog />
      <DesignTrack />
      <StoriesChecklist />
      </div>
    </main>
  )
}
