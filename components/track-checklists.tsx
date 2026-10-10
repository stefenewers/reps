'use client'

import { useReps } from '@/components/reps-provider'
import { DESIGN_TRACK } from '@/data/design-track'
import { STORY_PROMPTS } from '@/data/stories'

/** The design track and the twelve stories, as checklists that sync. */

type StoryStatus = 'todo' | 'draft' | 'polished'
const NEXT: Record<StoryStatus, StoryStatus> = { todo: 'draft', draft: 'polished', polished: 'todo' }
const STORY_LABEL: Record<StoryStatus, string> = { todo: 'Not started', draft: 'Draft', polished: 'Polished' }

export function DesignTrack() {
  const { repo, version } = useReps()
  void version
  const done = (id: string) => Boolean(repo.state<{ done?: boolean }>(`design:${id}`)?.done)
  const count = DESIGN_TRACK.filter((d) => done(d.id)).length
  return (
    <section aria-labelledby="design-h" className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="design-h" className="h2">
          Design track
        </h2>
        <p className="num text-[12.5px] text-muted">
          {count} of {DESIGN_TRACK.length} done
        </p>
      </div>
      <p className="mt-1 max-w-[640px] text-[13.5px] text-muted">One item for most Mondays from week 3. The bar for SWE I is clean classes, a sensible data model and depth on your own work.</p>
      <ul className="card mt-4 divide-y divide-line px-4">
        {DESIGN_TRACK.map((d) => (
          <li key={d.id} className="flex items-start gap-3 py-3">
            <input
              id={`design-${d.id}`}
              type="checkbox"
              checked={done(d.id)}
              onChange={(e) => void repo.setState(`design:${d.id}`, e.target.checked ? { done: true, at: new Date().toISOString() } : {})}
              className="mt-1 size-4 shrink-0 accent-[var(--ink)]"
            />
            <label htmlFor={`design-${d.id}`} className="min-w-0 flex-1">
              <span className="text-[14px] font-medium text-ink">{d.title}</span>
              <span className="ml-2 text-[12.5px] text-muted">
                Week {d.week} · {d.kind}
              </span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-2">{d.deliverables.join(' · ')}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function StoriesChecklist() {
  const { repo, version } = useReps()
  void version
  const status = (id: string): StoryStatus => repo.state<{ status?: StoryStatus }>(`story:${id}`)?.status ?? 'todo'
  const polished = STORY_PROMPTS.filter((s) => status(s.id) === 'polished').length
  const drafted = STORY_PROMPTS.filter((s) => status(s.id) === 'draft').length
  return (
    <section aria-labelledby="stories-h" className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="stories-h" className="h2">
          Stories
        </h2>
        <p className="num text-[12.5px] text-muted">
          {polished} polished · {drafted} in draft · {STORY_PROMPTS.length - polished - drafted} to go
        </p>
      </div>
      <p className="mt-1 max-w-[640px] text-[13.5px] text-muted">Twelve prompts to have a two-minute story for, in your own words. Tap a status to move it on: not started → draft → polished.</p>
      <ol className="card mt-4 divide-y divide-line px-4">
        {STORY_PROMPTS.map((s, i) => {
          const st = status(s.id)
          return (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <span className="num w-5 shrink-0 text-right text-[12.5px] text-muted">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="text-[14px] text-ink">{s.prompt}</span>
                <span className="block text-[12.5px] text-muted">{s.theme}</span>
              </span>
              <button
                type="button"
                onClick={() => void repo.setState(`story:${s.id}`, NEXT[st] === 'todo' ? {} : { status: NEXT[st], at: new Date().toISOString() })}
                aria-label={`${s.prompt}: ${STORY_LABEL[st]}. Change status`}
                className={`btn btn-sm shrink-0 ${st === 'polished' ? 'btn-primary' : ''}`}
              >
                {STORY_LABEL[st]}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
