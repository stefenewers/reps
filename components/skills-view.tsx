'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useReps } from '@/components/reps-provider'
import { ScoreBar, StatusLabel } from '@/components/mastery-bits'
import { SKILLS, SKILL_GROUPS } from '@/data/skills'
import type { Attempt } from '@/lib/types'

/** Evidence behind a number: what was actually written, and what slipped cold. */
export function evidenceFor(skill: string, attempts: Attempt[]) {
  let n = 0
  let cleanWrites = 0
  let coldMiss = 0
  let debugFixes = 0
  for (const a of attempts) {
    if (!a.skills.includes(skill) || !(a.completedAt || a.attemptsBeforePass > 0)) continue
    n++
    const production = a.stage !== 'recognize' && a.stage !== 'trace'
    if (a.passed && production && a.hintsUsed === 0 && !a.solutionViewed && a.attemptsBeforePass === 0) cleanWrites++
    if (a.passed && a.stage === 'debug') debugFixes++
    if (a.retrievalType === 'cold' && !a.passed) coldMiss++
  }
  return { n, cleanWrites, coldMiss, debugFixes }
}

export function evidenceText(e: ReturnType<typeof evidenceFor>): string {
  if (!e.n) return 'No reps yet'
  return [
    `${e.n} attempt${e.n === 1 ? '' : 's'}`,
    e.cleanWrites && `${e.cleanWrites} clean write${e.cleanWrites === 1 ? '' : 's'}`,
    e.debugFixes && `${e.debugFixes} fix${e.debugFixes === 1 ? '' : 'es'}`,
    e.coldMiss && `${e.coldMiss} cold miss${e.coldMiss === 1 ? '' : 'es'}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export default function SkillsView() {
  const { mastery, attempts } = useReps()
  const seen = Object.values(mastery).filter((m) => m.status !== 'unseen')
  const strong = seen.filter((m) => m.status === 'fluent' || m.status === 'competent').length
  const weak = seen.filter((m) => m.status === 'weak').length
  const evidence = useMemo(() => Object.fromEntries(SKILLS.map((s) => [s.id, evidenceFor(s.id, attempts)])), [attempts])

  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-10 sm:px-8">
        <h1 className="display">Skills</h1>
        <p className="mt-2 max-w-[640px] text-[14.5px] text-muted">Mastery comes from what you actually wrote, debugged and recalled cold. Recognising something is never enough to look fluent.</p>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
          {[
            ['Practiced', `${seen.length} of ${SKILLS.length}`],
            ['Competent or better', String(strong)],
            ['Needs reps', String(weak)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd className="num mt-1 text-[20px] font-semibold tracking-tight">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-col gap-10">
          {SKILL_GROUPS.map((g) => {
            const list = SKILLS.filter((s) => s.group === g)
            return (
              <section key={g} aria-labelledby={`g-${g}`}>
                <h2 id={`g-${g}`} className="h2 mb-3">
                  {g}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => {
                    const m = mastery[s.id]
                    const unseen = m.status === 'unseen'
                    return (
                      <li key={s.id} className="min-w-0">
                        <Link href={`/skills/${s.id}`} className={`card interactive flex h-full flex-col gap-3 p-4 ${unseen ? '!bg-transparent' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <span className={`text-[14.5px] font-medium ${unseen ? 'text-muted' : 'text-ink'}`}>{s.name}</span>
                            <span className={`num text-[20px] font-semibold leading-none tracking-tight ${unseen ? 'text-faint' : ''}`}>{unseen ? '—' : m.score}</span>
                          </div>
                          <ScoreBar score={m.score} className="!w-full" />
                          <div className="flex items-center justify-between gap-2">
                            <StatusLabel status={m.status} compact />
                            <span className="truncate text-[12px] text-muted">{evidenceText(evidence[s.id])}</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
