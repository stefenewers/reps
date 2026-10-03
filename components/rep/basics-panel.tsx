'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import Markdown from '@/components/markdown'
import CodeView from '@/components/code-view'
import { IconPlay, IconRotate, IconX } from '@/components/icons'
import { RepsBars } from '@/components/motif'
import { getRunner } from '@/lib/python/runner'
import type { Primer } from '@/data/primers/types'

const CodeEditor = dynamic(() => import('@/components/code-editor'), { ssr: false, loading: () => <div className="h-[150px] bg-editor" /> })

/**
 * The basics behind a rep, on request: what the concept is, how to think about
 * it, the lines you'll type, a runnable example to poke at, and the classic
 * mistakes. Teaches the concept, never the answer.
 */
export default function BasicsPanel({ primers, onClose }: { primers: Primer[]; onClose: () => void }) {
  const [active, setActive] = useState(0)
  const host = useRef<HTMLElement>(null)
  const p = primers[Math.min(active, primers.length - 1)]

  useEffect(() => {
    host.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  return (
    <section ref={host} aria-label="Basics" className="rise-in overflow-hidden rounded-2xl bg-bg shadow-[0_0_0_1px_var(--line-strong),var(--shadow-md)]">
      <div className="flex items-center gap-3 px-4 pb-0 pt-3.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <RepsBars width={14} bar={2} gap={1.5} /> Basics
        </span>
        {primers.length > 1 && (
          <div role="tablist" aria-label="Concepts" className="seg ml-1 !p-[2px]">
            {primers.map((x, i) => (
              <button key={x.id} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)} className="!h-6 !px-2 !text-[12px]">
                {x.title}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="icon-btn ml-auto !size-7" onClick={onClose} aria-label="Close basics">
          <IconX size={13} />
        </button>
      </div>

      <div key={p.id} className="fade-in flex flex-col gap-4 px-4 pb-4 pt-3">
        {primers.length === 1 && <h3 className="h3 text-[15px]">{p.title}</h3>}
        <Markdown text={p.what} className="!text-[14px]" />
        <p className="rounded-lg bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink-2 shadow-[inset_2px_0_0_var(--ink)]">
          <span className="font-medium text-ink">Think of it as</span> {p.model.charAt(0).toLowerCase() + p.model.slice(1)}
        </p>

        <div>
          <p className="label mb-2">What you’ll type</p>
          <ul className="flex flex-col gap-1.5">
            {p.syntax.map((s, i) => (
              <li key={i} className="grid gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:items-center">
                <CodeView code={s.code} className="!py-1.5 !text-[12.5px]" />
                <Markdown text={s.note} className="!text-[12.5px] !leading-snug !text-muted" />
              </li>
            ))}
          </ul>
        </div>

        <TryIt example={p.example} />

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
    </section>
  )
}

/** A small editable example: change it, run it, see what Python prints. */
function TryIt({ example }: { example: Primer['example'] }) {
  const [code, setCode] = useState(example.code)
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
          {code !== example.code && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => (setCode(example.code), setOut(null))}>
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
