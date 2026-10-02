'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useReps } from '@/components/reps-provider'
import { DAY_GLYPH, GlyphBraces } from '@/components/concept-icons'
import { IconCheck } from '@/components/icons'
import { RepsBars } from '@/components/motif'
import { FINISH_LINE, PROGRAM_STAGES } from '@/data/program'
import { PROBLEM_BY_ID } from '@/data/problems'
import { createElement } from 'react'

/**
 * Road to Ready: the ten topic stages between here and interview-ready.
 * Where you are comes from what you have actually completed, not the date.
 * Finished stages keep their check; the current one is the only cobalt stop.
 */
export default function RoadToReady() {
  const { program, loaded } = useReps()
  const { stages, current, mocks } = program
  const track = useRef<HTMLOListElement>(null)
  const done = stages.filter((s) => s.status === 'complete').length
  const reps = stages.reduce((n, s) => n + s.completed, 0)
  const total = stages.reduce((n, s) => n + s.total, 0)
  const next = stages.filter((s) => s.status !== 'complete' && s !== current).slice(0, 2)

  // On narrow screens the track scrolls; keep the current stop in view.
  useEffect(() => {
    const el = track.current
    if (!el || !current) return
    const stop = el.querySelector<HTMLElement>(`[data-stage="${current.stage.dayDate}"]`)
    if (stop && el.scrollWidth > el.clientWidth) el.scrollLeft = stop.offsetLeft - el.clientWidth / 2 + stop.clientWidth / 2
  }, [current, loaded])

  return (
    <section aria-labelledby="road" className="panel overflow-hidden">
      <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
        <div>
          <h2 id="road" className="h2 flex items-center gap-2">
            <RepsBars width={16} bar={2.5} gap={2} className="text-ink" /> Road to Ready
          </h2>
          <p className="eyebrow mt-4 text-faint">The finish line</p>
          <p className="mt-1.5 max-w-[560px] text-[15px] leading-relaxed text-ink-2">{FINISH_LINE}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 self-end">
          <div className="col-span-2">
            <dt className="eyebrow text-faint">{current ? 'Current' : 'Program'}</dt>
            <dd className="mt-1 text-[17px] font-semibold tracking-tight">
              {current ? current.stage.title : 'Complete'}
              {current?.currentSection && <span className="font-normal text-muted"> · {current.currentSection}</span>}
            </dd>
            {next.length > 0 && (
              <dd className="mt-0.5 text-[12.5px] text-muted">
                Up next: {next.map((s) => s.stage.title).join(', ')}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-[12px] text-faint">Topics</dt>
            <dd className="num mt-0.5 text-[16px] font-semibold">
              {done} / {stages.length} <span className="text-[12.5px] font-normal text-muted">complete</span>
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-faint">Canonical reps</dt>
            <dd className="num mt-0.5 text-[16px] font-semibold">
              {reps} / {total}
            </dd>
          </div>
        </dl>
      </div>

      <ol
        ref={track}
        aria-label="Topic stages"
        className="relative flex overflow-x-auto px-3 pb-6 [scrollbar-width:none] sm:px-4 lg:grid lg:grid-cols-10 lg:overflow-visible"
      >
        {stages.map((s, i) => {
          const isCurrent = s.status === 'current'
          const complete = s.status === 'complete'
          const partial = s.status === 'partial'
          const prevComplete = i > 0 && stages[i - 1].status === 'complete'
          const glyph = DAY_GLYPH[s.stage.dayDate] ?? GlyphBraces
          const def = PROGRAM_STAGES[i]
          const capstones = s.capstones.map((c) => PROBLEM_BY_ID[c]?.title).filter(Boolean)
          return (
            <li key={s.stage.dayDate} data-stage={s.stage.dayDate} className="group/stop relative min-w-[132px] flex-1 lg:min-w-0">
              {/* connector */}
              {i > 0 && <span aria-hidden="true" className={`absolute left-0 right-1/2 top-[19px] h-[2px] ${prevComplete ? 'bg-ink' : 'bg-line'}`} />}
              {i < stages.length - 1 && <span aria-hidden="true" className={`absolute left-1/2 right-0 top-[19px] h-[2px] ${complete ? 'bg-ink' : 'bg-line'}`} />}

              <Link
                href={`/day/${s.stage.dayDate}`}
                className={`relative flex h-full flex-col items-center rounded-xl px-2 pb-3 pt-2 text-center outline-none transition-colors focus-visible:bg-surface ${isCurrent ? '' : 'hover:bg-surface'}`}
                aria-label={`${s.stage.title}: ${complete ? 'complete' : isCurrent ? 'current' : partial ? `${s.completed} of ${s.total} reps done` : 'upcoming'}`}
              >
                <span
                  aria-hidden="true"
                  className={`relative z-10 grid size-[22px] place-items-center rounded-full transition-[box-shadow,background-color] duration-300 ${
                    complete
                      ? 'bg-ink text-white'
                      : isCurrent
                        ? 'bg-bg shadow-[0_0_0_2px_var(--accent),0_0_0_5px_var(--bg)]'
                        : partial
                          ? 'bg-bg shadow-[0_0_0_1.5px_var(--ink-2),0_0_0_5px_var(--bg)]'
                          : 'bg-bg shadow-[0_0_0_1.5px_var(--line-strong),0_0_0_5px_var(--bg)]'
                  }`}
                >
                  {complete ? (
                    <IconCheck size={12} strokeWidth={2.6} />
                  ) : isCurrent ? (
                    <span className="size-2.5 rounded-full bg-accent" />
                  ) : partial ? (
                    <span className="size-2 rounded-full bg-ink-2/60" />
                  ) : null}
                </span>

                <span className={`mt-3 ${isCurrent ? 'text-accent' : complete ? 'text-ink-2' : 'text-faint'}`}>{createElement(glyph, { size: 15 })}</span>
                <span
                  className={`mt-1.5 text-[12.5px] leading-snug ${isCurrent ? 'font-semibold text-ink' : complete ? 'font-medium text-ink-2' : partial ? 'text-ink-2' : 'text-muted'}`}
                >
                  {s.stage.title}
                </span>
                <span className="num mono mt-1 text-[10.5px] text-faint">{complete ? 'done' : `${s.completed}/${s.total}`}</span>
                {s.mocks && (
                  <span className={`num mono mt-0.5 text-[10.5px] ${s.mocks.completed === s.mocks.total ? 'text-ink-2' : 'text-faint'}`}>
                    mocks {s.mocks.completed}/{s.mocks.total}
                  </span>
                )}
                {isCurrent && s.currentSection && <span className="mt-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">{s.currentSection}</span>}
              </Link>

              {/* Hover/focus summary: what this stage builds. */}
              <span
                role="tooltip"
                className={`pointer-events-none absolute bottom-full z-30 mb-1 hidden w-[240px] rounded-xl bg-ink p-3 text-left text-[12px] leading-relaxed text-white shadow-lg group-focus-within/stop:block lg:group-hover/stop:block ${
                  i < 2 ? 'left-1' : i > stages.length - 3 ? 'right-1' : 'left-1/2 -translate-x-1/2'
                }`}
              >
                <span className="block font-semibold">{s.stage.title}</span>
                <span className="mt-0.5 block text-white/60">
                  {s.total} reps{capstones.length ? ` · ${capstones.join(', ')}` : ''}
                </span>
                <span className="mt-1.5 block text-white/85">{def?.description}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {mocks.total > 0 && (
        <p className="sr-only">
          Mock interviews completed: {mocks.completed} of {mocks.total}
        </p>
      )}
    </section>
  )
}
