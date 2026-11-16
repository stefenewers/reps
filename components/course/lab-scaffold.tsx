'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useReps } from '@/components/reps-provider'
import { IconArrowRight, IconCheck, IconLock } from '@/components/icons'
import Markdown from '@/components/markdown'
import type { Fade, Lab } from '@/data/course/types'
import { DESIGN_MIN_CHARS } from '@/lib/course/labs'
import { scaffoldKey, scaffoldProgress, stepUnlocked, type ScaffoldState } from '@/lib/course/scaffold'
import { getRunner } from '@/lib/python/runner'

const FADE_COPY: Record<Fade, string> = {
  full: 'Full support: a worked example first, then each step with its hints.',
  partial: 'Less support: step titles only, hints when you ask.',
  minimal: 'On your own: requirements and design below, then explain it back.'
}

/** The learner's latest code for an exercise: this browser's draft first (it is newer), then the synced one. */
function latestDraft(repo: { draft(id: string): string | undefined }, exerciseId: string): string {
  try {
    const local = window.localStorage.getItem(`reps-draft:${exerciseId}`)
    if (local) return local
  } catch {
    /* storage off */
  }
  return repo.draft(exerciseId) ?? ''
}

/**
 * A scaffolded lab, in order: the worked example, the steps (each locked until the one before it passes its
 * checkpoint), the hint ladder one rung at a time, the reveal (which marks the step as not your own work) and
 * the explain-back. The fade decides how much of it shows. Progress: study state `scaffold:<labId>`.
 */
