'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useReps } from '@/components/reps-provider'
import Markdown from '@/components/markdown'
import { TestResults } from '@/components/rep/results'
import { MOCKS } from '@/data/mocks'
import { EXERCISE_BY_ID } from '@/data/curriculum'
import { skillName } from '@/data/skills'
import { localDate } from '@/lib/dates'
import { getRunner, type RunResult } from '@/lib/python/runner'
import { newId } from '@/lib/sessions'
import { requestInterviewReview } from '@/lib/coach/client'
import type { Attempt, MockResult } from '@/lib/types'

const CodeEditor = dynamic(() => import('@/components/code-editor'), { ssr: false, loading: () => <div className="h-full min-h-[280px] bg-surface" /> })

/** Neutral interviewer prompts. No hints, no AI, unless asked for after the session. */
const NUDGES = ['What are you optimizing?', 'What’s the invariant?', 'What edge case could break this?', 'What’s the time complexity?', 'What’s the space complexity?', 'Can you walk through an example?']

interface ProblemState {
  code: string
  custom: string
  complexity: string
  explanation: string
  result: RunResult | null
  customResult: string | null
  passed: boolean
  testsPassed: number
  testsTotal: number
  submitted: boolean
  failures: number
}

export default function MockSession({ mockId }: { mockId: string }) {
  const mock = MOCKS.find((m) => m.id === mockId)
  if (!mock) return <main className="mx-auto max-w-[720px] px-5 py-16 text-muted">Unknown mock.</main>
  return <MockRunner mock={mock} />
}

