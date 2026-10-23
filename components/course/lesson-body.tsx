import Link from 'next/link'
import CodeView from '@/components/code-view'
import Markdown from '@/components/markdown'
import { IconArrowRight, IconExternal } from '@/components/icons'
import type { Lesson } from '@/data/course/types'

/** A lesson: what it is, the picture to hold, why it matters, worked sections, the usual mistakes. */
export default function LessonBody({ lesson, next }: { lesson: Lesson; next?: { href: string; label: string }[] }) {
  return (
    <article className="flex flex-col gap-6" data-testid="lesson">
      <section>
        <Markdown text={lesson.concept} className="!text-[15.5px]" />
        <p className="mt-3 rounded-xl bg-learn-soft px-4 py-3 text-[14px] leading-relaxed text-ink">
          <span className="font-semibold">Mental model: </span>
          {lesson.mentalModel}
        </p>
      </section>
      <section>
        <p className="label">Why it matters</p>
        <Markdown text={lesson.whyItMatters} className="mt-1 !text-[14.5px]" />
      </section>
      {lesson.sections.map((s, i) => (
        <section key={i}>
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">{s.heading}</h2>
          <Markdown text={s.body} className="mt-1.5 !text-[14.5px]" />
          {s.code && <CodeView code={s.code} className="mt-3" />}
          {s.output !== undefined && (
            <div className="mt-2">
              <p className="label">Prints</p>
              <pre className="code-view mt-1">{s.output}</pre>
            </div>
          )}
        </section>
      ))}
      <section>
        <p className="label">Watch out for</p>
        <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-[14px] leading-relaxed text-ink-2">
          {lesson.mistakes.map((m, i) => (
            <li key={i}>
              <Markdown text={m} inline />
            </li>
          ))}
        </ul>
      </section>
      {lesson.resources?.length ? (
        <section>
          <p className="label">If you want another explanation</p>
          <ul className="mt-1.5 flex flex-col gap-1.5">
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
        <div className="flex flex-wrap gap-2 pt-2">
          {next.map((n, i) => (
            <Link key={n.href} href={n.href} className={`btn ${i === 0 ? 'btn-accent' : ''}`}>
              {n.label} <IconArrowRight size={14} />
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  )
}
