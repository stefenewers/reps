'use client'

import { useId } from 'react'
import { highlightPython } from '@/components/code-view'

/** Recognize: options as a radio group, keyboard-first (1–9 picks). */
export function ChoiceInput({
  options,
  value,
  onChange,
  locked,
  correct,
}: {
  options: string[]
  value: number | null
  onChange: (i: number) => void
  locked: boolean
  correct?: number
}) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-2" disabled={locked}>
      <legend className="sr-only">Choose one answer</legend>
      {options.map((opt, i) => {
        const selected = value === i
        const isRight = correct === i
        const isWrongPick = correct !== undefined && selected && !isRight
        const looksLikeCode = /[()[\]{}=:]|\bdef\b|\bfor\b|^\s*\w+\.\w+/.test(opt) && opt.length < 160
        return (
          <label
            key={i}
            className={`group flex cursor-pointer items-start gap-3 rounded-xl px-4 py-3.5 text-[14.5px] transition-[box-shadow,background-color,transform] duration-150 active:scale-[0.995] ${
              isRight
                ? 'bg-pass-soft shadow-[0_0_0_1.5px_var(--pass)]'
                : isWrongPick
                  ? 'bg-fail-soft shadow-[0_0_0_1.5px_var(--fail)]'
                  : selected
                    ? 'bg-bg shadow-[0_0_0_1.5px_var(--ink),var(--shadow-sm)]'
                    : 'bg-bg shadow-[0_0_0_1px_var(--line-strong)] hover:shadow-[0_0_0_1px_#c9c9cf,var(--shadow-sm)]'
            } ${locked ? 'cursor-default' : ''}`}
          >
            <input type="radio" name={name} className="sr-only" checked={selected} onChange={() => onChange(i)} />
            <span
              aria-hidden="true"
              className={`mt-px inline-flex size-[22px] shrink-0 items-center justify-center rounded-md text-[11.5px] font-semibold tabular-nums transition-colors ${
                selected ? 'bg-ink text-white' : 'bg-surface-2 text-muted group-hover:text-ink'
              }`}
            >
              {i + 1}
            </span>
            <span className={looksLikeCode ? 'mono whitespace-pre-wrap text-[13px]' : ''}>{looksLikeCode ? highlightPython(opt) : opt}</span>
            {isRight && <span className="ml-auto text-[12px] font-medium text-pass">✓ Correct</span>}
            {isWrongPick && <span className="ml-auto text-[12px] font-medium text-fail">✗ Your pick</span>}
          </label>
        )
      })}
    </fieldset>
  )
}

/** Trace: type exactly what the program prints. */
export function OutputInput({ value, onChange, locked, onSubmit }: { value: string; onChange: (v: string) => void; locked: boolean; onSubmit: () => void }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] text-muted">
        Output, exactly as printed. One line per print.
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
        rows={6}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            onSubmit()
          }
        }}
        className="input mono min-h-[160px] !bg-editor text-[14px]"
        placeholder="Type the output…"
        data-testid="output-input"
      />
    </div>
  )
}

/** Reconstruct: move lines into order. Buttons and Alt+↑/↓ keep it keyboard-accessible. */
export function ReorderInput({ lines, order, onChange, locked }: { lines: string[]; order: number[]; onChange: (o: number[]) => void; locked: boolean }) {
  const move = (pos: number, dir: -1 | 1) => {
    const to = pos + dir
    if (to < 0 || to >= order.length) return
    const next = [...order]
    ;[next[pos], next[to]] = [next[to], next[pos]]
    onChange(next)
  }
  return (
    <ol className="flex flex-col gap-1.5" aria-label="Lines to order">
      {order.map((li, pos) => (
        <li key={li} className="flex items-stretch gap-2">
          <span className="w-5 shrink-0 pt-2 text-right text-[11px] tabular-nums text-faint">{pos + 1}</span>
          <div
            tabIndex={locked ? -1 : 0}
            onKeyDown={(e) => {
              if (locked || !e.altKey) return
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                move(pos, -1)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                move(pos, 1)
              }
            }}
            aria-label={`Line ${pos + 1}: ${lines[li]}. Alt+Up or Alt+Down to move.`}
            className="code-view flex-1 !py-2 transition-shadow focus:shadow-[inset_0_0_0_1.5px_var(--accent)]"
          >
            {highlightPython(lines[li])}
          </div>
          <div className="flex shrink-0 flex-col">
            <button type="button" className="btn btn-ghost !h-[18px] !px-1.5 text-[10px]" disabled={locked || pos === 0} onClick={() => move(pos, -1)} aria-label={`Move line ${pos + 1} up`}>
              ▲
            </button>
            <button
              type="button"
              className="btn btn-ghost !h-[18px] !px-1.5 text-[10px]"
              disabled={locked || pos === order.length - 1}
              onClick={() => move(pos, 1)}
              aria-label={`Move line ${pos + 1} down`}
            >
              ▼
            </button>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Interview explanation: write it, then self-check the rubric. */
export function ExplainInput({
  value,
  onChange,
  rubric,
  checked,
  onCheck,
  locked,
  aiMet,
}: {
  value: string
  onChange: (v: string) => void
  rubric: string[]
  checked: boolean[]
  onCheck: (i: number, v: boolean) => void
  locked: boolean
  aiMet?: boolean[]
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-[13px] text-muted">
          Say it as you would to an interviewer. Approach, invariant, complexity, edge cases.
        </label>
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} readOnly={locked} rows={9} className="input text-[14.5px]" placeholder="My approach is…" data-testid="explain-input" />
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-[13px] text-muted">Did your explanation cover…</legend>
        {rubric.map((r, i) => (
          <label key={i} className="flex items-start gap-2.5 text-[14px]">
            <input type="checkbox" className="mt-1 accent-[var(--ink)]" checked={checked[i] ?? false} onChange={(e) => onCheck(i, e.target.checked)} disabled={locked} />
            <span>
              {r}
              {aiMet && <span className={`ml-2 text-[12px] ${aiMet[i] ? 'text-pass' : 'text-warn'}`}>{aiMet[i] ? '✓ covered' : '○ missing'}</span>}
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  )
}
