'use client'

import { useState } from 'react'
import type { RunResult, TestResult } from '@/lib/python/runner'
import type { Mode } from '@/lib/types'
import { IconCheck, IconX, IconArrowLeft } from '@/components/icons'

/**
 * Test feedback built to get you back into the editor: a one-line summary,
 * failures first and expanded (expected vs received, error, printed output),
 * passes collapsed. Pass/fail always carries text and a symbol, not color alone.
 */
export function TestResults({ result, mode, submitted, onBackToCode }: { result: RunResult; mode: Mode; submitted: boolean; onBackToCode?: () => void }) {
  const visible = result.tests.filter((t) => !t.hidden)
  const hidden = result.tests.filter((t) => t.hidden)
  const passed = result.tests.filter((t) => t.passed).length
  const total = result.tests.length
  const hiddenPassed = hidden.filter((t) => t.passed).length
  const allPass = total > 0 && passed === total && !result.error
  const failing = [...visible.filter((t) => !t.passed), ...visible.filter((t) => t.passed)]
  const firstFail = visible.find((t) => !t.passed)
  const showDetail = mode !== 'interview' || submitted

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      {allPass && (
        <div className="fade-in flex items-center gap-2.5 rounded-xl bg-green-soft px-3.5 py-2.5 shadow-[inset_0_0_0_1px_rgba(36,166,106,0.2)]">
          <span className="pop-in grid size-6 place-items-center rounded-full bg-green text-white">
            <IconCheck size={13} strokeWidth={2.4} />
          </span>
          <span className="eyebrow text-green-ink">All tests passed</span>
          <span className="num ml-auto text-[12.5px] font-medium text-green-ink">
            {passed}/{total}
          </span>
        </div>
      )}
      {(total > 0 || result.error) && !allPass && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`inline-flex items-center gap-1.5 text-[13.5px] font-semibold ${allPass ? 'text-pass' : 'text-ink'}`}>
            {allPass ? <IconCheck size={15} /> : <IconX size={15} className="text-fail" />}
            {total > 0 ? `${passed} / ${total} tests passed` : 'Your code raised an error'}
          </span>
          {!allPass && (
            <span className="text-muted">
              {result.timedOut
                ? 'Stopped: it ran past 5 seconds.'
                : result.error
                  ? 'Fix the error first; the tests did not run.'
                  : firstFail
                    ? `${label(firstFail)} failed.`
                    : hidden.length && hiddenPassed < hidden.length
                      ? 'A hidden case failed: think empty input, one item, duplicates, negatives.'
                      : null}
            </span>
          )}
          {!allPass && onBackToCode && (
            <button type="button" className="btn btn-sm ml-auto" onClick={onBackToCode}>
              <IconArrowLeft size={13} /> Back to code
            </button>
          )}
        </div>
      )}

      {result.infraError && <p className="rounded-lg bg-warn-soft px-3 py-2 text-warn">Python could not run: {result.infraError}</p>}

      {result.error && (
        <div className="rounded-lg bg-fail-soft px-3.5 py-2.5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-fail">Error</p>
          <pre className="mono whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">{result.error}</pre>
        </div>
      )}

      {failing.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {failing.map((t, i) => (
            <TestRow key={i} t={t} index={i} showDetail={showDetail} defaultOpen={!t.passed && t === firstFail} />
          ))}
          {hidden.length > 0 && (
            <li className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted" style={{ boxShadow: 'inset 0 0 0 1px var(--line)', borderStyle: 'dashed' }}>
              {hiddenPassed === hidden.length ? <IconCheck size={14} className="text-pass" /> : <IconX size={14} className="text-fail" />}
              Hidden tests · {hiddenPassed}/{hidden.length} passed
            </li>
          )}
        </ul>
      )}

      {result.stdout && (
        <div>
          <p className="label mb-1">Printed</p>
          <pre className="code-view max-h-40 overflow-auto !py-2 text-[12.5px]">{result.stdout.replace(/\n$/, '')}</pre>
        </div>
      )}
    </div>
  )
}

function label(t: TestResult): string {
  return t.call ?? t.name
}

function TestRow({ t, index, showDetail, defaultOpen }: { t: TestResult; index: number; showDetail: boolean; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const canOpen = !t.passed && showDetail
  return (
    <li
      className={`rise-in overflow-hidden rounded-lg ${t.passed ? 'bg-bg' : 'bg-fail-soft/50'}`}
      style={{ boxShadow: `inset 0 0 0 1px ${t.passed ? 'rgba(36,166,106,0.18)' : 'rgba(180,35,24,0.18)'}`, animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left"
        onClick={() => canOpen && setOpen((v) => !v)}
        aria-expanded={canOpen ? open : undefined}
        disabled={!canOpen}
      >
        {t.passed ? (
          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-green-soft text-green">
            <IconCheck size={11} strokeWidth={2.4} />
          </span>
        ) : (
          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-fail-soft text-fail">
            <IconX size={11} strokeWidth={2.4} />
          </span>
        )}
        <span className="sr-only">{t.passed ? 'Passed:' : 'Failed:'}</span>
        <code className="mono min-w-0 flex-1 truncate text-[12.5px] text-ink-2">{t.call ?? t.name}</code>
        {canOpen && <span className="text-[11.5px] text-muted">{open ? 'Hide' : 'Details'}</span>}
      </button>
      {canOpen && open && (
        <div className="mono grid grid-cols-[72px_1fr] gap-x-3 gap-y-1.5 px-3 pb-3 pl-9 text-[12.5px]">
          {t.expected !== null && (
            <>
              <span className="text-faint">Expected</span>
              <span className="whitespace-pre-wrap break-all text-ink">{t.expected}</span>
            </>
          )}
          {t.actual !== null && (
            <>
              <span className="text-faint">Received</span>
              <span className="whitespace-pre-wrap break-all font-medium text-fail">{t.actual}</span>
            </>
          )}
          {t.error && (
            <>
              <span className="text-faint">Error</span>
              <span className="whitespace-pre-wrap break-all text-fail">{t.error}</span>
            </>
          )}
          {t.stdout && (
            <>
              <span className="text-faint">Printed</span>
              <span className="whitespace-pre-wrap break-all text-muted">{t.stdout.replace(/\n$/, '')}</span>
            </>
          )}
        </div>
      )}
    </li>
  )
}
