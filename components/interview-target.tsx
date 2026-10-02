import Link from 'next/link'
import { INTERVIEW_BEHAVIOURS, INTERVIEW_TARGET } from '@/data/program'
import { GlyphTerminal } from '@/components/concept-icons'

/**
 * The destination, stated plainly: which interview, what format, what it tests.
 * Deliberately no date; the calendar lives elsewhere.
 */

const T = INTERVIEW_TARGET

export function InterviewTargetCompact() {
  return (
    <Link
      href="/interview"
      aria-label={`Interview target: ${T.company} ${T.role}`}
      className="interactive group flex w-full max-w-[400px] gap-3.5 rounded-2xl bg-bg p-4 shadow-[0_0_0_1px_var(--hairline),var(--shadow-sm)]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink text-white">
        <GlyphTerminal size={17} />
      </span>
      <span className="min-w-0">
        <span className="eyebrow block text-faint">Interview target</span>
        <span className="mt-1 block text-[14.5px] font-semibold leading-snug tracking-tight text-ink">
          {T.company} {T.role}
        </span>
        <span className="mt-1 block text-[12.5px] text-ink-2">
          {T.rounds} × {T.minutes} min technical · {T.language} · {T.medium}
        </span>
        <span className="mt-1.5 block text-[12px] leading-relaxed text-muted">{T.focus} · implementation · testing · debugging · complexity · communication</span>
      </span>
    </Link>
  )
}

export function InterviewTargetFull() {
  return (
    <section aria-labelledby="target" className="panel overflow-hidden">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:p-7">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-white">
          <GlyphTerminal size={20} />
        </span>
        <div className="min-w-0">
          <p className="eyebrow text-faint">Target</p>
          <h2 id="target" className="mt-1 text-[22px] font-semibold leading-tight tracking-tight">
            {T.company} {T.role}
          </h2>
          <p className="mt-1.5 text-[14px] text-ink-2">
            {T.rounds} technical interviews · {T.minutes} min each · {T.language} · {T.medium}
          </p>
          <p className="mt-0.5 text-[13.5px] text-muted">{T.focus}, written from a blank editor and explained out loud.</p>
        </div>
      </div>
      <div className="px-6 pb-6 sm:px-7 sm:pb-7">
        <p className="eyebrow mb-3 text-faint">What needs to be automatic</p>
        <ol className="grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-2 lg:grid-cols-4">
          {INTERVIEW_BEHAVIOURS.map((b, i) => (
            <li key={b.id} className="flex gap-3 bg-bg px-4 py-3.5">
              <span className="num mono mt-px text-[11px] text-faint">{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-ink">{b.label}</span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">{b.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
