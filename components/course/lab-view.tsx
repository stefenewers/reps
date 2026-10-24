'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { useReps } from '@/components/reps-provider'
import { LAB_PREREQUISITES } from '@/data/course/applied'
import { LESSON_BY_ID } from '@/data/course/lessons'
import { CONCEPT_BY_ID } from '@/data/concepts'
import { IconArrowRight, IconCheck, IconLock } from '@/components/icons'
import Markdown from '@/components/markdown'
import type { Lab } from '@/data/course/types'
import { DESIGN_MIN_CHARS, labKey, labProgress, type LabState } from '@/lib/course/labs'
import '@/components/demos/learning.css'

/** One stage on the lab's path. */
function Stage({ n, done, now, title, sub, children }: { n: number; done: boolean; now: boolean; title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <section className="lab-stage" data-done={done ? 'true' : 'false'} data-now={now ? 'true' : 'false'}>
      <span className="lab-dot num" aria-hidden="true">
        {done ? <IconCheck size={16} strokeWidth={2.8} /> : n}
      </span>
      <div className="flex flex-wrap items-center gap-2 pt-1.5">
        <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-ink">{title}</h2>
        <span className={`tag ${done ? 'tag-pass' : now ? 'tag-flame' : 'tag-plain'}`}>{done ? 'Done' : now ? 'Now' : 'Not done'}</span>
        <span className="sr-only">{done ? ' (done)' : ' (not done)'}</span>
      </div>
      {sub && <div className="mt-1 text-[13.5px] text-muted">{sub}</div>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * A lab (REPS_2_MASTER_SPEC.md §34): the brief and requirements, then four
 * stages on one path (design, build, change, review). It ends DONE or NOT
 * DONE, never as a pile of reps; the finish says exactly what is still needed.
 */
export default function LabView({ lab }: { lab: Lab }) {
  const { repo, attempts } = useReps()
  const [local, setLocal] = useState<LabState | undefined>()
  const raw = local ?? repo.state<LabState>(labKey(lab.id))
  const saved: LabState = { design: raw?.design ?? {}, review: raw?.review ?? {}, doneAt: raw?.doneAt }
  const save = (next: LabState) => {
    setLocal(next)
    void repo.setState(labKey(lab.id), next)
  }
  const p = labProgress(lab, saved, attempts)
  const stages = [
    { key: 'design', title: 'Design', done: p.designDone },
    { key: 'build', title: 'Build', done: p.buildPassed },
    { key: 'change', title: 'Change', done: p.changePassed },
    { key: 'review', title: 'Review', done: p.reviewDone }
  ]
  const now = stages.find((s) => !s.done)?.key
  const designed = lab.designQuestions.filter((_, i) => (saved.design[i] ?? '').trim().length >= DESIGN_MIN_CHARS).length
  const reviewed = lab.review.filter((_, i) => saved.review[i]).length
  const missing = [
    !p.designDone && `the design (${designed} of ${lab.designQuestions.length} answered)`,
    !p.buildPassed && 'the build passing its tests',
    !p.changePassed && 'the change request passing',
    !p.reviewDone && `the review (${reviewed} of ${lab.review.length} checked)`
  ].filter(Boolean) as string[]

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,720px)_260px] lg:justify-between" data-testid="lab" data-done={p.done ? 'true' : 'false'}>
      <div className="flex min-w-0 flex-col gap-8">
        <section className="rounded-2xl bg-bg p-5 shadow-[0_0_0_1px_var(--hairline)] sm:p-6">
          <p className="eyebrow text-[#b9500b]">The brief</p>
          <Markdown text={lab.brief} className="mt-2 !text-[16px] !leading-relaxed" />
          {lab.aiFde && <p className="tag tag-cold mt-3">Applied Engineering build</p>}
          <p className="label mt-5">Requirements</p>
          <ul className="mt-2 flex flex-col gap-2">
            {lab.requirements.map((r, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-flame" />
                <span>
                  <Markdown text={r} inline />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div>
          <Stage n={1} done={stages[0].done} now={now === 'design'} title="Design first" sub="A sentence or two each. Decide before you type code.">
            {(LAB_PREREQUISITES[lab.id] ?? []).length > 0 && (
              <div className="mb-4 rounded-xl bg-learn-soft px-4 py-3" data-testid="lab-prerequisites">
                <p className="eyebrow text-learn">Taught first</p>
                <p className="mt-0.5 text-[13px] text-ink-2">These questions build on ideas from these lessons. Skim one again if a question feels unfamiliar.</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {(LAB_PREREQUISITES[lab.id] ?? []).map((id) => {
                    const l = LESSON_BY_ID[id] ?? CONCEPT_BY_ID[id]
                    if (!l) return null
                    const read = Boolean(repo.state(`lesson:${id}`))
                    return (
                      <li key={id}>
                        <Link href={`/learn/${id}`} className={`tag !normal-case !tracking-normal hover:underline ${read ? 'tag-pass' : 'tag-learn'}`}>
                          {read ? '✓ ' : ''}
                          {l.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {lab.designQuestions.map((q, i) => {
                const ok = (saved.design[i] ?? '').trim().length >= DESIGN_MIN_CHARS
                return (
                  <label key={i} className="flex flex-col gap-1.5 rounded-xl bg-bg p-3.5 shadow-[0_0_0_1px_var(--hairline)]">
                    <span className="flex items-start gap-2 text-[14px] font-medium text-ink">
                      <span aria-hidden="true" className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${ok ? 'bg-pass text-white' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}>
                        {ok && <IconCheck size={9} strokeWidth={3} />}
                      </span>
                      <Markdown text={q} inline className="!text-[14px] !text-ink" />
                    </span>
                    <textarea
                      className="input min-h-[64px] !text-[14px]"
                      value={saved.design[i] ?? ''}
                      onChange={(e) => save({ ...saved, design: { ...saved.design, [i]: e.target.value } })}
                      data-testid={`design-${i}`}
                    />
                  </label>
                )
              })}
            </div>
          </Stage>

          <Stage n={2} done={stages[1].done} now={now === 'build'} title="Build it" sub="The acceptance tests decide when it works. Hints are fine; a shown solution does not count.">
            <Link href={`/rep/${lab.buildExerciseId}`} className={`btn btn-lg ${p.buildPassed ? '' : 'btn-accent'}`} data-testid="lab-build">
              {p.buildPassed ? 'Open the build' : 'Start the build'} <IconArrowRight size={14} />
            </Link>
          </Stage>

          <Stage n={3} done={stages[2].done} now={now === 'change'} title={`Change request: ${lab.changeRequest.title}`}>
            <Markdown text={lab.changeRequest.description} className="!text-[14.5px] !leading-relaxed" />
            {p.buildPassed ? (
              <Link href={`/rep/${lab.changeRequest.exerciseId}`} className={`btn btn-lg mt-4 ${p.changePassed ? '' : 'btn-accent'}`} data-testid="lab-change">
                {p.changePassed ? 'Open the change' : 'Make the change'} <IconArrowRight size={14} />
              </Link>
            ) : (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[13px] text-muted">
                <IconLock size={13} /> Opens once the build passes.
              </p>
            )}
          </Stage>

          <Stage n={4} done={stages[3].done} now={now === 'review'} title="Review" sub="Check each honestly before calling it done.">
            <div className="flex flex-col gap-1.5">
              {lab.review.map((r, i) => (
                <label key={i} className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-[14px] text-ink-2 hover:bg-bg">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-[var(--pass)]"
                    checked={Boolean(saved.review[i])}
                    onChange={(e) => save({ ...saved, review: { ...saved.review, [i]: e.target.checked } })}
                  />
                  <Markdown text={r} inline />
                </label>
              ))}
            </div>
          </Stage>
        </div>

        <div className={`rounded-2xl p-5 sm:p-6 ${p.done ? 'bg-pass-soft' : 'bg-bg shadow-[0_0_0_1px_var(--hairline)]'}`}>
          {p.done ? (
            <p className="stamp-in flex items-center gap-3 text-[17px] font-semibold text-ink" data-testid="lab-done">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pass text-white" aria-hidden="true">
                <IconCheck size={18} strokeWidth={2.8} />
              </span>
              Done. You designed it, built it and changed it when the requirements moved.
            </p>
          ) : (
            <>
              <button type="button" className="btn btn-accent btn-lg" disabled={!p.canFinish} onClick={() => save({ ...saved, doneAt: new Date().toISOString() })} data-testid="lab-finish">
                Mark the lab done
              </button>
              <p className="mt-3 text-[13px] text-ink-2">
                {p.canFinish ? 'Everything is in place.' : `Still needed: ${missing.join(', ')}.`}{' '}
                <span className="text-muted">A lab is done or not done; it is not counted as reps.</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* The four stages at a glance. */}
      <aside className="order-first lg:order-none">
        <div className="sticky top-8 rounded-2xl bg-bg p-4 shadow-[0_0_0_1px_var(--hairline)] sm:p-5">
          <p className="label">{p.done ? 'Lab done' : `${stages.filter((s) => s.done).length} of 4 stages done`}</p>
          <ol className="mt-3 grid grid-cols-4 gap-1.5 lg:grid-cols-1">
            {stages.map((s, i) => (
              <li
                key={s.key}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-center text-[12px] font-medium lg:flex-row lg:gap-2.5 lg:text-left lg:text-[13px] ${
                  s.done ? 'bg-pass-soft text-green-ink' : now === s.key ? 'bg-flame-soft text-ink' : 'text-muted'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`num grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${s.done ? 'bg-pass text-white' : now === s.key ? 'bg-flame text-white' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}
                >
                  {s.done ? <IconCheck size={11} strokeWidth={3} /> : i + 1}
                </span>
                {s.title}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  )
}
