import Link from 'next/link'
import LearnHero from '@/components/demos/learn-hero'
import { IconArrowRight, IconBook, IconPlay } from '@/components/icons'
import { CONCEPTS, CONCEPT_BY_ID } from '@/data/concepts'
import { LESSONS } from '@/data/course/lessons'
import { UNITS } from '@/data/course/units'
import { DEMOS, demosForConcept } from '@/lib/demos'

export const metadata = { title: 'Learn' }

/** Card previews are plain text: markdown markers are dropped, not shown. */
const plain = (s: string) => s.replace(/\*\*|`|\*/g, '')

/** Every lesson, every concept guide and every moving picture, in course order. */
export default function LearnIndex() {
  const weekOf = (id: string) => UNITS.find((u) => u.lessonIds.includes(id))?.week
  return (
    <main className="flex-1 bg-canvas">
      <LearnHero
        kind="Lesson"
        crumbs={[{ href: '/', label: 'Today' }]}
        title="Learn"
        sub="The ideas behind the reps: what each one is, the picture to hold, the moves you will type, and the algorithm moving step by step. Learn it, then go produce it."
        meta={
          <>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{LESSONS.length} lessons</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{CONCEPTS.length} concept guides</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{DEMOS.length} interactive demos</span>
          </>
        }
      />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-14 px-5 pt-10 pb-24 sm:px-8">
        <section aria-labelledby="watch-h">
          <h2 id="watch-h" className="section-title">
            Watch it move
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">Step through each algorithm and see the state change: pointers, windows, stacks, frontiers, tables.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DEMOS.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/demo/${d.id}`}
                  className="group flex h-full flex-col rounded-2xl bg-shell p-5 text-shell-ink transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-shell-muted">{CONCEPT_BY_ID[d.concept]?.title ?? 'Demo'}</span>
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

        {LESSONS.length > 0 && (
          <section aria-labelledby="found-h">
            <h2 id="found-h" className="section-title">
              Foundations
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">The lessons of Weeks 1 and 2: how programs hold state, and how to take a problem apart.</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LESSONS.map((l) => (
                <li key={l.id}>
                  <Link href={`/learn/${l.id}`} className="card interactive flex h-full flex-col p-5">
                    <span className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-lg bg-learn-soft text-learn" aria-hidden="true">
                        <IconBook size={14} />
                      </span>
                      {weekOf(l.id) && <span className="tag tag-learn">Week {weekOf(l.id)}</span>}
                    </span>
                    <span className="font-display mt-3 text-[19px] font-semibold tracking-tight text-ink">{l.title}</span>
                    <span className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-muted">{plain(l.mentalModel)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="patterns-h">
          <h2 id="patterns-h" className="section-title">
            Patterns and structures
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">The full guide for each idea the course trains, with the video that teaches the idea (not one problem&apos;s answer).</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONCEPTS.map((c) => (
              <li key={c.id}>
                <Link href={`/learn/${c.id}`} className="card interactive group flex h-full flex-col p-5">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {c.pattern && <span className="tag tag-plain">{c.pattern}</span>}
                    {demosForConcept(c.id).length > 0 && (
                      <span className="tag tag-learn">
                        <IconPlay size={8} /> Interactive
                      </span>
                    )}
                  </span>
                  <span className="mt-3 text-[16px] font-semibold tracking-tight text-ink">{c.title}</span>
                  <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{plain(c.mentalModel)}</span>
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[12.5px] font-medium text-learn opacity-0 transition-opacity group-hover:opacity-100">
                    Open the guide <IconArrowRight size={11} />
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
