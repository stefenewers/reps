'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { DemoDefinition, DemoStep, VarValue } from '@/lib/demos/types'

/**
 * The shared player for every interactive demo (REPS_2_1_SPEC.md §13): the
 * visual state, the code with the executing line highlighted, the current step
 * and why it happens, the state variables, and controls (play, pause, back,
 * next, reset, speed, try another input). Prediction prompts pause the demo and
 * ask before revealing. Under reduced motion nothing animates or plays on its
 * own; stepping still works.
 */

export interface DemoViewProps<S> {
  state: S
  step: DemoStep<S>
}

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

const SPEEDS = [
  { label: '0.5×', ms: 2400 },
  { label: '1×', ms: 1400 },
  { label: '2×', ms: 700 },
]

function fmt(v: VarValue): string {
  if (v === null) return 'None'
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  return String(v)
}

export default function DemoPlayer<I, S>({ demo, View, onFinished, compact = false }: { demo: DemoDefinition<I, S>; View: (p: DemoViewProps<S>) => ReactNode; onFinished?: () => void; compact?: boolean }) {
  const reduced = usePrefersReducedMotion()
  const [input, setInput] = useState<I>(demo.defaultInput)
  const steps = useMemo(() => demo.run(input), [demo, input])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  // Predictions answered at each step index for this input (cleared when the input changes).
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [inputText, setInputText] = useState(() => demo.formatInput(demo.defaultInput))
  const [inputError, setInputError] = useState<string | null>(null)
  const finished = useRef(false)

  const step = steps[Math.min(index, steps.length - 1)]
  const pending = step.predict && answers[index] === undefined
  // While a prediction is pending, the view still shows the step before it: the answer is not given away.
  const shown = pending && index > 0 ? steps[index - 1] : step
  const last = index >= steps.length - 1

  const go = (i: number) => setIndex(Math.max(0, Math.min(steps.length - 1, i)))
  const reset = () => {
    setPlaying(false)
    setIndex(0)
    setAnswers({})
    finished.current = false
  }

  // Play: advance on a timer, stop at predictions and at the end. Never on its own under reduced motion.
  useEffect(() => {
    if (!playing || pending || last) return
    const t = window.setTimeout(() => setIndex((i) => Math.min(steps.length - 1, i + 1)), SPEEDS[speed].ms)
    return () => window.clearTimeout(t)
  }, [playing, pending, last, speed, index, steps.length])

  useEffect(() => {
    if (last && !pending && !finished.current) {
      finished.current = true
      onFinished?.()
    }
  }, [last, pending, onFinished])

  const tryInput = () => {
    if (!demo.parseInput) return
    const r = demo.parseInput(inputText)
    if ('error' in r) return setInputError(r.error)
    setInputError(null)
    setInput(r.input)
    reset()
  }
  const pickPreset = (k: number) => {
    const p = demo.presets[k]
    setInput(p.input)
    setInputText(demo.formatInput(p.input))
    setInputError(null)
    reset()
  }

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="demo-player"
      data-demo={demo.id}
      data-step={index}
      data-steps={steps.length}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' && !pending) go(index + 1)
        if (e.key === 'ArrowLeft') go(index - 1)
      }}
    >
      <p className="rounded-xl bg-learn-soft px-4 py-2.5 text-[13.5px] leading-relaxed text-ink" data-testid="demo-rule">
        <span className="font-semibold">The rule: </span>
        {demo.rule}
      </p>

      <div className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]'}`}>
        {/* VISUAL STATE */}
        <section aria-label="What the code is doing" className="min-w-0 rounded-2xl bg-bg p-4 shadow-[0_0_0_1px_var(--line)]" data-testid="demo-visual">
          <View state={shown.state} step={shown} />
        </section>

        {/* CODE */}
        <section aria-label="The code" className="min-w-0 overflow-x-auto rounded-2xl bg-editor p-3 shadow-[0_0_0_1px_var(--line)]" data-testid="demo-code">
          <pre className="mono text-[12.5px] leading-[1.7]">
            {demo.code.map((line, i) => {
              const on = shown.lines.includes(i + 1)
              return (
                <div key={i} className={`flex gap-3 rounded-md px-2 ${on ? 'bg-learn-soft text-ink shadow-[inset_2px_0_0_var(--learn)]' : 'text-ink-2'}`} data-line={i + 1} data-active={on ? 'true' : undefined}>
                  <span className="w-5 shrink-0 select-none text-right text-faint">{i + 1}</span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              )
            })}
          </pre>
        </section>
      </div>

      {/* CURRENT STEP + WHY, or the prediction */}
      {pending ? (
        <section className="rounded-2xl bg-flame-soft p-4 shadow-[inset_0_0_0_1px_var(--flame-2)]" data-testid="demo-predict" aria-live="polite">
          <p className="eyebrow text-flame">Predict first</p>
          <p className="mt-1 text-[15px] font-medium text-ink">{step.predict!.question}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {step.predict!.choices.map((c, k) => (
              <button key={c} type="button" className="btn btn-sm" onClick={() => setAnswers((a) => ({ ...a, [index]: k }))} data-testid={`predict-${k}`}>
                {c}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="grid gap-3 rounded-2xl bg-surface p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" aria-live="polite">
          <div>
            <p className="eyebrow text-learn" data-testid="demo-label">
              Step {index + 1} of {steps.length} · {step.label}
            </p>
            {step.predict && answers[index] !== undefined && (
              <p className={`mt-1 text-[13px] font-medium ${answers[index] === step.predict.answer ? 'text-green-ink' : 'text-repair'}`} data-testid="demo-predicted">
                {answers[index] === step.predict.answer ? 'Right.' : `Not quite: ${step.predict.choices[step.predict.answer]}.`}
              </p>
            )}
            <p className="mt-1 text-[14.5px] leading-relaxed text-ink" data-testid="demo-why">
              {step.why}
            </p>
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 self-start text-[13px]" data-testid="demo-vars">
            {Object.entries(step.vars).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="mono text-muted">{k}</dt>
                <dd className="mono num text-ink">{fmt(v)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* CONTROLS */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Demo controls">
        <button type="button" className="btn btn-sm" onClick={() => go(index - 1)} disabled={index === 0} data-testid="demo-prev">
          ← Back
        </button>
        <button type="button" className="btn btn-accent btn-sm" onClick={() => go(index + 1)} disabled={last || Boolean(pending)} data-testid="demo-next">
          Next step →
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setPlaying((p) => !p)} disabled={last} aria-pressed={playing} data-testid="demo-play" title={reduced ? 'Plays one step at a time, without animation' : undefined}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset} data-testid="demo-reset">
          Reset
        </button>
        <span className="ml-1 inline-flex items-center gap-1 text-[12px] text-muted">
          Speed
          {SPEEDS.map((s, k) => (
            <button key={s.label} type="button" className={`rounded-md px-1.5 py-0.5 ${speed === k ? 'bg-ink text-white' : 'hover:bg-surface-2'}`} onClick={() => setSpeed(k)} aria-pressed={speed === k}>
              {s.label}
            </button>
          ))}
        </span>
        <span className="h-1.5 min-w-[80px] flex-1 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
          <span className="block h-full rounded-full bg-learn transition-[width] duration-300" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
        </span>
      </div>

      {/* TRY ANOTHER INPUT */}
      <div className="flex flex-wrap items-center gap-2 text-[13px]" data-testid="demo-input">
        <span className="text-muted">Try another input:</span>
        {demo.presets.map((p, k) => (
          <button key={p.label} type="button" className="chip" onClick={() => pickPreset(k)}>
            {p.label}
          </button>
        ))}
        {demo.parseInput && (
          <form
            className="flex min-w-[240px] flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              tryInput()
            }}
          >
            <input className="input mono !h-8 !text-[12.5px]" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={demo.inputHint} aria-label="Your own input" data-testid="demo-custom" />
            <button type="submit" className="btn btn-sm">
              Run
            </button>
          </form>
        )}
        {inputError && (
          <p className="w-full text-[12.5px] text-repair" role="alert" data-testid="demo-input-error">
            {inputError}
          </p>
        )}
      </div>
    </div>
  )
}
