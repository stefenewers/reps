'use client'

import dynamic from 'next/dynamic'
import { Fragment, useEffect, useRef, useState } from 'react'
import Markdown from '@/components/markdown'
import CodeView from '@/components/code-view'
import { IconPlay, IconRotate, IconX } from '@/components/icons'
import { RepsBars } from '@/components/motif'
import { getRunner } from '@/lib/python/runner'
import type { Primer, Recipe } from '@/data/primers/types'
import type { Move } from '@/data/primers/moves'
import type { Brief } from '@/data/briefs'

const CodeEditor = dynamic(() => import('@/components/code-editor'), { ssr: false, loading: () => <div className="h-[150px] bg-editor" /> })

/**
 * The basics behind a rep, on request, focused on the rep in front of you:
 * the question in plain English, then only the moves it is built from. The
 * full concept guide stays one tap away. Teaches the concept, never the answer.
 */
export default function BasicsPanel({ brief, moves, primers, onClose }: { brief?: Brief; moves: Move[]; primers: Primer[]; onClose: () => void }) {
  const focused = Boolean(brief) || moves.length > 0
  const [guideOpen, setGuideOpen] = useState(!focused)
  const host = useRef<HTMLElement>(null)

  useEffect(() => {
    host.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  return (
    <section ref={host} aria-label="Basics" className="rise-in overflow-hidden rounded-2xl bg-bg shadow-[0_0_0_1px_var(--line-strong),var(--shadow-md)]">
      <div className="flex items-center gap-3 px-4 pb-0 pt-3.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <RepsBars width={14} bar={2} gap={1.5} /> Basics
        </span>
        <button type="button" className="icon-btn ml-auto !size-7" onClick={onClose} aria-label="Close basics">
          <IconX size={13} />
        </button>
      </div>

      {focused && (
        <div className="flex flex-col gap-5 px-4 pb-4 pt-3">
          {brief && <BriefView brief={brief} />}
          {moves.length > 0 && <MovesView moves={moves} />}
        </div>
      )}

      {primers.length > 0 && focused && (
        <button
          type="button"
          aria-expanded={guideOpen}
          onClick={() => setGuideOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-muted transition-colors hover:bg-surface hover:text-ink"
          style={{ boxShadow: '0 -1px 0 var(--hairline)' }}
        >
          <span aria-hidden="true" className={`inline-block transition-transform ${guideOpen ? 'rotate-90' : ''}`}>›</span>
          Full guide
          <span className="truncate text-faint">· {primers[0].title}{primers.length > 1 ? ` +${primers.length - 1}` : ''}</span>
        </button>
      )}
      {guideOpen && primers.length > 0 && <Guide primers={primers} />}
    </section>
  )
}

/** The question, decoded: what each input is, what you hand back, what to watch. */
function BriefView({ brief }: { brief: Brief }) {
  return (
    <div>
      <p className="label mb-2">This question, in plain English</p>
      <div className="flex flex-col gap-2.5 rounded-xl bg-surface px-3.5 py-3">
        {brief.task && <Markdown text={brief.task} className="!text-[14px] !leading-relaxed" />}
        {brief.inputs?.length ? (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13.5px] leading-relaxed">
            {brief.inputs.map((i) => (
              <Fragment key={i.name}>
                <dt>
                  <code className="mono rounded bg-bg px-1.5 py-0.5 text-[12.5px] text-ink shadow-[inset_0_0_0_1px_var(--line)]">{i.name}</code>
                </dt>
                <dd className="min-w-0 text-ink-2">
                  <Markdown text={i.is} className="!text-[13.5px]" />
                </dd>
              </Fragment>
            ))}
          </dl>
        ) : null}
        {brief.returns && (
          <p className="text-[13.5px] leading-relaxed text-ink-2">
            <span className="font-medium text-ink">You return </span>
            <Markdown text={brief.returns} inline className="!text-[13.5px]" />
          </p>
        )}
        {brief.catch && (
          <p className="flex gap-2 text-[13.5px] leading-relaxed text-ink-2">
            <span aria-hidden="true" className="mt-[8px] size-1.5 shrink-0 rounded-full bg-amber" />
            <span>
              <span className="font-medium text-ink">Watch for: </span>
              <Markdown text={brief.catch} inline className="!text-[13.5px]" />
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

/** Only the moves this rep is built from, closed until you ask. */
function MovesView({ moves }: { moves: Move[] }) {
  const [tryIt, setTryIt] = useState<{ code: string; n: number } | null>(null)
  const tryRef = useRef<HTMLDivElement>(null)
  const load = (code: string) => {
    setTryIt((t) => ({ code, n: (t?.n ?? 0) + 1 }))
    requestAnimationFrame(() => tryRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }
  return (
    <div className="flex flex-col gap-3">
      <Recipes recipes={moves} onTry={load} label="The moves you’ll need" initialOpen={-1} />
      {tryIt && (
        <div ref={tryRef}>
          <TryIt key={tryIt.n} initial={tryIt.code} />
        </div>
      )}
    </div>
  )
}

/** The whole concept primer(s), for browsing. */
function Guide({ primers }: { primers: Primer[] }) {
  const [active, setActive] = useState(0)
  const p = primers[Math.min(active, primers.length - 1)]
  return (
    <div style={{ boxShadow: '0 -1px 0 var(--hairline)' }}>
      {primers.length > 1 && (
        <div role="tablist" aria-label="Concepts" className="seg mx-4 mt-3 !p-[2px]">
          {primers.map((x, i) => (
            <button key={x.id} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)} className="!h-6 !px-2 !text-[12px]">
              {x.title}
            </button>
          ))}
        </div>
      )}
      <PrimerBody key={p.id} p={p} showTitle={primers.length === 1} />
    </div>
  )
}

function PrimerBody({ p, showTitle }: { p: Primer; showTitle: boolean }) {
  const [tryIt, setTryIt] = useState({ code: p.example.code, n: 0 })
  const tryRef = useRef<HTMLDivElement>(null)

  const load = (code: string) => {
    setTryIt((t) => ({ code, n: t.n + 1 }))
    requestAnimationFrame(() => tryRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }

  const syntax = (
    <ul className="flex flex-col gap-1.5">
      {p.syntax.map((s, i) => (
        <li key={i} className="grid gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:items-center">
          <CodeView code={s.code} className="!py-1.5 !text-[12.5px]" />
          <Markdown text={s.note} className="!text-[12.5px] !leading-snug !text-muted" />
        </li>
      ))}
    </ul>
  )

  return (
    <div className="fade-in flex flex-col gap-4 px-4 pb-4 pt-3">
      {showTitle && <h3 className="h3 text-[15px]">{p.title}</h3>}
      <Markdown text={p.what} className="!text-[14px]" />
      <p className="rounded-lg bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink-2 shadow-[inset_2px_0_0_var(--ink)]">
        <span className="font-medium text-ink">Think of it as</span> {p.model.charAt(0).toLowerCase() + p.model.slice(1)}
      </p>

      {p.recipes?.length ? (
        <>
          <Recipes recipes={p.recipes} onTry={load} />
          <details className="group">
            <summary className="label flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">›</span> Quick reference
            </summary>
            <div className="mt-2">{syntax}</div>
          </details>
        </>
      ) : (
        <div>
          <p className="label mb-2">What you’ll type</p>
          {syntax}
        </div>
      )}

      <div ref={tryRef}>
        <TryIt key={tryIt.n} initial={tryIt.code} />
      </div>

      <div>
        <p className="label mb-1.5">Watch out</p>
        <ul className="flex flex-col gap-1.5">
          {p.gotchas.map((g, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
              <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-amber" />
              <Markdown text={g} className="!text-[13px]" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Task first: pick what you're trying to do, see it inside a real function. */
function Recipes({ recipes, onTry, label = 'When you want to…', initialOpen = 0 }: { recipes: Recipe[]; onTry: (code: string) => void; label?: string; initialOpen?: number }) {
  const [open, setOpen] = useState(initialOpen)
  return (
    <div>
      <p className="label mb-2">{label}</p>
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--line)]">
        {recipes.map((r, i) => {
          const on = i === open
          return (
            <li key={r.when}>
              <button
                type="button"
                aria-expanded={on}
                onClick={() => setOpen(on ? -1 : i)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13.5px] transition-colors ${on ? 'bg-surface font-medium text-ink' : 'text-ink-2 hover:bg-surface'}`}
              >
                <span className={`num w-4 shrink-0 text-[11px] ${on ? 'text-accent' : 'text-faint'}`}>{i + 1}</span>
                <span className="min-w-0 flex-1">…{r.when}</span>
                <span aria-hidden="true" className={`text-faint transition-transform ${on ? 'rotate-90' : ''}`}>›</span>
              </button>
              {on && (
                <div className="fade-in flex flex-col gap-2 bg-surface px-3 pb-3">
                  <CodeView code={r.code} className="!text-[12.5px] max-sm:!text-[11.5px]" label={`Example: ${r.when}`} />
                  <div className="flex items-start gap-2">
                    <span className="label mt-[5px] shrink-0">Prints</span>
                    <pre className="code-view min-w-0 flex-1 !py-1.5 !text-[12px]">{r.output}</pre>
                  </div>
                  <Markdown text={r.note} className="!text-[13px] !leading-relaxed" />
                  <div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onTry(r.code)}>
                      <IconPlay size={10} /> Load into Try it
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** A small editable example: change it, run it, see what Python prints. */
function TryIt({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial)
  const [out, setOut] = useState<{ text: string; error: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    const r = await getRunner().run(code, [])
    setOut(r.infraError ? { text: `Python could not run: ${r.infraError}`, error: true } : r.error ? { text: `${r.stdout}${r.error}`, error: true } : { text: r.stdout.replace(/\n$/, '') || '(nothing printed)', error: false })
    setBusy(false)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="label">Try it</p>
        <div className="flex items-center gap-1">
          {code !== initial && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => (setCode(initial), setOut(null))}>
              <IconRotate size={12} /> Reset
            </button>
          )}
          <button type="button" className="btn btn-sm" onClick={run} disabled={busy}>
            <IconPlay size={10} /> {busy ? 'Running…' : 'Run'}
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--line)]">
        <CodeEditor value={code} onChange={setCode} onRun={run} assist={false} ariaLabel="Example code" minHeight={120} />
      </div>
      {out ? (
        <pre className={`code-view mt-2 !py-2 !text-[12.5px] ${out.error ? '!text-fail' : ''}`} aria-live="polite">
          {out.text}
        </pre>
      ) : (
        <p className="mt-1.5 text-[12px] text-faint">Edit it and run it. ⌘↵ works here too.</p>
      )}
    </div>
  )
}