export default function LabScaffold({ lab, fade }: { lab: Lab; fade: Fade }) {
  const { repo, today } = useReps()
  const s = lab.scaffold!
  const [local, setLocal] = useState<ScaffoldState | undefined>()
  const state: ScaffoldState = local ?? repo.state<ScaffoldState>(scaffoldKey(lab.id)) ?? { steps: {} }
  const save = (next: ScaffoldState) => {
    setLocal(next)
    void repo.setState(scaffoldKey(lab.id), next)
  }
  const progress = scaffoldProgress(lab, state)
  const [running, setRunning] = useState<number | null>(null)
  const [result, setResult] = useState<Record<number, string>>({})
  const [askedHints, setAskedHints] = useState(fade === 'full')
  const [showRef, setShowRef] = useState(false)

  const check = async (i: number) => {
    const step = s.steps[i]
    const exerciseId = step.checkpoint.exerciseId ?? lab.buildExerciseId
    setRunning(i)
    const code = latestDraft(repo, exerciseId)
    const r = await getRunner().run(code, step.checkpoint.tests ?? [], 8000)
    setRunning(null)
    const failed = r.tests.filter((t) => !t.passed)
    const ok = !r.error && !r.infraError && r.tests.length > 0 && failed.length === 0
    const tried = { ...(state.tried ?? {}), [i]: true }
    if (ok) save({ ...state, tried, steps: { ...state.steps, [i]: state.steps[i] === 'revealed' ? 'revealed' : 'passed' } })
    else save({ ...state, tried })
    setResult({
      ...result,
      [i]: ok
        ? 'Checkpoint passed. The next step is open.'
        : r.infraError
          ? `Python could not run: ${r.infraError}`
          : r.error
            ? `Your build raised an error: ${r.error}`
            : !code.trim()
              ? 'No draft yet: write this step in the build first.'
              : `${failed.length} of ${r.tests.length} checks failed: ${failed.map((t) => t.name ?? t.call ?? 'check').slice(0, 3).join('; ')}`
    })
  }

  const reveal = (i: number) => save({ ...state, steps: { ...state.steps, [i]: 'revealed' }, revealedOn: { ...(state.revealedOn ?? {}), [i]: today } })

  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-bg p-5 shadow-[0_0_0_1px_var(--hairline)] sm:p-6" data-testid="lab-scaffold" data-fade={fade}>
      <div>
        <p className="eyebrow text-learn">Step by step</p>
        <p className="mt-1 text-[14px] text-ink-2" data-testid="scaffold-fade">
          {FADE_COPY[fade]}
        </p>
      </div>

      {fade === 'full' && (
        <details open className="rounded-xl bg-learn-soft px-4 py-3" data-testid="scaffold-worked-example">
          <summary className="cursor-pointer text-[15px] font-semibold text-ink">Worked example first</summary>
          <Markdown text={s.workedExample.problem} className="mt-2 !text-[14px]" />
          <ol className="mt-3 flex flex-col gap-3">
            {s.workedExample.walkthrough.map((w, i) => (
              <li key={i} className="text-[14px] text-ink-2">
                <p className="font-medium text-ink">
                  {i + 1}. <Markdown text={w.step} inline />
                </p>
                <p className="mt-0.5 text-muted">
                  <Markdown text={w.why} inline />
                </p>
                {w.code && <pre className="code-block mt-1.5 overflow-x-auto rounded-lg p-3 text-[12.5px]">{w.code}</pre>}
              </li>
            ))}
          </ol>
          <p className="label mt-3">The whole solution</p>
          <pre className="code-block mt-1 overflow-x-auto rounded-lg p-3 text-[12.5px]">{s.workedExample.solution}</pre>
        </details>
      )}

      {fade !== 'minimal' && (
        <ol className="flex flex-col gap-3" data-testid="scaffold-steps">
          {s.steps.map((step, i) => {
            const open = stepUnlocked(i, state)
            const st = state.steps[i]
            const hintsShown = state.hints?.[i] ?? 0
            const current = i === progress.current
            return (
              <li
                key={i}
                className={`rounded-xl px-4 py-3 ${current ? 'bg-flame-soft' : 'shadow-[0_0_0_1px_var(--hairline)]'}`}
                data-testid={`scaffold-step-${i}`}
                data-state={st ?? (open ? 'open' : 'locked')}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num grid size-6 place-items-center rounded-full text-[11px] font-bold shadow-[inset_0_0_0_1.5px_var(--line-strong)]" aria-hidden="true">
                    {st === 'passed' ? <IconCheck size={11} strokeWidth={3} /> : !open ? <IconLock size={11} /> : i + 1}
                  </span>
                  <h3 className="text-[15px] font-semibold text-ink">{step.title}</h3>
                  {st === 'passed' && <span className="tag tag-pass">Passed</span>}
                  {st === 'revealed' && <span className="tag tag-plain">Revealed · not your own work</span>}
                  {!open && <span className="tag tag-plain">Locked until step {i} passes</span>}
                </div>
                {open && (fade === 'full' || current) && (
                  <div className="mt-2 flex flex-col gap-2">
                    {fade === 'full' && <Markdown text={step.instruction} className="!text-[14px]" />}
                    <p className="text-[13px] text-muted">
                      Checkpoint: <Markdown text={step.checkpoint.description} inline />
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/rep/${step.checkpoint.exerciseId ?? lab.buildExerciseId}`} className="btn">
                        Write it in the {step.checkpoint.exerciseId && step.checkpoint.exerciseId !== lab.buildExerciseId ? 'change' : 'build'} <IconArrowRight size={13} />
                      </Link>
                      {step.checkpoint.tests?.length ? (
                        <button type="button" className="btn btn-accent" disabled={running !== null} onClick={() => void check(i)} data-testid={`scaffold-check-${i}`}>
                          {running === i ? 'Checking…' : 'Check this step'}
                        </button>
                      ) : null}
                    </div>
                    {result[i] && (
                      <p role="status" className="text-[13px] text-ink-2">
                        {result[i]}
                      </p>
                    )}
                    {/* The hint ladder: one rung at a time. */}
                    {(askedHints || fade === 'full') && step.hints.length > 0 && (
                      <div className="flex flex-col gap-1.5" data-testid={`scaffold-hints-${i}`}>
                        {step.hints.slice(0, hintsShown).map((h, k) => (
                          <p key={k} className="rounded-lg bg-surface px-3 py-2 text-[13px] text-ink-2">
                            <span className="font-medium">Hint {k + 1}.</span> <Markdown text={h} inline />
                          </p>
                        ))}
                        {hintsShown < step.hints.length && (
                          <button type="button" className="self-start text-[13px] text-learn hover:underline" onClick={() => save({ ...state, hints: { ...(state.hints ?? {}), [i]: hintsShown + 1 } })}>
                            {hintsShown ? 'Next hint' : 'Show a hint'} ({hintsShown + 1} of {step.hints.length})
                          </button>
                        )}
                      </div>
                    )}
                    {fade === 'partial' && !askedHints && (
                      <button type="button" className="self-start text-[13px] text-learn hover:underline" onClick={() => setAskedHints(true)}>
                        I want hints
                      </button>
                    )}
                    {/* The reveal: only after an attempt at this step, and it never counts as own work. */}
                    {!st && (
                      <div className="mt-1">
                        {state.tried?.[i] ? (
                          <button
                            type="button"
                            className="text-[13px] text-muted hover:text-ink hover:underline"
                            onClick={() => {
                              if (window.confirm('This step won’t count as your own work. Reveal the reference solution?')) {
                                reveal(i)
                                setShowRef(true)
                              }
                            }}
                            data-testid={`scaffold-reveal-${i}`}
                          >
                            Reveal the reference (this step won’t count as your own work; the build then counts only when passed again on a later day)
                          </button>
                        ) : (
                          <p className="text-[12.5px] text-muted">The reference opens after you check this step once.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {(showRef || progress.revealed.length > 0) && (
        <details className="rounded-xl bg-surface px-4 py-3" data-testid="scaffold-reference">
          <summary className="cursor-pointer text-[14px] font-medium text-ink">Reference solution (revealed: not your own work)</summary>
          <pre className="code-block mt-2 overflow-x-auto rounded-lg p-3 text-[12.5px]">{s.referenceSolution}</pre>
        </details>
      )}

      <div className="flex flex-col gap-3" data-testid="scaffold-explain">
        <p className="label">Explain it back</p>
        <p className="text-[13px] text-muted">In your own words, a sentence or two each. Needed before this lab can be marked done.</p>
        {s.explainBack.map((q, i) => {
          const ok = (state.explain?.[i] ?? '').trim().length >= DESIGN_MIN_CHARS
          return (
            <label key={i} className="flex flex-col gap-1.5">
              <span className="flex items-start gap-2 text-[14px] font-medium text-ink">
                {ok && <IconCheck size={13} strokeWidth={3} className="mt-1 text-pass" />}
                <Markdown text={q} inline />
              </span>
              <textarea
                className="input min-h-[64px] !text-[14px]"
                value={state.explain?.[i] ?? ''}
                onChange={(e) => save({ ...state, explain: { ...(state.explain ?? {}), [i]: e.target.value } })}
                data-testid={`explain-${i}`}
              />
            </label>
          )
        })}
      </div>
    </section>
  )
}
