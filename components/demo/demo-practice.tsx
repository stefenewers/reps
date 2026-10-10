'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import Markdown from '@/components/markdown'
import { IconBulb, IconPlay, IconRotate } from '@/components/icons'
import { TestResults } from '@/components/rep/results'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { BRIEFS } from '@/data/briefs'
import { DEMO_REPS } from '@/data/demo'
import { getRunner, type RunResult } from '@/lib/python/runner'

const CodeEditor = dynamic(() => import('@/components/code-editor'), { ssr: false, loading: () => <div className="h-[260px] bg-editor" /> })

/**
 * A short ladder to try: four real reps, run against their real tests with
 * Python in the browser. Everything stays in this tab; nothing is saved.
 */
export default function DemoPractice() {
  const reps = DEMO_REPS.map((r) => ({ ...r, ex: EXERCISE_BY_ID[r.id] }))
  const [at, setAt] = useState(0)
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, RunResult>>({})
  const [hints, setHints] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)

  const { ex, why, rung } = reps[at]
  const code = codes[ex.id] ?? ex.starterCode ?? ''
  const result = results[ex.id]
  const passed = (id: string) => {
    const r = results[id]
    return Boolean(r && !r.error && r.tests.length > 0 && r.tests.every((t) => t.passed))
  }
  const brief = BRIEFS[ex.id]
  const shown = hints[ex.id] ?? 0

  const run = async () => {
    if (busy) return
    setBusy(true)
    const r = await getRunner().run(code, ex.tests ?? [])
    setResults((m) => ({ ...m, [ex.id]: r }))
    setBusy(false)
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-bg shadow-[0_0_0_1px_var(--line-strong),var(--shadow-md)]" data-testid="demo-practice">
      <div role="tablist" aria-label="Reps in this ladder" className="flex overflow-x-auto [scrollbar-width:none]" style={{ boxShadow: 'inset 0 -1px 0 var(--line)' }}>
        {reps.map((r, i) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={i === at}
            onClick={() => setAt(i)}
            className={`flex shrink-0 items-center gap-2 px-4 py-3 text-[13.5px] transition-colors ${i === at ? 'font-medium text-ink shadow-[inset_0_-2px_0_var(--accent)]' : 'text-muted hover:text-ink'}`}
          >
            <span className={`num grid size-5 place-items-center rounded-md text-[11.5px] ${passed(r.id) ? 'bg-ink text-white' : 'bg-surface-2 text-ink-2'}`}>{passed(r.id) ? '✓' : i + 1}</span>
            {r.rung}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <p className="eyebrow text-muted">
              Rep {at + 1} of {reps.length} · {rung}
            </p>
            <h3 className="mt-1.5 text-[19px] font-semibold tracking-tight">{ex.title.replace(/^[A-Za-z ]+: /, '').replace(/^./, (c) => c.toUpperCase())}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{why}</p>
          </div>
          <Markdown text={ex.prompt} className="!text-[14.5px]" />
          {ex.examples && ex.examples.length > 0 && (
            <div className="well divide-y divide-line overflow-hidden">
              {ex.examples.slice(0, 2).map((x, i) => (
                <div key={i} className="grid grid-cols-[30px_1fr] gap-x-3 gap-y-1 px-4 py-2.5 text-[13px]">
                  <span className="mono text-muted">in</span>
                  <span className="mono break-all text-ink-2">{x.input}</span>
                  <span className="mono text-muted">out</span>
                  <span className="mono break-all font-medium text-ink">{x.output}</span>
                </div>
              ))}
            </div>
          )}
          {brief && (
            <div className="rounded-xl bg-surface px-3.5 py-3 text-[13.5px] leading-relaxed text-ink-2">
              <p className="label mb-1.5">In plain English</p>
              {brief.task && <Markdown text={brief.task} className="!text-[13.5px]" />}
              {brief.inputs?.map((i) => (
                <p key={i.name}>
                  <code className="mono rounded bg-bg px-1.5 py-0.5 text-[12.5px] text-ink shadow-[inset_0_0_0_1px_var(--line)]">{i.name}</code> <Markdown text={i.is} inline className="!text-[13.5px]" />
                </p>
              ))}
              {brief.returns && (
                <p className="mt-1">
                  <span className="font-medium text-ink">You return </span>
                  <Markdown text={brief.returns} inline className="!text-[13.5px]" />
                </p>
              )}
            </div>
          )}
          {(ex.hints ?? []).slice(0, shown).map((h, i) => (
            <div key={i} className="rounded-xl px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line)]">
              <p className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-muted">
                <IconBulb size={13} /> Hint {i + 1}
              </p>
              <Markdown text={h} className="!text-[13.5px]" />
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-col bg-editor" style={{ boxShadow: 'inset 1px 0 0 var(--line)' }}>
          <CodeEditor key={ex.id} value={code} onChange={(v) => setCodes((m) => ({ ...m, [ex.id]: v }))} onRun={run} ariaLabel={`Python editor: ${ex.title}`} minHeight={260} />
          <div className="flex flex-wrap items-center gap-2 bg-bg px-3 py-3" style={{ boxShadow: '0 -1px 0 var(--line)' }}>
            {shown < (ex.hints?.length ?? 0) && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHints((m) => ({ ...m, [ex.id]: shown + 1 }))}>
                <IconBulb size={13} /> Hint {shown + 1}/{ex.hints!.length}
              </button>
            )}
            {code !== (ex.starterCode ?? '') && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => (setCodes((m) => ({ ...m, [ex.id]: ex.starterCode ?? '' })), setResults((m) => Object.fromEntries(Object.entries(m).filter(([k]) => k !== ex.id))))}>
                <IconRotate size={12} /> Reset
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {passed(ex.id) && at < reps.length - 1 && (
                <button type="button" className="btn" onClick={() => setAt(at + 1)}>
                  Next rep
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={run} disabled={busy} data-testid="demo-run">
                <IconPlay size={11} /> {busy ? 'Running…' : 'Run the tests'}
              </button>
            </div>
          </div>
          {result && (
            <div className="max-h-[300px] overflow-y-auto bg-bg px-4 py-3" style={{ boxShadow: '0 -1px 0 var(--line)' }} data-testid="demo-results">
              <TestResults result={result} mode="practice" submitted />
            </div>
          )}
          {!result && <p className="bg-bg px-4 pb-3 text-[12.5px] text-muted">Python runs in your browser. The first run takes a few seconds to load it. Nothing you type is saved or sent anywhere.</p>}
        </div>
      </div>
    </div>
  )
}
