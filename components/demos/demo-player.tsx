'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { IconArrowLeft, IconArrowRight, IconBulb, IconPlay, IconRotate } from '@/components/icons'
import type { DemoDefinition, DemoStep, VarValue } from '@/lib/demos/types'
import '@/components/demos/learning.css'

/**
 * The shared player for every interactive demo (REPS_2_1_SPEC.md §13): the
 * visual state on a stage, the code with the executing line lit, the step and
 * why it happens as a caption, the state variables (a changed one flashes), and
 * controls (back, next, play, reset, speed, a timeline, try another input).
 * Prediction prompts pause the demo and ask before revealing; the timeline
 * never jumps past an unanswered one. Under reduced motion nothing animates or
 * plays on its own; stepping still works.
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
    () => false
  )
}

const SPEEDS = [
  { label: '0.5×', ms: 2400 },
  { label: '1×', ms: 1400 },
  { label: '2×', ms: 700 }
]

function fmt(v: VarValue): string {
  if (v === null) return 'None'
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  return String(v)
}

function IconPause({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3.5" y="2.5" width="3" height="11" rx="1" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="1" />
    </svg>
  )
}

export default function DemoPlayer<I, S>({
  demo,
  View,
  onFinished,
  compact = false
}: {
  demo: DemoDefinition<I, S>
  View: (p: DemoViewProps<S>) => ReactNode
  onFinished?: () => void
  compact?: boolean
}) {
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
  const before = index > 0 ? steps[index - 1] : undefined
  const last = index >= steps.length - 1
  // The furthest the timeline may jump: up to the first unanswered prediction after here.
  const reachable = useMemo(() => {
    for (let i = index + 1; i < steps.length; i++) if (steps[i].predict && answers[i] === undefined) return i
    return steps.length - 1
  }, [index, steps, answers])

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
  const fill = steps.length > 1 ? (index / (steps.length - 1)) * 100 : 100

  return (
    <div
      className="flex flex-col gap-4 rounded-[24px] outline-none"
      data-testid="demo-player"
      data-demo={demo.id}
      data-step={index}
      data-steps={steps.length}
      tabIndex={0}
      aria-label={`${demo.title}: interactive demo. Left and right arrow keys step.`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' && !pending) go(index + 1)
        if (e.key === 'ArrowLeft') go(index - 1)
      }}
    >
      <p className="flex items-start gap-3 rounded-2xl bg-learn-soft px-4 py-3 text-[14px] leading-relaxed text-ink" data-testid="demo-rule">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-learn text-white" aria-hidden="true">
          <IconBulb size={12} />
        </span>
        <span>
          <span className="font-semibold">The rule: </span>
          {demo.rule}
        </span>
      </p>

      <div className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]'}`}>
        {/* STAGE: the structure, then the caption that explains this step */}
        <div className="flex min-w-0 flex-col gap-3">
          <section aria-label="What the code is doing" className="demo-stage min-w-0 p-4 pt-11 sm:p-6 sm:pt-12" data-testid="demo-visual">
            <span className="glass num absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">
              Step {index + 1} / {steps.length}
            </span>
            {playing && !pending && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-learn px-2.5 py-1 text-[11px] font-semibold text-white">
                <span className="pulse size-1.5 rounded-full bg-white" /> Playing
              </span>
            )}
            <View state={shown.state} step={shown} />
          </section>

          {pending ? (
            <section className="rounded-2xl bg-flame-soft p-4 shadow-[inset_0_0_0_1.5px_var(--flame-2)] sm:p-5" data-testid="demo-predict" aria-live="polite">
              <p className="eyebrow text-[#b9500b]">Predict first</p>
              <p className="mt-1 text-[16px] font-semibold leading-snug text-ink">{step.predict!.question}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {step.predict!.choices.map((c, k) => (
                  <button key={c} type="button" className="btn" onClick={() => setAnswers((a) => ({ ...a, [index]: k }))} data-testid={`predict-${k}`}>
                    {c}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section key={`${index}-${steps.length}`} className="demo-caption rounded-2xl bg-bg p-4 shadow-[0_0_0_1px_var(--hairline)] sm:p-5" aria-live="polite">
              <p className="eyebrow text-learn" data-testid="demo-label">
                Step {index + 1} of {steps.length} · {step.label}
              </p>
              {step.predict && answers[index] !== undefined && (
                <p
                  className={`mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[13px] font-semibold ${answers[index] === step.predict.answer ? 'bg-pass-soft text-green-ink' : 'bg-repair-soft text-repair'}`}
                  data-testid="demo-predicted"
                >
                  {answers[index] === step.predict.answer ? 'Right.' : `Not quite: ${step.predict.choices[step.predict.answer]}.`}
                </p>
              )}
              <p className="mt-1.5 text-[16px] leading-relaxed text-ink" data-testid="demo-why">
                {step.why}
              </p>
            </section>
          )}
        </div>

        {/* CODE + VARIABLES */}
        <div className="flex min-w-0 flex-col gap-3">
          <section aria-label="The code" className="demo-code min-w-0 overflow-x-auto p-3" data-testid="demo-code">
            <p className="mb-2 flex items-center gap-2 px-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#7f8ea6]">
              <span className="flex gap-1" aria-hidden="true">
                <span className="size-2 rounded-full bg-[#3a4a63]" />
                <span className="size-2 rounded-full bg-[#3a4a63]" />
                <span className="size-2 rounded-full bg-[#3a4a63]" />
              </span>
              Python
            </p>
            <pre className="mono text-[12.5px] leading-[1.75]">
              {demo.code.map((line, i) => {
                const on = shown.lines.includes(i + 1)
                return (
                  <div key={i} className="demo-code-line" data-line={i + 1} data-active={on ? 'true' : undefined}>
                    <span className="ln">{i + 1}</span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                )
              })}
            </pre>
          </section>
          {!pending && Object.keys(step.vars).length > 0 && (
            <section aria-label="Variables" className="rounded-2xl bg-surface p-3">
              <p className="label mb-2 px-1">State</p>
              <dl className="flex flex-wrap gap-1.5" data-testid="demo-vars">
                {Object.entries(step.vars).map(([k, v]) => {
                  const changed = before !== undefined && fmt(before.vars[k] ?? null) !== fmt(v)
                  return (
                    <div key={`${k}-${index}`} className="var-chip mono" data-changed={changed ? 'true' : 'false'}>
                      <dt className="text-muted">{k}</dt>
                      <dd className="num font-semibold text-ink">{fmt(v)}</dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          )}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col gap-3 rounded-2xl bg-bg p-3 shadow-[0_0_0_1px_var(--hairline)] sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <div className="flex items-center gap-2" role="group" aria-label="Demo controls">
          <button type="button" className="round-btn" onClick={() => go(index - 1)} disabled={index === 0} data-testid="demo-prev" aria-label="Back one step">
            <IconArrowLeft size={16} />
          </button>
          <button type="button" className="round-btn round-btn-primary h-11" onClick={() => go(index + 1)} disabled={last || Boolean(pending)} data-testid="demo-next">
            Next step <IconArrowRight size={14} />
          </button>
          <button
            type="button"
            className="round-btn"
            onClick={() => setPlaying((p) => !p)}
            disabled={last}
            aria-pressed={playing}
            aria-label={playing ? 'Pause' : 'Play'}
            data-testid="demo-play"
            title={reduced ? 'Plays one step at a time, without animation' : undefined}
          >
            {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
          </button>
          <button type="button" className="round-btn" onClick={reset} data-testid="demo-reset" aria-label="Reset">
            <IconRotate size={15} />
          </button>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            type="range"
            className="scrubber min-w-0 flex-1"
            min={0}
            max={steps.length - 1}
            value={index}
            onChange={(e) => go(Math.min(reachable, Number(e.target.value)))}
            aria-label="Step"
            aria-valuetext={`Step ${index + 1} of ${steps.length}`}
            style={{ '--fill': `${fill}%` } as CSSProperties}
          />
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-surface p-0.5 text-[12px] text-muted" role="group" aria-label="Speed">
            {SPEEDS.map((s, k) => (
              <button
                key={s.label}
                type="button"
                className={`rounded-md px-2 py-1 ${speed === k ? 'bg-bg font-semibold text-ink shadow-[0_0_0_1px_var(--line)]' : 'hover:text-ink'}`}
                onClick={() => setSpeed(k)}
                aria-pressed={speed === k}
              >
                {s.label}
              </button>
            ))}
          </span>
        </div>
      </div>

      {/* TRY ANOTHER INPUT */}
      <div className="flex flex-wrap items-center gap-2 px-1 text-[13px]" data-testid="demo-input">
        <span className="font-medium text-ink-2">Try another input</span>
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
            <input
              className="input mono !h-9 !text-[12.5px]"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={demo.inputHint}
              aria-label="Your own input"
              data-testid="demo-custom"
            />
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