function MockRunner({ mock }: { mock: (typeof MOCKS)[number] }) {
  const { repo } = useReps()
  const mockId = mock.id
  const problems = mock.exerciseIds.map((id) => EXERCISE_BY_ID[id]).filter(Boolean)
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready')
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [active, setActive] = useState(0)
  const [scratch, setScratch] = useState('')
  const [state, setState] = useState<ProblemState[]>(() =>
    problems.map((p) => ({ code: p.starterCode ?? '', custom: '', complexity: '', explanation: '', result: null, customResult: null, passed: false, testsPassed: 0, testsTotal: p.tests?.length ?? 0, submitted: false, failures: 0 })),
  )
  const [busy, setBusy] = useState(false)
  const [review, setReview] = useState<{ summary: string; strengths: string[]; improvements: string[]; nextReps: string[] } | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const resultId = useRef(newId())

  const total = mock.minutes * 60
  const used = startedAt ? Math.floor((now - startedAt.getTime()) / 1000) : 0
  const left = Math.max(0, total - used)


  useEffect(() => {
    if (phase === 'running') void getRunner().ensure().catch(() => undefined)
  }, [phase])

  const patch = (i: number, p: Partial<ProblemState>) => setState((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const cur = state[active]
  const ex = problems[active]

  const runCustom = async () => {
    if (!cur.custom.trim()) return
    setBusy(true)
    const r = await getRunner().run(cur.code, [{ call: cur.custom.trim(), expected: 'None', name: 'your test' }])
    const t = r.tests[0]
    patch(active, { customResult: r.error ? r.error : t?.error ? t.error : `→ ${t?.actual}${t?.stdout ? `\n${t.stdout}` : ''}`, result: r.stdout ? { ...r, tests: [] } : null })
    setBusy(false)
  }

  const runExamples = async () => {
    setBusy(true)
    const r = await getRunner().run(cur.code, (ex.tests ?? []).filter((t) => !t.hidden))
    patch(active, { result: r, submitted: false })
    setBusy(false)
  }

  const submit = async () => {
    setBusy(true)
    const r = await getRunner().run(cur.code, ex.tests ?? [])
    const passed = !r.error && r.tests.length > 0 && r.tests.every((t) => t.passed)
    patch(active, { result: r, submitted: true, passed, testsPassed: r.tests.filter((t) => t.passed).length, testsTotal: r.tests.length, failures: passed ? cur.failures : cur.failures + 1 })
    setBusy(false)
  }

  const finish = async () => {
    const end = new Date()
    setPhase('done')
    // Each problem becomes an interview-mode attempt: real evidence for mastery.
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i]
      const s = state[i]
      if (!s.code.trim() || s.code === p.starterCode) continue
      const a: Attempt = {
        id: newId(),
        exerciseId: p.id,
        date: localDate(),
        skills: p.skills,
        stage: p.stage,
        mode: 'interview',
        code: s.code,
        passed: s.passed,
        attemptsBeforePass: s.passed ? s.failures : Math.max(1, s.failures),
        hintsUsed: 0,
        solutionViewed: false,
        runtimeErrors: s.result?.error ? [s.result.error] : [],
        startedAt: startedAt!.toISOString(),
        completedAt: end.toISOString(),
        durationSeconds: used,
        retrievalType: 'cold',
        updatedAt: end.toISOString(),
      }
      void repo.recordAttempt(a, p)
    }
    const result: MockResult = {
      id: resultId.current,
      mockId,
      startedAt: startedAt!.toISOString(),
      completedAt: end.toISOString(),
      problems: problems.map((p, i) => ({
        exerciseId: p.id,
        code: state[i].code,
        passed: state[i].passed,
        testsPassed: state[i].testsPassed,
        testsTotal: state[i].testsTotal,
        complexity: state[i].complexity,
        explanation: state[i].explanation,
      })),
      scratchpad: scratch,
    }
    await repo.setState(`mock:${mockId}:${resultId.current}`, result, { flushDelayMs: 1000 })
  }



  // The clock: when time is up, the interview ends.
  const onTick = useEffectEvent(() => {
    const t = Date.now()
    setNow(t)
    if (startedAt && t - startedAt.getTime() >= total * 1000) void finish()
  })
  useEffect(() => {
    if (phase !== 'running') return
    const t = window.setInterval(onTick, 1000)
    return () => window.clearInterval(t)
  }, [phase])

  const askReview = async () => {
    setBusy(true)
    setReviewError(null)
    try {
      const r = await requestInterviewReview({
        problems: problems.map((p, i) => ({ title: p.title, code: state[i].code, passed: state[i].passed, testsPassed: state[i].testsPassed, testsTotal: state[i].testsTotal, complexity: state[i].complexity, explanation: state[i].explanation })),
        scratchpad: scratch,
        minutesUsed: Math.round(used / 60),
      })
      setReview(r)
      const prev = repo.state<MockResult>(`mock:${mockId}:${resultId.current}`)
      if (prev) await repo.setState(`mock:${mockId}:${resultId.current}`, { ...prev, review: JSON.stringify(r) })
    } catch (e) {
      setReviewError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'ready') {
    return (
      <main className="mx-auto w-full max-w-[680px] px-5 pb-28 pt-12">
        <Link href="/interview" className="text-[13px] text-muted hover:text-ink">
          ← Interview Reps
        </Link>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight">{mock.title}</h1>
        <p className="mt-2 text-[15px] text-ink-2">{mock.note}</p>
        <ul className="mt-6 flex flex-col gap-1.5 text-[14px] text-muted">
          <li>– {mock.minutes} minutes, {problems.length} problems.</li>
          <li>– Plain editor: no autocomplete, no hints, no AI.</li>
          <li>– Run your own test calls. Submit runs the hidden tests.</li>
          <li>– State complexity and talk through your approach in writing.</li>
        </ul>
        <button
          type="button"
          className="btn btn-primary btn-lg mt-8"
          onClick={() => {
            setStartedAt(new Date())
            setNow(Date.now())
            setPhase('running')
          }}
        >
          Start the clock
        </button>
      </main>
    )
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const nudge = NUDGES[Math.floor(used / 300) % NUDGES.length]

  if (phase === 'done') {
    return (
      <main className="mx-auto w-full max-w-[720px] px-5 pb-28 pt-12">
        <h1 className="text-[28px] font-semibold tracking-tight">Interview Rep complete</h1>
        <p className="mt-1 text-[14px] text-muted">{Math.round(used / 60)} minutes used.</p>
        <ul className="mt-6 divide-y divide-line border-y border-line text-[14px]">
          {problems.map((p, i) => (
            <li key={p.id} className="flex justify-between py-2">
              <span>{p.title}</span>
              <span className={state[i].passed ? 'text-pass' : 'text-muted'}>{state[i].submitted ? `${state[i].passed ? '✓' : '✗'} ${state[i].testsPassed}/${state[i].testsTotal} tests` : 'not submitted'}</span>
            </li>
          ))}
        </ul>
        {!review && (
          <button type="button" className="btn mt-6" onClick={askReview} disabled={busy}>
            {busy ? 'Reviewing…' : 'Review'}
          </button>
        )}
        {reviewError && <p className="mt-3 text-[13px] text-warn">{reviewError}</p>}
        {review && (
          <section className="mt-6 flex flex-col gap-4 text-[14px]">
            <p className="text-ink-2">{review.summary}</p>
            <div>
              <p className="label mb-1">Strengths</p>
              <ul className="text-ink-2">{review.strengths.map((s, i) => <li key={i}>– {s}</li>)}</ul>
            </div>
            <div>
              <p className="label mb-1">Improve</p>
              <ul className="text-ink-2">{review.improvements.map((s, i) => <li key={i}>– {s}</li>)}</ul>
            </div>
            {review.nextReps.length > 0 && <p className="text-muted">Next reps: {review.nextReps.map(skillName).join(', ')}</p>}
          </section>
        )}
        <Link href="/interview" className="btn btn-ghost mt-8">
          Back to Interview Reps
        </Link>
      </main>
    )
  }

  return (
    <main className="grid flex-1 grid-cols-1 lg:h-[calc(100vh-48px)] lg:grid-cols-[minmax(340px,0.8fr)_1.2fr]">
      <section className="flex flex-col gap-4 overflow-y-auto border-line px-6 py-5 lg:border-r">
        <div className="flex items-center justify-between">
          <div role="tablist" aria-label="Problems" className="flex gap-1">
            {problems.map((p, i) => (
              <button key={p.id} role="tab" aria-selected={i === active} type="button" onClick={() => setActive(i)} className={`rounded-md px-2.5 py-1 text-[13px] ${i === active ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
                Problem {i + 1}
              </button>
            ))}
          </div>
          <span className={`mono text-[15px] tabular-nums ${left < 300 ? 'text-fail' : 'text-ink'}`} role="timer" aria-label={`${mm} minutes ${ss} seconds left`}>
            {mm}:{ss}
          </span>
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight">{ex.title}</h1>
        <Markdown text={ex.prompt} />
        {ex.examples?.map((x, i) => (
          <div key={i} className="rounded-md border border-line bg-surface px-3 py-2 text-[13px]">
            <p className="mono">
              <span className="text-faint">in </span>
              {x.input}
            </p>
            <p className="mono">
              <span className="text-faint">out </span>
              {x.output}
            </p>
          </div>
        ))}
        <p className="text-[13px] italic text-faint" aria-live="off">
          {nudge}
        </p>
        <label className="flex flex-col gap-1 text-[13px] text-muted">
          Scratchpad
          <textarea className="input mono !text-[13px]" rows={6} value={scratch} onChange={(e) => setScratch(e.target.value)} placeholder="Examples, invariants, plan…" />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-muted">
          Complexity
          <input className="input mono !text-[13px]" value={cur.complexity} onChange={(e) => patch(active, { complexity: e.target.value })} placeholder="time O(?) · space O(?)" />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-muted">
          Explanation
          <textarea className="input !text-[13.5px]" rows={4} value={cur.explanation} onChange={(e) => patch(active, { explanation: e.target.value })} placeholder="Approach and why it works." />
        </label>
      </section>

      <section className="flex min-h-0 flex-col">
        <div className="min-h-0 flex-1">
          <CodeEditor key={ex.id} value={cur.code} onChange={(v) => patch(active, { code: v })} onRun={runExamples} onSubmit={submit} assist={false} ariaLabel="Interview editor" minHeight={280} />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line py-2.5 pl-4 pr-24">
          <input
            className="input mono !h-8 max-w-[320px] !py-1 !text-[12.5px]"
            value={cur.custom}
            onChange={(e) => patch(active, { custom: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && void runCustom()}
            placeholder="Your test, e.g. f([1, 2, 3])"
            aria-label="Custom test call"
          />
          <button type="button" className="btn" onClick={runCustom} disabled={busy}>
            Run test
          </button>
          <button type="button" className="btn" onClick={runExamples} disabled={busy}>
            Run examples
          </button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
            Submit
          </button>
          <button type="button" className="btn btn-ghost ml-auto" onClick={() => void finish()}>
            End interview
          </button>
        </div>
        <div className="max-h-[36vh] shrink-0 overflow-y-auto border-t border-line px-4 py-3 empty:hidden" aria-live="polite">
          {cur.customResult && <pre className="code-view mb-3 !py-2 text-[12.5px]">{cur.customResult}</pre>}
          {cur.result && <TestResults result={cur.result} mode="interview" submitted={cur.submitted} />}
        </div>
      </section>
    </main>
  )
}
