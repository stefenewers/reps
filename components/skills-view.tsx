'use client'

import Link from 'next/link'
import { useReps } from '@/components/reps-provider'
import { ScoreBar, StatusLabel } from '@/components/mastery-bits'
import { SKILLS, SKILL_GROUPS } from '@/data/skills'

export default function SkillsView() {
  const { mastery } = useReps()
  const seen = Object.values(mastery).filter((m) => m.status !== 'unseen')
  const fluent = seen.filter((m) => m.status === 'fluent' || m.status === 'competent').length
  const weak = seen.filter((m) => m.status === 'weak').length
  return (
    <main className="mx-auto w-full max-w-[880px] px-5 pb-28 pt-10">
      <h1 className="text-[28px] font-semibold tracking-tight">Skills</h1>
      <p className="mt-1 text-[14px] text-muted">
        {seen.length} of {SKILLS.length} practiced · {fluent} competent or better · {weak} weak. Mastery is computed from your attempts, never assigned.
      </p>
      <div className="mt-8 flex flex-col gap-10">
        {SKILL_GROUPS.map((g) => (
          <section key={g} aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="label mb-2">
              {g}
            </h2>
            <ul className="divide-y divide-line border-y border-line">
              {SKILLS.filter((s) => s.group === g).map((s) => {
                const m = mastery[s.id]
                return (
                  <li key={s.id}>
                    <Link href={`/skills/${s.id}`} className="grid grid-cols-[1fr_auto_32px_96px] items-center gap-2 px-1 py-2 sm:gap-4 text-[14px] hover:bg-surface">
                      <span className={m.status === 'unseen' ? 'text-muted' : ''}>{s.name}</span>
                      <ScoreBar score={m.score} className="max-sm:!w-12" />
                      <span className="text-right tabular-nums text-ink-2">{m.status === 'unseen' ? '—' : m.score}</span>
                      <StatusLabel status={m.status} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
