'use client'

import Link from 'next/link'
import { IconArrowRight, IconCheck, IconExternal, IconPlay } from '@/components/icons'
import { useTargets, type TargetState } from '@/components/use-targets'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { targetOfRep } from '@/data/problem-bridges'
import type { Target } from '@/lib/bridges'

/**
 * Why the current rep exists: the problem it builds toward, the building
 * blocks that problem needs, and which of them are already in place.
 */

/** How to use the walkthrough, by how the problem is approached. */
export function learnAdvice(t: Pick<Target, 'mode' | 'source'>, ready: boolean): string {
  if (t.source === 'reps') return 'Stuck after a real try? Watch the explanation, pause when the code starts, write it yourself, then finish the video to compare.'
  if (t.mode === 'study-first') return 'Part of the sequence: watch the explanation, pause when the code starts, write it yourself, then finish the video to compare.'
  if (!ready) return 'Finish the building blocks first. The walkthrough is for after a real attempt.'
  return 'Attempt it first, for up to 30 minutes. If you need the walkthrough, rebuild the solution from a blank editor afterwards.'
}

/** The checklist of building blocks. */
export function Blocks({ state, dense = false }: { state: TargetState; dense?: boolean }) {
  return (
    <ul className={`flex flex-col ${dense ? 'gap-1' : 'gap-1.5'}`} data-testid="blocks">
      {state.blocks.map((b, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] leading-snug">
          <span aria-hidden="true" className={`mt-[3px] grid size-[14px] shrink-0 place-items-center rounded-full ${b.ready ? 'bg-ink text-white' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
            {b.ready && <IconCheck size={9} strokeWidth={2.6} />}
          </span>
          <span className={b.ready ? 'text-ink-2' : 'font-medium text-ink'}>
            {b.label}
            <span className="sr-only">{b.ready ? ' (ready)' : ' (not yet)'}</span>
            {!b.ready && (
              <span className="num ml-1.5 font-normal text-muted">
                {b.left.length} rep{b.left.length === 1 ? '' : 's'}
              </span>
            )}
            {b.via === 'mastery' && <span className="ml-1.5 font-normal text-muted">already strong</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** The contextual Learn resource: one walkthrough, and how to use it for this problem. */
export function LearnResource({ state, className = '' }: { state: TargetState; className?: string }) {
  if (!state.video) return null
  const study = state.target.mode === 'study-first'
  return (
    <div className={`rounded-xl bg-surface px-3.5 py-3 ${className}`} data-testid="learn-resource">
      <p className="label">Learn</p>
      <a href={state.video} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink hover:underline">
        <IconPlay size={10} /> {study ? 'Concept and walkthrough' : 'Solution walkthrough'} · LC {state.target.lc} <IconExternal size={11} className="text-muted" />
      </a>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{learnAdvice(state.target, state.ready)}</p>
    </div>
  )
}

export default function BuildingToward({ repId }: { repId?: string }) {
  const { byLc, nextOpen } = useTargets()
  const owner = repId ? targetOfRep(repId) : undefined
  const state = (owner && byLc.get(owner.lc)) ?? nextOpen
  if (!state || state.first !== null) return null
  const { target } = state
  const next = state.nextRep ? EXERCISE_BY_ID[state.nextRep] : undefined
  const then = state.blocks.filter((b) => !b.ready).length
  return (
    <section aria-labelledby="toward-h" className="panel p-6" data-testid="building-toward">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="eyebrow text-muted">Building toward · {target.unit}</p>
          <h2 id="toward-h" className="mt-1.5 text-[20px] font-semibold leading-snug tracking-tight">
            <span className="num text-muted">LC {target.lc}</span> {target.title}
          </h2>
          <p className="num mt-1 text-[13.5px] text-ink-2" data-testid="blocks-ready">
            {state.ready ? `Ready: all ${state.total} building blocks in place` : `${state.readyCount} of ${state.total} building blocks ready`}
          </p>
          <div className="mt-4">
            <Blocks state={state} />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="rounded-xl px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line)]">
            <p className="label">{state.ready ? 'Now' : 'Next rep'}</p>
            {next ? (
              <Link href={`/rep/${next.id}`} className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink hover:underline">
                {next.title} <IconArrowRight size={13} />
              </Link>
            ) : target.source === 'reps' && target.exerciseId ? (
              <Link href={`/rep/${target.exerciseId}`} className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink hover:underline">
                Solve {target.title} in Reps <IconArrowRight size={13} />
              </Link>
            ) : (
              <a href={state.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink hover:underline">
                Attempt {target.title} on LeetCode <IconExternal size={12} />
              </a>
            )}
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              {state.ready
                ? 'Every move this problem needs is one you have already written. Then log how it went.'
                : `Then ${state.repsLeft - 1 > 0 ? `${state.repsLeft - 1} more rep${state.repsLeft - 1 === 1 ? '' : 's'}` : 'nothing else'}${then > 1 ? ` across ${then} blocks` : ''}, then attempt ${target.title}.`}
            </p>
          </div>
          <LearnResource state={state} />
        </div>
      </div>
    </section>
  )
}
