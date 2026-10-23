'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useReps } from '@/components/reps-provider'
import { IconArrowRight, IconCheck } from '@/components/icons'
import Markdown from '@/components/markdown'
import type { Lab } from '@/data/course/types'
import { labKey, labProgress, type LabState } from '@/lib/course/labs'
import { passedSet } from '@/lib/progress'

/**
 * A lab (REPS_2_MASTER_SPEC.md §34): requirements, design, implement against
 * acceptance tests, a change request, review. It ends DONE or NOT DONE, never as
 * a pile of reps.
 */
export default function LabView({ lab }: { lab: Lab }) {
  const { repo, attempts } = useReps()
  const [local, setLocal] = useState<LabState | undefined>()
  const saved = local ?? repo.state<LabState>(labKey(lab.id)) ?? { design: {}, review: {} }
  const save = (next: LabState) => {
    setLocal(next)
    void repo.setState(labKey(lab.id), next)
  }
  const p = labProgress(lab, saved, passedSet(attempts))
  const step = (n: number, title: string, ok: boolean) => (
    <h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink">
      <span aria-hidden="true" className={`grid size-6 place-items-center rounded-full text-[12px] ${ok ? 'bg-pass text-white' : 'text-muted shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
        {ok ? <IconCheck size={12} strokeWidth={2.6} /> : n}
      </span>
      {title}
      <span className="sr-only">{ok ? ' (done)' : ' (not done)'}</span>
    </h2>
  )
  return (
    <div className="flex flex-col gap-7" data-testid="lab" data-done={p.done ? 'true' : 'false'}>
      <section className="rounded-xl bg-surface px-4 py-3.5">
        <Markdown text={lab.brief} className="!text-[14.5px]" />
        {lab.aiFde && <p className="eyebrow mt-2 text-cold">Applied AI · FDE lane</p>}
      </section>

      <section>
        {step(1, 'Requirements', true)}
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-10 text-[14px] leading-relaxed text-ink-2">
          {lab.requirements.map((r, i) => (
            <li key={i}>
              <Markdown text={r} inline />
            </li>
          ))}
        </ul>
      </section>

      <section>
        {step(2, 'Design first', p.designDone)}
        <p className="ml-8 mt-1 text-[13px] text-muted">A sentence or two each. Decide before you type code.</p>
        <div className="ml-8 mt-3 flex flex-col gap-3">
          {lab.designQuestions.map((q, i) => (
            <label key={i} className="flex flex-col gap-1">
              <span className="text-[13.5px] font-medium text-ink">{q}</span>
              <textarea className="input min-h-[60px] !text-[13.5px]" value={saved.design[i] ?? ''} onChange={(e) => save({ ...saved, design: { ...saved.design, [i]: e.target.value } })} data-testid={`design-${i}`} />
            </label>
          ))}
        </div>
      </section>

      <section>
        {step(3, 'Build it', p.buildPassed)}
        <p className="ml-8 mt-1 text-[13px] text-muted">The acceptance tests decide when it works.</p>
        <Link href={`/rep/${lab.buildExerciseId}`} className="btn ml-8 mt-3" data-testid="lab-build">
          {p.buildPassed ? 'Open the build' : 'Start the build'} <IconArrowRight size={14} />
        </Link>
      </section>

      <section>
        {step(4, `Change request: ${lab.changeRequest.title}`, p.changePassed)}
        <Markdown text={lab.changeRequest.description} className="ml-8 mt-1 !text-[14px]" />
        {p.buildPassed ? (
          <Link href={`/rep/${lab.changeRequest.exerciseId}`} className="btn ml-8 mt-3" data-testid="lab-change">
            {p.changePassed ? 'Open the change' : 'Make the change'} <IconArrowRight size={14} />
          </Link>
        ) : (
          <p className="ml-8 mt-2 text-[12.5px] text-faint">Opens once the build passes.</p>
        )}
      </section>

      <section>
        {step(5, 'Review', p.reviewDone)}
        <div className="ml-8 mt-2 flex flex-col gap-1.5">
          {lab.review.map((r, i) => (
            <label key={i} className="flex items-start gap-2 text-[14px] text-ink-2">
              <input type="checkbox" className="mt-1" checked={Boolean(saved.review[i])} onChange={(e) => save({ ...saved, review: { ...saved.review, [i]: e.target.checked } })} />
              <Markdown text={r} inline />
            </label>
          ))}
        </div>
      </section>

      <div className={`rounded-xl px-4 py-4 ${p.done ? 'bg-pass-soft' : 'shadow-[inset_0_0_0_1px_var(--line)]'}`}>
        {p.done ? (
          <p className="celebrate-in flex items-center gap-2 text-[16px] font-semibold text-ink" data-testid="lab-done">
            <IconCheck size={18} strokeWidth={2.6} className="text-pass" /> Done. You designed it, built it and changed it when the requirements moved.
          </p>
        ) : (
          <>
            <button type="button" className="btn btn-accent" disabled={!p.canFinish} onClick={() => save({ ...saved, doneAt: new Date().toISOString() })} data-testid="lab-finish">
              Mark the lab done
            </button>
            <p className="mt-2 text-[12.5px] text-muted">
              {p.canFinish ? 'Everything is in place.' : 'Needs: the design written, the build and the change passing, and the review checked.'} A lab is done or not done; it is not counted as reps.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
