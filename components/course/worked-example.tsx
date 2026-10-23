'use client'

import Link from 'next/link'
import { useState } from 'react'
import CodeView from '@/components/code-view'
import Markdown from '@/components/markdown'
import { IconArrowRight } from '@/components/icons'
import type { WorkedExample } from '@/data/course/types'

/**
 * A worked example by subgoals (REPS_2_MASTER_SPEC.md §35): one goal at a time,
 * then the whole solution, then "Rebuild it" in a blank editor with the
 * example out of sight.
 */
export default function WorkedExampleView({ example }: { example: WorkedExample }) {
  const [shown, setShown] = useState(1)
  const all = shown > example.subgoals.length
  return (
    <div className="flex flex-col gap-5" data-testid="worked-example">
      <section className="rounded-xl bg-surface px-4 py-3.5">
        <p className="label">The task</p>
        <Markdown text={example.problem} className="mt-1 !text-[14.5px]" />
      </section>
      <ol className="flex flex-col gap-4">
        {example.subgoals.slice(0, shown).map((g, i) => (
          <li key={i} className="celebrate-in rounded-xl px-4 py-3.5 shadow-[inset_2px_0_0_var(--learn)]" data-testid="subgoal">
            <p className="eyebrow text-learn">Goal {i + 1}</p>
            <p className="mt-0.5 text-[15.5px] font-semibold tracking-tight text-ink">{g.title}</p>
            <Markdown text={g.explanation} className="mt-1 !text-[14px]" />
            {g.code && <CodeView code={g.code} className="mt-2.5" />}
          </li>
        ))}
      </ol>
      {all ? (
        <section className="celebrate-in flex flex-col gap-2">
          <p className="label">All together</p>
          <CodeView code={example.solution} />
          <div className="mt-3 rounded-xl bg-learn-soft px-4 py-3.5">
            <p className="text-[14.5px] font-semibold text-ink">Rebuild it</p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">Now write it yourself from a blank editor. The example stays here; the rep will not show it.</p>
            <Link href={`/rep/${example.reconstructionExerciseId}`} className="btn btn-accent mt-3" data-testid="rebuild">
              Rebuild it <IconArrowRight size={14} />
            </Link>
          </div>
        </section>
      ) : (
        <button type="button" className="btn self-start" onClick={() => setShown((n) => n + 1)} data-testid="next-goal">
          {shown < example.subgoals.length ? `Next: goal ${shown + 1}` : 'Show it all together'} <IconArrowRight size={14} />
        </button>
      )}
    </div>
  )
}
