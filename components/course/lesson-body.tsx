import Link from 'next/link'
import CodeView from '@/components/code-view'
import Markdown from '@/components/markdown'
import { IconArrowRight, IconBulb, IconExternal, IconX } from '@/components/icons'
import type { Lesson } from '@/data/course/types'
import '@/components/demos/learning.css'

/** Anchor ids for a lesson's parts, shared with the page's "On this page" list. */
export const lessonAnchors = (lesson: Lesson) => [
  { id: 'idea', label: 'The idea' },
  { id: 'why', label: 'Why it matters' },
  ...lesson.sections.map((s, i) => ({ id: `part-${i + 1}`, label: s.heading })),
  { id: 'mistakes', label: 'Watch out for' }
]

/** The printed output of a code block, set as a console strip under it. */
export function Prints({ output }: { output: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-shell px-4 py-3 text-[#dfe7f3] sm:flex-row sm:items-start sm:gap-4">
      <p className="shrink-0 pt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-shell-muted">Prints</p>
      <pre className="mono whitespace-pre-wrap text-[13px] leading-relaxed">{output}</pre>
    </div>
  )
}

/** The picture to hold in your head, set apart from the prose. */
export function MentalModel({ text }: { text: string }) {
  return (
    <div className="mental-model">
      <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white/75">
        <IconBulb size={14} /> Mental model
      </p>
      <p className="font-display mt-2 text-[19px] leading-snug">
        <Markdown text={text} inline className="!text-[19px] !leading-snug !text-[#eef3ff]" />
      </p>
    </div>
  )
}

/** The usual ways it goes wrong, as cards to scan. */
export function Mistakes({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {items.map((m, i) => (
        <li key={i} className="flex gap-3 rounded-xl bg-repair-soft px-4 py-3 text-[14px] leading-relaxed text-ink">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white text-repair" aria-hidden="true">
            <IconX size={10} strokeWidth={2.4} />
          </span>
          <Markdown text={m} inline />
        </li>
      ))}
    </ul>
  )
}

/**
 * A lesson: what it is, the picture to hold, why it matters, worked parts, the
 * usual mistakes. Read top to bottom; each part is one move with its code and
 * what it prints.
 */
export default function LessonBody({ lesson, next }: { lesson: Lesson; next?: { href: string; label: string }[] }) {
  return (
    <article className="flex flex-col gap-12" data-testid="lesson">
      <section id="idea" className="lesson-block">
        <Markdown text={lesson.concept} className="!text-[18px] !leading-[1.65] text-ink" />
        <div className="mt-6">
          <MentalModel text={lesson.mentalModel} />
        </div>
      </section>

      <section id="why" className="lesson-block rounded-2xl bg-bg p-6 shadow-[0_0_0_1px_var(--hairline)]">
        <p className="eyebrow text-learn">Why it matters</p>
        <Markdown text={lesson.whyItMatters} className="mt-2 !text-[15.5px] !leading-relaxed" />
      </section>

      {lesson.sections.map((s, i) => (
        <section key={i} id={`part-${i + 1}`} className="lesson-block">
          <div className="flex items-center gap-3">
            <span className="lesson-num num" aria-hidden="true">
              {i + 1}
            </span>
            <h2 className="font-display text-[23px] font-semibold leading-tight tracking-tight text-ink">{s.heading}</h2>
          </div>
          <Markdown text={s.body} className="mt-3 !text-[15.5px] !leading-relaxed" />
          {(s.code || s.output !== undefined) && (
            <div className="mt-4 grid gap-2">
              {s.code && <CodeView code={s.code} />}
              {s.output !== undefined && <Prints output={s.output} />}
            </div>
          )}
        </section>
      ))}

      <section id="mistakes" className="lesson-block">
        <p className="eyebrow text-repair">Watch out for</p>
        <Mistakes items={lesson.mistakes} />
      </section>

      {lesson.resources?.length ? (
        <section>
          <p className="label">If you want another explanation</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {lesson.resources.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[14px] text-ink hover:underline">
                  {r.title} <IconExternal size={11} className="text-muted" />
                </a>
                {r.note && <span className="ml-2 text-[12.5px] text-muted">{r.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {next?.length ? (
        <section className="rounded-2xl bg-learn-soft p-5 sm:p-6">
          <p className="eyebrow text-learn">Up next</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {next.map((n, i) => (
              <Link key={n.href} href={n.href} className={`btn btn-lg ${i === 0 ? 'btn-accent' : ''}`}>
                {n.label} <IconArrowRight size={14} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
