'use client'

import type { RunResult } from '@/lib/python/runner'
import type { Mode } from '@/lib/types'

/** Test and output feedback. Pass/fail always carries text and a symbol, never color alone. */
export function TestResults({ result, mode, submitted }: { result: RunResult; mode: Mode; submitted: boolean }) {
  const visible = result.tests.filter((t) => !t.hidden)
  const hidden = result.tests.filter((t) => t.hidden)
  const passed = result.tests.filter((t) => t.passed).length
  const hiddenPassed = hidden.filter((t) => t.passed).length

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      {result.infraError && <p className="rounded-md bg-warn-soft px-3 py-2 text-warn">Python could not run: {result.infraError}</p>}
      {result.error && (
        <div className="rounded-md border border-fail/20 bg-fail-soft px-3 py-2">
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-fail">Error</p>
          <pre className="mono whitespace-pre-wrap text-[12.5px] text-ink">{result.error}</pre>
        </div>
      )}
      {result.stdout && (
        <div>
          <p className="label mb-1">Printed</p>
          <pre className="code-view max-h-40 overflow-auto !py-2 text-[12.5px]">{result.stdout.replace(/\n$/, '')}</pre>
        </div>
      )}
      {result.tests.length > 0 && (
        <div>
          <p className="label mb-1.5">
            Tests · {passed}/{result.tests.length} passed
          </p>
          <ul className="flex flex-col gap-1">
            {visible.map((t, i) => (
              <li key={i} className="rounded-md border border-line px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className={`font-medium ${t.passed ? 'text-pass' : 'text-fail'}`}>{t.passed ? '✓ Pass' : '✗ Fail'}</span>
                  <code className="mono truncate text-[12.5px] text-ink-2">{t.call ?? t.name}</code>
                </div>
                {!t.passed && (mode !== 'interview' || submitted) && (
                  <div className="mono mt-1 grid grid-cols-[72px_1fr] gap-x-2 text-[12px] text-muted">
                    {t.expected !== null && (
                      <>
                        <span>expected</span>
                        <span className="whitespace-pre-wrap text-ink">{t.expected}</span>
                      </>
                    )}
                    {t.actual !== null && (
                      <>
                        <span>got</span>
                        <span className="whitespace-pre-wrap text-ink">{t.actual}</span>
                      </>
                    )}
                    {t.error && (
                      <>
                        <span>error</span>
                        <span className="whitespace-pre-wrap text-fail">{t.error}</span>
                      </>
                    )}
                  </div>
                )}
                {t.stdout && <pre className="mono mt-1 whitespace-pre-wrap text-[12px] text-faint">{t.stdout}</pre>}
              </li>
            ))}
            {hidden.length > 0 && (
              <li className="rounded-md border border-dashed border-line px-3 py-2 text-muted">
                <span className={hiddenPassed === hidden.length ? 'text-pass' : 'text-fail'}>{hiddenPassed === hidden.length ? '✓' : '✗'}</span> Hidden tests: {hiddenPassed}/{hidden.length} passed
                {hiddenPassed < hidden.length && mode === 'learn' && (
                  <span className="block text-[12px]">A hidden case fails. Think about empty input, one item, duplicates, or negatives.</span>
                )}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
