'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useReps } from '@/components/reps-provider'
import { ScoreBar, StatusLabel } from '@/components/mastery-bits'
import { SKILLS, SKILL_GROUPS } from '@/data/skills'
import { GROUP_GLYPH, GlyphBraces } from '@/components/concept-icons'
import { createElement } from 'react'
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

type Filter = 'all' | 'practiced' | 'weak' | 'unseen'
type Sort = 'group' | 'weakest' | 'strongest' | 'recent'
const FILTERS: Record<Filter, { label: string; keep: (status: string) => boolean }> = {
  all: { label: 'All', keep: () => true },
  practiced: { label: 'Practiced', keep: (s) => s !== 'unseen' },
  weak: { label: 'Needs reps', keep: (s) => s === 'weak' },
  unseen: { label: 'Not started', keep: (s) => s === 'unseen' },
}

export default function SkillsView() {
  const { mastery, attempts } = useReps()
  const seen = Object.values(mastery).filter((m) => m.status !== 'unseen')
  const strong = seen.filter((m) => m.status === 'fluent' || m.status === 'competent').length
  const weak = seen.filter((m) => m.status === 'weak').length
  const evidence = useMemo(() => Object.fromEntries(SKILLS.map((s) => [s.id, evidenceFor(s.id, attempts)])), [attempts])
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('group')
  const shown = SKILLS.filter((s) => FILTERS[filter].keep(mastery[s.id].status))
  const sorted =
    sort === 'weakest'
      ? [...shown].sort((a, b) => Number(mastery[a.id].status === 'unseen') - Number(mastery[b.id].status === 'unseen') || mastery[a.id].score - mastery[b.id].score)
      : sort === 'strongest'
        ? [...shown].sort((a, b) => mastery[b.id].score - mastery[a.id].score)
        : sort === 'recent'
          ? [...shown].sort((a, b) => (mastery[b.id].lastPracticed ?? '').localeCompare(mastery[a.id].lastPracticed ?? ''))
          : shown
  // Sorted views are one flat list; the default keeps the skill groups.
  const groups: { title: string | null; list: typeof SKILLS }[] = sort === 'group' ? SKILL_GROUPS.map((g) => ({ title: g as string, list: sorted.filter((s) => s.group === g) })).filter((g) => g.list.length) : [{ title: null, list: sorted }]

  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-28 pt-10 sm:px-8">
        <h1 className="display-xl">Skills</h1>
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

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div role="radiogroup" aria-label="Show" className="seg">
            {(Object.keys(FILTERS) as Filter[]).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
                {FILTERS[f].label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[13px] text-muted">
            Sort
            <select className="input !h-8 !w-auto !py-0 text-[13px]" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="group">By group</option>
              <option value="weakest">Weakest first</option>
              <option value="strongest">Strongest first</option>
              <option value="recent">Most recently practiced</option>
            </select>
          </label>
          <p className="num text-[12.5px] text-muted" role="status">
            {shown.length} of {SKILLS.length} skills
          </p>
        </div>

        {shown.length === 0 && (
          <p className="mt-8 text-[14px] text-muted">
            No skills match. {filter === 'weak' ? 'Nothing needs reps right now.' : 'Skills appear here as you practice them.'}{' '}
            <button type="button" className="text-ink underline underline-offset-4" onClick={() => setFilter('all')}>
              Show all skills
            </button>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-10">
          {groups.map(({ title: g, list }) => {
            return (
              <section key={g ?? 'all'} aria-label={g ?? 'Skills'}>
                {g && (
                  <h2 className="h2 mb-3 flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-lg bg-bg text-ink-2 shadow-[0_0_0_1px_var(--hairline)]">{createElement(GROUP_GLYPH[g as keyof typeof GROUP_GLYPH] ?? GlyphBraces, { size: 15 })}</span>
                    {g}
                    <span className="num text-[12.5px] font-normal text-muted">
                      {SKILLS.filter((x) => x.group === g && mastery[x.id].status !== 'unseen').length}/{SKILLS.filter((x) => x.group === g).length}
                    </span>
                  </h2>
                )}
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
                          <ScoreBar score={m.score} status={m.status} className="!w-full" />
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
