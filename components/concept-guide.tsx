'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import CodeView from '@/components/code-view'
import { IconExternal, IconPlay } from '@/components/icons'
import Markdown from '@/components/markdown'
import { MentalModel, Mistakes, Prints } from '@/components/course/lesson-body'
import { GUIDE_BEHAVIOUR, type Concept } from '@/data/concepts'

/**
 * The Learn layer for one concept: what it is, why it matters, the mental model,
 * the core moves, the usual shape, the mistakes to watch, and a concept video.
 * Composed from the primers; never a problem's solution.
 */

export function ConceptBody({ concept: c, full = false }: { concept: Concept; full?: boolean }) {
  return (
    <div className="flex flex-col gap-3.5" data-testid="concept-body">
      <Markdown text={c.concept} className="!text-[14px] !leading-relaxed" />
      <p className="text-[13.5px] leading-relaxed text-ink-2">
        <span className="font-medium text-ink">Mental model: </span>
        {c.mentalModel}
      </p>
      <div>
        <p className="label mb-1">Why it matters</p>
        <p className="text-[13.5px] leading-relaxed text-ink-2">{c.whyItMatters}</p>
      </div>
      <div>
        <p className="label mb-1">Core moves</p>
        <ul className="well divide-y divide-line overflow-hidden">
          {c.coreMoves.slice(0, full ? 7 : 4).map((x, k) => (
            <li key={k} className="grid gap-x-4 gap-y-0.5 px-3.5 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <code className="mono whitespace-pre-wrap text-[12.5px] text-ink">{x.code}</code>
              <span className="text-[12.5px] leading-relaxed text-muted">
                <Markdown text={x.note} inline className="!text-[12.5px]" />
              </span>
            </li>
          ))}
        </ul>
      </div>
      {c.shape && (
        <div>
          <p className="label mb-1">The usual shape</p>
          <ol className="flex list-decimal flex-col gap-0.5 pl-5 text-[13.5px] leading-relaxed text-ink-2">
            {c.shape.map((s, k) => (
              <li key={k}>
                <Markdown text={s} inline className="!text-[13.5px]" />
              </li>
            ))}
          </ol>
        </div>
      )}
      <div>
        <p className="label mb-1">Watch out for</p>
        <ul className="flex list-disc flex-col gap-0.5 pl-5 text-[13px] leading-relaxed text-ink-2">
          {c.commonMistakes.slice(0, full ? 5 : 3).map((m, k) => (
            <li key={k}>
              <Markdown text={m} inline className="!text-[13px]" />
            </li>
          ))}
        </ul>
      </div>
      {c.videos.length > 0 && (
        <div>
          <p className="label mb-1">Watch the idea</p>
          <ul className="flex flex-col gap-1.5">
            {c.videos.map((v) => (
              <li key={v.url}>
                <a href={v.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 text-[13.5px] text-ink hover:underline" data-testid="concept-video">
                  <IconPlay size={10} className="mt-1.5 shrink-0" />
                  <span>
                    {v.title} <span className="text-muted">· {v.channel} · {v.duration}</span> <IconExternal size={11} className="inline text-muted" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[12px] text-faint">A concept explanation, not a solution to this rep. Watch, then come back and type it.</p>
        </div>
      )}
      <details className="group">
        <summary className="cursor-pointer list-none text-[12.5px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink [&::-webkit-details-marker]:hidden">More examples</summary>
        <div className="mt-2 flex flex-col gap-3">
          {c.primers.map((p) => (
            <div key={p.id}>
              <p className="text-[13px] font-medium text-ink">{p.title}</p>
              <div className="mt-1">
                <CodeView code={p.example.code} />
              </div>
              <p className="mono mt-1 whitespace-pre-wrap text-[12px] text-muted">prints: {p.example.output}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

/**
 * The full guide on its own page (/learn/[id] for a concept): the same content
 * as the in-rep panel, laid out as a lesson. `demos` sits after "why", so the
 * picture comes before the moves.
 */
export function ConceptLesson({ concept: c, demos }: { concept: Concept; demos?: ReactNode }) {
  return (
    <article className="flex flex-col gap-12" data-testid="concept-body">
      <section id="idea" className="lesson-block">
        <Markdown text={c.concept} className="!text-[18px] !leading-[1.65] text-ink" />
        <div className="mt-6">
          <MentalModel text={c.mentalModel} />
        </div>
      </section>
      <section id="why" className="lesson-block rounded-2xl bg-bg p-6 shadow-[0_0_0_1px_var(--hairline)]">
        <p className="eyebrow text-learn">Why it matters</p>
        <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">{c.whyItMatters}</p>
      </section>
      {demos && (
        <section id="watch" className="lesson-block">
          <h2 className="font-display text-[23px] font-semibold tracking-tight">Watch it move</h2>
          <p className="mt-1 text-[14px] text-muted">Step through it. Predict before each reveal; then try your own input.</p>
          <div className="mt-4">{demos}</div>
        </section>
      )}
      <section id="moves" className="lesson-block">
        <h2 className="font-display text-[23px] font-semibold tracking-tight">Core moves</h2>
        <ul className="mt-4 grid gap-2">
          {c.coreMoves.map((x, k) => (
            <li key={k} className="grid gap-x-5 gap-y-1.5 rounded-xl bg-bg p-3 shadow-[0_0_0_1px_var(--hairline)] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:items-center">
              <code className="mono block whitespace-pre-wrap rounded-lg bg-shell px-3 py-2 text-[12.5px] text-[#dfe7f3]">{x.code}</code>
              <span className="text-[13.5px] leading-relaxed text-ink-2">
                <Markdown text={x.note} inline className="!text-[13.5px]" />
              </span>
            </li>
          ))}
        </ul>
      </section>
      {c.shape && (
        <section id="shape" className="lesson-block">
          <h2 className="font-display text-[23px] font-semibold tracking-tight">The usual shape</h2>
          <ol className="mt-4 flex flex-col gap-2">
            {c.shape.map((s, k) => (
              <li key={k} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-2">
                <span className="lesson-num num" aria-hidden="true">
                  {k + 1}
                </span>
                <span className="pt-0.5">
                  <Markdown text={s} inline className="!text-[15px]" />
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section id="example" className="lesson-block">
        <h2 className="font-display text-[23px] font-semibold tracking-tight">An example</h2>
        <div className="mt-4 grid gap-2">
          <CodeView code={c.example.code} />
          <Prints output={c.example.output} />
        </div>
      </section>
      <section id="mistakes" className="lesson-block">
        <p className="eyebrow text-repair">Watch out for</p>
        <Mistakes items={c.commonMistakes} />
      </section>
      {c.videos.length > 0 && (
        <section id="videos" className="lesson-block">
          <p className="eyebrow text-learn">Watch the idea</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {c.videos.map((v) => (
              <li key={v.url}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-full items-start gap-3 rounded-xl bg-bg p-3.5 text-[13.5px] text-ink shadow-[0_0_0_1px_var(--hairline)] transition-colors hover:bg-surface"
                  data-testid="concept-video"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-learn text-white" aria-hidden="true">
                    <IconPlay size={12} />
                  </span>
                  <span>
                    <span className="font-medium">{v.title}</span> <IconExternal size={11} className="inline text-muted" />
                    <span className="block text-[12.5px] text-muted">
                      {v.channel} · {v.duration}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-faint">A concept explanation, not a solution to a rep. Watch, then come back and type it.</p>
        </section>
      )}
      {c.primers.length > 0 && (
        <details className="group rounded-2xl bg-surface px-5 py-4">
          <summary className="cursor-pointer text-[14px] font-medium text-ink-2">More examples ({c.primers.length})</summary>
          <div className="mt-4 flex flex-col gap-5">
            {c.primers.map((p) => (
              <div key={p.id}>
                <p className="text-[14px] font-semibold text-ink">{p.title}</p>
                <div className="mt-2 grid gap-2">
                  <CodeView code={p.example.code} />
                  <Prints output={p.example.output} />
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </article>
  )
}

/**
 * The Learn panel inside a rep. How it behaves depends on what the rep is for:
 * - learn (first exposure): open, labelled "read this first";
 * - drill / combine: collapsed, one click away, opening it costs nothing;
 * - prove (capstone, check, transfer, cold): collapsed, and opening it counts as help;
 * - interview mode: not shown at all (the caller does not render it).
 */
export default function ConceptGuide({ concept, mode, label, onAssisted }: { concept: Concept; mode: 'learn' | 'practice' | 'prove'; label?: string; onAssisted?: () => void }) {
  const [open, setOpen] = useState(GUIDE_BEHAVIOUR[mode].open)
  const toggle = () => {
    if (!open && GUIDE_BEHAVIOUR[mode].assisted) onAssisted?.()
    setOpen((v) => !v)
  }
  return (
    <section aria-label={`Learn: ${concept.title}`} className={`rounded-xl ${open ? 'bg-surface px-4 py-3.5 shadow-[inset_2px_0_0_var(--accent)]' : 'shadow-[inset_0_0_0_1px_var(--line)]'}`} data-testid="concept-guide" data-mode={mode} data-open={open ? 'true' : 'false'}>
      <button type="button" onClick={toggle} aria-expanded={open} className={`flex w-full items-center justify-between gap-3 text-left ${open ? '' : 'px-4 py-2.5'}`}>
        <span className="text-[13px]">
          <span className="label mr-2 !text-ink-2">{label ?? (mode === 'learn' ? 'New here · read this first' : 'Learn')}</span>
          <span className="font-medium text-ink">{concept.title}</span>
        </span>
        <span className="shrink-0 text-[12px] text-muted">{open ? 'Hide' : mode === 'prove' ? 'Open (counts as help)' : 'Open'}</span>
      </button>
      {open && (
        <div className="mt-3">
          <ConceptBody concept={concept} />
          <p className="mt-3 text-[12px] text-muted">
            <Link href={`/learn/${concept.id}`} className="underline decoration-line-strong underline-offset-4 hover:text-ink">
              The full guide
            </Link>{' '}
            opens on its own page.
          </p>
        </div>
      )}
    </section>
  )
}
