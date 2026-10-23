import Link from 'next/link'
import { CONCEPTS } from '@/data/concepts'
import { LESSONS } from '@/data/course/lessons'

export const metadata = { title: 'Learn' }

/** Every concept the program trains, each with its guide. */
export default function LearnIndex() {
  return (
    <main className="flex-1 bg-canvas">
      <div className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-10 sm:px-8">
        <h1 className="display-xl">Learn</h1>
        <p className="mt-2 max-w-[640px] text-[14.5px] leading-relaxed text-muted">
          The ideas behind the reps: what each one is, why it matters, the moves you will type, and a video that teaches the idea (not one problem&apos;s answer). Read or watch, then go practice it.
        </p>
        {LESSONS.length > 0 && (
          <>
            <h2 className="h2 mt-8">Foundations</h2>
            <p className="mt-1 text-[13.5px] text-muted">The lessons of Weeks 1 and 2: how programs hold state, and how to take a problem apart.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {LESSONS.map((l) => (
                <li key={l.id}>
                  <Link href={`/learn/${l.id}`} className="card interactive block h-full p-5">
                    <p className="text-[15px] font-semibold tracking-tight text-ink">{l.title}</p>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{l.mentalModel}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="h2 mt-10">Patterns</h2>
          </>
        )}
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {CONCEPTS.map((c) => (
            <li key={c.id}>
              <Link href={`/learn/${c.id}`} className="card interactive block h-full p-5">
                <p className="text-[15px] font-semibold tracking-tight text-ink">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{c.mentalModel}</p>
                {c.pattern && <p className="eyebrow mt-2 text-faint">{c.pattern}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
