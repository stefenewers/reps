'use client'

import Link from 'next/link'
import DemoEmbed from '@/components/demos/demo-embed'
import LearningComplete from '@/components/course/learning-complete'
import { useState } from 'react'
import CodeView from '@/components/code-view'
import Markdown from '@/components/markdown'
import Ring from '@/components/ring'
import { IconArrowRight, IconCheck, IconCode, IconLock } from '@/components/icons'
import type { WorkedExample } from '@/data/course/types'
import '@/components/demos/learning.css'

/**
 * A worked example by subgoals (REPS_2_MASTER_SPEC.md §35): one goal at a time,
 * then the whole solution, then "Rebuild it" in a blank editor with the
 * example out of sight. The rail shows where you are on the way to the rebuild.
 */
export default function WorkedExampleView({ example }: { example: WorkedExample }) {
  const [shown, setShown] = useState(1)
  const total = example.subgoals.length
  const all = shown > total
  const seen = Math.min(shown, total)
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,720px)_260px] lg:justify-between" data-testid="worked-example">
      <div className="flex min-w-0 flex-col gap-8">
        <section className="rounded-2xl bg-bg p-5 shadow-[0_0_0_1px_var(--hairline)] sm:p-6">
          <p className="eyebrow text-learn">The task</p>
          <Markdown text={example.problem} className="mt-2 !text-[16px] !leading-relaxed" />
        </section>
        {example.manualReasoning && (
          <section className="rounded-2xl bg-learn-soft p-5 sm:p-6">
            <p className="eyebrow text-learn">First, by hand</p>
            <ol className="mt-3 flex flex-col gap-2.5">
              {example.manualReasoning.map((step, i) => (
                <li key={step} className="flex gap-3 text-[14.5px] leading-relaxed text-ink">
                  <span className="lesson-num num !size-6 !bg-white !text-[11px]" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <ol className="goal-rail">
          {example.subgoals.slice(0, shown).map((g, i) => (
            <li key={i} className="goal" data-testid="subgoal" data-latest={i === shown - 1 && !all ? 'true' : 'false'}>
              <span className="goal-dot num" aria-hidden="true">
                {i + 1}
              </span>
              <p className="eyebrow pt-2 text-learn">
                Goal {i + 1} of {total}
              </p>
              <h2 className="font-display mt-1 text-[22px] font-semibold leading-tight tracking-tight text-ink">{g.title}</h2>
              <Markdown text={g.explanation} className="mt-2 !text-[15px] !leading-relaxed" />
              {g.code && <CodeView code={g.code} className="mt-3" />}
            </li>
          ))}
        </ol>

        {all ? (
          <section className="celebrate-in flex flex-col gap-5">
            {example.demoId && (
              <div>
                <p className="eyebrow mb-3 text-learn">Watch it run</p>
                <DemoEmbed id={example.demoId} compact />
              </div>
            )}
            <div>
              <p className="eyebrow mb-3 flex items-center gap-2 text-ink-2">
                <IconCode size={14} /> All together
              </p>
              <CodeView code={example.solution} />
            </div>
            <div className="rounded-2xl bg-shell p-5 text-shell-ink sm:p-6">
              <p className="font-display text-[24px] font-semibold tracking-tight">Rebuild it</p>
              <p className="mt-1 max-w-[560px] text-[14px] leading-relaxed text-shell-muted">
                Now write it yourself from a blank editor. The example stays here; the rep will not show it.
              </p>
              <Link href={`/rep/${example.reconstructionExerciseId}`} className="btn btn-accent btn-lg mt-4" data-testid="rebuild">
                Rebuild it <IconArrowRight size={14} />
              </Link>
            </div>
            <LearningComplete stateKey={`example:${example.id}`} kind="example" />
          </section>
        ) : (
          <button type="button" className="btn btn-accent btn-lg self-start" onClick={() => setShown((n) => n + 1)} data-testid="next-goal">
            {shown < total ? `Next: goal ${shown + 1}` : 'Show it all together'} <IconArrowRight size={14} />
          </button>
        )}
      </div>

      {/* The rail: progress toward the rebuild. */}
      <aside className="order-first lg:order-none">
        <div className="sticky top-8 rounded-2xl bg-bg p-4 shadow-[0_0_0_1px_var(--hairline)] sm:p-5">
          <div className="flex items-center gap-3">
            <Ring value={all ? total + 1 : seen} max={total + 1} size={52} stroke={5} color="var(--learn)">
              <span className="num text-[12px] font-semibold">
                {all ? total + 1 : seen}/{total + 1}
              </span>
            </Ring>
            <div className="leading-tight">
              <p className="text-[14px] font-semibold">{all ? 'Ready to rebuild' : `Goal ${seen} of ${total}`}</p>
              <p className="text-[12px] text-muted">One goal at a time, then yours.</p>
            </div>
          </div>
          <ol className="mt-4 hidden flex-col gap-1.5 lg:flex">
            {example.subgoals.map((g, i) => {
              const open = i < shown
              return (
                <li key={i} className={`flex items-start gap-2.5 text-[13px] ${open ? 'text-ink' : 'text-faint'}`}>
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full text-[10px] font-bold ${open ? 'bg-learn text-white' : 'shadow-[inset_0_0_0_1.5px_var(--line-strong)]'}`}
                  >
                    {open ? <IconCheck size={9} strokeWidth={3} /> : i + 1}
                  </span>
                  {open ? g.title : `Goal ${i + 1}`}
                </li>
              )
            })}
            <li className={`mt-1 flex items-center gap-2.5 border-t border-line pt-2.5 text-[13px] font-semibold ${all ? 'text-ink' : 'text-faint'}`}>
              <span aria-hidden="true" className={`grid size-[18px] place-items-center rounded-full ${all ? 'bg-flame text-white' : 'bg-surface-2'}`}>
                {all ? <IconArrowRight size={9} /> : <IconLock size={9} />}
              </span>
              Rebuild it from blank
            </li>
          </ol>
        </div>
      </aside>
    </div>
  )
}
