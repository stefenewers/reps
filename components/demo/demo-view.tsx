'use client'

import BrandMark from '@/components/brand-mark'
import DemoPractice from '@/components/demo/demo-practice'
import { IconArrowRight, IconExternal, IconPlay } from '@/components/icons'
import { MODULES, PLAN_DAYS, dayExercises } from '@/data/curriculum'
import { DEMO_METHOD, DEMO_PACING, DEMO_RESOURCES } from '@/data/demo'
import { PROBLEMS } from '@/data/problems'
import { PLAN_UNITS } from '@/data/schedule-90'

/**
 * The public face of Reps: what it is, a short ladder to try, and a base plan
 * for software engineering interview prep built on the same method. No
 * personal data, no account, nothing stored.
 */

const SECTION_TITLE = new Map(MODULES.flatMap((m) => m.sections.map((s) => [s.id, s.title] as const)))
const LC = new Map(PLAN_DAYS.flatMap((d) => (d.leetcode ?? []).map((x) => [x.lc, x] as const)))
const PROBLEM_OF_CAPSTONE = new Map(PROBLEMS.map((p) => [p.exerciseId ?? `cap-${p.id}`, p]))

/** The plan's modules, with the weeks the original schedule gives them. */
const PLAN = PLAN_UNITS.map((u, i) => {
  const ids = new Set(u.sections.concat(u.check ? [u.check] : []))
  const days = PLAN_DAYS.filter((d) => d.sections.some((s) => !s.optional && ids.has(s.id)) || (d.leetcode ?? []).some((x) => x.type === 'new' && u.leetcode.includes(x.lc)))
  const reps = PLAN_DAYS.flatMap((d) => d.sections.filter((s) => !s.optional && ids.has(s.id)).flatMap((s) => s.exercises))
  // Problems solved inside the ladder (capstones) and the ones done on LeetCode after it.
  const capstones = reps.flatMap((e) => (PROBLEM_OF_CAPSTONE.has(e.id) ? [PROBLEM_OF_CAPSTONE.get(e.id)!] : []))
  const weeks = [...new Set(days.map((d) => d.planWeek!))]
  return {
    n: i + 1,
    name: u.name,
    weeks: weeks.length ? (weeks[0] === weeks[weeks.length - 1] ? `Week ${weeks[0]}` : `Weeks ${weeks[0]}–${weeks[weeks.length - 1]}`) : '',
    reps: reps.length,
    builds: [...new Set(u.sections.map((s) => SECTION_TITLE.get(s)).filter((t): t is string => Boolean(t) && !/^Capstone/.test(t!)))].slice(0, 6),
    check: Boolean(u.check),
    problems: [...capstones.map((p) => ({ lc: p.number, title: p.title, url: p.leetcode, video: null as string | null })), ...u.leetcode.flatMap((n) => (LC.has(n) ? [{ lc: n, title: LC.get(n)!.title, url: LC.get(n)!.url, video: LC.get(n)!.video }] : []))],
  }
})
const TOTAL_REPS = PLAN_DAYS.reduce((n, d) => n + dayExercises(d).length, 0)
const TOTAL_PROBLEMS = new Set(PLAN.flatMap((m) => m.problems.map((p) => p.lc))).size

const PHASES = [
  { name: 'Soft start', when: 'Week 1', load: 'About 1.5–2 hours a day', what: 'One pattern, small days, re-solving problems you already know.' },
  { name: 'Build', when: 'Weeks 2–4', load: 'About 3–3.5 hours a day', what: 'New ladder work, up to 3 re-solves, a short afternoon block.' },
  { name: 'Full', when: 'Weeks 5–12', load: 'About 4–4.5 hours a day', what: 'New ladder work, up to 5 re-solves, mocks, design and stories.' },
  { name: 'Buffers', when: 'Weeks 7 and 11', load: 'Re-solves only', what: 'No new ladder work. They absorb whatever slipped.' },
]

