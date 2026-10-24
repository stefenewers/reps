import Link from 'next/link'
import type { ReactNode } from 'react'
import LearnHero from '@/components/demos/learn-hero'
import LearnMark from '@/components/course/learn-mark'
import { IconArrowRight, IconBook, IconPlay } from '@/components/icons'
import { demosForConcept } from '@/lib/demos'
import { library, THREAD_LABEL } from '@/lib/course/library'

export const metadata = { title: 'Learn' }

/** Card previews are plain text: markdown markers are dropped, not shown. */
const plain = (s: string) => s.replace(/\*\*|`|\*/g, '')

function Section({ id, title, sub, children }: { id: string; title: string; sub: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20">
      <h3 id={`${id}-h`} className="text-[18px] font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-1 max-w-[760px] text-[13.5px] text-muted">{sub}</p>
      {children}
    </section>
  )
}

/** A lesson row in a track list: title, week and state, minutes, and the labs that build on it. */
function LessonRow({ id, title, sub, week, minutes, labs }: { id: string; title: string; sub: string; week?: number; minutes?: number; labs: { id: string; title: string }[] }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-xl bg-bg px-4 py-3.5 shadow-[0_0_0_1px_var(--hairline)] sm:flex-row sm:items-start sm:gap-4" data-lesson={id}>
      <div className="min-w-0 flex-1">
        <Link href={`/learn/${id}`} className="text-[15px] font-semibold tracking-tight text-ink hover:underline">
          {title}
        </Link>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{sub}</p>
        {labs.length > 0 && (
          <p className="mt-1 text-[12.5px] text-ink-2">
            Used in:{' '}
            {labs.map((l, i) => (
              <span key={l.id}>
                {i > 0 ? ', ' : ''}
                <Link href={`/lab/${l.id}`} className="underline underline-offset-2 hover:text-ink">
                  {l.title}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
        <LearnMark id={id} week={week} />
        {minutes && <span className="text-[12px] text-muted">{minutes} min</span>}
      </div>
    </li>
  )
}

/**
 * The Learn library: everything Reps teaches, grouped by track and ordered by the week it is taught,
 * all derived from course data. Browse everything here; Today assigns what to train.
 */
export default function LearnIndex() {
  const lib = library()
  const tracks = [
    {
      href: '#core',
      title: THREAD_LABEL.core,
      line: 'Programming foundations, then the patterns and data structures interviews are made of.',
      meta: `${lib.foundations.length} lessons · ${lib.concepts.length} concept guides · ${lib.spans.core}`
    },
    {
      href: '#applied',
      title: THREAD_LABEL.applied,
      line: 'Build reliable software around APIs, models and customer workflows: contracts, reliability, tools, evals, retrieval.',
      meta: `${lib.applied.length} short lessons · ${lib.spans.applied}`
    },
    {
      href: '#design',
      title: THREAD_LABEL.design,
      line: 'Practical design reasoning: components, state, data flow, failures and tradeoffs, from one program to an AI system.',
      meta: `${lib.design.length} short lessons · ${lib.spans.design}`
    }
  ]
  const jump = [
    ['#core', THREAD_LABEL.core],
    ['#applied', THREAD_LABEL.applied],
    ['#design', THREAD_LABEL.design],
    ['#builds', 'Builds'],
    ['#watch', 'Demos'],
    ['#examples', 'Worked examples']
  ]
  return (
    <main className="flex-1 bg-canvas">
      <LearnHero
        kind="Library"
        crumbs={[{ href: '/', label: 'Today' }]}
        title="Learn"
        sub="Everything Reps teaches, in one library. Browse anything, any time: reading ahead is fine and never counted. Today still decides what you train each day."
        meta={
          <>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{lib.foundations.length + lib.applied.length + lib.design.length} lessons</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{lib.concepts.length} concept guides</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{lib.demos.length} interactive demos</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{lib.labs.length} builds</span>
          </>
        }
      />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-14 px-5 pt-8 pb-24 sm:px-8">
        {/* The three tracks, at a glance. */}
        <section aria-label="Tracks">
          <ul className="grid gap-2 sm:gap-3 md:grid-cols-3" data-testid="learn-tracks">
            {tracks.map((t) => (
              <li key={t.href}>
                <a
                  href={t.href}
                  className="group flex h-full flex-col rounded-2xl bg-bg px-4 py-3.5 shadow-[0_0_0_1px_var(--hairline)] transition-shadow hover:shadow-[0_0_0_1px_var(--line-strong),var(--shadow-md)]"
                >
                  <span className="font-display text-[21px] font-semibold tracking-tight text-ink">{t.title}</span>
                  <span className="mt-1.5 hidden text-[13.5px] leading-relaxed text-ink-2 sm:block">{t.line}</span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-[12.5px] text-muted sm:pt-4">
                    {t.meta}
                    <IconArrowRight size={13} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <nav aria-label="Jump to" className="sticky top-14 z-10 -mx-1 mt-4 flex gap-1.5 overflow-x-auto bg-canvas/90 px-1 py-2 backdrop-blur-sm [scrollbar-width:none] lg:top-0">
            {jump.map(([href, label]) => (
              <a key={href} href={href} className="tag tag-plain !h-8 shrink-0 !px-3 !text-[11.5px] hover:bg-surface-3">
                {label}
              </a>
            ))}
          </nav>
        </section>

        {/* CORE SWE */}
        <div id="core" className="flex scroll-mt-20 flex-col gap-10">
          <h2 className="section-title">{THREAD_LABEL.core}</h2>
          <Section id="foundations" title="Foundations" sub={`How programs hold state, and how to take a problem apart. ${lib.spans.foundations}.`}>
            <ul className="mt-4 flex flex-col gap-2">
              {lib.foundations.map(({ lesson, week, labs }) => (
                <LessonRow key={lesson.id} id={lesson.id} title={lesson.title} sub={plain(lesson.mentalModel)} week={week} minutes={lesson.minutes} labs={labs} />
              ))}
            </ul>
          </Section>
          <Section
            id="patterns"
            title="Patterns and data structures"
            sub={`The full guide for each idea the course trains, in the order it is taught (${lib.spans.concepts}), with a video that teaches the idea, not one problem's answer.`}
          >
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lib.concepts.map(({ concept: c, week }) => (
                <li key={c.id}>
                  <Link href={`/learn/${c.id}`} className="card interactive flex h-full flex-col p-5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <LearnMark id={c.id} week={week} />
                      {demosForConcept(c.id).length > 0 && (
                        <span className="tag tag-learn">
                          <IconPlay size={8} /> Interactive
                        </span>
                      )}
                    </span>
                    <span className="mt-3 text-[16px] font-semibold tracking-tight text-ink">{c.title}</span>
                    <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{plain(c.mentalModel)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* APPLIED ENGINEERING */}
        <div id="applied" className="flex scroll-mt-20 flex-col gap-4" data-testid="learn-applied">
          <div>
            <h2 className="section-title">{THREAD_LABEL.applied}</h2>
            <p className="mt-1 max-w-[760px] text-[13.5px] text-muted">
              {lib.applied.length} short lessons ({lib.spans.applied}), each 5–10 minutes with checks. Software as a system first, then the model as one
              component. Each appears on Today in its week, before the build that uses it.
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {lib.applied.map(({ lesson, week, labs }) => (
              <LessonRow key={lesson.id} id={lesson.id} title={lesson.title} sub={plain(lesson.concept)} week={week} minutes={lesson.minutes} labs={labs} />
            ))}
          </ul>
        </div>

        {/* SYSTEM DESIGN */}
        <div id="design" className="flex scroll-mt-20 flex-col gap-4" data-testid="learn-design">
          <div>
            <h2 className="section-title">{THREAD_LABEL.design}</h2>
            <p className="mt-1 max-w-[760px] text-[13.5px] text-muted">
              {lib.design.length} short lessons ({lib.spans.design}): the design questions every build asks, then how applications fit together, fail and
              scale. Junior scope: what a strong SWE I is expected to reason about.
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {lib.design.map(({ lesson, week, labs }) => (
              <LessonRow key={lesson.id} id={lesson.id} title={lesson.title} sub={plain(lesson.concept)} week={week} minutes={lesson.minutes} labs={labs} />
            ))}
          </ul>
        </div>

        {/* BUILDS */}
        <section id="builds" aria-labelledby="builds-h" className="scroll-mt-20">
          <h2 id="builds-h" className="section-title">
            Builds
          </h2>
          <p className="mt-1 max-w-[760px] text-[13.5px] text-muted">
            Small, real programs ({lib.spans.labs}): design, build, change, review. Each lists the lessons it builds on. Done or not done; never counted as reps.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lib.labs.map(({ lab, week, track }) => (
              <li key={lab.id}>
                <Link href={`/lab/${lab.id}`} className="card interactive flex h-full flex-col gap-2 p-4">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <LearnMark id={lab.id} week={week} kind="lab" />
                    <span className={`tag ${track === 'applied' ? 'tag-cold' : 'tag-plain'}`}>{THREAD_LABEL[track]}</span>
                    {lab.optional && <span className="tag tag-locked">Optional</span>}
                  </span>
                  <span className="text-[15px] font-semibold tracking-tight text-ink">{lab.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* DEMOS */}
        <section id="watch" aria-labelledby="watch-h" className="scroll-mt-20">
          <h2 id="watch-h" className="section-title">
            Watch it move
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">Step through each algorithm and see the state change: pointers, windows, stacks, frontiers, tables.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lib.demos.map(({ demo: d, week }) => (
              <li key={d.id}>
                <Link href={`/demo/${d.id}`} className="group flex h-full flex-col rounded-2xl bg-shell p-5 text-shell-ink transition-transform duration-150 hover:-translate-y-0.5">
                  <span className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-shell-muted">{week ? `Week ${week}` : 'Demo'}</span>
                    <span className="grid size-8 place-items-center rounded-full bg-accent-bright text-white transition-transform group-hover:scale-110" aria-hidden="true">
                      <IconPlay size={11} />
                    </span>
                  </span>
                  <span className="font-display mt-3 text-[19px] font-semibold leading-snug tracking-tight">{d.title}</span>
                  <span className="mt-1.5 text-[13px] leading-relaxed text-shell-muted">{d.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* WORKED EXAMPLES */}
        <section id="examples" aria-labelledby="examples-h" className="scroll-mt-20">
          <h2 id="examples-h" className="section-title">
            Worked examples
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">One complete solution, goal by goal, then rebuilt from a blank editor.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lib.examples.map(({ example: w, week }) => (
              <li key={w.id}>
                <Link href={`/example/${w.id}`} className="card interactive flex h-full items-start gap-3 p-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-learn-soft text-learn" aria-hidden="true">
                    <IconBook size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-semibold tracking-tight text-ink">{w.title}</span>
                    <span className="mt-1 block">
                      <LearnMark id={w.id} week={week} kind="example" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