export default function DemoView() {
  return (
    <main className="flex-1 bg-canvas">
      <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 py-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2 text-[16px] font-semibold tracking-tight">
          <BrandMark size={26} /> Reps
        </a>
        <nav aria-label="On this page" className="flex items-center gap-1 text-[13.5px] text-muted">
          <a href="#try" className="rounded-lg px-2.5 py-1.5 hover:bg-surface hover:text-ink">
            Try it
          </a>
          <a href="#method" className="hidden rounded-lg px-2.5 py-1.5 hover:bg-surface hover:text-ink sm:block">
            Method
          </a>
          <a href="#plan" className="rounded-lg px-2.5 py-1.5 hover:bg-surface hover:text-ink">
            The plan
          </a>
          <a href="#resources" className="hidden rounded-lg px-2.5 py-1.5 hover:bg-surface hover:text-ink sm:block">
            Resources
          </a>
        </nav>
      </header>

      <div id="top" className="mx-auto w-full max-w-[1120px] px-5 pb-24 sm:px-8">
        <section className="pb-12 pt-10 sm:pt-16">
          <p className="eyebrow text-muted">A practice system for coding interviews</p>
          <h1 className="mt-3 max-w-[820px] text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[56px]">Build fluency through repetition.</h1>
          <p className="mt-5 max-w-[660px] text-[17px] leading-relaxed text-ink-2">
            Most interview prep hands you a LeetCode problem and a video. Reps treats each problem as the top of a ladder: you practise the small moves underneath it until they are automatic, then the problem is just those moves assembled.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <a href="#try" className="btn btn-accent btn-lg">
              Try a short ladder <IconArrowRight size={15} />
            </a>
            <a href="#plan" className="btn btn-lg">
              See the 13-week plan
            </a>
          </div>
          <dl className="mt-10 grid max-w-[660px] grid-cols-3 gap-6">
            {[
              [String(PLAN.length), 'patterns, in order'],
              [String(TOTAL_REPS), 'ladder reps'],
              [String(TOTAL_PROBLEMS), 'LeetCode problems'],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="num text-[28px] font-semibold tracking-tight text-ink">{v}</dt>
                <dd className="text-[13px] text-muted">{k}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="try" aria-labelledby="try-h" className="scroll-mt-6 pt-6">
          <h2 id="try-h" className="text-[26px] font-semibold tracking-tight">
            Try it: four reps up to Two Sum
          </h2>
          <p className="mt-2 max-w-[660px] text-[15px] leading-relaxed text-ink-2">A slice of the hashing ladder. Write the code, run it against the real tests, ask for a hint if you want one. Each rep uses the move from the one before.</p>
          <div className="mt-6">
            <DemoPractice />
          </div>
        </section>

        <section id="method" aria-labelledby="method-h" className="scroll-mt-6 pt-20">
          <h2 id="method-h" className="text-[26px] font-semibold tracking-tight">
            How every pattern is learned
          </h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_METHOD.map((m, i) => (
              <li key={m.title} className="card p-5">
                <span className="num grid size-7 place-items-center rounded-lg bg-ink text-[13px] font-semibold text-white">{i + 1}</span>
                <h3 className="mt-3 text-[15.5px] font-semibold tracking-tight">{m.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{m.body}</p>
              </li>
            ))}
          </ol>
          <div className="card mt-3 p-5">
            <h3 className="text-[15.5px] font-semibold tracking-tight">Pacing, not daily goals</h3>
            <ul className="mt-2 grid gap-x-8 gap-y-1.5 text-[13.5px] leading-relaxed text-ink-2 sm:grid-cols-3">
              {DEMO_PACING.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="plan" aria-labelledby="plan-h" className="scroll-mt-6 pt-20">
          <h2 id="plan-h" className="text-[26px] font-semibold tracking-tight">
            A base plan for software engineering interviews
          </h2>
          <p className="mt-2 max-w-[700px] text-[15px] leading-relaxed text-ink-2">
            Thirteen weeks for new-grad and entry-level loops, in Python. Fifteen patterns in the order they build on each other, each with its ladder, its check and its problems. Open a pattern to see what it covers.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PHASES.map((p) => (
              <div key={p.name} className="rounded-xl bg-bg px-4 py-3.5 shadow-[0_0_0_1px_var(--line)]">
                <p className="text-[14px] font-semibold text-ink">{p.name}</p>
                <p className="num text-[12.5px] text-muted">{p.when}</p>
                <p className="mt-2 text-[13px] font-medium text-ink-2">{p.load}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{p.what}</p>
              </div>
            ))}
          </div>

          <ol className="card mt-4 divide-y divide-line px-1" data-testid="demo-plan">
            {PLAN.map((m) => (
              <li key={m.name}>
                <details className="group px-3">
                  <summary className="grid cursor-pointer list-none grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-3 text-[14px] [&::-webkit-details-marker]:hidden">
                    <span className="num grid size-6 place-items-center rounded-md bg-surface-2 text-[12px] text-ink-2">{m.n}</span>
                    <span className="min-w-0">
                      <span className="font-medium text-ink">{m.name}</span>
                      <span className="ml-2 hidden text-[12.5px] text-muted sm:inline">
                        {m.reps ? `${m.reps} ladder reps` : 'study-first, no ladder'}
                        {m.check ? ' · mastery check' : ''} · {m.problems.length} problem{m.problems.length === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className="num flex items-center gap-2 text-[12.5px] text-muted">
                      {m.weeks}
                      <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">›</span>
                    </span>
                  </summary>
                  <div className="grid gap-x-8 gap-y-4 pb-4 pl-[40px] pr-2 sm:grid-cols-2">
                    {m.builds.length > 0 && (
                      <div>
                        <p className="label mb-1.5">The ladder builds</p>
                        <p className="text-[13.5px] leading-relaxed text-ink-2">{m.builds.join(' · ')}</p>
                      </div>
                    )}
                    <div>
                      <p className="label mb-1.5">Problems</p>
                      <ul className="flex flex-col gap-1 text-[13.5px]">
                        {m.problems.map((p) => (
                          <li key={p.lc} className="flex flex-wrap items-center gap-x-2">
                            <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-ink hover:underline">
                              <span className="num text-muted">LC {p.lc}</span> {p.title} <IconExternal size={11} className="text-muted" />
                            </a>
                            {p.video && (
                              <a href={p.video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ink">
                                <IconPlay size={9} /> walkthrough
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
          <p className="mt-3 max-w-[700px] text-[13px] leading-relaxed text-muted">
            Alongside the patterns: about two mock interviews a week from week 4, a design item most Mondays (object design first, then one end-to-end system), and twelve behavioral stories written and rehearsed. Checkpoints at days 30, 60 and 90 compare patterns cleared, problems done and the share of re-solves done unaided.
          </p>
        </section>

        <section id="resources" aria-labelledby="res-h" className="scroll-mt-6 pt-20">
          <h2 id="res-h" className="text-[26px] font-semibold tracking-tight">
            What it is built on
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {DEMO_RESOURCES.map((r) => (
              <li key={r.label}>
                <a href={r.href} target="_blank" rel="noreferrer" className="card interactive block h-full p-5">
                  <p className="flex items-center gap-1.5 text-[14.5px] font-medium text-ink">
                    {r.label} <IconExternal size={12} className="text-muted" />
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{r.note}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 pt-6 text-[13px] text-muted" style={{ boxShadow: '0 -1px 0 var(--line)' }}>
          <p className="flex items-center gap-2">
            <BrandMark size={18} /> Reps is a personal practice tool. This page is a demo: it has no accounts and stores nothing.
          </p>
          <a href="https://stefenewers.com" className="inline-flex items-center gap-1.5 text-ink hover:underline">
            Built by Stefen Ewers <IconExternal size={12} />
          </a>
        </footer>
      </div>
    </main>
  )
}
